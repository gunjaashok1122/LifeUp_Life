import React, { useState, useEffect } from 'react';
import { useApp, normalizePhone } from '../context/AppContext';
import { Shield, Sparkles, User, Mail, Lock, Loader2, Phone, Eye, EyeOff } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { 
    login, 
    register, 
    googleSignIn, 
    sendPasswordReset, 
    authLoading, 
    checkUsernameExists, 
    setSimulatedMessage,
    initiateForgotPassword,
    resetPasswordWithOtp
  } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpResendTimer, setOtpResendTimer] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);

  // Forgot password recovery wizard states
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'otp' | 'new_password'>('input');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotEnteredOtp, setForgotEnteredOtp] = useState(['', '', '', '', '', '']);
  const [forgotOtpError, setForgotOtpError] = useState<string | null>(null);
  const [forgotOtpTimer, setForgotOtpTimer] = useState(60);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotUserUid, setForgotUserUid] = useState('');
  const [forgotUserEmail, setForgotUserEmail] = useState('');
  const [forgotUserPhone, setForgotUserPhone] = useState('');
  const [forgotIsMigrated, setForgotIsMigrated] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  


  useEffect(() => {
    let interval: any;
    if (showOtpModal && otpResendTimer > 0) {
      interval = setInterval(() => {
        setOtpResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showOtpModal, otpResendTimer]);

  useEffect(() => {
    let interval: any;
    if (showForgot && forgotStep === 'otp' && forgotOtpTimer > 0) {
      interval = setInterval(() => {
        setForgotOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showForgot, forgotStep, forgotOtpTimer]);

  const handleForgotOtpChange = (value: string, index: number) => {
    if (value && isNaN(Number(value))) return;
    const newOtp = [...forgotEnteredOtp];
    newOtp[index] = value.substring(value.length - 1);
    setForgotEnteredOtp(newOtp);
    setForgotOtpError(null);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`forgot-otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleForgotOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !forgotEnteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`forgot-otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value && isNaN(Number(value))) return;
    const newOtp = [...enteredOtp];
    newOtp[index] = value.substring(value.length - 1);
    setEnteredOtp(newOtp);
    setOtpError(null);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !enteredOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  };

  const handleResendOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setEnteredOtp(['', '', '', '', '', '']);
    setOtpError(null);
    setOtpResendTimer(60);
    const normalizedPhone = normalizePhone(phone, countryCode);
    setSimulatedMessage({
      type: 'sms',
      to: normalizedPhone,
      text: `Your LevelUp Life registration code is: ${otp}`
    });
  };

  const handleVerifyOtpAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const code = enteredOtp.join('');
    if (code.length < 6) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    if (code !== generatedOtp) {
      setOtpError("Invalid verification code. Please check and try again.");
      return;
    }

    setLoading(true);
    setShowOtpModal(false);
    const normalizedPhone = normalizePhone(phone, countryCode);
    try {
      await register(email, password, name.trim(), username, normalizedPhone);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLogin) {
      setUsernameStatus('idle');
      return;
    }

    if (!username) {
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
  }, [username, isLogin, checkUsernameExists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(loginIdentifier, password);
      } else {
        if (!name.trim()) {
          setError("Name is required to forge a new account.");
          setLoading(false);
          return;
        }

        if (!username.trim()) {
          setError("Username is required to forge a new account.");
          setLoading(false);
          return;
        }
        
        if (/\s/.test(username)) {
          setError("Username cannot contain spaces.");
          setLoading(false);
          return;
        }

        if (/[A-Z]/.test(username)) {
          setError("Username must be in lowercase (small) letters only. Uppercase characters are not allowed.");
          setLoading(false);
          return;
        }

        const usernameRegex = /^[a-z0-9_.\-@!#$%^&*()+=~`{}|[\]\\:;"'<>,.?/]+$/;
        if (!usernameRegex.test(username)) {
          setError("Username contains invalid characters.");
          setLoading(false);
          return;
        }

        if (usernameStatus === 'taken') {
          setError("This username is already taken by another Hero.");
          setLoading(false);
          return;
        }

        if (usernameStatus === 'checking') {
          setError("Checking username availability...");
          setLoading(false);
          return;
        }

        if (!phone.trim()) {
          setError("Phone number is required to forge a new account.");
          setLoading(false);
          return;
        }

        const normalizedPhone = normalizePhone(phone, countryCode);

        // Trigger OTP Verification flow instead of immediate registration
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(otp);
        setEnteredOtp(['', '', '', '', '', '']);
        setOtpError(null);
        setOtpResendTimer(60);
        setShowOtpModal(true);
        setLoading(false);
        setSimulatedMessage({
          type: 'sms',
          to: normalizedPhone,
          text: `Your LevelUp Life registration code is: ${otp}`
        });
      }
    } catch (err: any) {
      console.error(err);
      // Clean up firebase error messages for better UX
      let cleanMessage = err.message || "An error occurred during authentication.";
      if (cleanMessage.includes("auth/invalid-credential")) {
        cleanMessage = "Invalid credentials. Please verify your email and password scroll.";
      } else if (cleanMessage.includes("auth/email-already-in-use")) {
        cleanMessage = "This email is already bound to another Hero profile.";
      } else if (cleanMessage.includes("auth/weak-password")) {
        cleanMessage = "Your password scroll must contain at least 6 characters.";
      } else if (cleanMessage.includes("auth/invalid-email")) {
        cleanMessage = "Please enter a valid email address format.";
      }
      setError(cleanMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await googleSignIn();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during Google sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmitIdentifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!forgotIdentifier.trim()) {
      setError("Please enter your email address or phone number.");
      return;
    }

    setLoading(true);
    try {
      const result = await initiateForgotPassword(forgotIdentifier);
      if (result.emailSent) {
        alert(`A password reset link has been successfully sent to your email address: ${result.email}.\n\nPlease check your Inbox and Spam/Junk folder.`);
        setShowForgot(false);
        setForgotIdentifier('');
        return;
      }

      setForgotOtp(result.otp);
      setForgotIsMigrated(result.isMigrated);
      setForgotUserUid(result.uid);
      setForgotUserEmail(result.email);
      setForgotUserPhone(result.phone);
      setForgotStep('otp');
      setForgotOtpTimer(60);
      setForgotEnteredOtp(['', '', '', '', '', '']);
      setForgotOtpError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while seeking your Hero profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    setLoading(true);
    setForgotOtpError(null);
    try {
      const result = await initiateForgotPassword(forgotIdentifier);
      setForgotOtp(result.otp);
      setForgotOtpTimer(60);
      setForgotEnteredOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      console.error(err);
      setForgotOtpError(err.message || "Failed to resend recovery code.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotOtpError(null);
    const code = forgotEnteredOtp.join('');
    if (code.length < 6) {
      setForgotOtpError("Please enter all 6 digits.");
      return;
    }

    if (code !== forgotOtp) {
      setForgotOtpError("Invalid verification code. Please check and try again.");
      return;
    }

    if (forgotIsMigrated) {
      setForgotStep('new_password');
    } else {
      // Legacy user who doesn't have custom password stored in Firestore yet
      setLoading(true);
      try {
        await sendPasswordReset(forgotUserEmail);
        alert(`Verification successful! We've sent a recovery email to ${forgotUserEmail}. 

Please check your Inbox and Spam/Junk folder (search for "noreply@daily-routine-7fea8.firebaseapp.com"). 

Once you reset your password, log in with it and the app will automatically migrate your account so future resets are 100% in-app via OTP!`);
        
        // Reset recovery flow
        setShowForgot(false);
        setForgotStep('input');
        setForgotIdentifier('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } catch (err: any) {
        console.error(err);
        setForgotOtpError(err.message || "An error occurred while sending the recovery email.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForgotSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (forgotNewPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithOtp(forgotUserUid, forgotNewPassword);
      alert("Password updated successfully! You can now log into the Discipline World.");
      
      // Auto-fill login email/username/phone
      setLoginIdentifier(forgotUserEmail || forgotUserPhone || forgotIdentifier);
      
      // Reset recovery flow and redirect to login
      setShowForgot(false);
      setForgotStep('input');
      setForgotIdentifier('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setIsLogin(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to update your password.");
    } finally {
      setLoading(false);
    }
  };



  const isWorking = loading || authLoading;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#070b13]">
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rpg-xp/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rpg-level/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md p-8 rounded-3xl border border-rpg-border/30 bg-rpg-card/40 backdrop-blur-xl shadow-glass flex flex-col relative z-10">
        
        {/* App Title & Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rpg-xp to-rpg-level flex items-center justify-center shadow-lg shadow-rpg-level/20 mb-4 animate-float">
            <Shield className="w-8 h-8 text-white stroke-[2]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            LevelUp Life
          </h1>
          <p className="text-xs font-semibold text-rpg-discipline uppercase tracking-widest mt-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Gamify Your Discipline OS
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="p-3.5 mb-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 text-xs font-bold leading-relaxed transition-all">
            ⚠️ {error.replace(/Firebase:\s*/, "")}
          </div>
        )}

        {/* Forgot Password Flow */}
        {showForgot ? (
          <div>
            {forgotStep === 'input' && (
              <form onSubmit={handleForgotSubmitIdentifier} className="space-y-5">
                <h2 className="text-lg font-bold text-white mb-1 animate-pulse">Recover Hero Account</h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Enter your email, username, or phone number and we'll send a simulated recovery code to retrieve your account.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Email, Username, or Phone</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. shadow_knight, +1234567890"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      disabled={isWorking}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isWorking}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rpg-xp to-blue-600 text-white font-bold text-sm shadow-lg shadow-rpg-xp/25 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isWorking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Casting Search Spell...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setShowForgot(false);
                  }}
                  disabled={isWorking}
                  className="w-full py-2.5 rounded-xl border border-rpg-border/40 hover:bg-slate-900 text-slate-400 text-xs font-bold transition-all disabled:opacity-50"
                >
                  Back to Login
                </button>
              </form>
            )}

            {forgotStep === 'otp' && (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-5">
                <h2 className="text-lg font-bold text-white mb-1">Verify Recovery Code</h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Enter the 6-digit recovery code sent to <span className="text-white font-bold">{forgotUserPhone || forgotUserEmail}</span>.
                </p>

                {forgotOtpError && (
                  <div className="w-full p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed">
                    ⚠️ {forgotOtpError}
                  </div>
                )}

                <div className="flex justify-between gap-2">
                  {forgotEnteredOtp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`forgot-otp-${idx}`}
                      type="text"
                      pattern="[0-9]*"
                      maxLength={1}
                      required
                      value={digit}
                      onChange={(e) => handleForgotOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleForgotOtpKeyDown(e, idx)}
                      className="w-11 h-12 rounded-xl bg-slate-950/80 border border-rpg-border/50 text-white font-black text-lg text-center focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/30 transition-all"
                    />
                  ))}
                </div>

                <div className="text-xs font-semibold text-slate-400 text-center">
                  {forgotOtpTimer > 0 ? (
                    <span>Resend code in <span className="text-rpg-level font-bold">{forgotOtpTimer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleForgotResendOtp}
                      className="text-rpg-xp hover:underline font-bold"
                    >
                      Resend Recovery Code
                    </button>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('input');
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-rpg-border/40 text-slate-400 text-xs font-bold hover:bg-slate-900 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-rpg-level text-white text-xs font-bold shadow-lg shadow-rpg-level/25 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Verify Code
                  </button>
                </div>
              </form>
            )}

            {forgotStep === 'new_password' && (
              <form onSubmit={handleForgotSetNewPassword} className="space-y-4">
                <h2 className="text-lg font-bold text-white mb-1">Set New Password</h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Create a new password scroll to log into your Hero account.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showForgotNewPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showForgotNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type={showForgotConfirmPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showForgotConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isWorking}
                  className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-rpg-xp to-rpg-level text-white font-bold text-sm shadow-lg shadow-rpg-level/25 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isWorking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Password...
                    </>
                  ) : (
                    'Set New Password'
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Login / Signup Flow */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-950/60 rounded-xl border border-rpg-border/40 mb-2">
              <button
                type="button"
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  isLogin ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => {
                  setError(null);
                  setIsLogin(true);
                }}
                disabled={isWorking}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  !isLogin ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
                onClick={() => {
                  setError(null);
                  setIsLogin(false);
                }}
                disabled={isWorking}
              >
                Sign Up
              </button>
            </div>

            {isLogin ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email, Username, or Phone
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. shadow_knight, +1234567890"
                    className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    disabled={isWorking}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ashok Kumar"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isWorking}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. ashok_k (letters, numbers, _, .)"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isWorking}
                    />
                  </div>
                  {usernameStatus === 'checking' && (
                    <span className="text-[10px] font-semibold text-rpg-level mt-1 block">
                      ⏳ Checking username availability...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-[10px] font-semibold text-emerald-400 mt-1 block">
                      ✅ Username is available!
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[10px] font-semibold text-rose-400 mt-1 block">
                      ⚠️ this username already used or existed
                    </span>
                  )}
                  {usernameStatus === 'invalid' && (
                    <span className="text-[10px] font-semibold text-amber-500 mt-1 block">
                      ⚠️ Must be small letters only, no uppercase or spaces. Special symbols are allowed.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="hero@kingdom.com"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isWorking}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1234567890"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isWorking}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl bg-slate-950/50 border border-rpg-border/60 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/40 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isWorking}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                  disabled={isWorking}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {isLogin && (
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setShowForgot(true);
                    }}
                    className="text-[10px] font-bold text-rpg-xp hover:underline"
                    disabled={isWorking}
                  >
                    Forgotten password
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isWorking}
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-rpg-xp to-rpg-level text-white font-bold text-sm shadow-lg shadow-rpg-level/25 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isWorking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Seals...
                </>
              ) : isLogin ? (
                'Enter Discipline World'
              ) : (
                'Sign Up'
              )}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setIsLogin(false);
                }}
                disabled={isWorking}
                className="w-full py-3 mt-3 rounded-xl border border-rpg-border/60 hover:bg-slate-900/40 text-slate-300 font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                CREATE ACCOUNT
              </button>
            )}
          </form>
        )}

        {/* Divider */}
        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-rpg-border/30" />
          </div>
          <span className="relative px-3 bg-[#0c1221] text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            or
          </span>
        </div>

        {/* Google button */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isWorking}
            className="w-full py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            {/* Simple Google G logo */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.67-.35-1.37-.35-2.09z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>

      {/* OTP verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm p-8 rounded-3xl border border-rpg-border/40 bg-[#0e1424]/90 flex flex-col items-center text-center space-y-6 relative overflow-hidden shadow-2xl animate-float">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rpg-xp to-rpg-level flex items-center justify-center shadow-lg shadow-rpg-level/20">
              <Phone className="w-7 h-7 text-white" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Verify Phone Number</h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Enter the 6-digit verification code sent to <span className="text-white font-bold">{phone}</span>.
              </p>
            </div>

            {otpError && (
              <div className="w-full p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-xs font-semibold leading-relaxed">
                ⚠️ {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndRegister} className="w-full space-y-6">
              <div className="flex justify-between gap-2">
                {enteredOtp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    pattern="[0-9]*"
                    maxLength={1}
                    required
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-11 h-12 rounded-xl bg-slate-950/80 border border-rpg-border/50 text-white font-black text-lg text-center focus:outline-none focus:border-rpg-xp focus:ring-1 focus:ring-rpg-xp/30 transition-all"
                  />
                ))}
              </div>

              <div className="text-xs font-semibold text-slate-400">
                {otpResendTimer > 0 ? (
                  <span>Resend code in <span className="text-rpg-level font-bold">{otpResendTimer}s</span></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-rpg-xp hover:underline font-bold"
                  >
                    Resend SMS Code
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-rpg-border/40 text-slate-400 text-xs font-bold hover:bg-slate-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-rpg-level text-white text-xs font-bold shadow-lg shadow-rpg-level/25 hover:opacity-90 active:scale-95 transition-all"
                >
                  Verify & Sign Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
