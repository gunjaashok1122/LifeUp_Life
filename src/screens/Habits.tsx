import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Habit } from '../context/AppContext';
import { HeatMap } from '../components/HeatMap';
import { Flame, Plus, Trash2, CheckCircle2, Circle, Sparkles, Award, ArrowLeft } from 'lucide-react';

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

      {/* Upper Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Habits Checklist */}
        <div className="lg:col-span-2 glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Your Active Rituals
            </h3>
          </div>

          <div className="space-y-3">
            {habits.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-medium border border-dashed border-rpg-border/40 rounded-xl">
                🌱 The ritual deck is empty. Set your habits to forge discipline paths!
              </div>
            ) : (
              habits.map(h => {
                const completedToday = h.completedDates.includes(todayStr);
                const isSelected = activeHabitForHeatmap?.id === h.id;

                return (
                  <div 
                    key={h.id}
                    onClick={() => setSelectedHabitId(h.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'border-rpg-discipline bg-rpg-card' 
                        : 'bg-slate-950/40 border-rpg-border/30 hover:border-rpg-border/60 hover:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHabit(h.id, todayStr);
                        }}
                        className="text-slate-500 hover:text-rpg-discipline transition-colors"
                      >
                        {completedToday ? (
                          <CheckCircle2 className="w-5.5 h-5.5 text-rpg-discipline animate-bounce" />
                        ) : (
                          <Circle className="w-5.5 h-5.5" />
                        )}
                      </button>

                      <div>
                        <h4 className={`text-sm font-bold ${completedToday ? 'text-rpg-discipline line-through' : 'text-white'}`}>
                          {h.name}
                        </h4>
                        
                        <div className="flex items-center gap-2.5 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${CATEGORY_COLORS[h.category]}`}>
                            {CATEGORY_ICONS[h.category]} {h.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            🔁 {h.frequency}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Streaks Widget */}
                      <div className="flex items-center gap-1 text-xs font-bold text-rpg-health bg-rpg-health/10 border border-rpg-health/20 px-2 py-1 rounded-lg">
                        <Flame className="w-4 h-4 fill-current animate-pulse" />
                        <span>{h.streak} Streak</span>
                      </div>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHabit(h.id);
                        }}
                        className="text-slate-600 hover:text-red-400 p-1.5 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Heatmap Viewer & Add Form */}
        <div className="space-y-6">
          {/* Add Habit Form */}
          {showAddForm && (
            <div className="glass-card p-5 space-y-4">
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

          {/* Monthly Heatmap Display */}
          {activeHabitForHeatmap ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1 font-sans text-xs font-bold text-slate-400">
                  <Award className="w-4 h-4 text-rpg-gold" />
                  <span>Consistency Logs for: </span>
                  <span className="text-white font-extrabold">{activeHabitForHeatmap.name}</span>
                </div>
                <HeatMap 
                  completedDates={activeHabitForHeatmap.completedDates} 
                  onDateClick={handleDateClick}
                />
              </div>

              {/* Date Range Selector Card */}
              {showRangeSelector && (
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
                      onClick={handleApplyRangeComplete}
                      className="flex-1 py-2 rounded-lg bg-rpg-discipline text-slate-950 text-xs font-black hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
                    >
                      Complete Range
                    </button>
                    <button
                      onClick={handleApplyRangeRemove}
                      className="flex-1 py-2 rounded-lg bg-slate-900 border border-red-900/30 text-red-400 text-xs font-bold hover:bg-red-950/20 active:scale-95 transition-all uppercase tracking-wider"
                    >
                      Clear Range
                    </button>
                  </div>
                </div>
              )}
              
              {/* Best streak indicator */}
              <div className="p-3 bg-slate-950/40 border border-rpg-border/30 rounded-xl flex items-center justify-between text-xs font-bold">
                <span className="text-slate-400">Best Historical Streak:</span>
                <span className="text-rpg-gold flex items-center gap-0.5">
                  🏆 {activeHabitForHeatmap.bestStreak} Days
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs font-medium border border-dashed border-rpg-border/40 rounded-xl">
              Select a habit to view its consistency logs.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
