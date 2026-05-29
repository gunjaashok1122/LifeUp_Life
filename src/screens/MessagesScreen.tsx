import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { FriendInfo } from '../context/AppContext';
import { AvatarBuilder } from '../components/AvatarBuilder';
import { Send, Search, UserPlus, MessageSquare, Loader2, AlertCircle, ArrowLeft, Plus, Check, MoreVertical, Trash2, User, X, TrendingUp, Share2, Copy } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, getDoc, where } from 'firebase/firestore';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

interface ParsedSharedPlan {
  title: string;
  targetDate: string;
  routines: { title: string; startTime: string; endTime: string }[];
}

const parseSharedPlan = (text: string): ParsedSharedPlan | null => {
  if (!text.startsWith('📋') || !text.includes('Shared by:')) return null;

  try {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let title = '';
    const titleLine = lines.find(l => l.startsWith('*') && l.endsWith('*'));
    if (titleLine) {
      title = titleLine.substring(1, titleLine.length - 1);
    } else {
      title = 'Shared Plan';
    }

    let targetDate = '';
    const periodLine = lines.find(l => l.includes('Period:'));
    if (periodLine) {
      targetDate = periodLine.split('Period:')[1].trim();
    } else {
      targetDate = 'Custom Period';
    }

    const routines: { title: string; startTime: string; endTime: string }[] = [];
    lines.forEach(line => {
      if (line.startsWith('•')) {
        const content = line.substring(1).trim();
        const match = content.match(/^(.*?)\s*\((.*?)\s*-\s*(.*?)\)$/);
        if (match) {
          routines.push({
            title: match[1].trim(),
            startTime: match[2].trim(),
            endTime: match[3].trim()
          });
        }
      }
    });

    return { title, targetDate, routines };
  } catch (e) {
    console.error("Error parsing shared plan:", e);
    return null;
  }
};

// --- Friend Profile Modal ---
interface FriendProfileModalProps {
  friend: FriendInfo;
  onClose: () => void;
}

const FriendProfileModal: React.FC<FriendProfileModalProps> = ({ friend, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ habitCount: 0, disciplineScore: 0, streak: 0, level: 1 });
  const [profileInfo, setProfileInfo] = useState<FriendInfo>(friend);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'users', friend.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.user) {
            setProfileInfo({
              uid: friend.uid,
              name: data.user.name || friend.name,
              username: data.user.username || friend.username,
              avatar: data.user.avatar || friend.avatar,
              profilePicture: data.user.profilePicture || ''
            });
            setStats({
              habitCount: (data.habits || []).length,
              disciplineScore: data.user.disciplineScore || 0,
              streak: data.user.streak || 0,
              level: data.user.level || 1
            });
          }
        }
      } catch (e) {
        console.error('Error fetching friend profile data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [friend.uid]);

  // Share handler
  const handleShare = async () => {
    const shareText =
      `🛡️ Meet ${profileInfo.name} (@${profileInfo.username}) on LevelUp Life!\n` +
      `📊 Level ${stats.level} • ${stats.streak}🔥 day streak • ${stats.habitCount} habits • ${stats.disciplineScore}% discipline\n` +
      `Join them on the LevelUp Life app and level up together!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${profileInfo.name}'s Profile`, text: shareText });
        setShareStatus('shared');
      } catch {
        // user cancelled — do nothing
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('copied');
      } catch {
        window.prompt('Copy this profile text:', shareText);
      }
    }
    setTimeout(() => setShareStatus('idle'), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-slate-900 border border-rpg-border/50 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 space-y-4">
          {/* Avatar + Identity */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="ring-2 ring-indigo-500/40 ring-offset-2 ring-offset-slate-900 rounded-full">
              <AvatarBuilder
                config={profileInfo.avatar}
                profilePicture={profileInfo.profilePicture}
                size={72}
                showCamera={false}
              />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">{profileInfo.name}</h3>
              <p className="text-xs font-semibold text-indigo-400">@{profileInfo.username}</p>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-slate-800/60 border border-rpg-border/30">
                <span className="text-sm font-black text-rpg-gold">Lv.{stats.level}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Level</span>
              </div>
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-slate-800/60 border border-rpg-border/30">
                <span className="text-sm font-black text-orange-400">{stats.streak}🔥</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Streak</span>
              </div>
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-slate-800/60 border border-rpg-border/30">
                <span className="text-sm font-black text-emerald-400">{stats.habitCount}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Habits</span>
              </div>
              <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-slate-800/60 border border-rpg-border/30">
                <span className="text-sm font-black text-indigo-400">{stats.disciplineScore}%</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">Disc.</span>
              </div>
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              shareStatus !== 'idle'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 active:scale-95'
            }`}
          >
            {shareStatus === 'copied' ? (
              <><Copy className="w-4 h-4" /> Copied to clipboard!</>
            ) : shareStatus === 'shared' ? (
              <><Check className="w-4 h-4" /> Shared!</>
            ) : (
              <><Share2 className="w-4 h-4" /> Share Profile</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MessagesScreen: React.FC = () => {
  const {
    user,
    firebaseUser,
    addFriendByUsername,
    setScreen,
    previousScreen,
    addLongTermPlan,
    unreadCounts,
    markChatAsRead,
    activeChatFriendId,
    setActiveChatFriendId
  } = useApp();

  const friendsList = useMemo(() => user.friends || [], [user.friends]);
  const friendsListKey = useMemo(() => friendsList.map(f => f.uid).join(','), [friendsList]);

  // Single source of truth: derive selected friend from activeChatFriendId
  const selectedFriend = useMemo<FriendInfo | null>(() => {
    if (!activeChatFriendId) return null;
    return friendsList.find(f => f.uid === activeChatFriendId) || null;
  }, [activeChatFriendId, friendsList]);

  const [friendProfile, setFriendProfile] = useState<FriendInfo | null>(null);
  const [friendsProfiles, setFriendsProfiles] = useState<Record<string, FriendInfo>>({});
  const [importedMessageIds, setImportedMessageIds] = useState<string[]>([]);
  const [friendUsername, setFriendUsername] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchSuccess, setSearchSuccess] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [searchResults, setSearchResults] = useState<FriendInfo[]>([]);
  const [searching, setSearching] = useState(false);

  // Real-time user search in Firestore
  useEffect(() => {
    const searchQ = friendUsername.trim().toLowerCase();
    if (!searchQ) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setSearching(true);
    setSearchError('');

    const delayDebounce = setTimeout(async () => {
      try {
        const usersRef = collection(db, 'users');
        let q;
        if (searchQ.length >= 2) {
          q = query(
            usersRef,
            where('user.username', '>=', searchQ),
            where('user.username', '<=', searchQ + '\uf8ff')
          );
        } else {
          q = query(
            usersRef,
            where('user.username', '==', searchQ)
          );
        }

        const querySnapshot = await getDocs(q);
        const results: FriendInfo[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== firebaseUser?.uid && data.user) {
            results.push({
              uid: doc.id,
              name: data.user.name || 'Hero',
              username: data.user.username || '',
              avatar: data.user.avatar,
              profilePicture: data.user.profilePicture || ''
            });
          }
        });

        // Search by legacy name if no username matches
        if (results.length === 0) {
          const qName = query(
            usersRef,
            where('user.name', '==', friendUsername.trim())
          );
          const nameSnapshot = await getDocs(qName);
          nameSnapshot.forEach((doc) => {
            const data = doc.data();
            if (doc.id !== firebaseUser?.uid && data.user && !results.some(r => r.uid === doc.id)) {
              results.push({
                uid: doc.id,
                name: data.user.name || 'Hero',
                username: data.user.username || '',
                avatar: data.user.avatar,
                profilePicture: data.user.profilePicture || ''
              });
            }
          });
        }

        setSearchResults(results);
        if (results.length === 0) {
          setSearchError('No matching heroes found.');
        }
      } catch (err) {
        console.error('Search error:', err);
        setSearchError('Failed to search users.');
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [friendUsername, firebaseUser]);

  // Sync mobile view status with active friend selection
  useEffect(() => {
    if (activeChatFriendId) {
      setMobileShowChat(true);
    } else {
      setMobileShowChat(false);
    }
  }, [activeChatFriendId]);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Handle clear chat
  const handleClearChat = async () => {
    if (!selectedFriend || !firebaseUser) return;
    const confirmed = window.confirm(`Clear all messages with ${selectedFriend.name}? This cannot be undone.`);
    if (!confirmed) return;
    setClearingChat(true);
    setMenuOpen(false);
    try {
      const myUid = firebaseUser.uid;
      const friendUid = selectedFriend.uid;
      const roomId = [myUid, friendUid].sort().join('_');
      const messagesRef = collection(db, 'chats', roomId, 'messages');
      const snapshot = await getDocs(messagesRef);
      await Promise.all(snapshot.docs.map(d => deleteDoc(d.ref)));
      setMessages([]);
    } catch (err) {
      console.error('Error clearing chat:', err);
    } finally {
      setClearingChat(false);
    }
  };

  // Handle selecting a friend — single click handler, no circular effects
  const handleSelectFriend = (friend: FriendInfo) => {
    setActiveChatFriendId(friend.uid);
    markChatAsRead(friend.uid);
  };

  // Real-time listener for all friends' profiles
  useEffect(() => {
    if (friendsList.length === 0) {
      setFriendsProfiles({});
      return;
    }

    const unsubscribes = friendsList.map(friend => {
      const docRef = doc(db, 'users', friend.uid);
      return onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.user) {
              setFriendsProfiles(prev => ({
                ...prev,
                [friend.uid]: {
                  uid: friend.uid,
                  name: data.user.name || friend.name,
                  username: data.user.username || friend.username,
                  avatar: data.user.avatar || friend.avatar,
                  profilePicture: data.user.profilePicture || ''
                }
              }));
            }
          }
        },
        (error) => {
          console.error(`Error listening to friend ${friend.uid} profile:`, error);
        }
      );
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendsListKey]);

  // Real-time friend profile listener for the active chat
  useEffect(() => {
    if (!selectedFriend) {
      setFriendProfile(null);
      return;
    }

    const docRef = doc(db, 'users', selectedFriend.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.user) {
            setFriendProfile({
              uid: selectedFriend.uid,
              name: data.user.name || selectedFriend.name,
              username: data.user.username || selectedFriend.username,
              avatar: data.user.avatar || selectedFriend.avatar,
              profilePicture: data.user.profilePicture || ''
            });
          }
        }
      },
      (error) => {
        console.error('Error fetching friend profile:', error);
      }
    );

    return () => unsubscribe();
  }, [selectedFriend?.uid]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
      const handle = requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
      return () => cancelAnimationFrame(handle);
    }
  }, [messages]);

  // Real-time messages listener
  useEffect(() => {
    if (!selectedFriend || !firebaseUser) {
      setMessages([]);
      return;
    }

    const myUid = firebaseUser.uid;
    const friendUid = selectedFriend.uid;
    const roomId = [myUid, friendUid].sort().join('_');

    const messagesRef = collection(db, 'chats', roomId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          timestamp: data.timestamp || Date.now()
        };
      });
      setMessages(fetchedMessages);
    }, (error) => {
      console.error('Error fetching real-time messages:', error);
    });

    return () => unsubscribe();
  }, [selectedFriend?.uid, firebaseUser]);

  // Handle importing a shared plan
  const handleImportPlan = (messageId: string, planText: string) => {
    const parsed = parseSharedPlan(planText);
    if (!parsed) return;

    let fromDate = '';
    let toDate = '';
    const isWeek = parsed.targetDate.includes('-') || parsed.targetDate.toLowerCase().includes('week');
    const type: 'week' | 'month' = isWeek ? 'week' : 'month';

    if (type === 'week') {
      try {
        const parts = parsed.targetDate.split(',');
        if (parts.length === 2) {
          const yearStr = parts[1].trim();
          const rangeStr = parts[0].trim();
          const rangeParts = rangeStr.split('-');
          if (rangeParts.length === 2) {
            const fromPart = rangeParts[0].trim();
            const toPart = rangeParts[1].trim();
            const fDate = new Date(`${fromPart}, ${yearStr}`);
            const tDate = new Date(`${toPart}, ${yearStr}`);
            if (!isNaN(fDate.getTime()) && !isNaN(tDate.getTime())) {
              fromDate = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}-${String(fDate.getDate()).padStart(2, '0')}`;
              toDate = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse dates during import:", e);
      }
    } else {
      try {
        const parts = parsed.targetDate.split(' ');
        if (parts.length === 2) {
          const monthName = parts[0].trim();
          const yearStr = parts[1].trim();
          const monthIdx = new Date(`${monthName} 1, ${yearStr}`).getMonth();
          if (!isNaN(monthIdx)) {
            const year = parseInt(yearStr);
            fromDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, monthIdx + 1, 0).getDate();
            toDate = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          }
        }
      } catch (e) {
        console.error("Failed to parse month dates during import:", e);
      }
    }

    const planRoutines = parsed.routines.map(r => ({
      id: Math.random().toString(36).substr(2, 9),
      title: r.title,
      startTime: r.startTime,
      endTime: r.endTime,
      startDate: fromDate || new Date().toISOString().split('T')[0],
      endDate: toDate || new Date().toISOString().split('T')[0]
    }));

    const newPlan = {
      title: parsed.title,
      type,
      targetDate: parsed.targetDate,
      status: 'pending' as const,
      routines: planRoutines,
      fromDate,
      toDate,
      completions: {}
    };

    addLongTermPlan(newPlan);
    setImportedMessageIds(prev => [...prev, messageId]);
    alert(`Plan "${parsed.title}" successfully added to your Planner list!`);
  };

  // Handle adding friend
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = friendUsername.trim();
    if (!target) return;

    setSearchLoading(true);
    setSearchError('');
    setSearchSuccess('');

    try {
      await addFriendByUsername(target);
      setSearchSuccess(`Hero @${target} added to your guild!`);
      setFriendUsername('');
    } catch (err: any) {
      setSearchError(err.message || 'Could not add friend.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleQuickAddFriend = async (targetUsername: string) => {
    setSearchLoading(true);
    setSearchError('');
    setSearchSuccess('');
    try {
      await addFriendByUsername(targetUsername);
      setSearchSuccess(`Hero @${targetUsername} added to your guild!`);
    } catch (err: any) {
      setSearchError(err.message || 'Could not add friend.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle sending message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedFriend || !firebaseUser) return;

    const myUid = firebaseUser.uid;
    const friendUid = selectedFriend.uid;
    const roomId = [myUid, friendUid].sort().join('_');

    const textToSend = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, 'chats', roomId, 'messages'), {
        senderId: myUid,
        senderName: user.name,
        text: textToSend,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Friend Profile Modal */}
      {showProfileModal && selectedFriend && (
        <FriendProfileModal
          friend={friendProfile || selectedFriend}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Header Back & Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            if (previousScreen === 'auth' || previousScreen === 'onboarding') {
              setScreen('dashboard');
            } else {
              setScreen(previousScreen || 'dashboard');
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-rpg-border/40 text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <span>👋 Welcome,</span>
          <span className="text-rpg-gold font-extrabold">{user.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">

        {/* --- LEFT PANEL: FRIENDS LIST & SEARCH --- */}
        <div className={`glass-card p-4 md:col-span-1 flex flex-col h-full overflow-hidden ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>

          {/* Section Header */}
          <div className="pb-3 border-b border-rpg-border/30">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              🛡️ Guild Members
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Add and chat with fellow heroes</p>
          </div>

          {/* Add Friend Form */}
          <form onSubmit={handleAddFriend} className="my-3 space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search username (e.g. hero)"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-slate-950 border border-rpg-border/60 rounded-xl text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-level transition-all"
              />
              <Search className="absolute left-3 w-4 h-4 text-slate-600" />
              {friendUsername.trim() !== '' ? (
                <button
                  type="button"
                  onClick={() => {
                    setFriendUsername('');
                    setSearchSuccess('');
                    setSearchError('');
                  }}
                  className="absolute right-3 p-1 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={searchLoading || !friendUsername.trim()}
                  className="absolute right-2 p-1.5 rounded-lg bg-rpg-level/10 hover:bg-rpg-level hover:text-white border border-rpg-level/20 text-rpg-level transition-all disabled:opacity-50"
                  title="Add direct friend"
                >
                  {searchLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>

            {/* Feedback messages */}
            {searchError && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rpg-health px-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
            {searchSuccess && (
              <div className="text-[10px] font-bold text-rpg-discipline px-1">
                ✨ {searchSuccess}
              </div>
            )}
          </form>

          {/* Friends List Container */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
            {friendUsername.trim() !== '' ? (
              // Search Results
              searching ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-500 text-xs font-bold">
                  <Loader2 className="w-5 h-5 animate-spin text-rpg-level" />
                  <span>Searching the guild registry...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-semibold border border-dashed border-rpg-border/30 rounded-xl px-2">
                  🔍 No heroes found matching "{friendUsername}"
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
                    Search Results ({searchResults.length})
                  </div>
                  {searchResults.map((result) => {
                    const isFriend = friendsList.some(f => f.uid === result.uid);
                    const active = activeChatFriendId === result.uid;
                    return (
                      <div
                        key={result.uid}
                        onClick={() => {
                          if (isFriend) {
                            handleSelectFriend(result);
                          }
                        }}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                          active
                            ? 'bg-gradient-to-r from-rpg-level/15 to-indigo-950/20 border-rpg-level/50 shadow'
                            : 'bg-slate-950/40 border-rpg-border/30 hover:border-rpg-border/70 hover:bg-slate-950/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          <AvatarBuilder config={result.avatar} profilePicture={result.profilePicture} size={32} showCamera={false} />
                          <div className="truncate flex-1">
                            <div className="text-xs font-bold text-white truncate">{result.name}</div>
                            <div className="text-[10px] font-semibold text-slate-500">@{result.username}</div>
                          </div>
                        </div>
                        
                        {isFriend ? (
                          <span className="text-[9px] font-black text-slate-400 bg-slate-900 border border-rpg-border/30 px-2 py-0.5 rounded-lg select-none">
                            Guild Joined
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickAddFriend(result.username);
                            }}
                            className="px-2.5 py-1 text-[10px] font-bold bg-rpg-level/10 hover:bg-rpg-level text-rpg-level hover:text-white border border-rpg-level/30 rounded-lg transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Standard Friends List
              friendsList.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-xs font-semibold border border-dashed border-rpg-border/40 rounded-xl px-2">
                  🤝 Your guild list is empty. Add a friend using their username above!
                </div>
              ) : (
                friendsList.map((friend) => {
                  const active = activeChatFriendId === friend.uid;
                  const currentFriend = friendsProfiles[friend.uid] || friend;
                  const count = unreadCounts[friend.uid] || 0;
                  return (
                    <div
                      key={friend.uid}
                      onClick={() => handleSelectFriend(friend)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer select-none transition-all ${
                        active
                          ? 'bg-gradient-to-r from-rpg-level/15 to-indigo-950/20 border-rpg-level/50 shadow'
                          : 'bg-slate-950/40 border-rpg-border/30 hover:border-rpg-border/70 hover:bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate flex-1">
                        <AvatarBuilder config={currentFriend.avatar} profilePicture={currentFriend.profilePicture} size={32} showCamera={false} />
                        <div className="truncate flex-1">
                          <div className="text-xs font-bold text-white truncate">{currentFriend.name}</div>
                          <div className="text-[10px] font-semibold text-slate-500">@{currentFriend.username}</div>
                        </div>
                      </div>
                      {count > 0 && (
                        <span className="flex-shrink-0 min-w-5 h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full shadow animate-pulse">
                          {count}
                        </span>
                      )}
                    </div>
                  );
                })
              )
            )}
          </div>

        </div>

        {/* --- RIGHT PANEL: CHAT WINDOW --- */}
        <div className={`glass-card md:col-span-2 flex flex-col h-full overflow-hidden relative ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>

          {selectedFriend ? (
            <>
              {/* Chat Room Header */}
              <div className="p-4 border-b border-rpg-border/30 bg-slate-950/40 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setMobileShowChat(false);
                      setActiveChatFriendId(null);
                    }}
                    className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer mr-1"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <AvatarBuilder config={(friendProfile || selectedFriend).avatar} profilePicture={(friendProfile || selectedFriend).profilePicture} size={36} showCamera={false} />
                  <div>
                    <h4 className="text-sm font-bold text-white">{(friendProfile || selectedFriend).name}</h4>
                    <div className="text-[9px] font-bold text-slate-500">@{(friendProfile || selectedFriend).username}</div>
                  </div>
                </div>
                {/* 3-dot menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(prev => !prev)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
                  title="More options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-rpg-border/50 rounded-xl shadow-xl shadow-black/40 z-50 overflow-hidden animate-in">
                    <button
                      onClick={() => { setMenuOpen(false); setShowProfileModal(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                    >
                      <User className="w-4 h-4 text-rpg-level" />
                      User Profile
                    </button>
                    <div className="h-px bg-rpg-border/30 mx-3" />
                    <button
                      onClick={handleClearChat}
                      disabled={clearingChat}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {clearingChat ? 'Clearing…' : 'Clear Chat'}
                    </button>
                  </div>
                )}
              </div>
              </div>

              {/* Chat Messages Feed */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 no-scrollbar bg-slate-950/10">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs font-medium gap-1.5">
                    <MessageSquare className="w-8 h-8 text-slate-700 animate-pulse" />
                    <span>Send a message to break the silence!</span>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = firebaseUser && m.senderId === firebaseUser.uid;
                    const sharedPlan = parseSharedPlan(m.text);
                    return (
                      <div
                        key={m.id}
                        className={`flex items-start gap-2.5 max-w-[80%] ${
                          isMe ? 'ml-auto flex-row-reverse' : ''
                        }`}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <AvatarBuilder
                            config={isMe ? user.avatar : (friendProfile || selectedFriend).avatar}
                            profilePicture={isMe ? user.profilePicture : (friendProfile || selectedFriend).profilePicture}
                            size={24}
                            showCamera={false}
                          />
                        </div>

                        {/* Bubble */}
                        <div className="flex flex-col space-y-0.5">
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed font-sans font-medium whitespace-pre-wrap ${
                              isMe
                                ? 'bg-gradient-to-br from-rpg-level to-indigo-600 text-white rounded-tr-sm shadow-md'
                                : 'bg-slate-900 border border-rpg-border/40 text-slate-200 rounded-tl-sm'
                            }`}
                          >
                            {m.text}
                            {sharedPlan && (
                              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-4">
                                <span className="text-[10px] text-slate-400 font-semibold italic">
                                  Track this shared plan?
                                </span>
                                {importedMessageIds.includes(m.id) ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-[10px] flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Imported
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleImportPlan(m.id, m.text)}
                                    className="px-2.5 py-1 rounded-lg bg-rpg-gold hover:bg-yellow-500 text-slate-950 font-black text-[10px] flex items-center gap-1 active:scale-95 transition-all cursor-pointer shadow"
                                    title="Add to my Planner"
                                  >
                                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add to My Plan
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <span className={`text-[8px] font-bold text-slate-600 px-1 ${isMe ? 'text-right' : ''}`}>
                            {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Send Message Panel */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-rpg-border/30 bg-slate-950/60 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Write message to ${selectedFriend.name}...`}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-level transition-all"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-rpg-level to-indigo-600 text-white font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-rpg-level/10 disabled:opacity-40"
                >
                  <Send className="w-4 h-4 fill-current" />
                </button>
              </form>
            </>
          ) : (
            /* Placeholder View */
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-950/60 border border-rpg-border/40 flex items-center justify-center text-slate-600">
                <MessageSquare className="w-8 h-8 text-rpg-level" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h4 className="text-sm font-bold text-white">Select a chat partner</h4>
                <p className="text-xs text-slate-500 font-medium">
                  Tap on any friend from your Guild Members list on the left to start a real-time message stream.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
