import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AvatarBuilder } from '../components/AvatarBuilder';
import { TrendGraph } from '../components/TrendGraph';
import { Flame, Plus, Droplet, ArrowRight, CheckCircle2, MessageSquare, Dumbbell, Timer, X, Check } from 'lucide-react';

const MOTIVATIONAL_QUOTES = [
  "Focus is a muscle, and today is your training day. Lock in and crush your milestones!",
  "Great things are built block by block. Win this hour, win the day!",
  "Your future self is waiting for you to get to work. Make them proud today!",
  "Eliminate the noise. Protect your focus like a warrior protecting their fortress.",
  "Doubt whispers, but discipline roars. Push through and conquer your routine!",
  "Small daily victories accumulate into massive lifetime success. Stay consistent!",
  "The secret of your future is hidden in your daily routine. Fuel your fire today!",
  "Don't wish it were easier; make yourself stronger. Stand tall and take action!",
  "Action cures fear and defeats laziness. Open your planner and make your mark!",
  "Energy flows where attention goes. Focus your mind on what truly matters today.",
  "Distraction is the thief of dreams. Put your shield up and stay locked into the zone.",
  "You don't need motivation; you need execution. Take the first step right now!",
  "The pain of self-discipline is far less than the pain of regret. Keep moving forward!",
  "Focus on progress, not perfection. Every single completed task is a step towards greatness.",
  "You are the master of your time. Rule your day with absolute focus and clarity!",
  "Rise above the excuses. Excellence is not an act, but a daily habit.",
  "Stay hungry, stay focused. The climb is tough, but the view from the summit is legendary!",
  "Success is the sum of small effort, repeated day in and day of focus. Stay on target!"
];

const getDailyQuoteIndex = (quotesLength: number) => {
  const d = new Date();
  const dateStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; // Local YYYY-M-D
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % quotesLength;
};

const GRAPH_COLORS = [
  { stroke: '#6366f1', stop: '#6366f1' }, // Indigo
  { stroke: '#10b981', stop: '#10b981' }, // Emerald
  { stroke: '#ec4899', stop: '#ec4899' }, // Pink
  { stroke: '#f59e0b', stop: '#f59e0b' }, // Amber
  { stroke: '#06b6d4', stop: '#06b6d4' }  // Cyan
];

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

const getPlanTrendData = (plan: any) => {
  const dates = getDatesInRange(plan.fromDate, plan.toDate);
  if (dates.length === 0) return { trend: [0, 0, 0, 0, 0, 0, 0], labels: ['', '', '', '', '', '', ''] };
  
  // Calculate completion percentage for each date
  const dailyData = dates.map(d => {
    let done = 0;
    const total = plan.routines?.length || 0;
    plan.routines?.forEach((r: any) => {
      const key = `${d}_${r.id}`;
      if (plan.completions && plan.completions[key]) {
        done++;
      }
    });
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { dateStr: d, pct };
  });

  // Sample exactly 7 points evenly spaced
  const numSamples = 7;
  const sampledData: number[] = [];
  const sampledLabels: string[] = [];

  for (let i = 0; i < numSamples; i++) {
    const index = Math.min(
      dailyData.length - 1,
      Math.round((i / (numSamples - 1)) * (dailyData.length - 1))
    );
    const item = dailyData[index];
    sampledData.push(item ? item.pct : 0);
    
    if (item) {
      const date = new Date(item.dateStr);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      sampledLabels.push(`${month} ${day}`);
    } else {
      sampledLabels.push('');
    }
  }

  return { trend: sampledData, labels: sampledLabels };
};

export const Dashboard: React.FC = () => {
  const { 
    user, 
    tasks, 
    toggleTask, 
    updateWater, 
    setScreen,
    fitnessLogs,
    longTermPlans,
    setTrackingPlanId,
    updateLongTermPlan
  } = useApp();

  const [activePlanForModal, setActivePlanForModal] = useState<any | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 3);




  const todayFitnessLogs = (fitnessLogs || []).filter(log => log.date === todayStr);
  const todaySteps = todayFitnessLogs.reduce((sum, log) => sum + (log.steps || 0), 0);
  const todayCalories = todayFitnessLogs.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
  const stepsTarget = user.stepsTarget || 10000;
  const caloriesTarget = user.caloriesTarget || 500;
  const stepsPct = Math.min(100, Math.round((todaySteps / stepsTarget) * 100));
  const caloriesPct = Math.min(100, Math.round((todayCalories / caloriesTarget) * 100));

  return (
    <div className="space-y-6">
      
      {/* --- HERO STATUS HEADER --- */}
      <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-rpg-level/10 rounded-full blur-xl pointer-events-none" />

        {/* Character Avatar */}
        <div className="relative group cursor-pointer" onClick={() => setScreen('profile')}>
          <AvatarBuilder config={user.avatar} size={110} />
        </div>

        {/* User Stats Feed */}
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-2xl font-black text-white font-sans tracking-tight">
            Welcome Back, {user.name}!
          </h2>

          <div className="text-xs font-semibold text-slate-400 italic max-w-md leading-relaxed border-l-2 border-rpg-xp pl-3.5 py-0.5 mt-2 bg-slate-950/40 rounded-r-xl pr-3">
            "{MOTIVATIONAL_QUOTES[getDailyQuoteIndex(MOTIVATIONAL_QUOTES.length)]}"
          </div>
        </div>

        {/* Streak Widget */}
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-950/60 border border-rpg-border/50 shadow-inner">
            <div className="w-8 h-8 rounded-lg bg-rpg-health/10 flex items-center justify-center border border-rpg-health/20">
              <Flame className="w-4 h-4 text-rpg-health animate-pulse" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Streak</div>
              <div className="text-sm font-bold text-white tracking-tight">{user.streak} Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- QUICK ACTION CENTER --- */}
      <div className="w-full">
        <button
          onClick={() => setScreen('focus')}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-rpg-level/10 to-indigo-950/20 border border-rpg-level/30 hover:border-rpg-level/60 hover:scale-[1.01] active:scale-95 transition-all text-left flex items-center justify-between group cursor-pointer"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Timer className="w-4 h-4 text-rpg-level" /> Enter Deep Focus Mode
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Start Pomodoro timer sessions and block distractions.
            </p>
          </div>
          <span className="p-2 py-1 rounded-lg bg-slate-950/60 border border-rpg-border/60 text-rpg-level font-black group-hover:bg-rpg-level group-hover:text-white transition-all text-xs">
            Focus →
          </span>
        </button>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Planning Progress Graph */}
        {longTermPlans.length === 0 ? (
          <div className="glass-card p-5 flex flex-col items-center justify-center text-center space-y-3 lg:col-span-2 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Planning Progress Graph</h3>
            <div className="text-xs text-slate-500 py-6 font-medium">
              📜 No active planning objectives found. Create long-term plans in the Planner to track your consistency graphs here!
            </div>
            <button 
              onClick={() => setScreen('planner')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white font-extrabold text-xs active:scale-95 transition-all shadow"
            >
              Create Plan
            </button>
          </div>
        ) : (
          <div className="glass-card p-5 flex flex-col space-y-4 lg:col-span-2 md:col-span-2">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider text-center">Planning Progress Graph</h3>
            
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1">
              {longTermPlans.map((plan, idx) => {
                const { trend, labels } = getPlanTrendData(plan);
                const colorConfig = GRAPH_COLORS[idx % GRAPH_COLORS.length];
                const currentVal = trend[trend.length - 1];

                return (
                  <TrendGraph 
                    key={plan.id}
                    data={trend}
                    months={labels}
                    color={colorConfig.stroke}
                    gradientId={`planTrendGrad_${plan.id}`}
                    stopColor={colorConfig.stop}
                    title={plan.title}
                    currentValue={currentVal}
                    onClick={() => {
                      setActivePlanForModal(plan);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        <div className="glass-card p-5 space-y-4 lg:col-span-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Upcoming Scheduled Quests
            </h3>
            <button 
              onClick={() => setScreen('planner')}
              className="text-xs font-bold text-rpg-xp hover:text-blue-400 transition-colors flex items-center gap-0.5"
            >
              Full Calendar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-medium border border-dashed border-rpg-border/40 rounded-xl">
                ☕ No upcoming time blocks. Ready for focus session?
              </div>
            ) : (
              upcomingTasks.map(t => (
                <div 
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-950/40 border border-rpg-border/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleTask(t.id)}
                      className="text-slate-600 hover:text-rpg-discipline transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5 hover:scale-105" />
                    </button>
                    <div>
                      <h4 className="text-sm font-bold text-white">{t.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>🕒 {t.startTime} - {t.endTime}</span>
                        <span 
                          className="px-1.5 rounded-sm"
                          style={{ 
                            backgroundColor: t.priority === 'high' ? 'rgba(239, 68, 68, 0.15)' : t.priority === 'medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: t.priority === 'high' ? '#f87171' : t.priority === 'medium' ? '#fbbf24' : '#60a5fa'
                          }}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setScreen('long-term-planning')}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rpg-xp/10 to-indigo-950/20 border border-rpg-xp/30 hover:border-rpg-xp/60 hover:scale-[1.01] active:scale-95 text-xs font-bold text-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            📅 Weekly & Monthly Planning
          </button>
        </div>

        {/* Water Intake Tracker */}
        <div className="glass-card p-5 space-y-4 lg:col-span-1 md:col-span-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-rpg-xp animate-pulse" /> Hydration Quest
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-rpg-border/40 text-rpg-xp">
              {user.waterIntake} / {user.waterTarget} ml
            </span>
          </div>

          {/* Water progress bar */}
          <div className="space-y-3">
            <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-rpg-border/40 p-[2px]">
              <div 
                className="h-full bg-gradient-to-r from-rpg-xp to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (user.waterIntake / user.waterTarget) * 100)}%` }}
              />
            </div>
            
            {/* Quick Logging Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => updateWater(250)}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-rpg-border/30 text-xs font-bold text-rpg-xp transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 250ml
              </button>
              <button 
                onClick={() => updateWater(500)}
                className="py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-rpg-border/30 text-xs font-bold text-rpg-xp transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 500ml
              </button>
              <button 
                onClick={() => updateWater(-250)}
                className="py-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-900 border border-red-900/30 text-xs font-semibold text-slate-500 transition-all"
              >
                Undo
              </button>
            </div>
          </div>
        </div>

        {/* Guild & Messages Widget */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between lg:col-span-1 md:col-span-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-rpg-level animate-pulse" /> Guild & Messages
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-rpg-border/40 text-rpg-level">
                {(user.friends || []).length} Members
              </span>
            </div>

            <div className="space-y-2">
              {(user.friends || []).length === 0 ? (
                <div className="text-center py-5 text-slate-500 text-xs font-medium border border-dashed border-rpg-border/40 rounded-xl px-2">
                  🛡️ No guild members yet. Add friends in Messages!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {(user.friends || []).slice(0, 3).map((friend) => (
                    <div
                      key={friend.uid}
                      onClick={() => setScreen('messages')}
                      className="p-2 rounded-xl bg-slate-950/40 border border-rpg-border/30 flex items-center justify-between cursor-pointer hover:border-rpg-border/60 hover:bg-slate-950/70 transition-all"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <AvatarBuilder config={friend.avatar} profilePicture={friend.profilePicture} size={24} showCamera={false} />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{friend.name}</div>
                          <div className="text-[9px] font-semibold text-slate-500 flex-shrink-0">@{friend.username}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-rpg-level uppercase tracking-wider flex-shrink-0">Chat →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setScreen('messages')}
            className="w-full py-1.5 rounded-lg bg-rpg-border hover:bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center gap-1 mt-2 transition-all"
          >
            Open Guild Chat
          </button>
        </div>

        {/* Fitness Quest Tracker */}
        <div className="glass-card p-5 flex flex-col justify-between space-y-3 lg:col-span-2 md:col-span-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-rpg-discipline animate-pulse" /> Fitness Quest
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 border border-rpg-border/40 text-rpg-discipline">
                Today
              </span>
            </div>

            {/* Steps & Calories progress side-by-side on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>🚶 Steps: {todaySteps.toLocaleString()} / {stepsTarget.toLocaleString()}</span>
                  <span>{stepsPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-rpg-border/40 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-rpg-xp to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${stepsPct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-bold text-slate-400">
                  <span>🔥 Calories: {todayCalories} / {caloriesTarget} kcal</span>
                  <span>{caloriesPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-rpg-border/40 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-rpg-health to-orange-400 rounded-full transition-all duration-300"
                    style={{ width: `${caloriesPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setScreen('fitness')}
            className="w-full py-1.5 rounded-lg bg-rpg-border hover:bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center gap-1 mt-2 transition-all"
          >
            Open Fitness Hub
          </button>
        </div>

      </div>

      {/* Local Planning Modal Overlay */}
      {(() => {
        const currentPlanInstance = activePlanForModal 
          ? longTermPlans.find(p => p.id === activePlanForModal.id) || activePlanForModal
          : null;
        if (!currentPlanInstance) return null;
        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto text-left">
            <div className="glass-card w-full max-w-6xl p-5 sm:p-6 border-indigo-500/30 flex flex-col gap-4 relative bg-slate-950/90 shadow-2xl max-h-[90vh]">
              
              {/* Close Button */}
              <button
                onClick={() => {
                  setActivePlanForModal(null);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 border border-rpg-border/40 text-slate-400 hover:text-white hover:border-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Modal Header */}
              <div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  Discipline Tracker Checklist
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
                  <span>📋</span> {currentPlanInstance.title}
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Period: {currentPlanInstance.targetDate}
                </p>
              </div>

              {/* Checklist Table */}
              <div className="overflow-x-auto rounded-xl border border-rpg-border/40 bg-slate-950/60 no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-rpg-border/30 bg-slate-950/80 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-950 z-20 border-r border-rpg-border/40 w-[180px]">
                        Habits / Routines
                      </th>
                      {getDatesInRange(currentPlanInstance.fromDate, currentPlanInstance.toDate).map(d => {
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
                    {currentPlanInstance.routines && currentPlanInstance.routines.map((routine: any) => (
                      <tr key={routine.id} className="border-b border-rpg-border/20 hover:bg-slate-900/20 transition-colors">
                        {/* Sticky Routine Header cell */}
                        <td className="sticky left-0 bg-slate-950 z-20 w-[180px] p-3 border-r border-rpg-border/40 text-xs font-bold text-slate-200">
                          <div className="truncate" title={routine.title}>{routine.title}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">⏰ {routine.startTime} - {routine.endTime}</div>
                        </td>
                        {/* Completion check cells */}
                        {getDatesInRange(currentPlanInstance.fromDate, currentPlanInstance.toDate).map(d => {
                          const todayStr = new Date().toLocaleDateString('en-CA');
                          const isFuture = d > todayStr;
                          const key = `${d}_${routine.id}`;
                          const isChecked = !!(currentPlanInstance.completions && currentPlanInstance.completions[key]);
                          const formattedDate = new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                          return (
                            <td key={d} className="p-2 text-center border-r border-rpg-border/20 last:border-r-0 w-[60px]">
                              <button
                                disabled={isFuture}
                                onClick={() => {
                                  // Toggle Routine Completion
                                  const completions = { ...(currentPlanInstance.completions || {}) };
                                  if (completions[key]) {
                                    delete completions[key];
                                  } else {
                                    completions[key] = true;
                                  }
                                  updateLongTermPlan({
                                    ...currentPlanInstance,
                                    completions
                                  });
                                }}
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
                      const dates = getDatesInRange(currentPlanInstance.fromDate, currentPlanInstance.toDate);
                      const stats = dates.map(d => {
                        let done = 0;
                        const total = currentPlanInstance.routines?.length || 0;
                        currentPlanInstance.routines?.forEach((r: any) => {
                          const key = `${d}_${r.id}`;
                          if (currentPlanInstance.completions && currentPlanInstance.completions[key]) {
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
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
