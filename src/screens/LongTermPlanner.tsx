import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { DailyRoutine } from '../context/AppContext';
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
  Pencil
} from 'lucide-react';

export const LongTermPlanner: React.FC = () => {
  const { longTermPlans, addLongTermPlan, updateLongTermPlanStatus, deleteLongTermPlan, updateLongTermPlan, setScreen, user } = useApp();
  const [activeTab, setActiveTab] = useState<'week' | 'month'>('week');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'week' | 'month'>('week');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [targetMonth, setTargetMonth] = useState('');
  const [weeksCount, setWeeksCount] = useState(1);
  const [routines, setRoutines] = useState<DailyRoutine[]>([]);
  const [expandedPlanIds, setExpandedPlanIds] = useState<Record<string, boolean>>({});
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const parseTargetDate = (plan: any) => {
    let parsedFrom = plan.fromDate || '';
    let parsedTo = plan.toDate || '';
    let parsedMonth = plan.targetMonth || '';
    let parsedWeeks = plan.weeksCount || 1;

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
      if (!parsedMonth && plan.targetDate) {
        try {
          const d = new Date(plan.targetDate + " 1");
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            parsedMonth = `${y}-${m}`;
          }
        } catch (e) {
          console.error("Failed to parse monthly targetDate:", e);
        }
      }
    }

    return { parsedFrom, parsedTo, parsedMonth, parsedWeeks };
  };

  const startEdit = (plan: any) => {
    const { parsedFrom, parsedTo, parsedMonth, parsedWeeks } = parseTargetDate(plan);
    setEditingPlan(plan);
    setTitle(plan.title);
    setType(plan.type);
    setFromDate(parsedFrom);
    setToDate(parsedTo);
    setTargetMonth(parsedMonth);
    setWeeksCount(parsedWeeks);
    setRoutines(plan.routines || []);
    setShowAddForm(true);
  };

  const getLastDayOfMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
  };

  const addRoutineRow = () => {
    const defaultStart = type === 'week' ? fromDate : (targetMonth ? `${targetMonth}-01` : '');
    const defaultEnd = type === 'week' ? toDate : (targetMonth ? getLastDayOfMonth(targetMonth) : '');
    
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
  const formatMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

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

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let dateLabel = '';
    if (type === 'week') {
      if (!fromDate || !toDate) return;
      dateLabel = formatDateRange(fromDate, toDate);
    } else {
      if (!targetMonth) return;
      dateLabel = formatMonth(targetMonth);
    }

    const planData = {
      title,
      type,
      targetDate: dateLabel,
      routines: routines.map(r => ({
        ...r,
        id: r.id || Math.random().toString(36).substr(2, 9)
      })),
      fromDate: type === 'week' ? fromDate : undefined,
      toDate: type === 'week' ? toDate : undefined,
      targetMonth: type === 'month' ? targetMonth : undefined,
      weeksCount: type === 'week' ? weeksCount : undefined
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
    setTargetMonth('');
    setWeeksCount(1);
    setRoutines([]);
    setEditingPlan(null);
    setShowAddForm(false);
  };

  const showDatePicker = (e: React.MouseEvent<HTMLDivElement>) => {
    // If the click is directly on the input, let the browser handle native focus/interaction.
    // If it is on the wrapper or calendar icon, call showPicker() to open the options dropdown.
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
          onClick={() => setScreen('dashboard')}
          className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-rpg-border/40 text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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
            <Sparkles className="w-4 h-4 text-rpg-gold" /> Planning Slot
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
                <div>
                  <label className="block uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    Select Month
                  </label>
                  <div className="relative cursor-pointer" onClick={showDatePicker}>
                    <CalendarDays className="absolute left-3.5 top-3 w-4 h-4 text-rpg-level cursor-pointer z-10 hover:text-white transition-colors" />
                    <input
                      type="month"
                      required
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white focus:outline-none focus:border-rpg-xp transition-all cursor-pointer font-semibold"
                      value={targetMonth}
                      onChange={(e) => {
                        const monthVal = e.target.value;
                        setTargetMonth(monthVal);
                        const start = `${monthVal}-01`;
                        const end = getLastDayOfMonth(monthVal);
                        setRoutines(prev => prev.map(r => ({
                          ...r,
                          startDate: r.startDate === `${targetMonth}-01` || !r.startDate ? start : r.startDate,
                          endDate: r.endDate === getLastDayOfMonth(targetMonth) || !r.endDate ? end : r.endDate
                        })));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Period Preview & Daily Routine Table */}
            {((type === 'week' && fromDate) || (type === 'month' && targetMonth)) && (
              <div className="space-y-4 border-t border-rpg-border/30 pt-4 mt-2">
                {/* Period Preview Card */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Planning Period</div>
                    <div className="text-xs font-black text-white mt-0.5">
                      {type === 'week' ? formatDateRange(fromDate, toDate) : formatMonth(targetMonth)}
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-black text-indigo-300 uppercase tracking-wider self-start sm:self-auto">
                    ⏳ {type === 'week' 
                      ? `${weeksCount * 7} Days (${weeksCount} ${weeksCount === 1 ? 'Week' : 'Weeks'})`
                      : `${new Date(parseInt(targetMonth.split('-')[0]), parseInt(targetMonth.split('-')[1]), 0).getDate()} Days`
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
                  setTargetMonth('');
                  setWeeksCount(1);
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
            <CalendarDays className="w-4 h-4" /> Weekly Slots
          </button>
          <button
            onClick={() => setActiveTab('month')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'month' ? 'bg-rpg-border text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-rpg-level" /> Monthly Slots
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
            const isDone = plan.status === 'done';
            const isFailed = plan.status === 'failed';

            return (
              <div 
                key={plan.id}
                className={`p-4.5 rounded-2xl border transition-all flex flex-col gap-3.5 ${
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
                      onClick={() => updateLongTermPlanStatus(plan.id, isDone ? 'pending' : 'done')}
                      title="Mark objective as Accomplished"
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isDone
                          ? 'bg-rpg-discipline border-rpg-discipline text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-slate-950/50 border-rpg-border/40 text-slate-500 hover:border-rpg-discipline hover:text-rpg-discipline'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* WRONG/FAIL BUTTON */}
                    <button
                      onClick={() => updateLongTermPlanStatus(plan.id, isFailed ? 'pending' : 'failed')}
                      title="Mark objective as Failed"
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isFailed
                          ? 'bg-rpg-health border-rpg-health text-slate-950 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                          : 'bg-slate-950/50 border-rpg-border/40 text-slate-500 hover:border-rpg-health hover:text-rpg-health'
                      }`}
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* EDIT BUTTON */}
                    <button
                      onClick={() => startEdit(plan)}
                      title="Edit Plan and Daily Routine"
                      className="w-9 h-9 rounded-xl bg-slate-950/50 border border-rpg-border/40 text-slate-500 hover:border-rpg-gold hover:text-rpg-gold flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <div className="w-px h-6 bg-rpg-border/30 mx-1" />

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => {
                        if (window.confirm("Purge this long-term slot plan from timeline scroll?")) {
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
                      onClick={() => togglePlanExpanded(plan.id)}
                      className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {expandedPlanIds[plan.id] ? '🔽 Hide Daily Routine' : '▶️ View Daily Routine'} ({plan.routines.length})
                    </button>

                    {expandedPlanIds[plan.id] && (
                      <div className="mt-3.5 space-y-2 border-l-2 border-indigo-500/30 pl-3.5 py-1">
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

    </div>
  );
};
