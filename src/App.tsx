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
  Timer
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
    setActiveChatFriendId 
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
    <div className="emulator-body">
      <div className="desktop-header">
        <h1>LevelUp Life</h1>
        <p>Your Personal Discipline OS</p>
        <span>Desktop Live Preview</span>
      </div>

      <div className="phone-container">
        <div className="phone-notch"></div>
        <div className="app-canvas bg-[#070b13] text-slate-200">
          
          {isAuthOrOnboarding ? (
            <div className="flex-1 overflow-y-auto">
              <ScreenRenderer />
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              {/* --- MOBILE HEADER --- */}
              <header className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-rpg-border/20 backdrop-blur-md flex-shrink-0 z-40">
                <h1 className="text-lg font-black text-white flex items-center gap-1.5 animate-pulse">
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

              {/* --- MAIN CONTENT AREA --- */}
              <main className="flex-1 p-4 overflow-y-auto pb-24 w-full">
                <ScreenRenderer />
              </main>

              {/* --- MOBILE BOTTOM NAVBAR --- */}
              <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-rpg-border/30 backdrop-blur-lg flex justify-around py-3 px-2 select-none h-16">
                {navItems.slice(0, 5).map((item) => {
                  const active = activeScreen === item.id;
                  const isMessages = item.id === 'messages';
                  return (
                    <button
                      key={item.id}
                      onClick={() => setScreen(item.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] min-[360px]:text-[10px] font-bold transition-all relative py-1 ${
                        active ? 'text-rpg-xp scale-105' : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center relative">
                        {React.cloneElement(item.icon, { className: "w-5.5 h-5.5" })}
                        {isMessages && totalUnreads > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 flex items-center justify-center bg-red-500 text-white text-[8px] font-black rounded-full shadow">
                            {totalUnreads}
                          </span>
                        )}
                      </div>
                      <span className="truncate max-w-[48px] min-[360px]:max-w-[60px] text-center">{item.label}</span>
                    </button>
                  );
                })}
                {/* Settings button */}
                {(() => {
                  const settingsItem = navItems.find(item => item.id === 'settings');
                  if (!settingsItem) return null;
                  const active = activeScreen === 'settings';
                  return (
                    <button
                      key={settingsItem.id}
                      onClick={() => setScreen(settingsItem.id)}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 text-[9px] min-[360px]:text-[10px] font-bold transition-all py-1 ${
                        active ? 'text-rpg-xp scale-105' : 'text-slate-500 hover:text-slate-400'
                      }`}
                    >
                      <div className="w-6 h-6 flex items-center justify-center">
                        {React.cloneElement(settingsItem.icon, { className: "w-5.5 h-5.5" })}
                      </div>
                      <span className="truncate max-w-[48px] min-[360px]:max-w-[60px] text-center">{settingsItem.label}</span>
                    </button>
                  );
                })()}
              </nav>
            </div>
          )}

          {/* Floating Action Button (FAB) for AI Oracle */}
          <div className={`fixed right-6 z-50 flex flex-col items-center gap-1.5 ${
            activeScreen === 'messages' || activeScreen === 'chat'
              ? 'bottom-36'
              : 'bottom-20'
          }`}>
            <span className="text-[9px] font-extrabold text-rpg-level uppercase tracking-widest bg-slate-950/90 px-2.5 py-0.5 rounded-full border border-rpg-level/30 shadow-md backdrop-blur-sm select-none animate-pulse">
              ASK AI
            </span>
            <button
              onClick={() => setScreen(activeScreen === 'chat' ? 'dashboard' : 'chat')}
              className={`w-14 h-14 rounded-full bg-gradient-to-r ${
                activeScreen === 'chat'
                  ? 'from-rpg-discipline to-emerald-600 border-rpg-discipline/30'
                  : 'from-rpg-level to-indigo-600 border-rpg-level/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              } hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center border text-white`}
              title="AI Oracle"
            >
              <Pencil className="w-6 h-6" />
            </button>
          </div>

          <SimulatedMessageToast />
          <ChatNotificationToast />
          <SavedAccountsModal />
        </div>
      </div>
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
