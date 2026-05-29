import React from 'react';
import { useApp } from '../context/AppContext';
import { FocusBarChart, HabitLineChart, CategoryDonutChart } from '../components/AnalyticsCharts';
import { Sparkles, Calendar, TrendingUp, Hourglass } from 'lucide-react';

export const Analytics: React.FC = () => {
  const { tasks, user } = useApp();

  // 1. Calculate categories from real tasks
  const categoryCounts: Record<string, { count: number; color: string }> = {
    work: { count: 0, color: '#8b5cf6' },
    study: { count: 0, color: '#a855f7' },
    fitness: { count: 0, color: '#10b981' },
    mind: { count: 0, color: '#6366f1' },
    routine: { count: 0, color: '#fbbf24' },
    other: { count: 0, color: '#64748b' }
  };

  tasks.forEach(task => {
    const cat = task.category || 'other';
    if (categoryCounts[cat]) {
      categoryCounts[cat].count += 1;
    } else {
      categoryCounts['other'].count += 1;
    }
  });

  // Convert to chart format
  let categoryData = Object.entries(categoryCounts).map(([name, val]) => ({
    name,
    count: val.count,
    color: val.color
  }));

  // Fallback placeholder if no tasks are added yet
  const totalCounts = categoryData.reduce((acc, d) => acc + d.count, 0);
  if (totalCounts === 0) {
    categoryData = [
      { name: 'work', count: 4, color: '#8b5cf6' },
      { name: 'study', count: 2, color: '#a855f7' },
      { name: 'fitness', count: 1, color: '#10b981' },
      { name: 'mind', count: 1, color: '#6366f1' },
      { name: 'routine', count: 2, color: '#fbbf24' }
    ];
  }

  // Mock static data for focus hours
  const weeklyFocusData = [
    { label: 'Mon', value: 2.5 },
    { label: 'Tue', value: 4.0 },
    { label: 'Wed', value: 3.5 },
    { label: 'Thu', value: 5.0 },
    { label: 'Fri', value: 4.5 },
    { label: 'Sat', value: 1.5 },
    { label: 'Sun', value: 0.0 }
  ];

  // Mock static data for habit completion curve
  const weeklyHabitCompletionData = [
    { label: '5/19', rate: 60 },
    { label: '5/20', rate: 75 },
    { label: '5/21', rate: 70 },
    { label: '5/22', rate: 85 },
    { label: '5/23', rate: 90 },
    { label: '5/24', rate: 80 },
    { label: '5/25', rate: user.disciplineScore }
  ];

  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rpg-discipline/10 border border-rpg-discipline/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-rpg-discipline" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discipline Index</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{user.disciplineScore}%</div>
            <div className="text-[9px] text-rpg-discipline font-semibold mt-0.5">Defensive rating active</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rpg-xp/10 border border-rpg-xp/20 flex items-center justify-center">
            <Hourglass className="w-6 h-6 text-rpg-xp" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Focus Time</div>
            <div className="text-xl font-extrabold text-white mt-0.5">21 Hours</div>
            <div className="text-[9px] text-slate-400 font-semibold mt-0.5">Across 7 focus sessions</div>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rpg-level/10 border border-rpg-level/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-rpg-level" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Routine Consistency</div>
            <div className="text-xl font-extrabold text-white mt-0.5">85%</div>
            <div className="text-[9px] text-rpg-level font-semibold mt-0.5">Daily missions completion rate</div>
          </div>
        </div>

      </div>

      {/* SVG Charts Deck */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FocusBarChart data={weeklyFocusData} />
        <HabitLineChart data={weeklyHabitCompletionData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CategoryDonutChart data={categoryData} />
        </div>

        {/* Analytics Critique summary */}
        <div className="glass-card p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rpg-gold" /> System Report
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              You are displaying strong focus blocks in the **Morning Shifts**. However, your habits consistency drops on weekends. 
            </p>
          </div>
          <div className="p-3 bg-slate-950/60 border border-rpg-border/40 rounded-xl text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Adjustment</span>
            <div className="text-xs font-bold text-rpg-gold mt-1">Schedule Saturday Reading at 10 AM</div>
          </div>
        </div>
      </div>

    </div>
  );
};
