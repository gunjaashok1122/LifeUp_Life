import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, RotateCcw, Award, Timer } from 'lucide-react';

export const FocusMode: React.FC = () => {
  const { incrementQuestProgress } = useApp();
  
  // Timer States
  const activeUid = localStorage.getItem('lvl_uid') || 'guest';
  const [duration, setDuration] = useState(30 * 60); // Default 30 mins
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [customMinInput, setCustomMinInput] = useState<string>("30");
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  const [regularPresets, setRegularPresets] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_regular_presets`);
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Coding', minutes: 30 },
        { id: '2', name: 'Reading', minutes: 15 }
      ];
    } catch (e) {
      return [];
    }
  });
  const [activePresetName, setActivePresetName] = useState<string | null>(null);
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetMins, setNewPresetMins] = useState('');

  const [sessionHistory, setSessionHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`lvl_${activeUid}_focus_history`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`lvl_${activeUid}_focus_history`, JSON.stringify(sessionHistory));
  }, [sessionHistory, activeUid]);

  useEffect(() => {
    localStorage.setItem(`lvl_${activeUid}_regular_presets`, JSON.stringify(regularPresets));
  }, [regularPresets, activeUid]);

  const timerRef = useRef<any>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- Timer Core Logic ---
  // Decrement timer
  useEffect(() => {
    let intervalId: any = null;
    if (isActive && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isActive, timeLeft]);

  // Trigger session completion side effects when timeLeft reaches 0
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      handleTimerComplete();
    }
  }, [timeLeft, isActive]);

  const handleTimerComplete = () => {
    setIsActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (!isBreak) {
      // Completed Focus block!
      incrementQuestProgress('focus');
      setCompletedSessions(prev => prev + 1);

      // Add to session history
      const historyItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: activePresetName || '',
        type: 'focus',
        duration: Math.round(duration / 60),
        timestamp: Date.now()
      };
      setSessionHistory(prev => [historyItem, ...prev]);

      // Trigger alarm notification
      playAlarmSound();
      
      // Auto toggle to break, but do not start automatically
      setIsBreak(true);
      setActivePresetName(null);
      setTimeLeft(5 * 60); // 5 mins break
    } else {
      // Completed Break
      playAlarmSound();

      setIsBreak(false);
      setActivePresetName(null);
      setTimeLeft(duration);
    }
  };

  const playAlarmSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      // Play sequence of double-beeps
      const playBeep = (time: number, beepDuration: number, freq: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.5, time + 0.02);
        gain.gain.setValueAtTime(0.5, time + beepDuration - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, time + beepDuration);
        
        osc.connect(gain).connect(ctx.destination);
        osc.start(time);
        osc.stop(time + beepDuration);
      };

      const now = ctx.currentTime;
      
      // Beep-beep 1
      playBeep(now, 0.15, 880);
      playBeep(now + 0.2, 0.15, 880);
      
      // Beep-beep 2
      playBeep(now + 0.6, 0.15, 880);
      playBeep(now + 0.8, 0.15, 880);
      
      // Beep-beep 3
      playBeep(now + 1.2, 0.15, 880);
      playBeep(now + 1.4, 0.15, 880);

      // Beep-beep 4 (higher alert pitch)
      playBeep(now + 1.8, 0.2, 1046.5);
      playBeep(now + 2.1, 0.3, 1046.5);
      
    } catch (e) {
      console.error("Failed to play alarm sound:", e);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setActivePresetName(null);
    setTimeLeft(duration);
  };

  const setCustomDuration = (minutes: number) => {
    setIsActive(false);
    setIsBreak(false);
    setActivePresetName(null);
    setDuration(minutes * 60);
    setTimeLeft(minutes * 60);
    setCustomMinInput(String(minutes));
  };

  const handleCustomMinChange = (valStr: string) => {
    setCustomMinInput(valStr);
    
    if (valStr === '') {
      setIsActive(false);
      setIsBreak(false);
      setActivePresetName(null);
      setDuration(0);
      setTimeLeft(0);
      return;
    }

    const mins = parseInt(valStr);
    if (!isNaN(mins)) {
      const clampedMins = Math.max(0, Math.min(180, mins));
      setIsActive(false);
      setIsBreak(false);
      setActivePresetName(null);
      setDuration(clampedMins * 60);
      setTimeLeft(clampedMins * 60);
    }
  };

  const startPresetSession = (preset: any) => {
    setActivePresetName(preset.name);
    setDuration(preset.minutes * 60);
    setTimeLeft(preset.minutes * 60);
    setIsBreak(false);
    setIsActive(true);
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    const mins = parseInt(newPresetMins);
    if (isNaN(mins) || mins <= 0) return;
    
    const newPreset = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPresetName.trim(),
      minutes: mins
    };
    
    setRegularPresets(prev => [...prev, newPreset]);
    setNewPresetName('');
    setNewPresetMins('');
    setIsAddingPreset(false);
  };

  const handleDeletePreset = (id: string) => {
    setRegularPresets(prev => prev.filter(p => p.id !== id));
  };

  // Helper formatting
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const currentPercent = duration === 0 ? 0 : (timeLeft / (isBreak ? 5 * 60 : duration)) * 100;

  return (
    <div className="space-y-6">
      
      {/* Countdown Visualizer */}
      <div className="glass-card p-8 relative overflow-hidden">
        {/* Neon focus glow backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative z-10">
          
          {/* Left Column: Timer, Custom Time & Controls */}
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5 justify-center">
                <Timer className="w-5 h-5 text-rpg-level animate-pulse" /> Focus Sanctuary
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {isBreak ? '☕ Rest Period - Regenerate Mana' : '⚔️ Deep Focus Session - Slay Distractions'}
              </p>
            </div>

            {/* Large Countdown Circular Ring */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <svg width="240" height="240" className="transform -rotate-90">
                <circle
                  stroke="rgba(34, 49, 80, 0.4)"
                  fill="transparent"
                  strokeWidth="10"
                  r="105"
                  cx="120"
                  cy="120"
                />
                <circle
                  stroke={isBreak ? '#10b981' : '#a855f7'}
                  fill="transparent"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 105}
                  strokeDashoffset={2 * Math.PI * 105 - (currentPercent / 100) * (2 * Math.PI * 105)}
                  strokeLinecap="round"
                  r="105"
                  cx="120"
                  cy="120"
                  className="transition-all duration-1000 ease-linear"
                  style={{ filter: `drop-shadow(0 0 6px ${isBreak ? 'rgba(16,185,129,0.3)' : 'rgba(168,85,247,0.3)'})` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black font-sans tracking-tight text-white select-none">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  Time Remaining
                </span>
              </div>
            </div>

            {/* Custom Time Selection (Select Duration) */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Select Duration</span>
                <span className="text-rpg-level">{Math.floor(duration / 60)} Minutes</span>
              </div>
              
              <div className="grid grid-cols-5 gap-1.5">
                {isEditingCustom ? (
                  <div className="relative flex items-center bg-slate-950 rounded-lg border border-rpg-level transition-colors px-1.5 py-0.5">
                    <input
                      type="number"
                      min="0"
                      max="180"
                      placeholder="00"
                      value={customMinInput}
                      onChange={(e) => handleCustomMinChange(e.target.value)}
                      onBlur={() => {
                        if (customMinInput === '' || customMinInput === '0') {
                          setIsEditingCustom(false);
                        }
                      }}
                      className="w-full bg-transparent text-white font-extrabold focus:outline-none text-center text-[10px] no-spinners"
                      autoFocus
                    />
                    <span className="text-[8px] text-slate-600 font-extrabold uppercase select-none">Min</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingCustom(true);
                      if (customMinInput === '' || customMinInput === '0' || [15, 30, 45, 60].includes(Math.floor(duration / 60))) {
                        setCustomMinInput('');
                      }
                    }}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer truncate ${
                      ![15, 30, 45, 60].includes(Math.floor(duration / 60)) && !isBreak
                        ? 'bg-rpg-level/20 border-rpg-level text-white shadow shadow-rpg-level/10'
                        : 'bg-slate-950 border-rpg-border/40 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {customMinInput && customMinInput !== '0' && ![15, 30, 45, 60].includes(parseInt(customMinInput)) ? `${customMinInput} Min` : 'Custom'}
                  </button>
                )}

                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setCustomDuration(mins)}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                      Math.floor(duration / 60) === mins && !isBreak
                        ? 'bg-rpg-level/20 border-rpg-level text-white shadow shadow-rpg-level/10'
                        : 'bg-slate-950 border-rpg-border/40 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {mins}M
                  </button>
                ))}
              </div>
            </div>

            {/* Controls bar */}
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="flex items-center gap-4">
                <button
                  onClick={resetTimer}
                  className="p-3.5 rounded-xl bg-slate-950 border border-rpg-border hover:bg-slate-900 text-slate-400 hover:text-white transition-all active:scale-95"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={toggleTimer}
                  className={`p-5 rounded-full text-white font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95 ${
                    isActive 
                      ? 'bg-slate-900 border border-rpg-level/50 hover:bg-slate-800' 
                      : 'bg-gradient-to-r from-rpg-level to-indigo-600 shadow-rpg-level/20 animate-glow'
                  }`}
                >
                  {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>
              </div>

              {/* Session complete counter */}
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border border-rpg-border/50 rounded-xl text-xs font-bold text-slate-400">
                <Award className="w-4 h-4 text-rpg-gold" />
                <span>Today's Sessions Cleared: </span>
                <span className="text-white font-extrabold">{completedSessions}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Regular Focus Presets */}
          <div className="flex flex-col space-y-4 h-full justify-start border-t border-slate-800 pt-6 md:border-t-0 md:pt-0 md:border-l md:border-slate-850 md:pl-8">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Regular Focus</span>
              {!isAddingPreset && (
                <button
                  onClick={() => setIsAddingPreset(true)}
                  className="text-rpg-level hover:text-purple-400 transition-colors flex items-center gap-1 font-bold lowercase tracking-normal"
                >
                  <span className="text-xs font-black">+</span> add preset
                </button>
              )}
            </div>

            {isAddingPreset && (
              <form onSubmit={handleAddPreset} className="space-y-2 p-2 bg-slate-950/80 rounded-lg border border-rpg-border/40">
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    placeholder="Name (e.g. Coding)"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    className="w-full bg-slate-900 text-white font-semibold rounded px-2 py-1 text-[10px] focus:outline-none border border-rpg-border/20 focus:border-rpg-level"
                    required
                  />
                  <div className="flex items-center gap-1 bg-slate-900 rounded border border-rpg-border/20 px-2">
                    <input
                      type="number"
                      min="1"
                      max="180"
                      placeholder="Mins"
                      value={newPresetMins}
                      onChange={(e) => setNewPresetMins(e.target.value)}
                      className="w-full bg-transparent text-white font-semibold py-1 text-[10px] focus:outline-none no-spinners"
                      required
                    />
                    <span className="text-[8px] text-slate-500 font-extrabold uppercase">Min</span>
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 text-[9px] font-bold">
                  <button
                    type="button"
                    onClick={() => setIsAddingPreset(false)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-gradient-to-r from-rpg-level to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded transition-all shadow shadow-purple-500/10"
                  >
                    Save Preset
                  </button>
                </div>
              </form>
            )}

            {regularPresets.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {[...regularPresets]
                  .sort((a, b) => a.minutes - b.minutes)
                  .map(preset => (
                    <div
                      key={preset.id}
                      className="group relative flex items-center bg-slate-950 hover:bg-slate-900 border border-rpg-border/40 hover:border-rpg-level/50 rounded-lg transition-all"
                    >
                      <button
                        onClick={() => startPresetSession(preset)}
                        className="pl-3 pr-2 py-1.5 text-xs font-bold text-slate-300 group-hover:text-white transition-colors cursor-pointer select-none"
                      >
                        {preset.name} <span className="text-[10px] text-rpg-level/80 group-hover:text-rpg-level ml-1 font-semibold">({preset.minutes}M)</span>
                      </button>
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="pr-2.5 pl-0.5 py-1.5 text-slate-600 hover:text-red-400 text-sm font-bold transition-colors cursor-pointer"
                        title="Delete Preset"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-[9px] text-slate-600 font-semibold italic">No presets added yet.</p>
            )}
          </div>

        </div>

      </div>

      {/* Session History */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-rpg-border/30 pb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            📜 Focus Log & History
          </h3>
          {sessionHistory.length > 0 && (
            <button
              onClick={() => setSessionHistory([])}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        {sessionHistory.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-xs font-semibold">
            🛡️ Your logs are empty. Complete a focus session to record history!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1 no-scrollbar">
            {sessionHistory.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/40 border border-rpg-border/20 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div>
                    <div className="font-bold text-white text-sm">
                      {item.name ? `${item.name} - ` : ''}{item.duration} Mins
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
