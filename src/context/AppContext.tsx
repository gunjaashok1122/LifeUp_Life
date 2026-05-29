import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

// --- Types ---
export interface AvatarConfig {
  hair: string;
  armor: string;
  weapon: string;
  accessory: string;
  hairColor: string;
  skinColor: string;
  bgColor: string;
}

export interface FriendInfo {
  uid: string;
  name: string;
  username: string;
  avatar: AvatarConfig;
  profilePicture?: string;
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  level: number;
  xp: number;
  xpNeeded: number;
  coins: number;
  disciplineScore: number;
  streak: number;
  waterIntake: number; // in ml, resets daily
  waterTarget: number; // default 2500
  lastActiveDate: string;
  avatar: AvatarConfig;
  inventory: string[]; // item IDs
  achievements: string[]; // badge IDs
  profilePicture?: string;
  friends?: FriendInfo[];
  stepsTarget?: number;
  caloriesTarget?: number;
  workoutDurationTarget?: number;
  password?: string;
  onboardingCompleted?: boolean;
}

export interface TaskBlock {
  id: string;
  title: string;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'study' | 'fitness' | 'mind' | 'routine' | 'other';
  color: string; // hex or tailwind text colors
  recurring: boolean;
}

export interface Habit {
  id: string;
  name: string;
  category: 'fitness' | 'mind' | 'work' | 'health' | 'custom';
  frequency: 'daily' | 'weekly';
  streak: number;
  bestStreak: number;
  completedDates: string[]; // Array of "YYYY-MM-DD"
  createdAt: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  coinReward: number;
  targetType: 'task' | 'habit' | 'water' | 'focus';
  targetCount: number;
  currentCount: number;
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'hair' | 'armor' | 'weapon' | 'accessory' | 'theme';
  value: string; // value code for AvatarBuilder
  previewColor?: string;
}

export interface DailyRoutine {
  id: string;
  title: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:30"
  startDate: string; // e.g. "2026-05-25"
  endDate: string;   // e.g. "2026-05-31"
}

export interface LongTermPlan {
  id: string;
  title: string;
  type: 'week' | 'month';
  targetDate: string; // e.g. "Week 22, 2026" or "May 2026"
  status: 'pending' | 'done' | 'failed';
  routines?: DailyRoutine[];
  fromDate?: string;
  toDate?: string;
  targetMonth?: string;
  weeksCount?: number;
  toMonth?: string;
  monthsCount?: number;
  completions?: Record<string, boolean>; // e.g. { "2026-05-15_abc123": true }
}

export interface SavedAccount {
  uid: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  avatar: AvatarConfig;
}

export interface FitnessLog {
  id: string;
  date: string; // YYYY-MM-DD
  steps: number;
  workoutDuration: number; // in minutes
  workoutType: string; // e.g. Gym, Running
  caloriesBurned: number; // in kcal
  notes?: string;
  createdAt: string;
}

// --- Context Definition ---
interface AppContextType {
  user: UserProfile;
  tasks: TaskBlock[];
  habits: Habit[];
  quests: Quest[];
  achievements: Achievement[];
  shopItems: ShopItem[];
  activeScreen: string;
  previousScreen: string;
  setScreen: (screen: string) => void;
  // Firebase Auth
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  login: (loginIdentifier: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, username: string, phone: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  pendingGoogleUser: FirebaseUser | null;
  completeGoogleSignUp: (name: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  initiateForgotPassword: (identifier: string) => Promise<{
    success: boolean;
    type: 'sms' | 'email';
    to: string;
    otp: string;
    isMigrated: boolean;
    email: string;
    phone: string;
    uid: string;
    emailSent?: boolean;
  }>;
  resetPasswordWithOtp: (uid: string, newPassword: string) => Promise<void>;
  updatePasswordInFirestore: (newPassword: string) => Promise<void>;
  // Long-Term Planning Actions
  longTermPlans: LongTermPlan[];
  addLongTermPlan: (plan: Omit<LongTermPlan, 'id'>) => void;
  updateLongTermPlanStatus: (id: string, status: LongTermPlan['status']) => void;
  deleteLongTermPlan: (id: string) => void;
  updateLongTermPlan: (plan: LongTermPlan) => void;
  // User Actions
  updateUsername: (username: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateProfilePicture: (pictureBase64: string) => Promise<void>;
  addFriendByUsername: (username: string) => Promise<void>;
  checkUsernameExists: (username: string) => Promise<boolean>;
  checkPhoneExists: (phone: string) => Promise<boolean>;
  checkEmailExists: (email: string) => Promise<boolean>;
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;
  updateWater: (amount: number) => void;
  // Task Actions
  addTask: (task: Omit<TaskBlock, 'id'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (task: TaskBlock) => void;
  // Habit Actions
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completedDates' | 'createdAt'>) => void;
  toggleHabit: (id: string, date: string) => void;
  deleteHabit: (id: string) => void;
  // Onboarding Actions
  completeOnboarding: (name: string, username: string) => Promise<void>;
  // RPG Actions
  purchaseItem: (itemId: string) => boolean;
  equipAvatarItem: (category: keyof AvatarConfig, value: string) => void;
  claimQuestReward: (questId: string) => void;
  incrementQuestProgress: (type: 'task' | 'habit' | 'water' | 'focus', amount?: number) => void;
  // Global actions
  resetData: () => void;
  // Saved Accounts Configuration
  showSavedAccounts: boolean;
  setShowSavedAccounts: (show: boolean) => void;
  savedAccounts: SavedAccount[];
  switchAccount: (uid: string, password?: string) => Promise<void>;
  removeSavedAccount: (uid: string) => void;
  // Fitness actions
  fitnessLogs: FitnessLog[];
  addFitnessLog: (log: Omit<FitnessLog, 'id' | 'createdAt'>) => void;
  deleteFitnessLog: (id: string) => void;
  updateFitnessLog: (log: FitnessLog) => void;
  updateFitnessTargets: (steps: number, calories: number, duration: number) => void;
  bulkUpdateHabitDates: (id: string, start: string, end: string, shouldComplete: boolean) => void;
  trackingPlanId: string | null;
  setTrackingPlanId: (id: string | null) => void;
  simulatedMessage: { type: 'sms' | 'email'; to: string; text: string } | null;
  setSimulatedMessage: (msg: { type: 'sms' | 'email'; to: string; text: string } | null) => void;
  unreadCounts: Record<string, number>;
  activeChatFriendId: string | null;
  setActiveChatFriendId: (id: string | null) => void;
  markChatAsRead: (friendUid: string) => void;
  chatNotification: { id: string; senderName: string; text: string; friendUid: string } | null;
  setChatNotification: (msg: { id: string; senderName: string; text: string; friendUid: string } | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Defaults ---
const DEFAULT_AVATAR: AvatarConfig = {
  hair: 'default',
  armor: 'ragged',
  weapon: 'stick',
  accessory: 'none',
  hairColor: '#f59e0b',
  skinColor: '#fecdd3',
  bgColor: '#1e293b'
};

const DEFAULT_USER: UserProfile = {
  name: 'Hero',
  username: 'hero',
  email: '',
  phone: '',
  level: 1,
  xp: 0,
  xpNeeded: 100,
  coins: 50,
  disciplineScore: 100,
  streak: 1,
  waterIntake: 0,
  waterTarget: 2500,
  lastActiveDate: new Date().toISOString().split('T')[0],
  avatar: DEFAULT_AVATAR,
  inventory: ['hair-default', 'armor-ragged', 'weapon-stick', 'accessory-none'],
  achievements: [],
  friends: [],
  stepsTarget: 10000,
  caloriesTarget: 500,
  workoutDurationTarget: 60
};

const DEFAULT_SHOP_ITEMS: ShopItem[] = [
  // Hair styles
  { id: 'hair-spiky', name: 'Warrior Spiky Hair', description: 'Make yourself look sharp.', price: 20, category: 'hair', value: 'spiky' },
  { id: 'hair-long', name: 'Elven Long Tresses', description: 'Graceful elven hair.', price: 30, category: 'hair', value: 'long' },
  { id: 'hair-wizard', name: 'Wizard Hood & Beard', description: 'Unleash arcane styling.', price: 50, category: 'hair', value: 'wizard' },

  // Armors
  { id: 'armor-leather', name: 'Rogue Leather Vest', description: 'Lightweight protection (+5 Agility).', price: 40, category: 'armor', value: 'leather' },
  { id: 'armor-steel', name: 'Knight Steel Plate', description: 'Heavy and shiny steel armor.', price: 100, category: 'armor', value: 'steel' },
  { id: 'armor-mage', name: 'Archmage Robes', description: 'Infused with static intelligence energy.', price: 150, category: 'armor', value: 'mage' },

  // Weapons
  { id: 'weapon-sword', name: 'Steel Broadsword', description: 'Standard sword for slaying delays.', price: 60, category: 'weapon', value: 'sword' },
  { id: 'weapon-staff', name: 'Crystal Mage Staff', description: 'Chock-full of focus energy.', price: 90, category: 'weapon', value: 'staff' },
  { id: 'weapon-shield', name: 'Aegis Shield of Focus', description: 'Blocks notification distractions.', price: 120, category: 'weapon', value: 'shield' },

  // Accessories
  { id: 'accessory-glasses', name: 'Scholar Spectacles', description: 'Look smart, read faster.', price: 25, category: 'accessory', value: 'glasses' },
  { id: 'accessory-crown', name: 'Crown of Discipline', description: 'Show everyone who rules their time.', price: 200, category: 'accessory', value: 'crown' },
  { id: 'accessory-wings', name: 'Angel Wings', description: 'Angelic backing for high consistency.', price: 300, category: 'accessory', value: 'wings' }
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-task', title: 'First Blood', description: 'Completed your first scheduled task.', icon: '⚔️' },
  { id: 'first-habit', title: 'Habit Initiate', description: 'Successfully checked off a habit.', icon: '🌱' },
  { id: 'streak-3', title: 'Consistent Explorer', description: 'Maintained a 3-day streak.', icon: '🔥' },
  { id: 'water-master', title: 'Hydrated God', description: 'Hit your water target for the day.', icon: '💧' },
  { id: 'focus-expert', title: 'Deep Thinker', description: 'Completed a full 25-minute Pomodoro focus session.', icon: '🧠' },
  { id: 'level-5', title: 'Unstoppable Hero', description: 'Reached Level 5.', icon: '👑' }
];

const DEFAULT_QUESTS: Quest[] = [
  { id: 'quest-daily-tasks', title: 'Slay the Agenda', description: 'Complete 3 daily tasks.', xpReward: 25, coinReward: 15, targetType: 'task', targetCount: 3, currentCount: 0, completed: false },
  { id: 'quest-daily-habits', title: 'Consistent Ritual', description: 'Complete 2 habits today.', xpReward: 30, coinReward: 20, targetType: 'habit', targetCount: 2, currentCount: 0, completed: false },
  { id: 'quest-daily-water', title: 'Quench the Thirst', description: 'Drink 1000ml of water.', xpReward: 15, coinReward: 10, targetType: 'water', targetCount: 1000, currentCount: 0, completed: false },
  { id: 'quest-daily-focus', title: 'Deep Diver', description: 'Do 1 Focus Session.', xpReward: 40, coinReward: 25, targetType: 'focus', targetCount: 1, currentCount: 0, completed: false }
];

export const normalizePhone = (phoneStr: string, defaultCode: string = '+91'): string => {
  const cleaned = phoneStr.trim().replace(/[\s\-()]/g, '');
  if (!cleaned) return '';
  
  if (cleaned.startsWith(defaultCode)) {
    return cleaned;
  }
  
  const codeDigits = defaultCode.replace('+', '');
  
  let raw = cleaned;
  if (raw.startsWith('+')) {
    raw = raw.substring(1);
  }
  
  if (raw.startsWith(codeDigits) && raw.length > 10) {
    return '+' + raw;
  }
  
  return defaultCode + raw;
};

const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    
    // Play a gentle, premium dual-tone notification chime
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      
      gainNode.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    
    // Clean notification ding (D5 -> A5)
    playTone(587.33, 0, 0.25);
    playTone(880.00, 0.08, 0.35);
  } catch (e) {
    console.error('Failed to play notification sound:', e);
  }
};

// --- AppProvider Component ---
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeUid = (() => {
    try {
      return localStorage.getItem('lvl_uid') || 'guest';
    } catch (e) {
      return 'guest';
    }
  })();

  const [currentUid, setCurrentUid] = useState<string>(activeUid);
  const notifiedMessageIdsRef = useRef<Set<string>>(new Set());

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_user`);
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
      return DEFAULT_USER;
    }
  });

  const [tasks, setTasks] = useState<TaskBlock[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_tasks`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing tasks from localStorage:', e);
      return [];
    }
  });

  const [habits, setHabits] = useState<Habit[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_habits`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing habits from localStorage:', e);
      return [];
    }
  });

  const [quests, setQuests] = useState<Quest[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_quests`);
      return saved ? JSON.parse(saved) : DEFAULT_QUESTS;
    } catch (e) {
      console.error('Error parsing quests from localStorage:', e);
      return DEFAULT_QUESTS;
    }
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_achievements`);
      return saved ? JSON.parse(saved) : DEFAULT_ACHIEVEMENTS;
    } catch (e) {
      console.error('Error parsing achievements from localStorage:', e);
      return DEFAULT_ACHIEVEMENTS;
    }
  });

  const [longTermPlans, setLongTermPlans] = useState<LongTermPlan[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_longTermPlans`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing longTermPlans from localStorage:', e);
      return [];
    }
  });

  const [trackingPlanId, setTrackingPlanId] = useState<string | null>(null);

  const [fitnessLogs, setFitnessLogs] = useState<FitnessLog[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_fitnessLogs`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error parsing fitnessLogs from localStorage:', e);
      return [];
    }
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [durationTarget, setDurationTarget] = useState(user.workoutDurationTarget || 60);

  const [activeScreen, setActiveScreen] = useState<string>(() => {
    try {
      if (activeUid === 'guest') return 'auth';
      return localStorage.getItem(`lvl_${activeUid}_screen`) || 'dashboard';
    } catch (e) {
      return 'auth';
    }
  });
  const [previousScreen, setPreviousScreen] = useState<string>('dashboard');

  const setScreen = (screen: string) => {
    setPreviousScreen(activeScreen);
    setActiveScreen(screen);
  };

  const [showSavedAccounts, setShowSavedAccounts] = useState<boolean>(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(() => {
    try {
      const saved = localStorage.getItem('lvl_saved_accounts');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [activeChatFriendId, setActiveChatFriendId] = useState<string | null>(null);
  const [chatNotification, setChatNotification] = useState<{ id: string; senderName: string; text: string; friendUid: string } | null>(null);

  const [simulatedMessage, setSimulatedMessage] = useState<{ type: 'sms' | 'email'; to: string; text: string } | null>(null);

  const updateFirestore = async (fields: Record<string, any>) => {
        if (!firebaseUser || authLoading) return;
        try {
          const cleanFields = JSON.parse(JSON.stringify(fields));
          await setDoc(doc(db, 'users', firebaseUser.uid), cleanFields, { merge: true });
        } catch (err) {
          console.error('Error syncing data to Firestore:', err);
        }
      };

      // --- Firebase Auth & Firestore Loading ---
      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
          setAuthLoading(true);
          if (fUser) {
            setFirebaseUser(fUser);
            try {
              const docRef = doc(db, 'users', fUser.uid);
              const savedUid = localStorage.getItem('lvl_uid');

              if (savedUid === fUser.uid) {
                // Ownership matches; prioritize localStorage to prevent data loss on refresh.
                // Read latest data from localStorage and sync it to Firestore.
                const savedUser = localStorage.getItem(`lvl_${fUser.uid}_user`);
                const savedTasks = localStorage.getItem(`lvl_${fUser.uid}_tasks`);
                const savedHabits = localStorage.getItem(`lvl_${fUser.uid}_habits`);
                const savedQuests = localStorage.getItem(`lvl_${fUser.uid}_quests`);
                const savedAchievements = localStorage.getItem(`lvl_${fUser.uid}_achievements`);
                const savedLongTermPlans = localStorage.getItem(`lvl_${fUser.uid}_longTermPlans`);
                const savedFitnessLogs = localStorage.getItem(`lvl_${fUser.uid}_fitnessLogs`);

                const u = savedUser ? JSON.parse(savedUser) : user;
                if (u && !u.username && u.name) {
                  u.username = u.name.toLowerCase().replace(/[^a-z0-9_.]/g, '_');
                }
                if (u && !u.email && fUser.email) {
                  u.email = fUser.email;
                }
                const t = savedTasks ? JSON.parse(savedTasks) : tasks;
                const h = savedHabits ? JSON.parse(savedHabits) : habits;
                const q = savedQuests ? JSON.parse(savedQuests) : quests;
                const a = savedAchievements ? JSON.parse(savedAchievements) : achievements;
                const ltp = savedLongTermPlans ? JSON.parse(savedLongTermPlans) : longTermPlans;
                const fl = savedFitnessLogs ? JSON.parse(savedFitnessLogs) : [];

                setUser(u);
                setTasks(t);
                setHabits(h);
                setQuests(q);
                setAchievements(a);
                setLongTermPlans(ltp);
                setFitnessLogs(fl);

                await setDoc(docRef, {
                  user: u,
                  tasks: t,
                  habits: h,
                  quests: q,
                  achievements: a,
                  longTermPlans: ltp,
                  fitnessLogs: fl
                }, { merge: true });

                checkDailyReset(u);
                setCurrentUid(fUser.uid);
                if (u && u.onboardingCompleted === false) {
                  setScreen('onboarding');
                } else if (activeScreen === 'auth') {
                  setScreen('dashboard');
                }
              } else {
                // New login or account switch; pull user data from Firestore and overwrite localStorage.
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  if (data.user) {
                    const loadedUser = data.user;
                    if (!loadedUser.username && loadedUser.name) {
                      loadedUser.username = loadedUser.name.toLowerCase().replace(/[^a-z0-9_.]/g, '_');
                    }
                    if (!loadedUser.email && fUser.email) {
                      loadedUser.email = fUser.email;
                    }
                    setUser(loadedUser);
                    localStorage.setItem(`lvl_${fUser.uid}_user`, JSON.stringify(loadedUser));
                  }
                  if (data.tasks) {
                    setTasks(data.tasks);
                    localStorage.setItem(`lvl_${fUser.uid}_tasks`, JSON.stringify(data.tasks));
                  }
                  if (data.habits) {
                    setHabits(data.habits);
                    localStorage.setItem(`lvl_${fUser.uid}_habits`, JSON.stringify(data.habits));
                  }
                  if (data.quests) {
                    setQuests(data.quests);
                    localStorage.setItem(`lvl_${fUser.uid}_quests`, JSON.stringify(data.quests));
                  }
                  if (data.achievements) {
                    setAchievements(data.achievements);
                    localStorage.setItem(`lvl_${fUser.uid}_achievements`, JSON.stringify(data.achievements));
                  }
                  if (data.longTermPlans) {
                    setLongTermPlans(data.longTermPlans);
                    localStorage.setItem(`lvl_${fUser.uid}_longTermPlans`, JSON.stringify(data.longTermPlans));
                  }
                  if (data.fitnessLogs) {
                    setFitnessLogs(data.fitnessLogs);
                    localStorage.setItem(`lvl_${fUser.uid}_fitnessLogs`, JSON.stringify(data.fitnessLogs));
                  }

                  if (data.user) checkDailyReset(data.user);
                  if (data.user && data.user.onboardingCompleted === false) {
                    setScreen('onboarding');
                  } else if (activeScreen === 'auth' || activeScreen === 'onboarding') {
                    setScreen('dashboard');
                  }
                  localStorage.setItem('lvl_uid', fUser.uid);
                  setCurrentUid(fUser.uid);
                } else {
                  // No record exists in Firestore; initialize database and set screen to onboarding.
                  const defaultName = fUser.displayName || 'Hero';
                  const baseUsername = defaultName.toLowerCase().replace(/[^a-z0-9_.]/g, '_') || 'hero';
                  
                  const newUser = {
                    ...DEFAULT_USER,
                    name: defaultName,
                    username: baseUsername,
                    email: fUser.email || '',
                    phone: fUser.phoneNumber || '',
                    onboardingCompleted: false
                  };

                  const defaultUserData = {
                    user: newUser,
                    tasks: [],
                    habits: [],
                    quests: DEFAULT_QUESTS,
                    achievements: DEFAULT_ACHIEVEMENTS,
                    longTermPlans: [],
                    fitnessLogs: []
                  };
                  await setDoc(docRef, defaultUserData);
                  setUser(newUser);
                  setTasks([]);
                  setHabits([]);
                  setQuests(DEFAULT_QUESTS);
                  setAchievements(DEFAULT_ACHIEVEMENTS);
                  setLongTermPlans([]);
                  setFitnessLogs([]);
                  setScreen('onboarding');

                  localStorage.setItem(`lvl_${fUser.uid}_user`, JSON.stringify(newUser));
                  localStorage.setItem(`lvl_${fUser.uid}_tasks`, JSON.stringify([]));
                  localStorage.setItem(`lvl_${fUser.uid}_habits`, JSON.stringify([]));
                  localStorage.setItem(`lvl_${fUser.uid}_quests`, JSON.stringify(DEFAULT_QUESTS));
                  localStorage.setItem(`lvl_${fUser.uid}_achievements`, JSON.stringify(DEFAULT_ACHIEVEMENTS));
                  localStorage.setItem(`lvl_${fUser.uid}_longTermPlans`, JSON.stringify([]));
                  localStorage.setItem(`lvl_${fUser.uid}_fitnessLogs`, JSON.stringify([]));
                  
                  localStorage.setItem('lvl_uid', fUser.uid);
                  setCurrentUid(fUser.uid);
                }
              }
            } catch (err) {
              console.error("Error loading Firestore data:", err);
            }
          } else {
            setFirebaseUser(null);
            localStorage.setItem('lvl_uid', 'guest');
            // Load Guest Mode from LocalStorage
            const savedUser = localStorage.getItem('lvl_guest_user');
            const savedTasks = localStorage.getItem('lvl_guest_tasks');
            const savedHabits = localStorage.getItem('lvl_guest_habits');
            const savedQuests = localStorage.getItem('lvl_guest_quests');
            const savedAchievements = localStorage.getItem('lvl_guest_achievements');
            const savedScreen = localStorage.getItem('lvl_guest_screen');
            const savedLongTermPlans = localStorage.getItem('lvl_guest_longTermPlans');
            const savedFitnessLogs = localStorage.getItem('lvl_guest_fitnessLogs');

            const u = savedUser ? JSON.parse(savedUser) : DEFAULT_USER;
            if (u && !u.username && u.name) {
              u.username = u.name.toLowerCase().replace(/[^a-z0-9_.]/g, '_');
            }
            setUser(u);
            setTasks(savedTasks ? JSON.parse(savedTasks) : []);
            setHabits(savedHabits ? JSON.parse(savedHabits) : []);
            setQuests(savedQuests ? JSON.parse(savedQuests) : DEFAULT_QUESTS);
            setAchievements(savedAchievements ? JSON.parse(savedAchievements) : DEFAULT_ACHIEVEMENTS);
            setLongTermPlans(savedLongTermPlans ? JSON.parse(savedLongTermPlans) : []);
            setFitnessLogs(savedFitnessLogs ? JSON.parse(savedFitnessLogs) : []);
            setScreen('auth');

            checkDailyReset(u);
            setCurrentUid('guest');
          }
          setAuthLoading(false);
        });

        return () => unsubscribe();
      }, []);

      // --- Auth Operations ---
      const checkUsernameExists = async (username: string): Promise<boolean> => {
        const cleanUsername = username.trim().toLowerCase();
        if (!cleanUsername) return false;

        const usersRef = collection(db, 'users');

        // Check user.username field
        const q1 = query(usersRef, where('user.username', '==', cleanUsername));
        const snap1 = await getDocs(q1);
        if (!snap1.empty) return true;

        // Check user.name field (legacy usernames)
        const q2 = query(usersRef, where('user.name', '==', cleanUsername));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) return true;

        return false;
      };

      const checkPhoneExists = async (phone: string): Promise<boolean> => {
        const cleanPhone = phone.trim();
        if (!cleanPhone) return false;

        const normalized = normalizePhone(cleanPhone);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('user.phone', 'in', [cleanPhone, normalized]));
        const snap = await getDocs(q);

        const otherUsers = snap.docs.filter(doc => doc.id !== currentUid);
        return otherUsers.length > 0;
      };

      const checkEmailExists = async (email: string): Promise<boolean> => {
        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) return false;

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('user.email', '==', cleanEmail));
        const snap = await getDocs(q);

        const otherUsers = snap.docs.filter(doc => doc.id !== currentUid);
        return otherUsers.length > 0;
      };

      const FIREBASE_MASTER_PASSWORD = "rpg_master_password_123!";

      const login = async (loginIdentifier: string, password: string) => {
        const input = loginIdentifier.trim();
        if (!input) {
          throw new Error("Please enter your email, username, or phone number.");
        }
        if (!password) {
          throw new Error("Please enter your password.");
        }

        const usersRef = collection(db, 'users');
        let foundUserDoc: any = null;

        // 1. Try to find by email
        const emailQuery = query(usersRef, where('user.email', '==', input.toLowerCase()));
        const emailSnapshot = await getDocs(emailQuery);
        if (!emailSnapshot.empty) {
          foundUserDoc = emailSnapshot.docs[0];
        }

        // 2. Try to find by username
        if (!foundUserDoc) {
          const usernameQuery = query(usersRef, where('user.username', '==', input.toLowerCase()));
          const usernameSnapshot = await getDocs(usernameQuery);
          if (!usernameSnapshot.empty) {
            foundUserDoc = usernameSnapshot.docs[0];
          }
        }

        // 3. Try to find by legacy user.name
        if (!foundUserDoc) {
          const legacyQuery = query(usersRef, where('user.name', '==', input));
          const legacySnapshot = await getDocs(legacyQuery);
          if (!legacySnapshot.empty) {
            foundUserDoc = legacySnapshot.docs[0];
          }
        }

        // 4. Try to find by phone (raw or normalized)
        if (!foundUserDoc) {
          const normalized = normalizePhone(input);
          const phoneQuery = query(usersRef, where('user.phone', 'in', [input, normalized]));
          const phoneSnapshot = await getDocs(phoneQuery);
          if (!phoneSnapshot.empty) {
            foundUserDoc = phoneSnapshot.docs[0];
          }
        }

        if (!foundUserDoc) {
          throw new Error("No account found matching this email, username, or phone number.");
        }

        const userData = foundUserDoc.data().user;
        const emailToUse = userData.email;

        // If user document is found, check custom password logic
        if (userData && userData.password) {
          if (userData.password !== password) {
            throw new Error("Incorrect password.");
          }
          await signInWithEmailAndPassword(auth, emailToUse, FIREBASE_MASTER_PASSWORD);
          return;
        }

        // Fallback / Migration: If no password in Firestore, try logging in with entered password
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, password);

        // If login succeeded, let's migrate this user to master password!
        if (userCredential.user) {
          try {
            await updatePassword(userCredential.user, FIREBASE_MASTER_PASSWORD);
            
            const uid = userCredential.user.uid;
            const userDocRef = doc(db, 'users', uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              const updatedUser = {
                ...data.user,
                password: password
              };
              await setDoc(userDocRef, { user: updatedUser }, { merge: true });
            }
          } catch (err) {
            console.error("Migration to master password failed:", err);
          }
        }
      };

      const register = async (email: string, password: string, name: string, username: string, phone: string) => {
        if (!username) {
          throw new Error("Username cannot be empty.");
        }
        if (/\s/.test(username)) {
          throw new Error("Username cannot contain spaces.");
        }
        if (/[A-Z]/.test(username)) {
          throw new Error("Username must be in lowercase (small) letters only. Uppercase letters are not accepted.");
        }

        const usernameRegex = /^[a-z0-9_.\-@!#$%^&*()+=~`{}|[\]\\:;"'<>,.?/]+$/;
        if (!usernameRegex.test(username)) {
          throw new Error("Username contains invalid characters.");
        }

        const usersRef = collection(db, 'users');

        // Check username uniqueness
        const exists = await checkUsernameExists(username);
        if (exists) {
          throw new Error("This username is already taken by another Hero.");
        }

        if (!phone || phone.trim() === '') {
          throw new Error("Phone number is required to forge a new account.");
        }

        // Check phone uniqueness
        const normalizedPhone = normalizePhone(phone);
        const phoneQuery = query(usersRef, where('user.phone', 'in', [phone.trim(), normalizedPhone]));
        const phoneSnapshot = await getDocs(phoneQuery);
        if (!phoneSnapshot.empty) {
          throw new Error("This phone number is already registered with another Hero.");
        }

        // Register in Firebase Auth with master password
        const userCredential = await createUserWithEmailAndPassword(auth, email, FIREBASE_MASTER_PASSWORD);
        const newUser = {
           ...DEFAULT_USER,
           name: name.trim(),
           username: username,
           email: email,
           phone: normalizedPhone,
           password: password, // Store custom password in Firestore
           onboardingCompleted: true
         };
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          user: newUser,
          tasks: [],
          habits: [],
          quests: DEFAULT_QUESTS,
          achievements: DEFAULT_ACHIEVEMENTS,
          longTermPlans: []
        });
      };

      const googleSignIn = async () => {
        await signInWithPopup(auth, googleProvider);
      };

      const completeGoogleSignUp = async (name: string, username: string) => {
        if (!pendingGoogleUser) return;

        // Check username uniqueness
        const exists = await checkUsernameExists(username);
        if (exists) {
          throw new Error("This username is already taken by another Hero.");
        }

        const uid = pendingGoogleUser.uid;
        const docRef = doc(db, 'users', uid);

        const newUser = {
          ...DEFAULT_USER,
          name: name.trim(),
          username: username.trim().toLowerCase(),
          email: pendingGoogleUser.email || '',
          phone: pendingGoogleUser.phoneNumber || '',
          onboardingCompleted: true
        };

        const defaultUserData = {
          user: newUser,
          tasks: [],
          habits: [],
          quests: DEFAULT_QUESTS,
          achievements: DEFAULT_ACHIEVEMENTS,
          longTermPlans: [],
          fitnessLogs: []
        };

        await setDoc(docRef, defaultUserData);

        setUser(newUser);
        setTasks([]);
        setHabits([]);
        setQuests(DEFAULT_QUESTS);
        setAchievements(DEFAULT_ACHIEVEMENTS);
        setLongTermPlans([]);
        setFitnessLogs([]);

        localStorage.setItem(`lvl_${uid}_user`, JSON.stringify(newUser));
        localStorage.setItem(`lvl_${uid}_tasks`, JSON.stringify([]));
        localStorage.setItem(`lvl_${uid}_habits`, JSON.stringify([]));
        localStorage.setItem(`lvl_${uid}_quests`, JSON.stringify(DEFAULT_QUESTS));
        localStorage.setItem(`lvl_${uid}_achievements`, JSON.stringify(DEFAULT_ACHIEVEMENTS));
        localStorage.setItem(`lvl_${uid}_longTermPlans`, JSON.stringify([]));
        localStorage.setItem(`lvl_${uid}_fitnessLogs`, JSON.stringify([]));

        localStorage.setItem('lvl_uid', uid);
        setCurrentUid(uid);
        setFirebaseUser(pendingGoogleUser);
        setPendingGoogleUser(null);
        setScreen('dashboard');
      };

      const logout = async () => {
        await firebaseSignOut(auth);
        setScreen('auth');
      };

      const sendPasswordReset = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
      };

      const initiateForgotPassword = async (identifier: string) => {
        const cleanIdentifier = identifier.trim();
        if (!cleanIdentifier) throw new Error("Please enter your email address, phone number, or username.");

        const usersRef = collection(db, 'users');
        let userDoc: any = null;

        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanIdentifier);
        const isPhoneSearch = /^[0-9+\s\-()]+$/.test(cleanIdentifier) && cleanIdentifier.replace(/[^0-9]/g, '').length >= 10;

        if (isEmail) {
          const emailQuery = query(usersRef, where('user.email', '==', cleanIdentifier.toLowerCase()));
          const snap = await getDocs(emailQuery);
          if (!snap.empty) {
            userDoc = snap.docs[0];
          }
        } else if (isPhoneSearch) {
          const normalized = normalizePhone(cleanIdentifier);
          const phoneQuery = query(usersRef, where('user.phone', 'in', [cleanIdentifier, normalized]));
          const snap = await getDocs(phoneQuery);
          if (!snap.empty) {
            userDoc = snap.docs[0];
          }
        } else {
          // Check username
          const usernameQuery = query(usersRef, where('user.username', '==', cleanIdentifier.toLowerCase()));
          let snap = await getDocs(usernameQuery);
          if (!snap.empty) {
            userDoc = snap.docs[0];
          } else {
            // Legacy name fallback
            const nameQuery = query(usersRef, where('user.name', '==', cleanIdentifier));
            snap = await getDocs(nameQuery);
            if (!snap.empty) {
              userDoc = snap.docs[0];
            }
          }
        }

        if (!userDoc) {
          throw new Error("No Hero account found with this email, phone, or username.");
        }

        const userData = userDoc.data().user;
        const uid = userDoc.id;
        const email = userData.email || '';
        const phone = userData.phone || '';
        const isMigrated = !!userData.password;

        // If it is NOT a phone search (username, legacy name, or email), send the reset link to email directly
        if (!isPhoneSearch) {
          if (!email) {
            throw new Error("No registered email address found for this account.");
          }
          await sendPasswordResetEmail(auth, email);
          return {
            success: true,
            emailSent: true,
            email,
            phone: '',
            uid,
            otp: '',
            isMigrated,
            type: 'email' as const,
            to: email
          };
        }

        // Generate OTP for phone search
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const type = 'sms' as const;
        const to = phone;

        if (!to) {
          throw new Error("No phone number found for this account.");
        }

        // Send simulated SMS message
        setSimulatedMessage({
          type,
          to,
          text: `Your LevelUp Life password recovery code is: ${otp}`
        });

        return {
          success: true,
          emailSent: false,
          type,
          to,
          otp,
          isMigrated,
          email,
          phone,
          uid
        };
      };

      const resetPasswordWithOtp = async (uid: string, newPassword: string) => {
        if (!newPassword || newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }

        const userDocRef = doc(db, 'users', uid);
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
          throw new Error("User profile not found.");
        }

        const currentData = docSnap.data();
        const updatedUser = {
          ...currentData.user,
          password: newPassword
        };

        await setDoc(userDocRef, { user: updatedUser }, { merge: true });
      };

      const updatePasswordInFirestore = async (newPassword: string) => {
        if (!newPassword || newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        setUser(prev => ({
          ...prev,
          password: newPassword
        }));
      };

      // --- Sync with LocalStorage and Firebase ---
      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_user`, JSON.stringify(user));
        if (authLoading) return;
        updateFirestore({ user });
      }, [user, firebaseUser, authLoading, currentUid]);

      useEffect(() => {
        if (!user || !currentUid) return;
        setSavedAccounts(prev => {
          const existingIndex = prev.findIndex(acc => acc.uid === currentUid);
          const accountData = {
            uid: currentUid,
            name: user.name,
            username: user.username || 'hero',
            email: user.email || '',
            profilePicture: user.profilePicture || '',
            avatar: user.avatar
          };
          let next;
          if (existingIndex > -1) {
            if (JSON.stringify(prev[existingIndex]) === JSON.stringify(accountData)) {
              return prev;
            }
            next = [...prev];
            next[existingIndex] = accountData;
          } else {
            next = [...prev, accountData];
          }
          localStorage.setItem('lvl_saved_accounts', JSON.stringify(next));
          return next;
        });
      }, [user, currentUid]);

      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_tasks`, JSON.stringify(tasks));
        if (authLoading) return;
        updateFirestore({ tasks });
      }, [tasks, firebaseUser, authLoading, currentUid]);

      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_habits`, JSON.stringify(habits));
        if (authLoading) return;
        updateFirestore({ habits });
      }, [habits, firebaseUser, authLoading, currentUid]);

      useEffect(() => {
        if (!authLoading) {
          recalculateDiscipline();
        }
      }, [tasks, habits, longTermPlans, authLoading]);

      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_quests`, JSON.stringify(quests));
        if (authLoading) return;
        updateFirestore({ quests });
      }, [quests, firebaseUser, authLoading, currentUid]);

      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_achievements`, JSON.stringify(achievements));
        if (authLoading) return;
        updateFirestore({ achievements });
      }, [achievements, firebaseUser, authLoading, currentUid]);

      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_screen`, activeScreen);
      }, [activeScreen, currentUid]);

      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_longTermPlans`, JSON.stringify(longTermPlans));
        if (authLoading) return;
        updateFirestore({ longTermPlans });
      }, [longTermPlans, firebaseUser, authLoading, currentUid]);

      useEffect(() => {
        localStorage.setItem(`lvl_${currentUid}_fitnessLogs`, JSON.stringify(fitnessLogs));
        if (authLoading) return;
        updateFirestore({ fitnessLogs });
      }, [fitnessLogs, firebaseUser, authLoading, currentUid]);

      // Sync/update friends profiles in the background when app loads
      useEffect(() => {
        if (!user || !user.friends || user.friends.length === 0 || !currentUid || currentUid === 'guest' || authLoading) return;

        const updateFriendsProfiles = async () => {
          try {
            const friends = user.friends || [];
            let changed = false;
            const updatedFriends = await Promise.all(
              friends.map(async (friend) => {
                const friendDocRef = doc(db, 'users', friend.uid);
                const friendDocSnap = await getDoc(friendDocRef);
                if (friendDocSnap.exists()) {
                  const data = friendDocSnap.data();
                  if (data && data.user) {
                    const friendData = data.user;
                    const profilePicture = friendData.profilePicture || '';
                    const name = friendData.name || friend.name;
                    const username = friendData.username || friend.username;
                    const avatar = friendData.avatar || friend.avatar;

                    if (
                      friend.profilePicture !== profilePicture ||
                      friend.name !== name ||
                      friend.username !== username ||
                      JSON.stringify(friend.avatar) !== JSON.stringify(avatar)
                    ) {
                      changed = true;
                      return {
                        ...friend,
                        name,
                        username,
                        avatar,
                        profilePicture
                      };
                    }
                  }
                }
                return friend;
              })
            );

            if (changed) {
              setUser(prev => ({
                ...prev,
                friends: updatedFriends
              }));
            }
          } catch (error) {
            console.error("Error updating friends profiles in background:", error);
          }
        };

        updateFriendsProfiles();
      }, [currentUid, authLoading]);

      // --- Long-Term Planning Actions ---
      const addLongTermPlan = (plan: Omit<LongTermPlan, 'id'>) => {
        const newPlan: LongTermPlan = {
          ...plan,
          id: Math.random().toString(36).substr(2, 9)
        };
        setLongTermPlans(prev => [...prev, newPlan]);
      };

      const updateLongTermPlanStatus = (id: string, status: LongTermPlan['status']) => {
        setLongTermPlans(prev => prev.map(p => p.id === id ? { ...p, status } : p));
      };

      const deleteLongTermPlan = (id: string) => {
        setLongTermPlans(prev => prev.filter(p => p.id !== id));
      };

      const updateLongTermPlan = (plan: LongTermPlan) => {
        setLongTermPlans(prev => prev.map(p => p.id === plan.id ? plan : p));
      };

      // --- Fitness Actions ---
      const addFitnessLog = (log: Omit<FitnessLog, 'id' | 'createdAt'>) => {
        const newLog: FitnessLog = {
          ...log,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date().toISOString()
        };
        setFitnessLogs(prev => [newLog, ...prev]);
        // Award RPG rewards (XP and Coins)
        addXP(15);
        addCoins(5);
      };

      const deleteFitnessLog = (id: string) => {
        setFitnessLogs(prev => prev.filter(l => l.id !== id));
      };

      const updateFitnessLog = (log: FitnessLog) => {
        setFitnessLogs(prev => prev.map(l => l.id === log.id ? log : l));
      };

      const updateFitnessTargets = (steps: number, calories: number, duration: number) => {
        setUser(prev => ({
          ...prev,
          stepsTarget: steps,
          caloriesTarget: calories,
          workoutDurationTarget: duration
        }));
      };

      // --- Helper: Daily Reset check ---
      const checkDailyReset = (currentUser: UserProfile | null) => {
        const today = new Date().toISOString().split('T')[0];
        const userProfile = currentUser || user;
        const lastActive = userProfile.lastActiveDate;

        if (lastActive && lastActive !== today) {
          const diff = daysBetween(lastActive, today);
          // 1. Reset water intake
          setUser(prev => ({
            ...prev,
            waterIntake: 0,
            lastActiveDate: today,
            // Increment streak if logged in consecutively (diff === 1), otherwise reset to 0
            streak: diff === 1 ? prev.streak + 1 : 0
          }));

          // 2. Uncomplete all daily tasks
          setTasks(prev => prev.map(t => ({ ...t, completed: false })));

          // 3. Reset daily quests
          setQuests(DEFAULT_QUESTS.map(q => ({ ...q, currentCount: 0, completed: false })));
        }
      };

      const daysBetween = (date1: string, date2: string) => {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diff = Math.abs(d2.getTime() - d1.getTime());
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      };

      // --- Helper: Recalculate Discipline Score ---
      const recalculateDiscipline = () => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.completed).length;
        const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
        const hasTasks = totalTasks > 0;

        const totalHabits = habits.length;
        const completedHabits = habits.filter(h => h.completedDates.includes(today)).length;
        const habitScore = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 100;
        const hasHabits = totalHabits > 0;

        // Active plans today
        const activePlans = longTermPlans.filter(p => {
          if (p.type === 'week') {
            return p.fromDate && p.toDate && p.fromDate <= today && p.toDate >= today;
          } else {
            return p.targetMonth && today.startsWith(p.targetMonth);
          }
        });

        let planScoreSum = 0;
        let activePlansCount = 0;

        activePlans.forEach(p => {
          const routines = p.routines || [];
          if (routines.length > 0) {
            const completedRoutines = routines.filter(r => p.completions && p.completions[`${today}_${r.id}`]).length;
            const score = (completedRoutines / routines.length) * 100;
            planScoreSum += score;
            activePlansCount++;
          }
        });

        const hasPlans = activePlansCount > 0;
        const planningScore = hasPlans ? planScoreSum / activePlansCount : 100;

        const scores: number[] = [];
        if (hasTasks) scores.push(taskScore);
        if (hasHabits) scores.push(habitScore);
        if (hasPlans) scores.push(planningScore);

        const score = scores.length > 0 ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length) : 100;

        setUser(prev => {
          if (prev.disciplineScore !== score && !isNaN(score)) {
            return { ...prev, disciplineScore: score };
          }
          return prev;
        });
      };

      // --- User Core Functions ---
      const updateUsername = async (username: string) => {
        if (!username) return;
        if (/\s/.test(username)) {
          throw new Error("Username cannot contain spaces.");
        }
        if (/[A-Z]/.test(username)) {
          throw new Error("Username must be in lowercase (small) letters only. Uppercase letters are not accepted.");
        }

        const usernameRegex = /^[a-z0-9_.\-@!#$%^&*()+=~`{}|[\]\\:;"'<>,.?/]+$/;
        if (!usernameRegex.test(username)) {
          throw new Error("Username contains invalid characters.");
        }

        if (currentUid === 'guest') {
          setUser(prev => ({ ...prev, username: username }));
          return;
        }

        // Check Firestore
        const usersRef = collection(db, 'users');

        // Check username uniqueness (check both username and name)
        const q1 = query(usersRef, where('user.username', '==', username));
        const snap1 = await getDocs(q1);
        const otherUsers1 = snap1.docs.filter(doc => doc.id !== currentUid);
        if (otherUsers1.length > 0) {
          throw new Error("This username is already taken by another Hero.");
        }

        const q2 = query(usersRef, where('user.name', '==', username));
        const snap2 = await getDocs(q2);
        const otherUsers2 = snap2.docs.filter(doc => doc.id !== currentUid);
        if (otherUsers2.length > 0) {
          throw new Error("This username is already taken by another Hero.");
        }

        setUser(prev => ({ ...prev, username: username }));
      };

      const addFriendByUsername = async (friendUsername: string) => {
        const cleanUsername = friendUsername.trim().toLowerCase();
        if (!cleanUsername) throw new Error("Username cannot be empty.");

        if (currentUid === 'guest') {
          throw new Error("You must register or log in to add friends.");
        }

        if ((user.username || user.name || '').toLowerCase() === cleanUsername) {
          throw new Error("You cannot add yourself as a friend.");
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('user.username', '==', cleanUsername));
        const snap = await getDocs(q);

        let friendDoc = snap.docs[0];
        if (!friendDoc) {
          const qFallback = query(usersRef, where('user.name', '==', cleanUsername));
          const snapFallback = await getDocs(qFallback);
          friendDoc = snapFallback.docs[0];
        }

        if (!friendDoc) {
          throw new Error("Hero not found. Check the username spelling.");
        }

        const friendDocId = friendDoc.id;
        const friendData = friendDoc.data().user;

        const currentFriends = user.friends || [];
        if (currentFriends.some(f => f.uid === friendDocId)) {
          throw new Error("You are already friends with this Hero.");
        }

        const friendInfoForMe: FriendInfo = {
          uid: friendDocId,
          name: friendData.name || 'Hero',
          username: friendData.username || cleanUsername,
          avatar: friendData.avatar,
          profilePicture: friendData.profilePicture
        };

        const myInfoForFriend: FriendInfo = {
          uid: currentUid,
          name: user.name || 'Hero',
          username: user.username || 'hero',
          avatar: user.avatar,
          profilePicture: user.profilePicture
        };

        const friendRef = doc(db, 'users', friendDocId);
        const friendFriendsList = friendData.friends || [];
        if (!friendFriendsList.some((f: any) => f.uid === currentUid)) {
          await setDoc(friendRef, {
            user: {
              ...friendData,
              friends: [...friendFriendsList, myInfoForFriend]
            }
          }, { merge: true });
        }

        setUser(prev => {
          const prevFriends = prev.friends || [];
          if (prevFriends.some(f => f.uid === friendDocId)) return prev;
          return {
            ...prev,
            friends: [...prevFriends, friendInfoForMe]
          };
        });
      };

      const updateName = async (name: string) => {
        const cleanName = name.trim();
        if (!cleanName) return;
        setUser(prev => ({ ...prev, name: cleanName }));
      };

      const updatePhone = async (phone: string) => {
        const cleanPhone = phone.trim();
        if (!cleanPhone) throw new Error("Phone number cannot be empty.");

        const normalizedPhone = normalizePhone(cleanPhone);

        if (currentUid === 'guest') {
          setUser(prev => ({ ...prev, phone: normalizedPhone }));
          return;
        }

        // Check phone uniqueness
        const usersRef = collection(db, 'users');
        const phoneQuery = query(usersRef, where('user.phone', 'in', [cleanPhone, normalizedPhone]));
        const phoneSnapshot = await getDocs(phoneQuery);

        const otherUsers = phoneSnapshot.docs.filter(doc => doc.id !== currentUid);
        if (otherUsers.length > 0) {
          throw new Error("This phone number is already registered with another Hero.");
        }

        setUser(prev => ({ ...prev, phone: normalizedPhone }));
      };

      const updateUserEmail = async (newEmail: string) => {
        const cleanEmail = newEmail.trim();
        if (!cleanEmail) throw new Error("Email address cannot be empty.");

        // Check format
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
        if (!isEmail) {
          throw new Error("Please enter a valid email format.");
        }

        if (currentUid === 'guest') {
          setUser(prev => ({ ...prev, email: cleanEmail }));
          return;
        }

        // Update in Firebase Authentication
        const currentUser = auth.currentUser;
        if (currentUser) {
          await updateEmail(currentUser, cleanEmail);
        }

        setUser(prev => ({ ...prev, email: cleanEmail }));
      };

      const updateProfilePicture = async (pictureBase64: string) => {
        setUser(prev => ({ ...prev, profilePicture: pictureBase64 }));
      };

      const addXP = (amount: number) => {
        setUser(prev => {
          let newXp = prev.xp + amount;
          let newLevel = prev.level;
          let nextXpNeeded = prev.xpNeeded;

          while (newXp >= nextXpNeeded) {
            newXp -= nextXpNeeded;
            newLevel += 1;
            nextXpNeeded = Math.round(nextXpNeeded * 1.5);
            triggerAchievement('level-5'); // Check achievement trigger
          }

          return {
            ...prev,
            level: newLevel,
            xp: newXp,
            xpNeeded: nextXpNeeded
          };
        });
      };

      const addCoins = (amount: number) => {
        setUser(prev => ({ ...prev, coins: prev.coins + amount }));
      };

      const updateWater = (amount: number) => {
        setUser(prev => {
          const newWater = Math.max(0, prev.waterIntake + amount);
          const hitTarget = newWater >= prev.waterTarget && prev.waterIntake < prev.waterTarget;

          if (hitTarget) {
            triggerAchievement('water-master');
          }

          return {
            ...prev,
            waterIntake: newWater
          };
        });
        incrementQuestProgress('water', amount);
      };

      // --- Task Functions ---
      const addTask = (task: Omit<TaskBlock, 'id'>) => {
        const newTask: TaskBlock = {
          ...task,
          id: Math.random().toString(36).substr(2, 9)
        };
        setTasks(prev => [...prev, newTask]);
      };

      const toggleTask = (id: string) => {
        setTasks(prev => prev.map(task => {
          if (task.id === id) {
            const nextState = !task.completed;
            if (nextState) {
              // Task Completed Rewards
              const xpGained = task.priority === 'high' ? 30 : task.priority === 'medium' ? 20 : 10;
              const coinsGained = task.priority === 'high' ? 15 : task.priority === 'medium' ? 10 : 5;
              addXP(xpGained);
              addCoins(coinsGained);
              incrementQuestProgress('task');
              triggerAchievement('first-task');
            }
            return { ...task, completed: nextState };
          }
          return task;
        }));
      };

      const deleteTask = (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
      };

      const updateTask = (updatedTask: TaskBlock) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      };

      // --- Habit Functions ---
      const addHabit = (habit: Omit<Habit, 'id' | 'streak' | 'bestStreak' | 'completedDates' | 'createdAt'>) => {
        const newHabit: Habit = {
          ...habit,
          id: Math.random().toString(36).substr(2, 9),
          streak: 0,
          bestStreak: 0,
          completedDates: [],
          createdAt: new Date().toISOString()
        };
        setHabits(prev => [...prev, newHabit]);
      };

      const toggleHabit = (id: string, date: string) => {
        setHabits(prev => prev.map(habit => {
          if (habit.id === id) {
            const completedIndex = habit.completedDates.indexOf(date);
            const isCompleted = completedIndex !== -1;
            let newDates = [...habit.completedDates];
            let newStreak = habit.streak;

            if (isCompleted) {
              // Remove completion
              newDates.splice(completedIndex, 1);
              newStreak = Math.max(0, newStreak - 1);
            } else {
              // Add completion
              newDates.push(date);
              newStreak += 1;

              // Reward Habit Completion
              addXP(20);
              addCoins(10);
              incrementQuestProgress('habit');
              triggerAchievement('first-habit');
            }

            const bestStreak = Math.max(habit.bestStreak, newStreak);

            if (newStreak >= 3) {
              triggerAchievement('streak-3');
            }

            return {
              ...habit,
              completedDates: newDates,
              streak: newStreak,
              bestStreak
            };
          }
          return habit;
        }));
      };

      const recalculateStreak = (completedDates: string[]): number => {
        if (completedDates.length === 0) return 0;

        // Sort dates in descending order (latest first)
        const sorted = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // If the latest completed date is neither today nor yesterday, the current streak is 0
        if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) {
          return 0;
        }

        let streak = 0;
        let checkDate = new Date(sorted[0] + 'T00:00:00');

        while (true) {
          const checkStr = checkDate.toISOString().split('T')[0];
          if (completedDates.includes(checkStr)) {
            streak++;
            // Go to previous day
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        return streak;
      };

      const bulkUpdateHabitDates = (id: string, startStr: string, endStr: string, shouldComplete: boolean) => {
        setHabits(prev => prev.map(habit => {
          if (habit.id === id) {
            // Generate array of dates
            const dates: string[] = [];
            const start = new Date(startStr + 'T00:00:00');
            const end = new Date(endStr + 'T00:00:00');

            let curr = new Date(start);
            while (curr <= end) {
              dates.push(curr.toISOString().split('T')[0]);
              curr.setDate(curr.getDate() + 1);
            }

            let newDates = [...habit.completedDates];
            if (shouldComplete) {
              dates.forEach(d => {
                if (!newDates.includes(d)) {
                  newDates.push(d);
                  // Give rewards for each checkoff!
                  addXP(10);
                  addCoins(5);
                }
              });
            } else {
              newDates = newDates.filter(d => !dates.includes(d));
            }

            // Sort dates to keep them ordered
            newDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

            // Recalculate streak
            const newStreak = recalculateStreak(newDates);
            const bestStreak = Math.max(habit.bestStreak, newStreak);

            if (newStreak >= 3) {
              triggerAchievement('streak-3');
            }

            return {
              ...habit,
              completedDates: newDates,
              streak: newStreak,
              bestStreak
            };
          }
          return habit;
        }));
      };

      const deleteHabit = (id: string) => {
        setHabits(prev => prev.filter(h => h.id !== id));
      };

      // --- Onboarding Function ---
      const completeOnboarding = async (name: string, username: string) => {
         const cleanName = name.trim();
         const cleanUsername = username.trim().toLowerCase();

         await updateName(cleanName);
         await updateUsername(cleanUsername);

         setUser(prev => ({
           ...prev,
           onboardingCompleted: true
         }));
         setScreen('dashboard');
       };

      // --- RPG Actions ---
      const purchaseItem = (itemId: string): boolean => {
        const item = DEFAULT_SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return false;

        if (user.coins >= item.price && !user.inventory.includes(itemId)) {
          setUser(prev => ({
            ...prev,
            coins: prev.coins - item.price,
            inventory: [...prev.inventory, itemId]
          }));
          return true;
        }
        return false;
      };

      const equipAvatarItem = (category: keyof AvatarConfig, value: string) => {
        setUser(prev => ({
          ...prev,
          avatar: {
            ...prev.avatar,
            [category]: value
          }
        }));
      };

      const claimQuestReward = (questId: string) => {
        setQuests(prev => prev.map(quest => {
          if (quest.id === questId && quest.completed) {
            addXP(quest.xpReward);
            addCoins(quest.coinReward);
            // Refresh this quest with standard values but marked as claimed (or we can just toggle standard completed check)
            return { ...quest, completed: false, currentCount: 0 };
          }
          return quest;
        }));
      };

      const incrementQuestProgress = (type: 'task' | 'habit' | 'water' | 'focus', amount: number = 1) => {
        setQuests(prev => prev.map(quest => {
          if (quest.targetType === type && !quest.completed) {
            const nextCount = quest.currentCount + amount;
            const isNowCompleted = nextCount >= quest.targetCount;

            if (isNowCompleted && !quest.completed) {
              // Toast or alert reward when completing daily quest
              addXP(quest.xpReward);
              addCoins(quest.coinReward);
            }

            return {
              ...quest,
              currentCount: Math.min(quest.targetCount, nextCount),
              completed: isNowCompleted
            };
          }
          return quest;
        }));
      };

      const triggerAchievement = (id: string) => {
        setUser(prev => {
          if (!prev.achievements.includes(id)) {
            // Unlock Achievement
            const nextAchievements = [...prev.achievements, id];

            // Find achievement details for XP/Coins rewards
            addXP(50); // Achievement bonus XP!
            addCoins(20); // Achievement bonus Gold!

            // Trigger visual effect in browser
            return {
              ...prev,
              achievements: nextAchievements
            };
          }
          return prev;
        });
      };
      const markChatAsRead = useCallback((friendUid: string) => {
        if (!firebaseUser) return;
        const myUid = firebaseUser.uid;
        try {
          const saved = localStorage.getItem(`lvl_${myUid}_chat_last_read`);
          const lastReadMap = saved ? JSON.parse(saved) : {};
          lastReadMap[friendUid] = Date.now();
          localStorage.setItem(`lvl_${myUid}_chat_last_read`, JSON.stringify(lastReadMap));
          setUnreadCounts(prev => {
            if (prev[friendUid] === 0) return prev;
            return { ...prev, [friendUid]: 0 };
          });
        } catch (e) {
          console.error(e);
        }
      }, [firebaseUser]);

      const friendsListKey = (user.friends || []).map(f => f.uid).join(',');

      // Real-time unread messages listener across all friends' rooms
      useEffect(() => {
        if (!firebaseUser || !user.friends || user.friends.length === 0) {
          setUnreadCounts({});
          return;
        }

        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission();
        }

        const myUid = firebaseUser.uid;
        const unsubscribes = user.friends.map(friend => {
          const roomId = [myUid, friend.uid].sort().join('_');
          const messagesRef = collection(db, 'chats', roomId, 'messages');
          const q = query(messagesRef, orderBy('timestamp', 'asc'));

          // Track if this is the first snapshot for this listener instance
          let isFirstSnapshot = true;

          return onSnapshot(q, (snapshot) => {
            // Check if this chat room is currently open
            const isOpen = activeScreen === 'messages' && activeChatFriendId === friend.uid;
            
            if (isOpen) {
              // Auto-mark as read
              let lastReadMap: Record<string, number> = {};
              try {
                const saved = localStorage.getItem(`lvl_${myUid}_chat_last_read`);
                lastReadMap = saved ? JSON.parse(saved) : {};
              } catch (e) {}
              lastReadMap[friend.uid] = Date.now();
              localStorage.setItem(`lvl_${myUid}_chat_last_read`, JSON.stringify(lastReadMap));
              setUnreadCounts(prev => {
                if (prev[friend.uid] === 0) return prev;
                return { ...prev, [friend.uid]: 0 };
              });
              isFirstSnapshot = false;
              return;
            }

            // Otherwise, calculate unread count
            let lastRead = 0;
            try {
              const saved = localStorage.getItem(`lvl_${myUid}_chat_last_read`);
              const lastReadMap = saved ? JSON.parse(saved) : {};
              lastRead = lastReadMap[friend.uid] || 0;
            } catch (e) {}

            const docs = snapshot.docs;
            const unreads = docs.filter(docSnap => {
              const m = docSnap.data();
              return m.senderId !== myUid && (m.timestamp || 0) > lastRead;
            });

            setUnreadCounts(prev => {
              if (prev[friend.uid] === unreads.length) return prev;
              return { ...prev, [friend.uid]: unreads.length };
            });

            // On the initial load (first snapshot), populate our notified Set so we don't
            // trigger notifications for pre-existing messages on listener instantiation/re-sub.
            if (isFirstSnapshot) {
              docs.forEach(docSnap => {
                notifiedMessageIdsRef.current.add(docSnap.id);
              });
              isFirstSnapshot = false;
              return;
            }

            // Trigger notification for new incoming messages (within last 8 seconds)
            const latestDoc = docs[docs.length - 1];
            if (latestDoc) {
              const latestMsg = latestDoc.data();
              const msgId = latestDoc.id;

              // Only notify if we haven't notified for this message ID yet
              if (!notifiedMessageIdsRef.current.has(msgId)) {
                notifiedMessageIdsRef.current.add(msgId);

                const age = Date.now() - (latestMsg.timestamp || 0);
                const isNew = age < 8000;
                const isFromFriend = latestMsg.senderId !== myUid;
                const isNotActiveChat = !(activeScreen === 'messages' && activeChatFriendId === friend.uid);

                if (isNew && isFromFriend && isNotActiveChat) {
                  // 1. Browser Notification
                  if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(`Message from ${friend.name}`, {
                      body: latestMsg.text,
                      icon: '/favicon.ico'
                    });
                  }

                  // 2. In-App Notification Toast
                  setChatNotification({
                    id: msgId,
                    senderName: friend.name,
                    text: latestMsg.text,
                    friendUid: friend.uid
                  });

                  // 3. Play audio chime exactly once
                  playNotificationSound();
                }
              }
            }
          });
        });

        return () => {
          unsubscribes.forEach(unsub => unsub());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [firebaseUser, friendsListKey, activeScreen, activeChatFriendId]);
      const resetData = async () => {
        if (firebaseUser) {
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              user: DEFAULT_USER,
              tasks: [],
              habits: [],
              quests: DEFAULT_QUESTS,
              achievements: DEFAULT_ACHIEVEMENTS,
              longTermPlans: [],
              fitnessLogs: []
            });
          } catch (err) {
            console.error("Error resetting data in Firestore:", err);
          }
        }
        setUser(DEFAULT_USER);
        setTasks([]);
        setHabits([]);
        setQuests(DEFAULT_QUESTS);
        setLongTermPlans([]);
        setFitnessLogs([]);
        setScreen('auth');
        localStorage.clear();
        localStorage.setItem('lvl_uid', firebaseUser?.uid || 'guest');
      };

      const switchAccount = async (uid: string, password?: string) => {
        if (uid === 'guest') {
          await firebaseSignOut(auth);
          setCurrentUid('guest');
          const savedUser = localStorage.getItem('lvl_guest_user');
          setUser(savedUser ? JSON.parse(savedUser) : DEFAULT_USER);

          const savedTasks = localStorage.getItem('lvl_guest_tasks');
          setTasks(savedTasks ? JSON.parse(savedTasks) : []);

          const savedHabits = localStorage.getItem('lvl_guest_habits');
          setHabits(savedHabits ? JSON.parse(savedHabits) : []);

          const savedQuests = localStorage.getItem('lvl_guest_quests');
          setQuests(savedQuests ? JSON.parse(savedQuests) : DEFAULT_QUESTS);

          const savedAchievements = localStorage.getItem('lvl_guest_achievements');
          setAchievements(savedAchievements ? JSON.parse(savedAchievements) : DEFAULT_ACHIEVEMENTS);

          const savedLongTermPlans = localStorage.getItem('lvl_guest_longTermPlans');
          setLongTermPlans(savedLongTermPlans ? JSON.parse(savedLongTermPlans) : []);

          const savedFitnessLogs = localStorage.getItem('lvl_guest_fitnessLogs');
          setFitnessLogs(savedFitnessLogs ? JSON.parse(savedFitnessLogs) : []);

          setScreen('dashboard');
          return;
        }

        const saved = savedAccounts.find(acc => acc.uid === uid);
        if (!saved) throw new Error("Account not found.");

        if (auth.currentUser?.uid === uid) {
          setCurrentUid(uid);
          const savedUser = localStorage.getItem(`lvl_${uid}_user`);
          setUser(savedUser ? JSON.parse(savedUser) : saved);

          const savedTasks = localStorage.getItem(`lvl_${uid}_tasks`);
          setTasks(savedTasks ? JSON.parse(savedTasks) : []);

          const savedHabits = localStorage.getItem(`lvl_${uid}_habits`);
          setHabits(savedHabits ? JSON.parse(savedHabits) : []);

          const savedQuests = localStorage.getItem(`lvl_${uid}_quests`);
          setQuests(savedQuests ? JSON.parse(savedQuests) : DEFAULT_QUESTS);

          const savedAchievements = localStorage.getItem(`lvl_${uid}_achievements`);
          setAchievements(savedAchievements ? JSON.parse(savedAchievements) : DEFAULT_ACHIEVEMENTS);

          const savedLongTermPlans = localStorage.getItem(`lvl_${uid}_longTermPlans`);
          setLongTermPlans(savedLongTermPlans ? JSON.parse(savedLongTermPlans) : []);

          const savedFitnessLogs = localStorage.getItem(`lvl_${uid}_fitnessLogs`);
          setFitnessLogs(savedFitnessLogs ? JSON.parse(savedFitnessLogs) : []);

          setScreen('dashboard');
          return;
        }

        if (!password) {
          throw new Error("PASSWORD_REQUIRED");
        }

        // Validate custom password against Firestore first
        const userDocRef = doc(db, 'users', uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data().user;
          if (userData && userData.password) {
            if (userData.password !== password) {
              throw new Error("Incorrect password.");
            }
            await signInWithEmailAndPassword(auth, saved.email, FIREBASE_MASTER_PASSWORD);
            return;
          }
        }

        // Fallback for unmigrated legacy users
        await signInWithEmailAndPassword(auth, saved.email, password);
      };

      const removeSavedAccount = (uid: string) => {
        setSavedAccounts(prev => {
          const next = prev.filter(acc => acc.uid !== uid);
          localStorage.setItem('lvl_saved_accounts', JSON.stringify(next));
          return next;
        });
      };

      return (
        <AppContext.Provider value={{
          user,
          tasks,
          habits,
          quests,
          achievements,
          shopItems: DEFAULT_SHOP_ITEMS,
          activeScreen,
          previousScreen,
          setScreen,
          firebaseUser,
          authLoading,
          login,
          register,
          googleSignIn,
          pendingGoogleUser,
          completeGoogleSignUp,
          logout,
          sendPasswordReset,
          initiateForgotPassword,
          resetPasswordWithOtp,
          updatePasswordInFirestore,
          longTermPlans,
          addLongTermPlan,
          updateLongTermPlanStatus,
          deleteLongTermPlan,
          updateLongTermPlan,
          updateUsername,
          addFriendByUsername,
          updateName,
          updatePhone,
          updateUserEmail,
          updateProfilePicture,
          checkUsernameExists,
          checkPhoneExists,
          checkEmailExists,
          addXP,
          addCoins,
          updateWater,
          addTask,
          toggleTask,
          deleteTask,
          updateTask,
          addHabit,
          toggleHabit,
          deleteHabit,
          completeOnboarding,
          purchaseItem,
          equipAvatarItem,
          claimQuestReward,
          incrementQuestProgress,
          resetData,
          showSavedAccounts,
          setShowSavedAccounts,
          savedAccounts,
          switchAccount,
          removeSavedAccount,
          fitnessLogs,
          addFitnessLog,
          deleteFitnessLog,
          updateFitnessLog,
          updateFitnessTargets,
          bulkUpdateHabitDates,
          trackingPlanId,
          setTrackingPlanId,
          simulatedMessage,
          setSimulatedMessage,
          unreadCounts,
          activeChatFriendId,
          setActiveChatFriendId,
          markChatAsRead,
          chatNotification,
          setChatNotification
        }}>
          {children}
        </AppContext.Provider>
      );
    };

    export const useApp = () => {
      const context = useContext(AppContext);
      if (!context) throw new Error('useApp must be used within an AppProvider');
      return context;
    };
