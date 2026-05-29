import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Moon, Sun, Briefcase, Dumbbell, BookOpen, ChevronRight, ChevronLeft } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [wakeTime, setWakeTime] = useState('06:00');
  const [sleepTime, setSleepTime] = useState('22:00');
  const [studyWorkHours, setStudyWorkHours] = useState('09:00-17:00');
  const [focusGoals, setFocusGoals] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([
    'Drink 2500ml Water',
    '30 Mins Daily Meditation'
  ]);
  const [fitnessGoal, setFitnessGoal] = useState('active');

  const habitTemplates = [
    { name: 'Drink 2500ml Water', desc: 'Hydration Quest', category: 'health' },
    { name: 'Go to Gym / Workout', desc: 'Strength Training', category: 'fitness' },
    { name: '30 Mins Daily Meditation', desc: 'Mental Clarity', category: 'mind' },
    { name: 'Read 10 Pages of Book', desc: 'Knowledge Buff', category: 'mind' },
    { name: 'Write Code / Project Work', desc: 'Craft Enhancement', category: 'work' },
    { name: 'Review Daily Time Blocks', desc: 'Focus Mastery', category: 'work' },
    { name: 'Sleep Before 11 PM', desc: 'Rest & Recover', category: 'health' }
  ];

  const goalTemplates = [
    { id: 'fitness', name: 'Physical Conditioning', desc: 'Improve fitness, endurance, and physical power', icon: <Dumbbell className="w-5 h-5 text-emerald-400" /> },
    { id: 'mind', name: 'Mental Fortitude', desc: 'Practice meditation, reading, and mental clarity', icon: <BookOpen className="w-5 h-5 text-indigo-400" /> },
    { id: 'career', name: 'Professional Slaying', desc: 'Advance career skills, writing code, and learning', icon: <Briefcase className="w-5 h-5 text-violet-400" /> }
  ];

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else {
      completeOnboarding({
        name: name || 'Hero',
        wakeTime,
        sleepTime,
        focusGoals,
        selectedHabits,
        studyWorkHours
      });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleGoal = (goalId: string) => {
    setFocusGoals(prev => 
      prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]
    );
  };

  const toggleHabit = (habitName: string) => {
    setSelectedHabits(prev => 
      prev.includes(habitName) ? prev.filter(h => h !== habitName) : [...prev, habitName]
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#070b13]">
      {/* Decorative Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-rpg-discipline/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rpg-level/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Onboarding Panel */}
      <div className="w-full max-w-lg p-8 rounded-3xl border border-rpg-border/30 bg-rpg-card/40 backdrop-blur-xl shadow-glass flex flex-col relative z-10">
        
        {/* Progress Dots */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Step {step} of 4
          </span>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(idx => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx <= step ? 'w-6 bg-rpg-discipline' : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Nickname */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Create Your Hero Profile <Sparkles className="w-6 h-6 text-rpg-gold animate-pulse" />
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Welcome to LevelUp Life. Choose your hero name to start mapping your daily quests.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Hero Nickname</label>
              <input
                type="text"
                placeholder="e.g. AlexTheGreat"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-rpg-border/60 text-white placeholder-slate-700 font-medium focus:outline-none focus:border-rpg-discipline focus:ring-1 focus:ring-rpg-discipline/30 transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Sleep & Work Times */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Establish Your Routine Cycle
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Schedules help the AI build time blocks. Tell us when you wake, sleep, and do deep focus.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-rpg-gold" /> Wake-Up
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-discipline transition-all"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" /> Bedtime
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-discipline transition-all"
                  value={sleepTime}
                  onChange={(e) => setSleepTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Work/Study Focus Window
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-rpg-border/60 text-white font-medium focus:outline-none focus:border-rpg-discipline transition-all"
                value={studyWorkHours}
                onChange={(e) => setStudyWorkHours(e.target.value)}
              >
                <option value="09:00-17:00">Standard Workday (9 AM - 5 PM)</option>
                <option value="08:00-13:00">Morning Shift (8 AM - 1 PM)</option>
                <option value="13:00-18:00">Afternoon Shift (1 PM - 6 PM)</option>
                <option value="20:00-24:00">Night Owl Focus (8 PM - Midnight)</option>
                <option value="none">No set work schedule (Flexible)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Life Goals & Fitness */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Select Your Life Paths
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Choose the attributes you want to maximize. Completing habits in these paths awards category multipliers.
              </p>
            </div>

            <div className="space-y-3">
              {goalTemplates.map(goal => {
                const selected = focusGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all ${
                      selected 
                        ? 'bg-rpg-discipline/10 border-rpg-discipline' 
                        : 'bg-slate-950/40 border-rpg-border/50 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="mt-0.5">{goal.icon}</div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{goal.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{goal.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Fitness Orientation
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['Active Lifestyle', 'Muscle Gain', 'Cardio Endurance', 'General Health'].map((fit) => {
                  const id = fit.toLowerCase().split(' ')[0];
                  return (
                    <button
                      key={fit}
                      type="button"
                      onClick={() => setFitnessGoal(id)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                        fitnessGoal === id 
                          ? 'bg-rpg-discipline text-slate-900 border-rpg-discipline' 
                          : 'bg-slate-900 border-rpg-border/40 text-slate-400'
                      }`}
                    >
                      {fit}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Habits Tracker selection */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Select Your Starting Habits
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Choose the daily rituals you wish to track. Consistency forms streaks and upgrades your discipline score.
              </p>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {habitTemplates.map((h, idx) => {
                const checked = selectedHabits.includes(h.name);
                return (
                  <label
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      checked 
                        ? 'bg-rpg-discipline/10 border-rpg-discipline' 
                        : 'bg-slate-950/40 border-rpg-border/50 hover:bg-slate-950/70'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{h.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5 font-bold">
                        {h.desc}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleHabit(h.name)}
                      className="w-4 h-4 rounded text-rpg-discipline focus:ring-rpg-discipline bg-slate-950 border-rpg-border/60"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-rpg-border/30">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1 text-slate-400 hover:text-white font-bold text-sm transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 rounded-xl bg-rpg-discipline text-slate-950 font-bold text-sm shadow-lg shadow-rpg-discipline/25 hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all flex items-center gap-1.5"
          >
            {step === 4 ? 'Generate Life Routine' : 'Continue'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
