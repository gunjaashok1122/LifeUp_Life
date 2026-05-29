import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { DailyRoutine, LongTermPlan, FriendInfo } from '../context/AppContext';
import { 
  ArrowLeft, 
  CalendarDays, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  CalendarRange,
  Info,
  Pencil,
  Share2
} from 'lucide-react';
import { AvatarBuilder } from '../components/AvatarBuilder';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

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

const getLastDayOfMonth = (monthStr: string) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
};

const parseTargetDate = (plan: any) => {
  let parsedFrom = plan.fromDate || '';
  let parsedTo = plan.toDate || '';
  let parsedMonth = plan.targetMonth || '';
  let parsedToMonth = plan.toMonth || '';
  let parsedWeeks = plan.weeksCount || 1;
  let parsedMonthsCount = plan.monthsCount || 1;

  if (plan.type === 'week') {
    if (!parsedFrom && plan.targetDate) {
      try {
        const parts = plan.targetDate.split(',');
        if (parts.length === 2) {
          const yearStr = parts[1].trim(); // "2026"
          const rangeStr = parts[0].trim(); // "May 26 - Jun 1"
          const rangeParts = rangeStr.split('-');
          if (rangeParts.length === 2) {
            const fromPart = rangeParts[0].trim();
            const toPart = rangeParts[1].trim();
            
            const fDate = new Date(`${fromPart}, ${yearStr}`);
            const tDate = new Date(`${toPart}, ${yearStr}`);
            
            if (!isNaN(fDate.getTime()) && !isNaN(tDate.getTime())) {
              const fy = fDate.getFullYear();
              const fm = String(fDate.getMonth() + 1).padStart(2, '0');
              const fd = String(fDate.getDate()).padStart(2, '0');
              parsedFrom = `${fy}-${fm}-${fd}`;
              
              const ty = tDate.getFullYear();
              const tm = String(tDate.getMonth() + 1).padStart(2, '0');
              const td = String(tDate.getDate()).padStart(2, '0');
              parsedTo = `${ty}-${tm}-${td}`;
              
              const diffTime = Math.abs(tDate.getTime() - fDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              parsedWeeks = Math.round(diffDays / 7) || 1;
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse weekly targetDate:", e);
      }
    }
  } else {
    if (!parsedMonth && plan.targetMonth) {
      parsedMonth = plan.targetMonth;
    }
    if (!parsedToMonth) {
      if (plan.toMonth) {
        parsedToMonth = plan.toMonth;
      } else if (parsedMonth) {
        parsedToMonth = parsedMonth;
      }
    }
    if (plan.monthsCount) {
      parsedMonthsCount = plan.monthsCount;
    } else {
      parsedMonthsCount = 1;
    }

    if (!parsedFrom && parsedMonth) {
      parsedFrom = `${parsedMonth}-01`;
    }
    if (!parsedTo && parsedToMonth) {
      parsedTo = getLastDayOfMonth(parsedToMonth);
    }
  }

  return { parsedFrom, parsedTo, parsedMonth, parsedToMonth, parsedWeeks, parsedMonthsCount };
};

export const Planner: React.FC = () => {
  const { 
    longTermPlans, 
    addLongTermPlan, 
    updateLongTermPlanStatus, 
    deleteLongTermPlan, 
    updateLongTermPlan, 
    setScreen, 
    user, 
    previousScreen,
    trackingPlanId,
    setTrackingPlanId,
    firebaseUser
  } = useApp();
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');
  const [showAddForm, setShowAddForm] = useState(false);

  // Sharing states
  const [selectedSharePlan, setSelectedSharePlan] = useState<LongTermPlan | null>(null);
  const [sharingToId, setSharingToId] = useState<string | null>(null);
  const [sharedFriendIds, setSharedFriendIds] = useState<string[]>([]);

  const handleSharePlan = async (friend: FriendInfo) => {
    if (!firebaseUser) {
      alert("You must log in to share plans with friends.");
      return;
    }
    if (!selectedSharePlan) return;

    setSharingToId(friend.uid);

    try {
      const myUid = firebaseUser.uid;
      const friendUid = friend.uid;
      const roomId = [myUid, friendUid].sort().join('_');

      const routinesText = selectedSharePlan.routines && selectedSharePlan.routines.length > 0
        ? `\nRoutines:\n` + selectedSharePlan.routines.map(r => `• ${r.title} (${r.startTime} - ${r.endTime})`).join('\n')
        : '';

      const senderInfo = user.username ? `Shared by: ${user.name} (@${user.username})` : `Shared by: ${user.name}`;
      const shareMessage = `📋 ${senderInfo}\n\n*${selectedSharePlan.title}*\n📅 Period: ${selectedSharePlan.targetDate}${routinesText}`;

      await addDoc(collection(db, 'chats', roomId, 'messages'), {
        senderId: myUid,
        senderName: user.name,
        text: shareMessage,
        timestamp: Date.now()
      });

      setSharedFriendIds(prev => [...prev, friend.uid]);
    } catch (error) {
      console.error("Error sharing plan:", error);
      alert("Failed to share plan. Please try again.");
    } finally {
      setSharingToId(null);
    }
  };

  const closeShareModal = () => {
    setSelectedSharePlan(null);
    setSharedFriendIds([]);
  };

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'week' | 'month'>('week');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [weeksCount, setWeeksCount] = useState(1);
  const [monthsCount, setMonthsCount] = useState(1);
  const [routines, setRoutines] = useState<DailyRoutine[]>([]);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  React.useEffect(() => {
    if (trackingPlanId) {
      const plan = longTermPlans.find(p => p.id === trackingPlanId);
      if (plan) {
        setActiveTab(plan.type);
      }
    }
  }, [trackingPlanId, longTermPlans]);
  const trackingPlanRaw = longTermPlans.find(p => p.id === trackingPlanId) || null;
  const trackingPlan = (() => {
    if (!trackingPlanRaw) return null;
    let fromDate = trackingPlanRaw.fromDate;
    let toDate = trackingPlanRaw.toDate;
    if (!fromDate || !toDate) {
      const parsed = parseTargetDate(trackingPlanRaw);
      fromDate = parsed.parsedFrom;
      toDate = parsed.parsedTo;
    }
    return {
      ...trackingPlanRaw,
      fromDate,
      toDate
    };
  })();
  const [showPerformanceChart, setShowPerformanceChart] = useState(false);

  const toggleRoutineCompletion = (plan: LongTermPlan, dateStr: string, routineId: string) => {
    const key = `${dateStr}_${routineId}`;
    const completions = { ...(plan.completions || {}) };
    if (completions[key]) {
      delete completions[key];
    } else {
      completions[key] = true;
    }

    updateLongTermPlan({
      ...plan,
      completions
    });
  };



  const startEdit = (plan: any) => {
    const { parsedFrom, parsedTo, parsedWeeks, parsedMonthsCount } = parseTargetDate(plan);
    setEditingPlan(plan);
    setTitle(plan.title);
    setType(plan.type);
    setFromDate(parsedFrom);
    setToDate(parsedTo);
    setWeeksCount(parsedWeeks);
    setMonthsCount(parsedMonthsCount);
    setRoutines(plan.routines || []);
    setShowAddForm(true);
  };

  const addRoutineRow = () => {
    const defaultStart = fromDate;
    const defaultEnd = toDate;
    
    let initialStart = '05:00';
    let initialEnd = '05:00';
    
    if (routines.length > 0) {
      const lastRoutine = routines[routines.length - 1];
      if (lastRoutine.endTime) {
        initialStart = lastRoutine.endTime;
        initialEnd = lastRoutine.endTime;
      }
    }
    
    setRoutines(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: '',
        startTime: initialStart,
        endTime: initialEnd,
        startDate: defaultStart,
        endDate: defaultEnd
      }
    ]);
  };

  const updateRoutineField = (idx: number, field: keyof DailyRoutine, value: string) => {
    setRoutines(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRoutineRow = (idx: number) => {
    setRoutines(prev => prev.filter((_, i) => i !== idx));
  };

  const togglePlanExpanded = (id: string) => {
    setExpandedPlanIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Date format helpers


  const formatDateRange = (fromStr: string, toStr: string) => {
    if (!fromStr || !toStr) return '';
    const fDate = new Date(fromStr);
    const tDate = new Date(toStr);
    
    const optMonthDay: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const optYear: Intl.DateTimeFormatOptions = { year: 'numeric' };
    
    const fromFormatted = fDate.toLocaleDateString('en-US', optMonthDay);
    const toFormatted = tDate.toLocaleDateString('en-US', optMonthDay);
    const yearFormatted = tDate.toLocaleDateString('en-US', optYear);
    
    return `${fromFormatted} - ${toFormatted}, ${yearFormatted}`;
  };

  const updateToDate = (fromVal: string, weeksVal: number) => {
    if (!fromVal) return;
    const date = new Date(fromVal);
    date.setDate(date.getDate() + (weeksVal * 7) - 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const computedTo = `${yyyy}-${mm}-${dd}`;
    setToDate(computedTo);

    // Sync routine defaults if dates match primary values
    setRoutines(prev => prev.map(r => ({
      ...r,
      startDate: r.startDate === fromDate || !r.startDate ? fromVal : r.startDate,
      endDate: r.endDate === toDate || !r.endDate ? computedTo : r.endDate
    })));
  };

  const updateToMonth = (fromVal: string, monthsVal: number) => {
    if (!fromVal) return;
    const date = new Date(fromVal);
    const startDay = date.getDate();
    date.setMonth(date.getMonth() + monthsVal);
    if (date.getDate() !== startDay) {
      date.setDate(0);
    } else {
      date.setDate(date.getDate() - 1);
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const computedTo = `${yyyy}-${mm}-${dd}`;
    setToDate(computedTo);

    // Sync routine defaults if dates match primary values
    setRoutines(prev => prev.map(r => {
      const isStartMatch = !r.startDate || r.startDate === fromDate;
      const isEndMatch = !r.endDate || r.endDate === toDate;
      return {
        ...r,
        startDate: isStartMatch ? fromVal : r.startDate,
        endDate: isEndMatch ? computedTo : r.endDate
      };
    }));
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!fromDate || !toDate) return;

    const dateLabel = formatDateRange(fromDate, toDate);

    const planData = {
      title,
      type,
      targetDate: dateLabel,
      routines: routines.map(r => ({
        ...r,
        id: r.id || Math.random().toString(36).substr(2, 9)
      })),
      fromDate,
      toDate,
      targetMonth: type === 'month' ? fromDate.substring(0, 7) : undefined,
      toMonth: type === 'month' ? toDate.substring(0, 7) : undefined,
      weeksCount: type === 'week' ? weeksCount : undefined,
      monthsCount: type === 'month' ? monthsCount : undefined
    };

    if (editingPlan) {
      updateLongTermPlan({
        ...editingPlan,
        ...planData
      });
    } else {
      addLongTermPlan({
        ...planData,
        status: 'pending'
      });
    }

    // Reset Form
    setTitle('');
    setFromDate('');
    setToDate('');
    setWeeksCount(1);
    setMonthsCount(1);
    setRoutines([]);
    setEditingPlan(null);
    setShowAddForm(false);
  };

  const showDatePicker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLInputElement) {
      return;
    }
    const input = e.currentTarget.querySelector('input');
    if (input && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch (err) {
        console.error("Failed to show date picker:", err);
      }
    }
  };

  // Filter plans based on active tab
  const filteredPlans = longTermPlans.filter(p => p.type === activeTab);

  // Stats
  const totalCount = filteredPlans.length;
  const doneCount = filteredPlans.filter(p => p.status === 'done').length;
  const failedCount = filteredPlans.filter(p => p.status === 'failed').length;
  const pendingCount = filteredPlans.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      
      {/* Header Back & Action Buttons */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => {
            if (showAddForm) {
              // Close the form and return to the main slots view
              setShowAddForm(false);
              setEditingPlan(null);
              setTitle('');
              setFromDate('');
              setToDate('');
              setWeeksCount(1);
              setMonthsCount(1);
              setRoutines([]);
            } else {
              // Go to previous screen
              if (previousScreen === 'auth' || previousScreen === 'onboarding') {
                setScreen('dashboard');
              } else {
                setScreen(previousScreen);
              }
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

      {/* Screen Title */}
      <div className="glass-card p-5 relative overflow-hidden bg-gradient-to-r from-rpg-xp/10 to-indigo-950/10">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rpg-xp/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rpg-xp to-indigo-600 text-white shadow shadow-rpg-xp/30">
            <CalendarRange className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white font-sans tracking-tight">Long-Term Planning</h2>
            <p className="text-[10px] font-bold text-rpg-xp uppercase tracking-widest mt-0.5">
              Weekly & Monthly Discipline Quests
            </p>
          </div>
        </div>
      </div>

      {/* Add Plan Form Modal/Box */}
      {showAddForm && (
        <div className="glass-card p-5 border-rpg-xp/40 space-y-4 max-w-4xl mx-auto">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rpg-gold" /> Planning Plan
          </h3>

          <form onSubmit={handleCreatePlan} className="space-y-4 text-xs font-semibold text-slate-400">
            
            {/* Title */}
            <div>
              <label className="block uppercase tracking-wider mb-1.5">Plan Objective / Routine</label>
              <input
                type="text"
                required
                placeholder="e.g. Read 4 chapters of biology / Complete project blueprint"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 font-medium focus:outline-none focus:border-rpg-xp transition-all"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Context Label & Target Period Grid */}
            <div className="space-y-4">
              <div>
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                  type === 'week' ? 'bg-rpg-xp/10 text-rpg-xp border border-rpg-xp/30' : 'bg-rpg-level/10 text-rpg-level border border-rpg-level/30'
                }`}>
                  ⚙️ {type === 'week' ? 'Weekly' : 'Monthly'} objective config
                </span>
              </div>

              {type === 'week' ? (
                <div className="space-y-4">
                  {/* How Many Weeks */}
                  <div>
                    <label className="block uppercase tracking-wider mb-1.5">How many weeks?</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white focus:outline-none focus:border-rpg-xp transition-all font-semibold"
                      value={weeksCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setWeeksCount(val);
                        updateToDate(fromDate, val);
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                        <option key={w} value={w}>{w} {w === 1 ? 'Week' : 'Weeks'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dates Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        From Date
                      </label>
                      <div className="relative cursor-pointer" onClick={showDatePicker}>
                        <CalendarDays className="absolute left-3.5 top-3 w-4 h-4 text-rpg-xp cursor-pointer z-10 hover:text-white transition-colors" />
                        <input
                          type="date"
                          required
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white focus:outline-none focus:border-rpg-xp transition-all cursor-pointer font-semibold"
                          value={fromDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFromDate(val);
                            updateToDate(val, weeksCount);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        To Date (Calculated)
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3.5 top-3 w-4 h-4 text-slate-600 pointer-events-none" />
                        <input
                          type="date"
                          disabled
                          readOnly
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/40 border border-rpg-border/20 text-slate-500 font-semibold select-none"
                          value={toDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* How Many Months */}
                  <div>
                    <label className="block uppercase tracking-wider mb-1.5">How many months?</label>
                    <select
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white focus:outline-none focus:border-rpg-xp transition-all font-semibold"
                      value={monthsCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setMonthsCount(val);
                        updateToMonth(fromDate, val);
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dates Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        From Date
                      </label>
                      <div className="relative cursor-pointer" onClick={showDatePicker}>
                        <CalendarDays className="absolute left-3.5 top-3 w-4 h-4 text-rpg-level cursor-pointer z-10 hover:text-white transition-colors" />
                        <input
                          type="date"
                          required
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white focus:outline-none focus:border-rpg-xp transition-all cursor-pointer font-semibold"
                          value={fromDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFromDate(val);
                            updateToMonth(val, monthsCount);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        To Date (Calculated)
                      </label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3.5 top-3 w-4 h-4 text-slate-600 pointer-events-none" />
                        <input
                          type="date"
                          disabled
                          readOnly
                          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/40 border border-rpg-border/20 text-slate-500 font-semibold select-none"
                          value={toDate}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Period Preview & Daily Routine Table */}
            {fromDate && (
              <div className="space-y-4 border-t border-rpg-border/30 pt-4 mt-2">
                {/* Period Preview Card */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Planning Period</div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {fromDate && toDate ? formatDateRange(fromDate, toDate) : ''}
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-black text-indigo-300 uppercase tracking-wider self-start sm:self-auto">
                    ⏳ {type === 'week' 
                      ? `${weeksCount * 7} Days (${weeksCount} ${weeksCount === 1 ? 'Week' : 'Weeks'})`
                      : `${monthsCount} ${monthsCount === 1 ? 'Month' : 'Months'}`
                    }
                  </div>
                </div>

                {/* Daily Routine Table Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block uppercase tracking-wider text-slate-300 text-[10px]">Daily Routine Schedule</label>
                    <button
                      type="button"
                      onClick={addRoutineRow}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>

                  {routines.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 bg-slate-950/40 border border-dashed border-rpg-border/30 rounded-xl">
                      <p className="text-[10px] font-semibold">No daily routines defined yet. Click "Add Row" to build your daily timetable.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-rpg-border/40 bg-slate-950/60 no-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-rpg-border/30 bg-slate-950/80 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            <th className="py-2.5 px-3">Routine / Activity</th>
                            <th className="py-2.5 px-3 w-[230px]">Time (Start - End)</th>
                            <th className="py-2.5 px-3 w-[320px]">Dates (Start - End)</th>
                            <th className="py-2.5 px-3 text-center w-[40px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {routines.map((routine, idx) => (
                            <tr key={idx} className="border-b border-rpg-border/20 last:border-0 hover:bg-slate-900/30 transition-colors">
                              {/* Title */}
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Reading/Exercise"
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-rpg-border/40 text-white placeholder-slate-700 font-medium focus:outline-none focus:border-rpg-xp transition-all text-xs"
                                  value={routine.title}
                                  onChange={(e) => updateRoutineField(idx, 'title', e.target.value)}
                                />
                              </td>
                              {/* Time Range */}
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="time"
                                    required
                                    className="w-[98px] px-2 py-1.5 rounded-lg bg-slate-950 border border-rpg-border/40 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all text-[11px]"
                                    value={routine.startTime}
                                    onChange={(e) => updateRoutineField(idx, 'startTime', e.target.value)}
                                  />
                                  <span className="text-slate-600 font-bold">-</span>
                                  <input
                                    type="time"
                                    required
                                    className="w-[98px] px-2 py-1.5 rounded-lg bg-slate-950 border border-rpg-border/40 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all text-[11px]"
                                    value={routine.endTime}
                                    onChange={(e) => updateRoutineField(idx, 'endTime', e.target.value)}
                                  />
                                </div>
                              </td>
                              {/* Date Range */}
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  {/* Start Date */}
                                  <div className="relative flex-1" onClick={showDatePicker}>
                                    <CalendarDays className="absolute left-2 top-2.5 w-3.5 h-3.5 text-rpg-xp cursor-pointer z-10 hover:text-white transition-colors" />
                                    <input
                                      type="date"
                                      required
                                      className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-slate-950 border border-rpg-border/40 text-white focus:outline-none focus:border-rpg-xp transition-all cursor-pointer font-medium text-[11px]"
                                      value={routine.startDate}
                                      onChange={(e) => updateRoutineField(idx, 'startDate', e.target.value)}
                                    />
                                  </div>
                                  <span className="text-slate-600 font-bold">-</span>
                                  {/* End Date */}
                                  <div className="relative flex-1" onClick={showDatePicker}>
                                    <CalendarDays className="absolute left-2 top-2.5 w-3.5 h-3.5 text-rpg-xp cursor-pointer z-10 hover:text-white transition-colors" />
                                    <input
                                      type="date"
                                      required
                                      className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-slate-950 border border-rpg-border/40 text-white focus:outline-none focus:border-rpg-xp transition-all cursor-pointer font-medium text-[11px]"
                                      value={routine.endDate}
                                      onChange={(e) => updateRoutineField(idx, 'endDate', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </td>
                              {/* Action */}
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeRoutineRow(idx)}
                                  className="p-1 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Prompt */}
            <div className="p-3 rounded-lg bg-slate-950/40 border border-rpg-border/30 text-[10px] text-slate-500 flex gap-2">
              <Info className="w-4 h-4 text-rpg-xp flex-shrink-0" />
              <p className="leading-relaxed">
                Create routine planning slots for weeks or months. Once created, you can check it off as Done (✓) or mark it as Failed (✗) based on your consistency.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingPlan(null);
                  setTitle('');
                  setFromDate('');
                  setToDate('');
                  setWeeksCount(1);
                  setMonthsCount(1);
                  setRoutines([]);
                }}
                className="flex-1 py-2.5 rounded-xl border border-rpg-border/40 hover:bg-slate-900 text-slate-400 text-xs font-bold transition-all"
              >
                Discard
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp to-indigo-600 text-white font-extrabold shadow-lg shadow-rpg-xp/25 hover:opacity-90 transition-all"
              >
                {editingPlan ? 'Save Changes' : 'Plan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Menu & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex p-1 bg-slate-950/60 rounded-xl border border-rpg-border/40 max-w-sm w-full">
          <button
            onClick={() => setActiveTab('week')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'week' ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Weekly Plans
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'month' ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-rpg-level" /> Monthly Plans
          </button>
        </div>

        <button 
          onClick={() => {
            setType(activeTab);
            setShowAddForm(true);
          }}
          className="px-4 py-2 rounded-xl bg-rpg-xp text-white text-xs font-black shadow hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Plan {activeTab === 'week' ? 'Week' : 'Month'}
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-3 gap-3.5 max-w-lg">
        <div className="p-3 rounded-xl bg-slate-950/60 border border-rpg-border/30 text-center">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Completed</div>
          <div className="text-sm font-black text-rpg-discipline mt-0.5">{doneCount} / {totalCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-rpg-border/30 text-center">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Failed</div>
          <div className="text-sm font-black text-rpg-health mt-0.5">{failedCount} / {totalCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/60 border border-rpg-border/30 text-center">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending</div>
          <div className="text-sm font-black text-slate-300 mt-0.5">{pendingCount} / {totalCount}</div>
        </div>
      </div>

      {/* Plan Slots Container */}
      <div className="space-y-3.5">
        {filteredPlans.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs font-semibold border-2 border-dashed border-rpg-border/30 rounded-2xl flex flex-col items-center justify-center gap-3">
            <span>📜 No long-term {activeTab} objectives have been inscribed.</span>
            <button
              onClick={() => {
                setType(activeTab);
                setShowAddForm(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-rpg-border/50 text-white hover:bg-slate-850 text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Plan {activeTab === 'week' ? 'Week' : 'Month'}
            </button>
          </div>
        ) : (
          filteredPlans.map(plan => {
            let fromDate = plan.fromDate;
            let toDate = plan.toDate;
            if (!fromDate || !toDate) {
              const parsed = parseTargetDate(plan);
              fromDate = parsed.parsedFrom;
              toDate = parsed.parsedTo;
            }
            const isDone = plan.status === 'done';
            const isFailed = plan.status === 'failed';
            const todayStr = new Date().toLocaleDateString('en-CA');
            const isPlanOver = toDate ? todayStr > toDate : false;
            const hasTrackingData = !!(plan.completions && Object.values(plan.completions).some(v => v === true));
            const canToggleStatus = isPlanOver || hasTrackingData;

            return (
              <div 
                key={plan.id}
                onClick={() => setTrackingPlanId(plan.id)}
                className={`p-4.5 rounded-2xl border transition-all flex flex-col gap-3.5 cursor-pointer hover:bg-slate-900/20 hover:border-indigo-500/30 ${
                  isDone 
                    ? 'bg-rpg-discipline/5 border-rpg-discipline/30 shadow-[0_0_8px_rgba(16,185,129,0.05)]' 
                    : isFailed 
                    ? 'bg-rpg-health/5 border-rpg-health/30 shadow-[0_0_8px_rgba(239,68,68,0.05)]' 
                    : 'bg-slate-950/40 border-rpg-border/30 hover:border-rpg-border/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Information */}
                  <div className="space-y-1.5 max-w-xl">
                    <h4 className={`text-sm font-black ${
                      isDone 
                        ? 'text-rpg-discipline' 
                        : isFailed 
                        ? 'text-rpg-health line-through' 
                        : 'text-white'
                    }`}>
                      {plan.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
                      <span>Target: {plan.targetDate}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      <span className={`px-1.5 py-0.5 rounded-sm ${
                        isDone 
                          ? 'bg-rpg-discipline/10 text-rpg-discipline' 
                          : isFailed 
                          ? 'bg-rpg-health/10 text-rpg-health' 
                          : 'bg-slate-900 text-slate-400'
                      }`}>
                        {plan.status}
                      </span>
                    </div>
                  </div>

                  {/* Status Checkbox Controls */}
                  <div className="flex items-center gap-2.5 justify-end">
                    
                    {/* TICK/DONE BUTTON */}
                    <button
                      disabled={!canToggleStatus}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLongTermPlanStatus(plan.id, isDone ? 'pending' : 'done');
                      }}
                      title={canToggleStatus ? "Mark objective as Accomplished" : "Objective is active and untracked. Log progress or wait for period to end."}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                        !canToggleStatus
                          ? 'bg-slate-950/20 border-rpg-border/20 text-slate-700 cursor-not-allowed opacity-30'
                          : isDone
                          ? 'bg-rpg-discipline border-rpg-discipline text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)] cursor-pointer'
                          : 'bg-slate-950/50 border-rpg-border/40 text-slate-500 hover:border-rpg-discipline hover:text-rpg-discipline cursor-pointer'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* WRONG/FAIL BUTTON */}
                    <button
                      disabled={!canToggleStatus}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateLongTermPlanStatus(plan.id, isFailed ? 'pending' : 'failed');
                      }}
                      title={canToggleStatus ? "Mark objective as Failed" : "Objective is active and untracked. Log progress or wait for period to end."}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                        !canToggleStatus
                          ? 'bg-slate-950/20 border-rpg-border/20 text-slate-700 cursor-not-allowed opacity-30'
                          : isFailed
                          ? 'bg-rpg-health border-rpg-health text-slate-950 shadow-[0_0_10px_rgba(239,68,68,0.3)] cursor-pointer'
                          : 'bg-slate-950/50 border-rpg-border/40 text-slate-500 hover:border-rpg-health hover:text-rpg-health cursor-pointer'
                      }`}
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* EDIT BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(plan);
                      }}
                      title="Edit Plan and Daily Routine"
                      className="w-9 h-9 rounded-xl bg-slate-950/50 border border-rpg-border/40 text-slate-500 hover:border-rpg-gold hover:text-rpg-gold flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* SHARE PLAN BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSharePlan(plan);
                      }}
                      title="Share Plan with Friends"
                      className="w-9 h-9 rounded-xl bg-slate-950/50 border border-rpg-border/40 text-slate-500 hover:border-rpg-level hover:text-rpg-level flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-rpg-border/30 mx-1" />

                    {/* DELETE BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("Purge this long-term plan from timeline scroll?")) {
                          deleteLongTermPlan(plan.id);
                        }
                      }}
                      title="Purge Objective"
                      className="w-9 h-9 rounded-xl bg-slate-950/50 border border-rpg-border/40 text-slate-600 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                  </div>
                </div>

                {/* Expanded Routine Schedule Block */}
                {plan.routines && plan.routines.length > 0 && (
                  <div className="border-t border-rpg-border/20 pt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlanExpanded(plan.id);
                      }}
                      className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {expandedPlanIds[plan.id] ? '🔽 Hide Daily Routine' : '▶️ View Daily Routine'} ({plan.routines.length})
                    </button>

                    {expandedPlanIds[plan.id] && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3.5 space-y-2 border-l-2 border-indigo-500/30 pl-3.5 py-1"
                      >
                        {plan.routines.map((routine) => (
                          <div key={routine.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 rounded-xl bg-slate-950/40 border border-rpg-border/20">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-bold text-indigo-400">
                                ⏰ {routine.startTime} - {routine.endTime}
                              </span>
                              <span className="text-xs font-bold text-slate-200">{routine.title}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                              <span>📅</span>
                              <span>
                                {formatDateRange(routine.startDate, routine.endDate)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Discipline Grid Modal */}
      {trackingPlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="glass-card w-full max-w-6xl p-5 sm:p-6 border-indigo-500/30 flex flex-col gap-4 relative bg-slate-950/90 shadow-2xl max-h-[90vh]">
            
            {/* Close Button */}
            <button
              onClick={() => {
                setTrackingPlanId(null);
                setShowPerformanceChart(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div>
              <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                {showPerformanceChart ? "Discipline Performance Trend" : "Discipline Tracker Checklist"}
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
                <span>📋</span> {trackingPlan.title}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Period: {trackingPlan.targetDate}
              </p>
            </div>

            {showPerformanceChart ? (
              /* Performance Chart View */
              <div className="flex-1 min-h-[300px] bg-slate-950/60 border border-rpg-border/40 rounded-xl p-4 flex flex-col gap-3 justify-center">
                {(() => {
                  const dates = getDatesInRange(trackingPlan.fromDate, trackingPlan.toDate);
                  const data = dates.map(d => {
                    let done = 0;
                    const total = trackingPlan.routines?.length || 0;
                    trackingPlan.routines?.forEach(r => {
                      const key = `${d}_${r.id}`;
                      if (trackingPlan.completions && trackingPlan.completions[key]) {
                        done++;
                      }
                    });
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                    return { dateStr: d, pct, done, total };
                  });

                  // Chart Coordinates
                  const width = 800;
                  const height = 300;
                  const paddingLeft = 50;
                  const paddingRight = 30;
                  const paddingTop = 30;
                  const paddingBottom = 40;

                  const chartWidth = width - paddingLeft - paddingRight;
                  const chartHeight = height - paddingTop - paddingBottom;

                  const points = data.map((d, index) => {
                    const x = paddingLeft + (data.length > 1 ? (index / (data.length - 1)) * chartWidth : chartWidth / 2);
                    const y = paddingTop + chartHeight - (d.pct / 100) * chartHeight;
                    return { x, y, ...d };
                  });

                  // Generate smooth Bezier line path
                  let linePath = "";
                  if (points.length > 0) {
                    linePath = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 0; i < points.length - 1; i++) {
                      const p0 = points[i];
                      const p1 = points[i + 1];
                      const cp1x = p0.x + (p1.x - p0.x) / 2;
                      const cp1y = p0.y;
                      const cp2x = p0.x + (p1.x - p0.x) / 2;
                      const cp2y = p1.y;
                      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
                    }
                  }

                  // Calculate area path (closing the bottom coordinates)
                  let areaPath = "";
                  if (points.length > 0) {
                    const startX = points[0].x;
                    const endX = points[points.length - 1].x;
                    const bottomY = paddingTop + chartHeight;
                    areaPath = `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
                  }

                  return (
                    <div className="w-full overflow-x-auto no-scrollbar">
                      <div className="min-w-[650px] p-2">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
                          <defs>
                            {/* Gradient Area Fill */}
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          {[0, 25, 50, 75, 100].map(val => {
                            const y = paddingTop + chartHeight - (val / 100) * chartHeight;
                            return (
                              <g key={val}>
                                <line 
                                  x1={paddingLeft} 
                                  y1={y} 
                                  x2={width - paddingRight} 
                                  y2={y} 
                                  className="stroke-slate-800/80 stroke-1" 
                                  strokeDasharray="4 4"
                                />
                                <text 
                                  x={paddingLeft - 10} 
                                  y={y + 4} 
                                  className="fill-slate-500 text-[10px] font-bold"
                                  textAnchor="end"
                                >
                                  {val}%
                                </text>
                              </g>
                            );
                          })}

                          {/* Area under the line */}
                          {points.length > 0 && (
                            <path d={areaPath} fill="url(#chartGradient)" />
                          )}

                          {/* Trending Line */}
                          {points.length > 0 && (
                            <path 
                              d={linePath} 
                              fill="none" 
                              stroke="#818cf8" 
                              strokeWidth="3.5" 
                              className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.5)]" 
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* X Axis labels */}
                          {points.map((p, index) => {
                            const showLabel = data.length < 15 || index % Math.ceil(data.length / 10) === 0 || index === data.length - 1;
                            if (!showLabel) return null;
                            const dateObj = new Date(p.dateStr);
                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
                            const dayNum = dateObj.getDate();
                            return (
                              <text 
                                key={index} 
                                x={p.x} 
                                y={height - 15} 
                                className="fill-slate-400 text-[9px] font-bold"
                                textAnchor="middle"
                              >
                                {dayName} {dayNum}
                              </text>
                            );
                          })}

                          {/* Interactive Points / Circles */}
                          {points.map((p, index) => (
                            <g key={index} className="group cursor-pointer">
                              <circle 
                                cx={p.x} 
                                cy={p.y} 
                                r="5" 
                                className="fill-indigo-500 stroke-slate-950 stroke-2 hover:r-7 transition-all duration-100 hover:fill-rpg-gold"
                              />
                              <title>
                                {`${p.dateStr}\nCompletion: ${p.pct}%\nRoutines: ${p.done} / ${p.total}`}
                              </title>
                            </g>
                          ))}
                        </svg>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Grid Table Container */
              <div className="overflow-x-auto rounded-xl border border-rpg-border/40 bg-slate-950/60 no-scrollbar select-none max-h-[60vh]">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="border-b border-rpg-border/30 bg-slate-950/80">
                      {/* Sticky Habits Column Header */}
                      <th className="sticky left-0 bg-slate-950 z-20 w-[180px] p-3 border-r border-rpg-border/40 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Habits / Routines
                      </th>
                      {getDatesInRange(trackingPlan.fromDate, trackingPlan.toDate).map(d => {
                        const date = new Date(d);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2);
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
                    {/* Routine Rows */}
                    {trackingPlan.routines && trackingPlan.routines.map(routine => (
                      <tr key={routine.id} className="border-b border-rpg-border/20 hover:bg-slate-900/20 transition-colors">
                        {/* Sticky Routine Header cell */}
                        <td className="sticky left-0 bg-slate-950 z-20 w-[180px] p-3 border-r border-rpg-border/40 text-xs font-bold text-slate-200">
                          <div className="truncate" title={routine.title}>{routine.title}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">⏰ {routine.startTime} - {routine.endTime}</div>
                        </td>
                        {/* Completion check cells */}
                        {getDatesInRange(trackingPlan.fromDate, trackingPlan.toDate).map(d => {
                          const todayStr = new Date().toLocaleDateString('en-CA');
                          const isFuture = d > todayStr;
                          const key = `${d}_${routine.id}`;
                          const isChecked = !!(trackingPlan.completions && trackingPlan.completions[key]);
                          const formattedDate = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <td key={d} className="p-2 text-center border-r border-rpg-border/20 last:border-r-0 w-[60px]">
                              <button
                                disabled={isFuture}
                                onClick={() => toggleRoutineCompletion(trackingPlan, d, routine.id)}
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
                      const dates = getDatesInRange(trackingPlan.fromDate, trackingPlan.toDate);
                      const stats = dates.map(d => {
                        let done = 0;
                        const total = trackingPlan.routines?.length || 0;
                        trackingPlan.routines?.forEach(r => {
                          const key = `${d}_${r.id}`;
                          if (trackingPlan.completions && trackingPlan.completions[key]) {
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
                          {/* Done Row */}
                          <tr className="border-b border-rpg-border/20 bg-slate-900/20">
                            <td className="sticky left-0 bg-slate-950 z-20 w-[180px] p-3 border-r border-rpg-border/40 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              Done
                            </td>
                            {stats.map((stat, idx) => (
                              <td key={idx} className="p-2 text-center border-r border-rpg-border/20 last:border-r-0 w-[60px] text-[10px] font-bold text-slate-300">
                                {stat.done}
                              </td>
                            ))}
                          </tr>
                          {/* Total Row */}
                          <tr className="bg-slate-900/10">
                            <td className="sticky left-0 bg-slate-950 z-20 w-[180px] p-3 border-r border-rpg-border/40 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              Total
                            </td>
                            {stats.map((stat, idx) => (
                              <td key={idx} className="p-2 text-center border-r border-rpg-border/20 last:border-r-0 w-[60px] text-[10px] font-bold text-slate-400">
                                {stat.total}
                              </td>
                            ))}
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Help footer */}
            <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-rpg-border/20 flex gap-2">
              <span>💡</span>
              <p>Click checkboxes to toggle completion of each daily routine task. Your daily discipline stats automatically calculate at the bottom in real time.</p>
            </div>
            
            {/* Modal Controls */}
            <div className="flex flex-col sm:flex-row gap-2 mt-1">
              <button
                type="button"
                onClick={() => setShowPerformanceChart(!showPerformanceChart)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-650/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                {showPerformanceChart ? (
                  <>📋 Checklist Grid</>
                ) : (
                  <>📊 Performance</>
                )}
              </button>
              
              <button
                onClick={() => {
                  setTrackingPlanId(null);
                  setShowPerformanceChart(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-rpg-border/40 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Share Plan Modal */}
      {selectedSharePlan && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-5 border-rpg-level/30 flex flex-col gap-4 relative bg-slate-950/90 shadow-2xl">
            <button
              onClick={closeShareModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="text-[10px] font-black text-rpg-level uppercase tracking-widest">Share Plan</div>
              <h3 className="text-base font-black text-white mt-1 truncate">
                📤 {selectedSharePlan.title}
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                Target Period: {selectedSharePlan.targetDate}
              </p>
            </div>

            <div className="border-t border-rpg-border/20 pt-3 flex-1 flex flex-col min-h-[250px] max-h-[350px]">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                Guild Members
              </label>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {(!user.friends || user.friends.length === 0) ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-6 text-slate-500 gap-3 border border-dashed border-rpg-border/40 rounded-xl px-4">
                    <p className="text-xs font-semibold">No guild members found. Add friends in the chat hub to share your plan!</p>
                    <button
                      onClick={() => {
                        closeShareModal();
                        setScreen('messages');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-650 hover:bg-indigo-500 text-white font-extrabold text-xs active:scale-95 transition-all shadow"
                    >
                      Go to Messages
                    </button>
                  </div>
                ) : (
                  user.friends.map(friend => {
                    const isShared = sharedFriendIds.includes(friend.uid);
                    const isLoading = sharingToId === friend.uid;

                    return (
                      <div
                        key={friend.uid}
                        className="p-3 rounded-xl bg-slate-950/40 border border-rpg-border/20 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <AvatarBuilder config={friend.avatar} profilePicture={friend.profilePicture} size={28} showCamera={false} />
                          <div className="truncate">
                            <div className="text-xs font-bold text-white truncate">{friend.name}</div>
                            <div className="text-[10px] font-semibold text-slate-500">@{friend.username}</div>
                          </div>
                        </div>

                        <button
                          disabled={isShared || isLoading}
                          onClick={() => handleSharePlan(friend)}
                          className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                            isShared
                              ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 cursor-default'
                              : 'bg-indigo-650 hover:bg-indigo-550 border border-indigo-500/30 text-white active:scale-95'
                          }`}
                        >
                          {isLoading ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : isShared ? (
                            'Shared ✔️'
                          ) : (
                            'Share'
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              onClick={closeShareModal}
              className="w-full py-2 rounded-xl bg-slate-900 border border-rpg-border/40 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
