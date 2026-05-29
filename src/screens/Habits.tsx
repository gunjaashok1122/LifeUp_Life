import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Habit } from '../context/AppContext';
import { HeatMap } from '../components/HeatMap';
import { TrendGraph } from '../components/TrendGraph';
import { Flame, Plus, Trash2, CheckCircle2, Circle, Sparkles, Award, ArrowLeft, TrendingUp } from 'lucide-react';

const CATEGORY_ICONS: Record<Habit['category'], string> = {
  fitness: '🏃',
  mind: '🧘',
  work: '💻',
  health: '🥛',
  custom: '🌱'
};

const CATEGORY_COLORS: Record<Habit['category'], string> = {
  fitness: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
  mind: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10',
  work: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
  health: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
  custom: 'border-slate-500/30 text-slate-400 bg-slate-500/10'
};

const CATEGORY_GRAPH_COLORS: Record<Habit['category'], { stroke: string; stop: string }> = {
  fitness: { stroke: '#10b981', stop: '#10b981' }, // Emerald
  mind: { stroke: '#6366f1', stop: '#6366f1' },    // Indigo
  work: { stroke: '#a855f7', stop: '#a855f7' },    // Purple
  health: { stroke: '#3b82f6', stop: '#3b82f6' },  // Blue
  custom: { stroke: '#64748b', stop: '#64748b' }   // Slate
};

const getHabitTrendData = (habit: Habit) => {
  // Get last 7 days dates
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const trend = last7Days.map(date => {
    // For each day, look at the 7-day window ending on this date
    let completedInWindow = 0;
    for (let j = 0; j < 7; j++) {
      const checkDate = new Date(date);
      checkDate.setDate(checkDate.getDate() - j);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (habit.completedDates.includes(dateStr)) {
        completedInWindow++;
      }
    }
    return Math.round((completedInWindow / 7) * 100);
  });

  const labels = last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));

  return { trend, labels };
};

export const Habits: React.FC = () => {
  const { habits, addHabit, toggleHabit, deleteHabit, bulkUpdateHabitDates, setScreen, previousScreen, user } = useApp();
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Range Selector State
  const [showRangeSelector, setShowRangeSelector] = useState(false);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Habit['category']>('custom');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');

  const todayStr = new Date().toISOString().split('T')[0];

  // Pick first habit as default selected for heatmap
  const activeHabitForHeatmap = habits.find(h => h.id === selectedHabitId) || habits[0];

  const handleDateClick = (dateStr: string) => {
    if (!activeHabitForHeatmap) return;
    
    // Toggle current date status
    toggleHabit(activeHabitForHeatmap.id, dateStr);

    // If it is a daily loop habit, open range checkoff card
    if (activeHabitForHeatmap.frequency === 'daily') {
      setRangeStart(dateStr);
      setRangeEnd(todayStr);
      setShowRangeSelector(true);
    }
  };

  const handleApplyRangeComplete = () => {
    if (!activeHabitForHeatmap || !rangeStart || !rangeEnd) return;
    bulkUpdateHabitDates(activeHabitForHeatmap.id, rangeStart, rangeEnd, true);
    setShowRangeSelector(false);
  };

  const handleApplyRangeRemove = () => {
    if (!activeHabitForHeatmap || !rangeStart || !rangeEnd) return;
    bulkUpdateHabitDates(activeHabitForHeatmap.id, rangeStart, rangeEnd, false);
    setShowRangeSelector(false);
  };

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addHabit({
      name,
      category,
      frequency
    });

    setName('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      
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

      {/* HEADER STATUS */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rpg-discipline/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 rounded-xl bg-rpg-discipline/20 flex items-center justify-center border border-rpg-discipline/30">
            <span className="text-xl">🌱</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Habit Rituals Deck</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Forge consistency, track streaks, and level up your discipline.
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto">
          <button 
            onClick={() => {
              setShowAddForm(prev => !prev);
              setShowRangeSelector(false);
            }}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-rpg-discipline hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Inject Habit Quest
          </button>
        </div>
      </div>

      {/* Add Habit Form */}
      {showAddForm && (
        <div className="glass-card p-5 space-y-4 max-w-4xl mx-auto">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-rpg-gold" /> Forge Habit Quest
          </h3>

          <form onSubmit={handleCreateHabit} className="space-y-3.5 text-xs font-semibold text-slate-400">
            <div>
              <label className="block uppercase tracking-wider mb-1.5">Habit Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Read 15 Mins / Drink Water"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 font-medium focus:outline-none focus:border-rpg-xp transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block uppercase tracking-wider mb-1.5">Category</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white focus:outline-none focus:border-rpg-xp transition-all"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="fitness">Fitness (Gym/Run)</option>
                  <option value="mind">Mind (Read/Mediate)</option>
                  <option value="work">Work (Coding/Study)</option>
                  <option value="health">Health (Water/Sleep)</option>
                  <option value="custom">Custom (Other)</option>
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5">Frequency</label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white focus:outline-none focus:border-rpg-xp transition-all"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                >
                  <option value="daily">Daily Loop</option>
                  <option value="weekly">Weekly Cycle</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-rpg-discipline to-emerald-600 text-slate-950 font-bold tracking-wide shadow-md hover:opacity-90 active:scale-[0.98] transition-all animate-glow"
            >
              Seal Ritual Contract
            </button>
          </form>
        </div>
      )}

      {/* Habits List with Side-by-Side Calendar and Graph */}
      <div className="space-y-6">
        {habits.length === 0 ? (
          <div className="glass-card text-center py-10 text-slate-500 text-xs font-medium border border-dashed border-rpg-border/40 rounded-xl">
            🌱 The ritual deck is empty. Set your habits to forge discipline paths!
          </div>
        ) : (
          habits.map(h => {
            const completedToday = h.completedDates.includes(todayStr);
            const trendData = getHabitTrendData(h);
            const strokeColor = CATEGORY_GRAPH_COLORS[h.category].stroke;
            const stopColor = CATEGORY_GRAPH_COLORS[h.category].stop;

            return (
              <div key={h.id} className="glass-card p-5 space-y-5">
                
                {/* Habit Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rpg-border/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950/80 flex items-center justify-center text-lg border border-rpg-border/30">
                      {CATEGORY_ICONS[h.category] || '🌱'}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">{h.name}</h3>
                      <div className="flex items-center gap-2.5 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${CATEGORY_COLORS[h.category]}`}>
                          {h.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          🔁 {h.frequency}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleHabit(h.id, todayStr)}
                      className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-rpg-border/40 hover:border-rpg-discipline/60 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {completedToday ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-rpg-discipline animate-bounce" />
                          <span className="text-rpg-discipline font-extrabold">Done Today</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-slate-500" />
                          <span>Mark Done</span>
                        </>
                      )}
                    </button>

                    {/* Streaks Widget */}
                    <div className="flex items-center gap-1 text-xs font-bold text-rpg-health bg-rpg-health/10 border border-rpg-health/20 px-2.5 py-1.5 rounded-xl">
                      <Flame className="w-4 h-4 fill-current animate-pulse" />
                      <span>{h.streak} Streak</span>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteHabit(h.id)}
                      className="text-slate-600 hover:text-red-400 p-2 rounded-xl bg-slate-950/40 border border-rpg-border/30 hover:bg-red-950/20 transition-colors cursor-pointer"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Side-by-Side: Calendar & Graph */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  
                  {/* Left Side: Calendar & Range Selector */}
                  <div className="space-y-4">
                    <HeatMap 
                      completedDates={h.completedDates} 
                      onDateClick={(dateStr) => {
                        toggleHabit(h.id, dateStr);
                        if (h.frequency === 'daily') {
                          setRangeStart(dateStr);
                          setRangeEnd(todayStr);
                          setSelectedHabitId(h.id);
                          setShowRangeSelector(true);
                        }
                      }}
                    />

                    {/* Date Range Selector Card */}
                    {showRangeSelector && selectedHabitId === h.id && (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-rpg-border/40 space-y-3 transition-all">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            📅 Apply to Date Range
                          </h4>
                          <button 
                            onClick={() => setShowRangeSelector(false)}
                            className="text-slate-500 hover:text-slate-300 text-[10px] font-bold"
                          >
                            Dismiss
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-500">
                          <div>
                            <label className="block mb-1 uppercase tracking-wider">Start Date</label>
                            <input 
                              type="date"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-rpg-border/60 text-white text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all"
                              value={rangeStart}
                              onChange={(e) => setRangeStart(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block mb-1 uppercase tracking-wider">End Date</label>
                            <input 
                              type="date"
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-rpg-border/60 text-white text-xs font-semibold focus:outline-none focus:border-rpg-xp transition-all"
                              value={rangeEnd}
                              onChange={(e) => setRangeEnd(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              bulkUpdateHabitDates(h.id, rangeStart, rangeEnd, true);
                              setShowRangeSelector(false);
                            }}
                            className="flex-1 py-2 rounded-lg bg-rpg-discipline text-slate-950 text-xs font-black hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
                          >
                            Complete Range
                          </button>
                          <button
                            onClick={() => {
                              bulkUpdateHabitDates(h.id, rangeStart, rangeEnd, false);
                              setShowRangeSelector(false);
                            }}
                            className="flex-1 py-2 rounded-lg bg-slate-900 border border-red-900/30 text-red-400 text-xs font-bold hover:bg-red-950/20 active:scale-95 transition-all uppercase tracking-wider"
                          >
                            Clear Range
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Side: Graph & Stats */}
                  <div className="space-y-4">
                    <div className="p-1 rounded-xl bg-slate-950/20 border border-rpg-border/10">
                      <TrendGraph
                        data={trendData.trend}
                        months={trendData.labels}
                        color={strokeColor}
                        gradientId={`habit-trend-${h.id}`}
                        stopColor={stopColor}
                        title={`${h.name}`}
                        currentValue={trendData.trend[trendData.trend.length - 1]}
                      />
                    </div>

                    {/* Stats details */}
                    <div className="grid grid-cols-3 gap-2.5 mt-2">
                      {/* Current Streak */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-rpg-border/20 text-center flex flex-col justify-center items-center">
                        <Flame className="w-4 h-4 text-rpg-health mb-1 animate-pulse" />
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Streak</div>
                        <div className="text-xs font-black text-white mt-0.5">{h.streak} Days</div>
                      </div>

                      {/* Best Historical Streak */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-rpg-border/20 text-center flex flex-col justify-center items-center">
                        <Award className="w-4 h-4 text-rpg-gold mb-1" />
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Best Streak</div>
                        <div className="text-xs font-black text-white mt-0.5">{h.bestStreak} Days</div>
                      </div>

                      {/* Total Completed */}
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-rpg-border/20 text-center flex flex-col justify-center items-center">
                        <span className="text-sm mb-1">🏆</span>
                        <div className="text-[9px] font-bold text-slate-500 uppercase">Completions</div>
                        <div className="text-xs font-black text-white mt-0.5">{h.completedDates.length} Times</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
