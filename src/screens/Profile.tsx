import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AvatarBuilder } from '../components/AvatarBuilder';
import { 
  Shield, 
  Flame, 
  Award, 
  Star, 
  User, 
  Lock, 
  TrendingUp, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  Phone,
  LogOut,
  Dumbbell,
  Footprints,
  Clock,
  Info,
  X,
  Check,
  Plus,
  Trash2,
  ChevronDown,
  Circle,
  CalendarDays
} from 'lucide-react';
import { TrendGraph } from '../components/TrendGraph';
import { HeatMap } from '../components/HeatMap';

const CATEGORY_ICONS: Record<string, string> = {
  fitness: '🏃',
  mind: '🧘',
  work: '💻',
  health: '🥛',
  custom: '🌱'
};

const WORKOUT_TYPES = [
  { name: 'Gym / Strength', icon: '🏋️', caloriesPerMin: 7 },
  { name: 'Running', icon: '🏃', caloriesPerMin: 10 },
  { name: 'Walking', icon: '🚶', caloriesPerMin: 4 },
  { name: 'Cycling', icon: '🚴', caloriesPerMin: 8 },
  { name: 'Swimming', icon: '🏊', caloriesPerMin: 9 },
  { name: 'Yoga / Pilates', icon: '🧘', caloriesPerMin: 3.5 },
  { name: 'Other', icon: '⚡', caloriesPerMin: 6 }
];



const GRAPH_COLORS = [
  { stroke: '#6366f1', stop: '#6366f1' }, // Indigo
  { stroke: '#10b981', stop: '#10b981' }, // Emerald
  { stroke: '#ec4899', stop: '#ec4899' }, // Pink
  { stroke: '#f59e0b', stop: '#f59e0b' }, // Amber
  { stroke: '#06b6d4', stop: '#06b6d4' }  // Cyan
];

const getDatesInRange = (fromStr?: string, toStr?: string) => {
  const dates: string[] = [];
  if (!fromStr || !toStr) return dates;
  const start = new Date(fromStr);
  const end = new Date(toStr);
  const current = new Date(start);
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
    if (dates.length > 366) break;
  }
  return dates;
};

const getPlanTrendData = (plan: any) => {
  const dates = getDatesInRange(plan.fromDate, plan.toDate);
  if (dates.length === 0) return { trend: [0, 0, 0, 0, 0, 0, 0], labels: ['', '', '', '', '', '', ''] };
  
  // Calculate completion percentage for each date
  const dailyData = dates.map(d => {
    let done = 0;
    const total = plan.routines?.length || 0;
    plan.routines?.forEach((r: any) => {
      const key = `${d}_${r.id}`;
      if (plan.completions && plan.completions[key]) {
        done++;
      }
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { dateStr: d, pct };
  });

  // Sample exactly 7 points evenly spaced
  const numSamples = 7;
  const sampledData: number[] = [];
  const sampledLabels: string[] = [];

  for (let i = 0; i < numSamples; i++) {
    const index = Math.min(
      dailyData.length - 1,
      Math.round((i / (numSamples - 1)) * (dailyData.length - 1))
    );
    const item = dailyData[index];
    sampledData.push(item ? item.pct : 0);
    
    if (item) {
      const date = new Date(item.dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      sampledLabels.push(`${month} ${day}`);
    } else {
      sampledLabels.push('');
    }
  }

  return { trend: sampledData, labels: sampledLabels };
};

export const Profile: React.FC = () => {
  const { 
    user, 
    achievements, 
    updateUsername, 
    updateName, 
    updatePhone, 
    updateUserEmail, 
    checkUsernameExists, 
    checkPhoneExists,
    checkEmailExists,
    firebaseUser, 
    sendPasswordReset, 
    setScreen,
    logout,
    setShowSavedAccounts,
    setSimulatedMessage,
    updatePasswordInFirestore,
    longTermPlans,
    fitnessLogs,
    habits,
    setTrackingPlanId,
    previousScreen,
    updateLongTermPlan,
    addFitnessLog,
    deleteFitnessLog,
    toggleHabit
  } = useApp();
  const [activeTab, setActiveTab] = useState<'details' | 'performance' | 'password'>('details');

  // Modal states for Performance tab popups
  const [activePlanForModal, setActivePlanForModal] = useState<any | null>(null);
  const [showFitnessModal, setShowFitnessModal] = useState<boolean>(false);
  const [activeHabitForModal, setActiveHabitForModal] = useState<any | null>(null);

  // Fitness form modal states
  const [workoutType, setWorkoutType] = useState('Gym / Strength');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [steps, setSteps] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddFitnessForm, setShowAddFitnessForm] = useState(false);

  // Details form state
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [email, setEmail] = useState(user.email || firebaseUser?.email || '');

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  
  // Phone OTP Verification states
  const [showPhoneOtpModal, setShowPhoneOtpModal] = useState(false);
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState('');
  const [enteredPhoneOtp, setEnteredPhoneOtp] = useState(['', '', '', '', '', '']);
  const [phoneOtpError, setPhoneOtpError] = useState<string | null>(null);
  const [phoneOtpResendTimer, setPhoneOtpResendTimer] = useState(60);

  // Email OTP Verification states
  const [showEmailOtpModal, setShowEmailOtpModal] = useState(false);
  const [generatedEmailOtp, setGeneratedEmailOtp] = useState('');
  const [enteredEmailOtp, setEnteredEmailOtp] = useState(['', '', '', '', '', '']);
  const [emailOtpError, setEmailOtpError] = useState<string | null>(null);
  const [emailOtpResendTimer, setEmailOtpResendTimer] = useState(60);

  // Loading and success states per action
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);

  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [phoneSuccess, setPhoneSuccess] = useState(false);

  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Password form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [emailResetSent, setEmailResetSent] = useState(false);

  // Sync state if user profile is updated elsewhere
  useEffect(() => {
    setName(user.name);
    setUsername(user.username || '');
    setPhone(user.phone || '');
    setEmail(user.email || firebaseUser?.email || '');
  }, [user.name, user.username, user.phone, user.email, firebaseUser?.email]);


  // --- Fitness and Habits trend data calculations ---
  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's totals for fitness modal
  const todayLogs = (fitnessLogs || []).filter(log => log.date === todayStr);
  const todaySteps = todayLogs.reduce((sum, log) => sum + (log.steps || 0), 0);
  const todayDuration = todayLogs.reduce((sum, log) => sum + (log.workoutDuration || 0), 0);
  const todayCalories = todayLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

  const stepsPct = Math.min(100, Math.round((todaySteps / (user.stepsTarget || 10000)) * 100));
  const durationPct = Math.min(100, Math.round((todayDuration / (user.workoutDurationTarget || 30)) * 100));
  const caloriesPct = Math.min(100, Math.round((todayCalories / (user.caloriesTarget || 500)) * 100));

  // Get last 7 days labels and date strings for weekly charts
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      dateStr: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate()
    };
  }).reverse();

  // Aggregate stats per day for weekly chart
  const weeklyChartData = last7Days.map(day => {
    const dayLogs = (fitnessLogs || []).filter(log => log.date === day.dateStr);
    const daySteps = dayLogs.reduce((sum, log) => sum + (log.steps || 0), 0);
    const dayCals = dayLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
    const dayMins = dayLogs.reduce((sum, log) => sum + (log.workoutDuration || 0), 0);
    return {
      label: day.label,
      steps: daySteps,
      calories: dayCals,
      minutes: dayMins
    };
  });

  // --- Daily Performance: last 30 days ---
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyPerfData = last30Days.map(dateStr => {
    const dayLogs = (fitnessLogs || []).filter(log => log.date === dateStr);
    const s = dayLogs.reduce((sum, l) => sum + (l.steps || 0), 0);
    const c = dayLogs.reduce((sum, l) => sum + (l.caloriesBurned || 0), 0);
    const m = dayLogs.reduce((sum, l) => sum + (l.workoutDuration || 0), 0);
    const sT = user.stepsTarget || 10000;
    const cT = user.caloriesTarget || 500;
    const mT = user.workoutDurationTarget || 30;
    const signals = [Math.min(100, (s / sT) * 100), Math.min(100, (c / cT) * 100), Math.min(100, (m / mT) * 100)];
    return Math.round(signals.reduce((a, b) => a + b, 0) / signals.length);
  });

  // X-axis labels: show every 5th day as "D+N"
  const perfLabels = last30Days.map((dateStr, i) => {
    if (i % 5 === 0 || i === 29) {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return '';
  });

  const currentPerfScore = dailyPerfData[dailyPerfData.length - 1];
  const avgPerfScore = Math.round(dailyPerfData.reduce((a, b) => a + b, 0) / dailyPerfData.length);

  // Build SVG smooth line for daily perf
  const perfW = 320, perfH = 100, perfPL = 30, perfPR = 10, perfPT = 12, perfPB = 20;
  const perfCW = perfW - perfPL - perfPR;
  const perfCH = perfH - perfPT - perfPB;
  const perfPts = dailyPerfData.map((v, i) => ({
    x: perfPL + (i / (dailyPerfData.length - 1)) * perfCW,
    y: perfPT + perfCH - (v / 100) * perfCH
  }));
  let perfLine = `M ${perfPts[0].x} ${perfPts[0].y}`;
  for (let i = 0; i < perfPts.length - 1; i++) {
    const p0 = perfPts[i], p1 = perfPts[i + 1];
    const mx = (p0.x + p1.x) / 2;
    perfLine += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  const perfArea = `${perfLine} L ${perfPts[perfPts.length-1].x} ${perfPT+perfCH} L ${perfPts[0].x} ${perfPT+perfCH} Z`;
  const perfLast = perfPts[perfPts.length - 1];

  // --- Habits trend calculation ---
  const last7DaysDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });


  const habitLabels = last7DaysDates.map(dateStr => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  // Username validation effect
  useEffect(() => {
    if (!username || username === user.username) {
      setUsernameStatus('idle');
      return;
    }

    if (/\s/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    if (/[A-Z]/.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    const usernameRegex = /^[a-z0-9_.\-@!#$%^&*()+=~`{}|[\]\\:;"'<>,.?/]+$/;
    if (!usernameRegex.test(username)) {
      setUsernameStatus('invalid');
      return;
    }

    setUsernameStatus('checking');

    const delayDebounce = setTimeout(async () => {
      try {
        const exists = await checkUsernameExists(username);
        if (exists) {
          setUsernameStatus('taken');
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        console.error(err);
        setUsernameStatus('idle');
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [username, user.username, checkUsernameExists]);

  // Phone OTP resend timer effect
  useEffect(() => {
    let interval: any;
    if (showPhoneOtpModal && phoneOtpResendTimer > 0) {
      interval = setInterval(() => {
        setPhoneOtpResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPhoneOtpModal, phoneOtpResendTimer]);

  // Email OTP resend timer effect
  useEffect(() => {
    let interval: any;
    if (showEmailOtpModal && emailOtpResendTimer > 0) {
      interval = setInterval(() => {
        setEmailOtpResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showEmailOtpModal, emailOtpResendTimer]);

  const handlePhoneOtpChange = (value: string, index: number) => {
    if (value && isNaN(Number(value))) return;
    const newOtp = [...enteredPhoneOtp];
    newOtp[index] = value.substring(value.length - 1);
    setEnteredPhoneOtp(newOtp);
    setPhoneOtpError(null);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`phone-otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handlePhoneOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !enteredPhoneOtp[index] && index > 0) {
      const prevInput = document.getElementById(`phone-otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleResendPhoneOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedPhoneOtp(otp);
    setEnteredPhoneOtp(['', '', '', '', '', '']);
    setPhoneOtpError(null);
    setPhoneOtpResendTimer(60);
    setSimulatedMessage({
      type: 'sms',
      to: phone,
      text: `Your LevelUp Life phone update code is: ${otp}`
    });
  };

  const handleVerifyPhoneOtpAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneOtpError(null);
    const code = enteredPhoneOtp.join('');
    if (code.length < 6) {
      setPhoneOtpError("Please enter all 6 digits.");
      return;
    }

    if (code !== generatedPhoneOtp) {
      setPhoneOtpError("Invalid verification code. Please check and try again.");
      return;
    }

    setIsUpdatingPhone(true);
    setShowPhoneOtpModal(false);
    try {
      await updatePhone(phone.trim());
      setPhoneSuccess(true);
      setTimeout(() => setPhoneSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setDetailsError(err.message || "Failed to update phone number.");
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleEmailOtpChange = (value: string, index: number) => {
    if (value && isNaN(Number(value))) return;
    const newOtp = [...enteredEmailOtp];
    newOtp[index] = value.substring(value.length - 1);
    setEnteredEmailOtp(newOtp);
    setEmailOtpError(null);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`email-otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleEmailOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !enteredEmailOtp[index] && index > 0) {
      const prevInput = document.getElementById(`email-otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleResendEmailOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedEmailOtp(otp);
    setEnteredEmailOtp(['', '', '', '', '', '']);
    setEmailOtpError(null);
    setEmailOtpResendTimer(60);
    setSimulatedMessage({
      type: 'email',
      to: email,
      text: `Your LevelUp Life email update verification code is: ${otp}`
    });
  };

  const handleVerifyEmailOtpAndUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailOtpError(null);
    const code = enteredEmailOtp.join('');
    if (code.length < 6) {
      setEmailOtpError("Please enter all 6 digits.");
      return;
    }

    if (code !== generatedEmailOtp) {
      setEmailOtpError("Invalid verification code. Please check and try again.");
      return;
    }

    setIsUpdatingEmail(true);
    setShowEmailOtpModal(false);
    try {
      await updateUserEmail(email.trim());
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setDetailsError(err.message || "Failed to update email. For security, updating email may require a recent login.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const stats = [
    { label: 'Intelligence (Focus Hours)', value: '14 Int', desc: 'Increases deep work rate' },
    { label: 'Strength (Fitness Workouts)', value: '18 Str', desc: 'Increases health points defense' },
    { label: 'Wisdom (Meditation/Reading)', value: '12 Wis', desc: 'Increases mana regeneration' },
    { label: 'Fortitude (Daily Timelines Completed)', value: '15 Ftr', desc: 'Reduces streak loss risk' }
  ];

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    setNameSuccess(false);
    if (!name.trim()) {
      setDetailsError("Name cannot be empty.");
      return;
    }
    setIsUpdatingName(true);
    try {
      await updateName(name.trim());
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setDetailsError(err.message || "Failed to update name.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    setUsernameSuccess(false);

    if (!username) {
      setDetailsError("Username cannot be empty.");
      return;
    }
    if (/\s/.test(username)) {
      setDetailsError("Username cannot contain spaces.");
      return;
    }
    if (/[A-Z]/.test(username)) {
      setDetailsError("Username must be in lowercase (small) letters only. Uppercase characters are not allowed.");
      return;
    }

    const usernameRegex = /^[a-z0-9_.\-@!#$%^&*()+=~`{}|[\]\\:;"'<>,.?/]+$/;
    if (!usernameRegex.test(username)) {
      setDetailsError("Username contains invalid characters.");
      return;
    }

    if (usernameStatus === 'taken') {
      setDetailsError("This username is already taken by another Hero.");
      return;
    }
    setIsUpdatingUsername(true);
    try {
      await updateUsername(username);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setDetailsError(err.message || "Failed to update username.");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleUpdatePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    setPhoneSuccess(false);

    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setDetailsError("Phone number cannot be empty.");
      return;
    }

    if (cleanPhone === user.phone) {
      setDetailsError("Phone number is already set to this value.");
      return;
    }

    setIsUpdatingPhone(true);
    try {
      const exists = await checkPhoneExists(cleanPhone);
      if (exists) {
        setDetailsError("This phone number is already registered with another Hero.");
        return;
      }

      // Trigger OTP verification modal
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPhoneOtp(otp);
      setEnteredPhoneOtp(['', '', '', '', '', '']);
      setPhoneOtpError(null);
      setPhoneOtpResendTimer(60);
      setShowPhoneOtpModal(true);
      setSimulatedMessage({
        type: 'sms',
        to: cleanPhone,
        text: `Your LevelUp Life phone update code is: ${otp}`
      });
    } catch (err: any) {
      console.error(err);
      setDetailsError(err.message || "Failed to check phone number uniqueness.");
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setDetailsError(null);
    setEmailSuccess(false);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setDetailsError("Email address cannot be empty.");
      return;
    }

    const currentEmailVal = user.email || firebaseUser?.email || '';
    if (cleanEmail === currentEmailVal) {
      setDetailsError("Email address is already set to this value.");
      return;
    }

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!isEmail) {
      setDetailsError("Please enter a valid email format.");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const exists = await checkEmailExists(cleanEmail);
      if (exists) {
        setDetailsError("This email address is already registered with another Hero.");
        return;
      }

      // Trigger Email OTP verification modal
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedEmailOtp(otp);
      setEnteredEmailOtp(['', '', '', '', '', '']);
      setEmailOtpError(null);
      setEmailOtpResendTimer(60);
      setShowEmailOtpModal(true);
      setSimulatedMessage({
        type: 'email',
        to: cleanEmail,
        text: `Your LevelUp Life email update verification code is: ${otp}`
      });
    } catch (err: any) {
      console.error(err);
      setDetailsError(err.message || "Failed to check email uniqueness.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    
    if (newPassword.length < 6) {
      setPassError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Passwords do not match.');
      return;
    }

    setIsUpdatingPass(true);
    try {
      await updatePasswordInFirestore(newPassword);
      setPassSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setPassError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!firebaseUser?.email) return;
    setEmailResetSent(false);
    try {
      await sendPasswordReset(firebaseUser.email);
      setEmailResetSent(true);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to send recovery email.');
    }
  };



  return (
    <div className="space-y-6">
      
      {/* Top Hero Card */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Background visual detail */}
        <div className="absolute top-0 left-0 w-36 h-36 bg-gradient-to-tr from-rpg-level/10 to-transparent rounded-br-full blur-xl pointer-events-none" />

        <AvatarBuilder config={user.avatar} size={130} />
        
        <div className="flex-1 text-center md:text-left space-y-3">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{user.name}</h2>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">
              Champion
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto md:mx-0">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-rpg-border/40 text-center">
              <Flame className="w-4 h-4 text-rpg-health mx-auto mb-1 animate-pulse" />
              <div className="text-[10px] font-bold text-slate-500 uppercase">Streak</div>
              <div className="text-xs font-black text-white mt-0.5">{user.streak} Days</div>
            </div>

            <div className="p-2 rounded-xl bg-slate-950/60 border border-rpg-border/40 text-center">
              <Shield className="w-4 h-4 text-rpg-discipline mx-auto mb-1" />
              <div className="text-[10px] font-bold text-slate-500 uppercase">Discipline</div>
              <div className="text-xs font-black text-white mt-0.5">{user.disciplineScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-950/60 rounded-xl border border-rpg-border/40 max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'details' ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <User className="w-3.5 h-3.5" /> User details
        </button>
        <button
          onClick={() => setActiveTab('performance')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'performance' ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" /> Performance
        </button>
        <button
          onClick={() => setActiveTab('password')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'password' ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Lock className="w-3.5 h-3.5" /> Password
        </button>
      </div>

      {/* --- TAB CONTENT: USER DETAILS --- */}
      {activeTab === 'details' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* User Profile Form */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-rpg-xp" /> Account Information
            </h3>

            <div className="space-y-4">
              {detailsError && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-950/60 text-red-400 text-xs font-semibold">
                  ⚠️ {detailsError}
                </div>
              )}

              {/* Name Field */}
              <form onSubmit={handleUpdateName} className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hero Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ashok Kumar"
                    className="flex-1 px-4 py-2 bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all rounded-xl"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isUpdatingName}
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingName}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rpg-border/50 text-white text-xs font-bold transition-all disabled:opacity-50 min-w-[70px]"
                  >
                    {isUpdatingName ? 'Saving...' : 'Update'}
                  </button>
                </div>
                {nameSuccess && (
                  <p className="text-[9px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Name updated!
                  </p>
                )}
              </form>

              {/* Username Field */}
              <form onSubmit={handleUpdateUsername} className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hero Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. ashok_k"
                    className="flex-1 px-4 py-2 bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all rounded-xl"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={isUpdatingUsername}
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingUsername || usernameStatus === 'taken'}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rpg-border/50 text-white text-xs font-bold transition-all disabled:opacity-50 min-w-[70px]"
                  >
                    {isUpdatingUsername ? 'Saving...' : 'Update'}
                  </button>
                </div>
                {usernameStatus === 'checking' && (
                  <span className="text-[9px] font-semibold text-rpg-level mt-1 block">
                    ⏳ Checking username availability...
                  </span>
                )}
                {usernameStatus === 'available' && (
                  <span className="text-[9px] font-semibold text-emerald-400 mt-1 block">
                    ✅ Username is available!
                  </span>
                )}
                {usernameStatus === 'taken' && (
                  <span className="text-[9px] font-semibold text-rose-400 mt-1 block">
                    ⚠️ This username is already taken by another Hero.
                  </span>
                )}
                {usernameStatus === 'invalid' && (
                  <span className="text-[9px] font-semibold text-amber-500 mt-1 block">
                    ⚠️ Must be small letters only, no uppercase or spaces. Special symbols are allowed.
                  </span>
                )}
                {usernameSuccess && (
                  <p className="text-[9px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Username updated!
                  </p>
                )}
              </form>

              {/* Phone Field */}
              <form onSubmit={handleUpdatePhone} className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +1234567890"
                    className="flex-1 px-4 py-2 bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all rounded-xl"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isUpdatingPhone}
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingPhone}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rpg-border/50 text-white text-xs font-bold transition-all disabled:opacity-50 min-w-[70px]"
                  >
                    {isUpdatingPhone ? 'Saving...' : 'Update'}
                  </button>
                </div>
                {phoneSuccess && (
                  <p className="text-[9px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Phone number updated!
                  </p>
                )}
              </form>

              {/* Email Field */}
              <form onSubmit={handleUpdateEmail} className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="hero@kingdom.com"
                    className="flex-1 px-4 py-2 bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all rounded-xl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isUpdatingEmail}
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingEmail}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rpg-border/50 text-white text-xs font-bold transition-all disabled:opacity-50 min-w-[70px]"
                  >
                    {isUpdatingEmail ? 'Saving...' : 'Update'}
                  </button>
                </div>
                <div className="text-[9px] text-slate-500 font-semibold mt-1">
                  Current Email: <span className="text-slate-400">{user.email || 'None'}</span> | Phone: <span className="text-slate-400">{user.phone || 'None'}</span>
                </div>
                {emailSuccess && (
                  <p className="text-[9px] text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Email address updated!
                  </p>
                )}
              </form>
            </div>


          </div>

          {/* Daily Streak Overview */}
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rpg-health animate-pulse" /> Hero Daily Streak
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950/40 border border-rpg-border/30 space-y-3.5">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-rpg-border/20 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Daily Streak</span>
                  <span className="text-xs font-black text-rpg-health mt-1 block">🔥 {user.streak} Days</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Switch Account Option */}
        <div className="mt-6">
          <button
            onClick={() => setShowSavedAccounts(true)}
            className="w-full py-3 rounded-xl border border-rpg-border/60 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            🔄 Switch Account
          </button>
        </div>

        {/* Logout Option at the bottom */}
        <div className="mt-3">
          {firebaseUser ? (
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          ) : (
            <button
              onClick={logout}
              className="w-full py-3 rounded-xl border border-rpg-xp bg-rpg-xp/10 text-rpg-xp text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-rpg-xp/25"
            >
              Link Account
            </button>
          )}
        </div>
        </>
      )}

      {/* --- TAB CONTENT: PERFORMANCE --- */}
      {activeTab === 'performance' && (
        <div className="space-y-8 animate-fadeIn text-left">
          
          {/* 1. Long-Term Planning Trends */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Long-Term Planning Trends
            </h3>
            {longTermPlans.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-500 text-xs font-medium border border-dashed border-rpg-border/40 rounded-xl">
                📜 No active planning objectives found. Create long-term plans in the Planner to track your consistency graphs here!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {longTermPlans.map((plan, idx) => {
                  const { trend, labels } = getPlanTrendData(plan);
                  const colorConfig = GRAPH_COLORS[idx % GRAPH_COLORS.length];
                  const currentVal = trend[trend.length - 1];

                  return (
                    <TrendGraph 
                      key={plan.id}
                      data={trend}
                      months={labels}
                      color={colorConfig.stroke}
                      gradientId={`profilePlanTrendGrad_${plan.id}`}
                      stopColor={colorConfig.stop}
                      title={`${plan.type === 'week' ? 'Weekly Plan' : 'Monthly Plan'}: ${plan.title}`}
                      currentValue={currentVal}
                      onClick={() => {
                        setActivePlanForModal(plan);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Fitness Tracking Trends */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Fitness Tracking Trends
            </h3>
            
            {/* All 3 Fitness Charts in compact grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Daily Performance SVG Graph */}
              <div 
                onClick={() => setShowFitnessModal(true)}
                className="w-full p-2.5 rounded-xl bg-slate-950/40 border border-rpg-border/20 space-y-1 cursor-pointer hover:scale-[1.02] hover:border-emerald-500/50 hover:bg-slate-900/60 active:scale-95 transition-all"
              >
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="truncate pr-2 max-w-[70%]">Daily Performance</span>
                  <span className="text-emerald-400 font-extrabold flex-shrink-0">{currentPerfScore}%</span>
                </div>
                <svg viewBox={`0 0 ${perfW} ${perfH}`} className="w-full overflow-visible select-none">
                  <defs>
                    <linearGradient id="profilePerfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[25, 50, 75].map((yv, idx) => {
                    const y = perfPT + perfCH - (yv / 100) * perfCH;
                    return (
                      <g key={idx} opacity="0.15">
                        <line x1={perfPL} y1={y} x2={perfW - perfPR} y2={y} stroke="#cbd5e1" strokeDasharray="3,3" />
                        <text x={perfPL - 8} y={y + 3} fill="#cbd5e1" fontSize="8" textAnchor="end" fontWeight="bold">{yv}%</text>
                      </g>
                    );
                  })}
                  {perfLabels.map((lbl, idx) => {
                    if (!lbl) return null;
                    const x = perfPL + (idx / (dailyPerfData.length - 1)) * perfCW;
                    return (
                      <text key={idx} x={x} y={perfH - 8} fill="#94a3b8" fontSize="8"
                        textAnchor="middle" fontWeight="bold" opacity="0.7">{lbl}</text>
                    );
                  })}
                  <path d={perfArea} fill="url(#profilePerfGrad)" />
                  <path d={perfLine} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {perfPts.length > 0 && (
                    <circle cx={perfLast.x} cy={perfLast.y} r="4" fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
                  )}
                </svg>
              </div>

              {/* Weekly Steps Line Chart */}
              {(() => {
                const W = 320, H = 100, PL = 30, PR = 10, PT = 12, PB = 20;
                const CW = W - PL - PR, CH = H - PT - PB;
                const vals = weeklyChartData.map(d => d.steps);
                const maxV = Math.max(...vals, 1);
                const pts = vals.map((v, i) => ({
                  x: PL + (i / (vals.length - 1)) * CW,
                  y: PT + CH - (v / maxV) * CH
                }));
                let line = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const mx = (pts[i].x + pts[i+1].x) / 2;
                  line += ` C ${mx} ${pts[i].y}, ${mx} ${pts[i+1].y}, ${pts[i+1].x} ${pts[i+1].y}`;
                }
                const area = `${line} L ${pts[pts.length-1].x} ${PT+CH} L ${pts[0].x} ${PT+CH} Z`;
                const last = pts[pts.length - 1];
                return (
                  <div 
                    onClick={() => setShowFitnessModal(true)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/40 border border-rpg-border/20 space-y-1 cursor-pointer hover:scale-[1.02] hover:border-cyan-500/50 hover:bg-slate-900/60 active:scale-95 transition-all"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Footprints className="w-3 h-3 text-cyan-400" /> Steps</span>
                      <span className="text-cyan-400">{weeklyChartData[weeklyChartData.length-1].steps.toLocaleString()}</span>
                    </div>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible select-none">
                      <defs>
                        <linearGradient id="profileWStepsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0.25, 0.5, 0.75, 1].map((r, i) => {
                        const y = PT + CH - r * CH;
                        return <g key={i} opacity="0.1"><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#cbd5e1" strokeDasharray="3,3" /><text x={PL-4} y={y+3} fill="#cbd5e1" fontSize="6.5" textAnchor="end" fontWeight="bold">{Math.round(r*maxV)}</text></g>;
                      })}
                      {pts.map((pt, i) => (
                        <text key={i} x={pt.x} y={H-5} fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold" opacity="0.7">{weeklyChartData[i].label}</text>
                      ))}
                      <path d={area} fill="url(#profileWStepsGrad)" />
                      <path d={line} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />)}
                      <circle cx={last.x} cy={last.y} r="5" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
                    </svg>
                  </div>
                );
              })()}

              {/* Weekly Calories Line Chart */}
              {(() => {
                const W = 320, H = 100, PL = 30, PR = 10, PT = 12, PB = 20;
                const CW = W - PL - PR, CH = H - PT - PB;
                const vals = weeklyChartData.map(d => d.calories);
                const maxV = Math.max(...vals, 1);
                const pts = vals.map((v, i) => ({
                  x: PL + (i / (vals.length - 1)) * CW,
                  y: PT + CH - (v / maxV) * CH
                }));
                let line = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const mx = (pts[i].x + pts[i+1].x) / 2;
                  line += ` C ${mx} ${pts[i].y}, ${mx} ${pts[i+1].y}, ${pts[i+1].x} ${pts[i+1].y}`;
                }
                const area = `${line} L ${pts[pts.length-1].x} ${PT+CH} L ${pts[0].x} ${PT+CH} Z`;
                const last = pts[pts.length - 1];
                return (
                  <div 
                    onClick={() => setShowFitnessModal(true)}
                    className="w-full p-2.5 rounded-xl bg-slate-950/40 border border-rpg-border/20 space-y-1 cursor-pointer hover:scale-[1.02] hover:border-orange-500/50 hover:bg-slate-900/60 active:scale-95 transition-all"
                  >
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Calories</span>
                      <span className="text-orange-400">{weeklyChartData[weeklyChartData.length-1].calories} kcal</span>
                    </div>
                    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible select-none">
                      <defs>
                        <linearGradient id="profileWCalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {[0.25, 0.5, 0.75, 1].map((r, i) => {
                        const y = PT + CH - r * CH;
                        return <g key={i} opacity="0.1"><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#cbd5e1" strokeDasharray="3,3" /><text x={PL-4} y={y+3} fill="#cbd5e1" fontSize="6.5" textAnchor="end" fontWeight="bold">{Math.round(r*maxV)}</text></g>;
                      })}
                      {pts.map((pt, i) => (
                        <text key={i} x={pt.x} y={H-5} fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold" opacity="0.7">{weeklyChartData[i].label}</text>
                      ))}
                      <path d={area} fill="url(#profileWCalGrad)" />
                      <path d={line} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#f97316" stroke="#0f172a" strokeWidth="1.5" />)}
                      <circle cx={last.x} cy={last.y} r="5" fill="#f97316" stroke="#0f172a" strokeWidth="2" />
                    </svg>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 3. Habits Consistency Trends */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="text-base">🌱</span> Habits Consistency Trends
            </h3>
            {habits.length === 0 ? (
              <div className="glass-card p-6 text-center text-slate-500 text-xs font-medium border border-dashed border-rpg-border/40 rounded-xl">
                🌱 No habits tracked yet. Set habits in the Habits tab to view consistency trends!
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* Individual habits trends */}
                {habits.map((habit, idx) => {
                  const trend = last7DaysDates.map(dateStr => habit.completedDates.includes(dateStr) ? 100 : 0);
                  const colorConfig = GRAPH_COLORS[idx % GRAPH_COLORS.length];
                  const currentVal = trend[trend.length - 1];

                  return (
                    <TrendGraph 
                      key={habit.id}
                      data={trend}
                      months={habitLabels}
                      color={colorConfig.stroke}
                      gradientId={`profileHabitTrendGrad_${habit.id}`}
                      stopColor={colorConfig.stop}
                      title={`Habit: ${habit.name}`}
                      currentValue={currentVal}
                      onClick={() => {
                        setActiveHabitForModal(habit);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB CONTENT: PASSWORD --- */}
      {activeTab === 'password' && (
        <div className="max-w-md mx-auto">
          {!firebaseUser ? (
            /* Offline Warning */
            <div className="glass-card p-6 text-center space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-bold text-white">Offline Guest Mode Active</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-medium">
                  Passwords can only be managed for cloud-synchronized accounts. Please link your account to secure your level milestones, gear, and habits across devices.
                </p>
              </div>
              <button
                onClick={() => setScreen('settings')}
                className="px-5 py-2.5 w-full rounded-xl bg-gradient-to-r from-rpg-xp to-indigo-600 text-white font-bold text-xs shadow-lg hover:opacity-90 active:scale-98 transition-all"
              >
                Go to Settings to Link Account
              </button>
            </div>
          ) : (
            /* Password Update Form */
            <div className="glass-card p-5 space-y-4 animate-fadeIn">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-rpg-xp" /> Credentials Manager
              </h3>

              <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                {passError && (
                  <div className="p-3 rounded-xl bg-red-950/20 border border-red-950/60 text-red-400 text-xs font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}

                {passSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-950/60 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      placeholder="At least 6 characters"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      placeholder="Repeat new password"
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPass}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-indigo-600 text-white text-xs font-bold transition-all disabled:opacity-50 hover:opacity-95 active:scale-98"
                >
                  {isUpdatingPass ? 'Updating Scroll...' : 'Change Password'}
                </button>
              </form>

              {/* Password Recovery alternative */}
              <div className="pt-4 mt-2 border-t border-rpg-border/20 text-center space-y-2">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  Alternative Recovery Method
                </span>
                <button
                  onClick={handleSendResetEmail}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-rpg-border/40 hover:border-rpg-border/70 text-slate-300 text-[10px] font-bold transition-all"
                >
                  Send Reset Password Email
                </button>
                {emailResetSent && (
                  <p className="text-[9px] text-emerald-400 font-bold flex items-center justify-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Password recovery scroll sent to your inbox!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Phone OTP verification Modal */}
      {showPhoneOtpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm p-8 rounded-3xl border border-rpg-border/40 bg-[#0e1424]/90 flex flex-col items-center text-center space-y-6 relative overflow-hidden shadow-2xl animate-float">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rpg-xp to-rpg-level flex items-center justify-center shadow-lg shadow-rpg-level/20">
              <Phone className="w-7 h-7 text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Verify New Phone Number</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Enter the 6-digit verification code sent to <span className="text-white font-bold">{phone}</span>.
              </p>
            </div>

            {phoneOtpError && (
              <div className="w-full p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed">
                ⚠️ {phoneOtpError}
              </div>
            )}

            <form onSubmit={handleVerifyPhoneOtpAndUpdate} className="w-full space-y-6">
              <div className="flex justify-between gap-2">
                {enteredPhoneOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`phone-otp-${idx}`}
                    type="text"
                    pattern="[0-9]*"
                    maxLength={1}
                    required
                    value={digit}
                    onChange={(e) => handlePhoneOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handlePhoneOtpKeyDown(e, idx)}
                    className="w-11 h-12 rounded-xl bg-slate-950/80 border border-rpg-border/50 text-white font-black text-lg text-center focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/30 transition-all"
                  />
                ))}
              </div>

              <div className="text-xs font-semibold text-slate-400">
                {phoneOtpResendTimer > 0 ? (
                  <span>Resend code in <span className="text-rpg-level font-bold">{phoneOtpResendTimer}s</span></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendPhoneOtp}
                    className="text-rpg-xp hover:underline font-bold"
                  >
                    Resend SMS Code
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPhoneOtpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-rpg-border/40 text-slate-400 text-xs font-bold hover:bg-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-rpg-level text-white text-xs font-bold shadow-lg shadow-rpg-level/25 hover:opacity-90 active:scale-95 transition-all animate-glow"
                >
                  Verify & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email OTP verification Modal */}
      {showEmailOtpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md p-8 rounded-3xl border border-rpg-border/40 bg-[#0e1424]/90 flex flex-col space-y-6 relative overflow-hidden shadow-2xl animate-float">
            <div className="flex items-center gap-3 border-b border-rpg-border/20 pb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rpg-xp to-rpg-level flex items-center justify-center shadow-lg shadow-rpg-level/20">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Verify New Email Address</h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              We need to verify the new email address before saving it. Please review your account links and enter the 6-digit code sent to <span className="text-white font-bold">{email}</span>:
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-rpg-border/30 space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Previous Email Address
                </span>
                <span className="text-xs font-semibold text-white mt-1 block">
                  {user.email || firebaseUser?.email || 'None'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Previous Phone Number
                </span>
                <span className="text-xs font-semibold text-white mt-1 block">
                  {user.phone || 'None'}
                </span>
              </div>

              <div className="pt-2 border-t border-rpg-border/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rpg-xp block">
                  New Email Address
                </span>
                <span className="text-xs font-black text-emerald-400 mt-1 block">
                  {email}
                </span>
              </div>
            </div>

            {emailOtpError && (
              <div className="w-full p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed text-center">
                ⚠️ {emailOtpError}
              </div>
            )}

            <form onSubmit={handleVerifyEmailOtpAndUpdate} className="w-full space-y-6">
              <div className="flex justify-between gap-2">
                {enteredEmailOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`email-otp-${idx}`}
                    type="text"
                    pattern="[0-9]*"
                    maxLength={1}
                    required
                    value={digit}
                    onChange={(e) => handleEmailOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleEmailOtpKeyDown(e, idx)}
                    className="w-11 h-12 rounded-xl bg-slate-950/80 border border-rpg-border/50 text-white font-black text-lg text-center focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/30 transition-all"
                  />
                ))}
              </div>

              <div className="text-xs font-semibold text-slate-400 text-center">
                {emailOtpResendTimer > 0 ? (
                  <span>Resend code in <span className="text-rpg-level font-bold">{emailOtpResendTimer}s</span></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendEmailOtp}
                    className="text-rpg-xp hover:underline font-bold"
                  >
                    Resend Email Code
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailOtpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-rpg-border/40 text-slate-400 text-xs font-bold hover:bg-slate-900 transition-all text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-rpg-level text-white text-xs font-bold shadow-lg shadow-rpg-level/25 hover:opacity-90 active:scale-95 transition-all text-center animate-glow"
                >
                  Verify & Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Planning Modal Overlay */}
      {(() => {
        const currentPlanInstance = activePlanForModal 
          ? longTermPlans.find(p => p.id === activePlanForModal.id) || activePlanForModal
          : null;
        if (!currentPlanInstance) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="glass-card w-full max-w-6xl p-5 sm:p-6 border-indigo-500/30 flex flex-col gap-4 relative bg-slate-950/90 shadow-2xl max-h-[90vh]">
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setActivePlanForModal(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Discipline Tracker Checklist
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1 flex items-center gap-2">
                  <span>📋</span> {currentPlanInstance.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Period: {currentPlanInstance.targetDate}
                </p>
              </div>

              {/* Checklist Table */}
              <div className="overflow-x-auto rounded-xl border border-rpg-border/40 bg-slate-950/60 no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-rpg-border/30 bg-slate-950/80 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-950 z-20 border-r border-rpg-border/40 w-[180px]">
                        Habits / Routines
                      </th>
                      {getDatesInRange(currentPlanInstance.fromDate, currentPlanInstance.toDate).map(d => {
                        const date = new Date(d);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 3);
                        const dayNum = date.getDate();
                        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                        return (
                          <th key={d} className="w-[60px] p-2 border-r border-rpg-border/20 last:border-r-0 text-center align-middle">
                            <div className="flex flex-col items-center justify-center text-[10px] py-1 text-slate-400 font-extrabold uppercase">
                              <div>{dayName}</div>
                              <div className="text-xs text-white mt-0.5">{dayNum}</div>
                              <div className="text-[8px] text-indigo-400 font-bold mt-0.5">{monthName}</div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {currentPlanInstance.routines && currentPlanInstance.routines.map((routine: any) => (
                      <tr key={routine.id} className="border-b border-rpg-border/20 hover:bg-slate-900/20 transition-colors">
                        {/* Sticky Routine Header cell */}
                        <td className="sticky left-0 bg-slate-950 z-20 w-[180px] p-3 border-r border-rpg-border/40 text-xs font-bold text-slate-200">
                          <div className="truncate" title={routine.title}>{routine.title}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">⏰ {routine.startTime} - {routine.endTime}</div>
                        </td>
                        {/* Completion check cells */}
                        {getDatesInRange(currentPlanInstance.fromDate, currentPlanInstance.toDate).map(d => {
                          const todayStr = new Date().toLocaleDateString('en-CA');
                          const isFuture = d > todayStr;
                          const key = `${d}_${routine.id}`;
                          const isChecked = !!(currentPlanInstance.completions && currentPlanInstance.completions[key]);
                          const formattedDate = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <td key={d} className="p-2 text-center border-r border-rpg-border/20 last:border-r-0 w-[60px]">
                              <button
                                disabled={isFuture}
                                onClick={() => {
                                  // Toggle Routine Completion
                                  const completions = { ...(currentPlanInstance.completions || {}) };
                                  if (completions[key]) {
                                    delete completions[key];
                                  } else {
                                    completions[key] = true;
                                  }
                                  updateLongTermPlan({
                                    ...currentPlanInstance,
                                    completions
                                  });
                                }}
                                title={isFuture ? `Locked (Future Date: ${formattedDate})` : `${routine.title} (${formattedDate})`}
                                className={`w-6 h-6 rounded border flex items-center justify-center transition-all mx-auto ${
                                  isFuture
                                    ? 'bg-slate-950/40 border-rpg-border/25 text-transparent cursor-not-allowed opacity-25'
                                    : isChecked 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-600/30 cursor-pointer' 
                                    : 'bg-slate-900 border-rpg-border/40 text-transparent hover:border-indigo-500 cursor-pointer'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Summary Rows */}
                    {(() => {
                      const dates = getDatesInRange(currentPlanInstance.fromDate, currentPlanInstance.toDate);
                      const stats = dates.map(d => {
                        let done = 0;
                        const total = currentPlanInstance.routines?.length || 0;
                        currentPlanInstance.routines?.forEach((r: any) => {
                          const key = `${d}_${r.id}`;
                          if (currentPlanInstance.completions && currentPlanInstance.completions[key]) {
                            done++;
                          }
                        });
                        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                        return { done, total, pct };
                      });

                      return (
                        <>
                          {/* Progress (%) Row */}
                          <tr className="border-b border-rpg-border/30 bg-slate-900/30">
                            <td className="sticky left-0 bg-slate-950 z-20 w-[180px] p-3 border-r border-rpg-border/40 text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                              Progress
                            </td>
                            {stats.map((stat, idx) => (
                              <td key={idx} className="p-2 text-center border-r border-rpg-border/20 last:border-r-0 w-[60px] text-[10px] font-black text-indigo-400">
                                {stat.pct}%
                              </td>
                            ))}
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 2. Fitness Modal Overlay */}
      {showFitnessModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-4xl p-5 sm:p-6 border-emerald-500/30 flex flex-col gap-5 relative bg-slate-950/90 shadow-2xl max-h-[90vh] text-left">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowFitnessModal(false);
                setShowAddFitnessForm(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                Fitness Tracker Checklist
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
                <span>🏋️</span> Today's Fitness Targets
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Date: {todayStr}
              </p>
            </div>

            {/* Today's Overview Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Steps */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-rpg-border/40 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Footprints className="w-3.5 h-3.5 text-cyan-400" /> Steps</span>
                  <span className="text-cyan-400">Target: {user.stepsTarget || 10000}</span>
                </div>
                <div className="text-xl font-black text-white">{todaySteps.toLocaleString()}</div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-rpg-border/20">
                  <div className="h-full bg-cyan-400 rounded-full transition-all duration-300" style={{ width: `${stepsPct}%` }} />
                </div>
              </div>

              {/* Workout Duration */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-rpg-border/40 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /> Minutes</span>
                  <span className="text-indigo-400">Target: {user.workoutDurationTarget || 30}m</span>
                </div>
                <div className="text-xl font-black text-white">{todayDuration} mins</div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-rpg-border/20">
                  <div className="h-full bg-indigo-400 rounded-full transition-all duration-300" style={{ width: `${durationPct}%` }} />
                </div>
              </div>

              {/* Calories */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-rpg-border/40 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> Calories</span>
                  <span className="text-orange-400">Target: {user.caloriesTarget || 500} kcal</span>
                </div>
                <div className="text-xl font-black text-white">{todayCalories} kcal</div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-rpg-border/20">
                  <div className="h-full bg-orange-400 rounded-full transition-all duration-300" style={{ width: `${caloriesPct}%` }} />
                </div>
              </div>
            </div>

            {/* Log / Add Form Toggle */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300">Logged Activities Today</span>
              <button
                onClick={() => setShowAddFitnessForm(!showAddFitnessForm)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-rpg-border/40 text-white text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                {showAddFitnessForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showAddFitnessForm ? "Cancel" : "Log Fitness Data"}
              </button>
            </div>

            {/* Log Entry Form */}
            {showAddFitnessForm && (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const parsedDuration = parseFloat(workoutDuration) || 0;
                  const parsedSteps = parseInt(steps) || 0;
                  const parsedCalories = parseFloat(caloriesBurned) || 0;

                  if (parsedDuration === 0 && parsedSteps === 0 && parsedCalories === 0) {
                    alert("Please log some valid metrics.");
                    return;
                  }

                  addFitnessLog({
                    date: logDate,
                    steps: parsedSteps,
                    workoutDuration: parsedDuration,
                    workoutType,
                    caloriesBurned: parsedCalories,
                    notes: notes.trim() || undefined
                  });

                  // Reset
                  setWorkoutDuration('');
                  setSteps('');
                  setCaloriesBurned('');
                  setNotes('');
                  setShowAddFitnessForm(false);
                }} 
                className="p-4 rounded-xl bg-slate-950/60 border border-rpg-border/40 space-y-3.5 text-xs font-semibold text-slate-400"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block uppercase tracking-wider mb-1">Workout Type</label>
                    <div className="relative">
                      <select
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white appearance-none focus:outline-none focus:border-rpg-xp transition-all"
                        value={workoutType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWorkoutType(val);
                          if (workoutDuration) {
                            const mins = parseFloat(workoutDuration) || 0;
                            const found = WORKOUT_TYPES.find(w => w.name === val);
                            const multiplier = found ? found.caloriesPerMin : 6;
                            setCaloriesBurned(Math.round(mins * multiplier).toString());
                          }
                        }}
                      >
                        {WORKOUT_TYPES.map(type => (
                          <option key={type.name} value={type.name}>
                            {type.icon} {type.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none"
                      value={workoutDuration}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkoutDuration(val);
                        if (!val) {
                          setCaloriesBurned('');
                          return;
                        }
                        const mins = parseFloat(val) || 0;
                        const found = WORKOUT_TYPES.find(w => w.name === workoutType);
                        const multiplier = found ? found.caloriesPerMin : 6;
                        setCaloriesBurned(Math.round(mins * multiplier).toString());
                      }}
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider mb-1">Steps Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none"
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block uppercase tracking-wider mb-1">Calories Burned (kcal)</label>
                    <input
                      type="number"
                      placeholder="e.g. 300"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none"
                      value={caloriesBurned}
                      onChange={(e) => setCaloriesBurned(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block uppercase tracking-wider mb-1">Log Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none"
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Workout Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Felt great!"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-lg tracking-wide shadow-md active:scale-98 transition-all"
                >
                  Log Activity & Claim Loot (+15 XP)
                </button>
              </form>
            )}

            {/* Log Entries History for Today */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[250px] no-scrollbar">
              {todayLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-semibold border border-dashed border-rpg-border/30 rounded-xl">
                  🛡️ No workouts logged for today yet.
                </div>
              ) : (
                todayLogs.map(log => {
                  const getWorkoutIcon = (type: string) => {
                    const found = WORKOUT_TYPES.find(w => w.name === type);
                    return found ? found.icon : '⚡';
                  };

                  return (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-950/40 border border-rpg-border/30 flex items-center justify-between gap-3 group relative">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-rpg-border/40 flex items-center justify-center text-lg flex-shrink-0">
                          {getWorkoutIcon(log.workoutType)}
                        </div>
                        
                        <div className="truncate text-left">
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{log.workoutType}</span>
                          </h4>
                          
                          <div className="flex flex-wrap gap-x-2 text-[9px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                            {log.workoutDuration > 0 && <span>🕒 {log.workoutDuration} mins</span>}
                            {log.caloriesBurned > 0 && <span>🔥 {log.caloriesBurned} kcal</span>}
                            {log.steps > 0 && <span>🚶 {log.steps.toLocaleString()} steps</span>}
                          </div>
                          {log.notes && (
                            <p className="text-[9px] italic text-slate-500 truncate mt-0.5">"{log.notes}"</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => deleteFitnessLog(log.id)}
                        className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0 cursor-pointer"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* 3. Habits Modal Overlay */}
      {(() => {
        const currentHabitInstance = activeHabitForModal
          ? habits.find(h => h.id === activeHabitForModal.id) || activeHabitForModal
          : null;
        if (!currentHabitInstance) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="glass-card w-full max-w-md p-5 sm:p-6 border-indigo-500/30 flex flex-col gap-4 relative bg-slate-950/90 shadow-2xl max-h-[90vh] text-left">
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setActiveHabitForModal(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-lg border border-indigo-500/30">
                  {CATEGORY_ICONS[currentHabitInstance.category] || '🌱'}
                </div>
                <div>
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Habit Consistency Checklist
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                    {currentHabitInstance.name}
                  </h3>
                </div>
              </div>

              {/* Today's Completion Checkbox */}
              {(() => {
                const completedToday = currentHabitInstance.completedDates.includes(todayStr);
                return (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-rpg-border/30 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-300">Complete Ritual for Today</div>
                    <button
                      onClick={() => toggleHabit(currentHabitInstance.id, todayStr)}
                      className="text-slate-500 hover:text-rpg-discipline transition-colors cursor-pointer"
                    >
                      {completedToday ? (
                        <CheckCircle2 className="w-7 h-7 text-rpg-discipline animate-bounce" />
                      ) : (
                        <Circle className="w-7 h-7" />
                      )}
                    </button>
                  </div>
                );
              })()}

              {/* Streaks and Total Completed */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-rpg-border/20 text-center">
                  <Flame className="w-5 h-5 text-rpg-health mx-auto mb-1 animate-pulse" />
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Current Streak</div>
                  <div className="text-xs font-black text-white mt-0.5">{currentHabitInstance.streak} Days</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-rpg-border/20 text-center">
                  <Award className="w-5 h-5 text-rpg-gold mx-auto mb-1" />
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Total Completed</div>
                  <div className="text-xs font-black text-white mt-0.5">{currentHabitInstance.completedDates.length} Times</div>
                </div>
              </div>

              {/* Heatmap Calendar */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  Completion Calendar History
                </span>
                <HeatMap
                  completedDates={currentHabitInstance.completedDates}
                  onDateClick={(dateStr) => toggleHabit(currentHabitInstance.id, dateStr)}
                />
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
