import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AvatarBuilder } from './components/AvatarBuilder';
import { SavedAccountsModal } from './components/SavedAccountsModal';
import { AuthScreen } from './screens/AuthScreen';
import { Onboarding } from './screens/Onboarding';
import { Dashboard } from './screens/Dashboard';
import { Planner } from './screens/Planner';
import { Habits } from './screens/Habits';
import { MessagesScreen } from './screens/MessagesScreen';
import { FocusMode } from './screens/FocusMode';
import { AIChat } from './screens/AIChat';
import { Profile } from './screens/Profile';
import { Settings } from './screens/Settings';
import { FitnessTracker } from './screens/FitnessTracker';

// Navigation Icons
import { 
  Home, 
  Calendar, 
  CheckSquare, 
  Flame, 
  MessageSquare,
  User,
  Settings as SettingsIcon,
  Pencil,
  Dumbbell,
  Mail,
  X,
  Timer,
  Users,
  LogOut
} from 'lucide-react';

const ScreenRenderer: React.FC = () => {
  const { activeScreen } = useApp();

  switch (activeScreen) {
    case 'auth':
      return <AuthScreen />;
    case 'onboarding':
      return <Onboarding />;
    case 'dashboard':
      return <Dashboard />;
    case 'planner':
      return <Planner />;
    case 'habits':
      return <Habits />;
    case 'fitness':
      return <FitnessTracker />;
    case 'messages':
      return <MessagesScreen />;
    case 'focus':
      return <FocusMode />;
    case 'chat':
      return <AIChat />;
    case 'profile':
      return <Profile />;
    case 'settings':
      return <Settings />;
    case 'long-term-planning':
      return <Planner />;
    default:
      return <Dashboard />;
  }
};

const SimulatedMessageToast: React.FC = () => {
  const { simulatedMessage, setSimulatedMessage } = useApp();
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (simulatedMessage) {
      setCopied(false);
      const timer = setTimeout(() => {
        setSimulatedMessage(null);
      }, 15000); // Auto hide after 15 seconds
      return () => clearTimeout(timer);
    }
  }, [simulatedMessage, setSimulatedMessage]);

  if (!simulatedMessage) return null;

  // Extract numeric OTP code if possible (e.g. from "code is: 123456")
  const otpMatch = simulatedMessage.text.match(/\d{6}/);
  const otpCode = otpMatch ? otpMatch[0] : '';

  const handleCopy = () => {
    if (otpCode) {
      navigator.clipboard.writeText(otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      navigator.clipboard.writeText(simulatedMessage.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSms = simulatedMessage.type === 'sms';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 z-[9999] w-[92%] max-w-sm animate-slideDown select-none">
      <div 
        onClick={handleCopy}
        className="glass-card p-4 border-indigo-500/40 bg-slate-950/95 shadow-2xl flex gap-3 relative cursor-pointer hover:border-indigo-400/60 active:scale-98 transition-all"
      >
        {/* Left Side Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isSms 
            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
        }`}>
          {isSms ? (
            <MessageSquare className="w-5 h-5" />
          ) : (
            <Mail className="w-5 h-5" />
          )}
        </div>

        {/* Middle text */}
        <div className="flex-1 min-w-0 pr-4 space-y-0.5">
          <div className="flex items-center gap-1.5 justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {isSms ? '💬 LEVELUP SMS' : '📧 LEVELUP MAIL'}
            </span>
            <span className="text-[9px] font-bold text-slate-600">now</span>
          </div>
          <div className="text-[10px] font-black text-slate-400 truncate">
            {isSms ? 'From: +1 (800) LEVEL-UP' : 'From: system@levelup.life'}
          </div>
          <div className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
            To: {simulatedMessage.to}
          </div>
          <p className="text-xs font-semibold text-white mt-1 leading-relaxed">
            {simulatedMessage.text}
          </p>
          {otpCode && (
            <div className="mt-2.5 flex items-center justify-between bg-slate-900 border border-rpg-border/30 rounded-lg px-2.5 py-1 text-[10px] font-bold text-indigo-400">
              <span>Code: <span className="font-mono text-xs font-black text-white ml-1">{otpCode}</span></span>
              <span className="text-[9px] uppercase tracking-wider text-indigo-400/80 hover:text-indigo-300">
                {copied ? 'Copied! ✔️' : 'Tap to Copy 📋'}
              </span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSimulatedMessage(null);
          }}
          className="absolute top-3 right-3 p-1 rounded-md bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const ChatNotificationToast: React.FC = () => {
  const { chatNotification, setChatNotification, setScreen, setActiveChatFriendId } = useApp();

  React.useEffect(() => {
    if (chatNotification) {
      const timer = setTimeout(() => {
        setChatNotification(null);
      }, 7000); // Hide after 7 seconds
      return () => clearTimeout(timer);
    }
  }, [chatNotification, setChatNotification]);

  if (!chatNotification) return null;

  const handleToastClick = () => {
    setActiveChatFriendId(chatNotification.friendUid);
    setScreen('messages');
    setChatNotification(null);
  };

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-4 z-[9999] w-[92%] max-w-sm animate-slideDown select-none">
      <div 
        onClick={handleToastClick}
        className="glass-card p-4 border-purple-500/40 bg-slate-950/95 shadow-2xl flex gap-3 relative cursor-pointer hover:border-purple-400/60 active:scale-98 transition-all"
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <MessageSquare className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-4 space-y-0.5">
          <div className="flex items-center gap-1.5 justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              💬 NEW GUILD MESSAGE
            </span>
            <span className="text-[9px] font-bold text-slate-600">now</span>
          </div>
          <div className="text-xs font-black text-white truncate">
            {chatNotification.senderName}
          </div>
          <p className="text-xs font-semibold text-slate-300 mt-1 line-clamp-2 leading-relaxed">
            {chatNotification.text}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setChatNotification(null);
          }}
          className="absolute top-3 right-3 p-1 rounded-md bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const LayoutWrapper: React.FC = () => {
  const { 
    activeScreen, 
    setScreen, 
    user, 
    setShowSavedAccounts, 
    unreadCounts, 
    chatNotification, 
    setChatNotification, 
    setActiveChatFriendId,
    logout
  } = useApp();

  const longPressTimer = React.useRef<any>(null);
  const isLongPressActive = React.useRef<boolean>(false);

  const startLongPress = () => {
    isLongPressActive.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      setShowSavedAccounts(true);
      isLongPressActive.current = true;
      longPressTimer.current = null;
    }, 600);
  };

  const endLongPress = (navigate: () => void) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!isLongPressActive.current) {
      navigate();
    }
    isLongPressActive.current = false;
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSavedAccounts(true);
  };

  const totalUnreads = Object.values(unreadCounts || {}).reduce((a, b) => a + b, 0);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'planner', label: 'Planner', icon: <Calendar className="w-5 h-5" /> },
    { id: 'focus', label: 'Focus', icon: <Timer className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'fitness', label: 'Fitness', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'habits', label: 'Habits', icon: <CheckSquare className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> }
  ];

  const isAuthOrOnboarding = activeScreen === 'auth' || activeScreen === 'onboarding';

  return (
    <div className="flex flex-col h-screen bg-[#070b13] text-slate-200 overflow-hidden">
      {isAuthOrOnboarding ? (
        <div className="flex-1 overflow-y-auto">
          <ScreenRenderer />
        </div>
      ) : (
        <>
          {/* --- TOP HEADER --- */}
          <header className="flex items-center justify-between px-5 py-3 bg-slate-950/80 border-b border-rpg-border/20 backdrop-blur-md flex-shrink-0 z-40">
            <h1 className="text-lg font-black text-white flex items-center gap-2">
              🛡️ LevelUp Life
            </h1>
            <div className="flex items-center gap-2">
              <button
                onMouseDown={startLongPress}
                onMouseUp={() => endLongPress(() => setScreen('profile'))}
                onMouseLeave={cancelLongPress}
                onTouchStart={startLongPress}
                onTouchEnd={() => endLongPress(() => setScreen('profile'))}
                onContextMenu={handleContextMenu}
                className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 select-none"
              >
                <AvatarBuilder config={user.avatar} size={28} showCamera={false} />
              </button>
            </div>
          </header>

          {/* --- BODY: LEFT SIDEBAR + MAIN CONTENT --- */}
          <div className="flex flex-1 overflow-hidden">

            {/* LEFT SIDEBAR */}
            <nav className="w-52 flex-shrink-0 bg-slate-950/80 border-r border-rpg-border/20 backdrop-blur-md flex flex-col py-4 px-3 gap-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = activeScreen === item.id;
                const isMessages = item.id === 'messages';
                return (
                  <button
                    key={item.id}
                    onClick={() => setScreen(item.id)}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 w-full text-left ${
                      active
                        ? 'bg-rpg-level/15 text-rpg-xp border border-rpg-level/30'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rpg-xp rounded-r-full" />
                    )}
                    <span className={`flex-shrink-0 ${active ? 'text-rpg-xp' : 'text-slate-500'}`}>
                      {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
                    </span>
                    <span className="flex-1 truncate">{item.label}</span>
                    {isMessages && totalUnreads > 0 && (
                      <span className="ml-auto min-w-5 h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full shadow flex-shrink-0">
                        {totalUnreads}
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="border-t border-rpg-border/10 my-2" />

              {/* Switch Account */}
              <button
                onClick={() => setShowSavedAccounts(true)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 w-full text-left text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent cursor-pointer"
              >
                <span className="flex-shrink-0 text-slate-500">
                  <Users className="w-5 h-5" />
                </span>
                <span className="flex-1 truncate">Switch Account</span>
              </button>

              {/* Log Out */}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 w-full text-left text-red-400/80 hover:bg-red-950/20 hover:text-red-400 border border-transparent cursor-pointer"
              >
                <span className="flex-shrink-0 text-red-500/80">
                  <LogOut className="w-5 h-5" />
                </span>
                <span className="flex-1 truncate">Log Out</span>
              </button>

              {/* AI Oracle pinned at bottom */}
              <div className="mt-auto pt-4 border-t border-rpg-border/20">
                <button
                  onClick={() => setScreen(activeScreen === 'chat' ? 'dashboard' : 'chat')}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 w-full text-left ${
                    activeScreen === 'chat'
                      ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rpg-level/10 text-rpg-level border border-rpg-level/20 hover:bg-rpg-level/20'
                  }`}
                >
                  <Pencil className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">AI Oracle</span>
                  <span className="text-[9px] font-black uppercase tracking-wider opacity-70 animate-pulse">AI</span>
                </button>
              </div>
            </nav>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto px-6 py-5">
              <ScreenRenderer />
            </main>
          </div>
        </>
      )}

      <SimulatedMessageToast />
      <ChatNotificationToast />
      <SavedAccountsModal />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <LayoutWrapper />
    </AppProvider>
  );
}

export default App;
