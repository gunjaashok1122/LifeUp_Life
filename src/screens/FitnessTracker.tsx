import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Flame, 
  Footprints, 
  Clock, 
  Sliders, 
  Info,
  ChevronDown,
  ArrowLeft,
  TrendingUp
} from 'lucide-react';

const WORKOUT_TYPES = [
  { name: 'Gym / Strength', icon: '🏋️', caloriesPerMin: 7 },
  { name: 'Running', icon: '🏃', caloriesPerMin: 10 },
  { name: 'Walking', icon: '🚶', caloriesPerMin: 4 },
  { name: 'Cycling', icon: '🚴', caloriesPerMin: 8 },
  { name: 'Swimming', icon: '🏊', caloriesPerMin: 9 },
  { name: 'Yoga / Pilates', icon: '🧘', caloriesPerMin: 3.5 },
  { name: 'Other', icon: '⚡', caloriesPerMin: 6 }
];

export const FitnessTracker: React.FC = () => {
  const { 
    user, 
    fitnessLogs, 
    addFitnessLog, 
    deleteFitnessLog,
    updateFitnessTargets,
    setScreen,
    previousScreen
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Form State
  const [workoutType, setWorkoutType] = useState('Gym / Strength');
  const [workoutDuration, setWorkoutDuration] = useState('');
  const [steps, setSteps] = useState('');
  const [caloriesBurned, setCaloriesBurned] = useState('');
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);

  // Target Settings State
  const [stepsTarget, setStepsTarget] = useState(user.stepsTarget || 10000);
  const [caloriesTarget, setCaloriesTarget] = useState(user.caloriesTarget || 500);
  const [durationTarget, setDurationTarget] = useState(user.workoutDurationTarget || 60);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate today's totals
  const todayLogs = fitnessLogs.filter(log => log.date === todayStr);
  const todaySteps = todayLogs.reduce((sum, log) => sum + (log.steps || 0), 0);
  const todayDuration = todayLogs.reduce((sum, log) => sum + (log.workoutDuration || 0), 0);
  const todayCalories = todayLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);

  // Auto-estimate calories on type/duration change
  const handleDurationChange = (val: string) => {
    setWorkoutDuration(val);
    if (!val) {
      setCaloriesBurned('');
      return;
    }
    const mins = parseFloat(val);
    if (isNaN(mins)) return;

    const selectedType = WORKOUT_TYPES.find(w => w.name === workoutType);
    const multiplier = selectedType ? selectedType.caloriesPerMin : 6;
    setCaloriesBurned(Math.round(mins * multiplier).toString());
  };

  const handleTypeChange = (type: string) => {
    setWorkoutType(type);
    if (!workoutDuration) return;
    const mins = parseFloat(workoutDuration);
    if (isNaN(mins)) return;

    const selectedType = WORKOUT_TYPES.find(w => w.name === type);
    const multiplier = selectedType ? selectedType.caloriesPerMin : 6;
    setCaloriesBurned(Math.round(mins * multiplier).toString());
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedDuration = parseFloat(workoutDuration) || 0;
    const parsedSteps = parseInt(steps) || 0;
    const parsedCalories = parseFloat(caloriesBurned) || 0;

    if (parsedDuration === 0 && parsedSteps === 0 && parsedCalories === 0) {
      alert("Please log some valid metrics (Steps, Duration, or Calories).");
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

    // Reset Form
    setWorkoutDuration('');
    setSteps('');
    setCaloriesBurned('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFitnessTargets(stepsTarget, caloriesTarget, durationTarget);
    setShowSettings(false);
  };

  // Get last 7 days labels and date strings
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
    const dayLogs = fitnessLogs.filter(log => log.date === day.dateStr);
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

  // Pick max values for charting ceiling
  const maxSteps = Math.max(...weeklyChartData.map(d => d.steps), 5000);
  const maxCals = Math.max(...weeklyChartData.map(d => d.calories), 300);

  const getWorkoutIcon = (type: string) => {
    const found = WORKOUT_TYPES.find(w => w.name === type);
    return found ? found.icon : '⚡';
  };

  // Progress Percentages
  const stepsPct = Math.min(100, Math.round((todaySteps / (user.stepsTarget || 10000)) * 100));
  const durationPct = Math.min(100, Math.round((todayDuration / (user.workoutDurationTarget || 30)) * 100));
  const caloriesPct = Math.min(100, Math.round((todayCalories / (user.caloriesTarget || 500)) * 100));

  // --- Daily Performance: last 30 days ---
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const dailyPerfData = last30Days.map(dateStr => {
    const dayLogs = fitnessLogs.filter(log => log.date === dateStr);
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
  const perfW = 600, perfH = 130, perfPL = 32, perfPR = 12, perfPT = 14, perfPB = 28;
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
            <Dumbbell className="w-6 h-6 text-rpg-discipline" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">Fitness Quest Deck</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              Log workouts, track daily steps, and burn calories to level up!
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => {
              setShowAddForm(prev => !prev);
              setShowSettings(false);
            }}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-rpg-discipline hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Log Fitness Data
          </button>
          <button 
            onClick={() => {
              setShowSettings(prev => !prev);
              setShowAddForm(false);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-rpg-border/40 text-slate-300 hover:text-white font-extrabold text-xs flex items-center justify-center gap-1 shadow hover:bg-slate-800 transition-all"
          >
            <Sliders className="w-4 h-4" /> Config Targets
          </button>
        </div>
      </div>

      {/* EXPANDABLE FORMS */}
      {showSettings && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            ⚙️ Tune Fitness Target Quest
          </h3>
          <form onSubmit={handleSettingsSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold text-slate-400">
            <div>
              <label className="block uppercase tracking-wider mb-1.5">Steps Target (steps/day)</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                value={stepsTarget}
                onChange={(e) => setStepsTarget(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1.5">Workout duration Target (mins/day)</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                value={durationTarget}
                onChange={(e) => setDurationTarget(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider mb-1.5">Calories Target (kcal/day)</label>
              <input
                type="number"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                value={caloriesTarget}
                onChange={(e) => setCaloriesTarget(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-rpg-level to-indigo-600 text-white font-bold tracking-wide shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Seal Target Parameters
              </button>
            </div>
          </form>
        </div>
      )}

      {showAddForm && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            🏋️ Inject Fitness Quest Entry
          </h3>
          <form onSubmit={handleLogSubmit} className="space-y-4 text-xs font-semibold text-slate-400">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block uppercase tracking-wider mb-1.5">Workout type</label>
                <div className="relative">
                  <select
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white appearance-none focus:outline-none focus:border-rpg-xp transition-all"
                    value={workoutType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    {WORKOUT_TYPES.map(type => (
                      <option key={type.name} value={type.name}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5">Workout Duration (Minutes)</label>
                <input
                  type="number"
                  placeholder="e.g. 45"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                  value={workoutDuration}
                  onChange={(e) => handleDurationChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5">Steps Count (If applicable)</label>
                <input
                  type="number"
                  placeholder="e.g. 6500"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block uppercase tracking-wider mb-1.5">
                  Calories Burned (kcal) <span className="text-[10px] text-rpg-gold font-normal lowercase">(estimated automatically, but customizable)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 350"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                  value={caloriesBurned}
                  onChange={(e) => setCaloriesBurned(e.target.value)}
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1.5">Log Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block uppercase tracking-wider mb-1.5">Workout notes / Achievements</label>
              <input
                type="text"
                placeholder="e.g. Felt strong on overhead presses! / Ran 5km under 25 mins"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-xp transition-all"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-rpg-border/20">
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-rpg-gold" />
                Sealing this contract awards +15 XP and +5 Gold Coins!
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-rpg-discipline to-emerald-600 text-slate-950 font-extrabold tracking-wide shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Log Entry & Claim Loot
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TODAY OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Steps Stats Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-rpg-xp animate-bounce" /> Walking Steps
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-rpg-border/40 text-rpg-xp">
              Target: {user.stepsTarget || 10000}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{todaySteps.toLocaleString()}</span>
            <span className="text-xs text-slate-500 font-bold">steps today</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-rpg-border/40 p-[1.5px]">
              <div 
                className="h-full bg-gradient-to-r from-rpg-xp to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${stepsPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Progress</span>
              <span className="text-white">{stepsPct}%</span>
            </div>
          </div>
        </div>

        {/* Workout Duration Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rpg-level" /> Workout Minutes
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-rpg-border/40 text-rpg-level">
              Target: {user.workoutDurationTarget || 30} mins
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{todayDuration}</span>
            <span className="text-xs text-slate-500 font-bold">mins logged</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-rpg-border/40 p-[1.5px]">
              <div 
                className="h-full bg-gradient-to-r from-rpg-level to-indigo-400 rounded-full transition-all duration-300"
                style={{ width: `${durationPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Progress</span>
              <span className="text-white">{durationPct}%</span>
            </div>
          </div>
        </div>

        {/* Calories Burned Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-rpg-health animate-pulse" /> Calories Burned
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-rpg-border/40 text-rpg-health">
              Target: {user.caloriesTarget || 500} kcal
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{todayCalories}</span>
            <span className="text-xs text-slate-500 font-bold">kcal active</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-rpg-border/40 p-[1.5px]">
              <div 
                className="h-full bg-gradient-to-r from-rpg-health to-orange-400 rounded-full transition-all duration-300"
                style={{ width: `${caloriesPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
              <span>Progress</span>
              <span className="text-white">{caloriesPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* DAILY PERFORMANCE GRAPH */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Daily Performance
            <span className="text-[10px] font-semibold text-slate-500 normal-case tracking-normal">— last 30 days</span>
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Today: <span className="text-white">{currentPerfScore}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              30-Day Avg: <span className="text-white">{avgPerfScore}%</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <span className="flex items-center gap-1.5"><Footprints className="w-3 h-3 text-cyan-400" /> Steps</span>
          <span className="flex items-center gap-1.5"><Flame className="w-3 h-3 text-orange-400" /> Calories</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-indigo-400" /> Duration</span>
          <span className="text-slate-600">— combined avg % of daily targets</span>
        </div>

        <div className="rounded-xl bg-slate-950/40 border border-rpg-border/20 p-3">
          <svg viewBox={`0 0 ${perfW} ${perfH}`} className="w-full overflow-visible select-none">
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[25, 50, 75, 100].map((yv, idx) => {
              const y = perfPT + perfCH - (yv / 100) * perfCH;
              return (
                <g key={idx} opacity="0.12">
                  <line x1={perfPL} y1={y} x2={perfW - perfPR} y2={y} stroke="#cbd5e1" strokeDasharray="3,3" />
                  <text x={perfPL - 5} y={y + 3} fill="#cbd5e1" fontSize="7" textAnchor="end" fontWeight="bold">{yv}%</text>
                </g>
              );
            })}

            {/* Avg reference line */}
            {(() => {
              const avgY = perfPT + perfCH - (avgPerfScore / 100) * perfCH;
              return (
                <line x1={perfPL} y1={avgY} x2={perfW - perfPR} y2={avgY}
                  stroke="#818cf8" strokeWidth="1" strokeDasharray="5,4" opacity="0.5" />
              );
            })()}

            {/* X-axis date labels */}
            {perfLabels.map((lbl, idx) => {
              if (!lbl) return null;
              const x = perfPL + (idx / (dailyPerfData.length - 1)) * perfCW;
              return (
                <text key={idx} x={x} y={perfH - 6} fill="#94a3b8" fontSize="7.5"
                  textAnchor="middle" fontWeight="bold" opacity="0.7">{lbl}</text>
              );
            })}

            {/* Area fill */}
            <path d={perfArea} fill="url(#perfGrad)" />

            {/* Line */}
            <path d={perfLine} fill="none" stroke="#34d399" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />

            {/* Data dots for every 5th day */}
            {perfPts.map((pt, idx) => {
              if (idx % 5 !== 0 && idx !== perfPts.length - 1) return null;
              return (
                <circle key={idx} cx={pt.x} cy={pt.y} r="3"
                  fill="#34d399" stroke="#0f172a" strokeWidth="1.5" />
              );
            })}

            {/* Animated highlight on today */}
            <circle cx={perfLast.x} cy={perfLast.y} r="5"
              fill="#34d399" stroke="#0f172a" strokeWidth="2" />
            <circle cx={perfLast.x} cy={perfLast.y} r="9"
              fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.4"
              className="animate-ping" />
          </svg>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly chart */}
        <div className="lg:col-span-2 glass-card p-3 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            📊 Weekly Fitness Report
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Steps line chart */}
            {(() => {
              const W = 320, H = 110, PL = 30, PR = 10, PT = 12, PB = 22;
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
                <div className="p-2 rounded-xl bg-slate-950/40 border border-rpg-border/20 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Footprints className="w-3 h-3 text-cyan-400" /> Steps Walked</span>
                    <span className="text-cyan-400">{weeklyChartData[weeklyChartData.length-1].steps.toLocaleString()}</span>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible select-none">
                    <defs>
                      <linearGradient id="wStepsGrad" x1="0" y1="0" x2="0" y2="1">
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
                    <path d={area} fill="url(#wStepsGrad)" />
                    <path d={line} fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#06b6d4" stroke="#0f172a" strokeWidth="1.5" />)}
                    <circle cx={last.x} cy={last.y} r="5" fill="#06b6d4" stroke="#0f172a" strokeWidth="2" />
                    <circle cx={last.x} cy={last.y} r="9" fill="none" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
                  </svg>
                </div>
              );
            })()}

            {/* Calories line chart */}
            {(() => {
              const W = 320, H = 110, PL = 30, PR = 10, PT = 12, PB = 22;
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
                <div className="p-2 rounded-xl bg-slate-950/40 border border-rpg-border/20 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> Calories Burned</span>
                    <span className="text-orange-400">{weeklyChartData[weeklyChartData.length-1].calories} kcal</span>
                  </div>
                  <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible select-none">
                    <defs>
                      <linearGradient id="wCalGrad" x1="0" y1="0" x2="0" y2="1">
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
                    <path d={area} fill="url(#wCalGrad)" />
                    <path d={line} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {pts.map((pt, i) => <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#f97316" stroke="#0f172a" strokeWidth="1.5" />)}
                    <circle cx={last.x} cy={last.y} r="5" fill="#f97316" stroke="#0f172a" strokeWidth="2" />
                    <circle cx={last.x} cy={last.y} r="9" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.4" className="animate-ping" />
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>


        {/* Historical Logs List */}
        <div className="glass-card p-5 space-y-4 flex flex-col">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            ⚔️ Fitness Logs History
          </h3>
          
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[300px] no-scrollbar">
            {fitnessLogs.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-semibold border border-dashed border-rpg-border/40 rounded-xl">
                🛡️ No logs found. Complete your workouts and keep tabs here!
              </div>
            ) : (
              fitnessLogs.slice(0, 15).map(log => {
                const dayOfWeek = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                const dayMonth = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950/40 border border-rpg-border/30 flex items-center justify-between gap-3 group relative">
                    <div className="flex items-center gap-3 truncate">
                      <div className="w-9 h-9 rounded-lg bg-slate-900 border border-rpg-border/40 flex items-center justify-center text-lg flex-shrink-0">
                        {getWorkoutIcon(log.workoutType)}
                      </div>
                      
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{log.workoutType}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">{dayOfWeek}, {dayMonth}</span>
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
                      className="text-slate-600 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
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
    </div>
  );
};
