import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Send, Bot, User, BrainCircuit, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  suggestedRoutine?: any[]; // for importable routines
}

export const AIChat: React.FC = () => {
  const { user, tasks, addTask } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      id: 'welcome', 
      sender: 'ai', 
      text: `Greetings, Hero ${user.name}! I am FocusFlow, your AI companion. I can analyze your schedule, critique your discipline score, generate custom time-block routines, or offer motivational RPG advice. Click an option below or type a query!` 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Handle local AI responses
  const getAIResponse = (input: string): ChatMessage => {
    const query = input.toLowerCase();
    const id = Math.random().toString(36).substr(2, 9);
    
    // 1. Routine generator
    if (query.includes('routine') || query.includes('schedule') || query.includes('plan')) {
      const routine = [
        { title: '🌅 Morning Mind Clarity (Journal/Meditate)', startTime: '07:00', endTime: '07:30', priority: 'medium', category: 'mind', color: '#6366f1', recurring: true },
        { title: '💻 Focus Sprint (Coding/Learning)', startTime: '09:00', endTime: '11:00', priority: 'high', category: 'work', color: '#8b5cf6', recurring: true },
        { title: '🏃 Fitness Training (Gym)', startTime: '17:00', endTime: '18:00', priority: 'medium', category: 'fitness', color: '#10b981', recurring: true },
        { title: '🧘 Review & Scribe (Wind Down)', startTime: '21:30', endTime: '22:00', priority: 'low', category: 'routine', color: '#fbbf24', recurring: true }
      ];

      return {
        id,
        sender: 'ai',
        text: `Here is a custom **RPG Focus Routine** template. It allocates dedicated time blocks for mental clarity, professional sprints, and fitness. You can click 'Apply Routine' below to inject these blocks directly into your planner schedule!`,
        suggestedRoutine: routine
      };
    }

    // 2. Schedule Critique
    if (query.includes('critique') || query.includes('analyze') || query.includes('score')) {
      const discipline = user.disciplineScore;
      let critiqueText = ``;

      if (tasks.length === 0) {
        critiqueText = `Your timeline scroll is completely blank, Hero! Procrastination will breach your defense. I suggest creating at least 3 scheduled task blocks to establish your guard.`;
      } else if (discipline < 50) {
        critiqueText = `Warning! Your Discipline Score is currently at **${discipline}%**. Your character defense stats are weakened. You have several pending schedule blocks. Try starting a **Pomodoro Focus session** to complete a scheduled work block and recover your XP.`;
      } else {
        critiqueText = `Superb status! Your Discipline Score is at a solid **${discipline}%**. You have completed ${tasks.filter(t=>t.completed).length} of your scheduled task blocks today. Keep maintaining this streak to unlock rare legendary badges!`;
      }

      return {
        id,
        sender: 'ai',
        text: `**Schedule Critique Analysis:**\n\n` + critiqueText
      };
    }

    // 3. Motivation
    if (query.includes('motivate') || query.includes('quote') || query.includes('inspiration')) {
      const quotes = [
        "Undisciplined heroes fade into memory. Consistent knights are carved in gold.",
        "Your future stats are determined by your current grind. Slay this hour's tasks!",
        "Failing a quest is temporary. Quitting the schedule is permanent defeat. Pick up your focus shield!",
        "Every focus block you complete is a strike to your procrastination dragon."
      ];
      const q = quotes[Math.floor(Math.random() * quotes.length)];
      return {
        id,
        sender: 'ai',
        text: `*The Oracle whispers motivation to your ears:*\n\n"${q}"`
      };
    }

    // Default chat
    return {
      id,
      sender: 'ai',
      text: `I understand, Hero. To help you level up: try typing **"generate routine"** to get an importable schedule template, **"analyze schedule"** to get a critique of your day's productivity, or **"give motivation"** for inspirational RPG quotes.`
    };
  };

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    // 1. Add user message
    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'user',
      text
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // 2. Simulate AI Typing delay
    setTimeout(() => {
      const aiResponse = getAIResponse(text);
      setMessages(prev => [...prev, aiResponse]);
    }, 600);
  };

  const handleImportRoutine = (routine: any[]) => {
    routine.forEach(r => {
      addTask(r);
    });

    // Notify user in chat
    const confirmMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'ai',
      text: `✨ Successfully imported **${routine.length} time blocks** into your Planner timeline!`
    };
    setMessages(prev => [...prev, confirmMsg]);
  };

  return (
    <div className="glass-card flex flex-col h-[520px] relative overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-rpg-border/30 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-rpg-level/10 border border-rpg-level/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-rpg-level" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">FocusFlow AI Companion</h4>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rpg-discipline animate-ping" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active System Oracle</span>
            </div>
          </div>
        </div>
        <BrainCircuit className="w-5 h-5 text-slate-600" />
      </div>

      {/* Message Feed */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m) => {
          const isAI = m.sender === 'ai';
          return (
            <div 
              key={m.id}
              className={`flex items-start gap-2.5 max-w-[85%] ${isAI ? '' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Profile icon */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                isAI ? 'bg-rpg-level/10 text-rpg-level border border-rpg-level/20' : 'bg-slate-950 text-slate-300 border border-rpg-border/40'
              }`}>
                {isAI ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Chat Bubble */}
              <div className="space-y-3">
                <div 
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans font-medium ${
                    isAI 
                      ? 'bg-slate-900 border border-rpg-border/40 text-slate-200 rounded-tl-sm' 
                      : 'bg-gradient-to-br from-rpg-xp to-indigo-700 text-white rounded-tr-sm shadow-md'
                  }`}
                >
                  {/* Handle basic markdown bullet rendering in UI */}
                  {m.text.split('\n').map((line, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                      {line.startsWith('*') ? `• ${line.replace(/\*+/g, '')}` : line.replace(/\*+/g, '')}
                    </p>
                  ))}
                </div>

                {/* Import routine buttons */}
                {m.suggestedRoutine && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-rpg-border/40 space-y-2">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Suggested Blocks:</div>
                    <div className="space-y-1">
                      {m.suggestedRoutine.map((block, idx) => (
                        <div key={idx} className="flex justify-between text-[10px] text-white">
                          <span>{block.title}</span>
                          <span className="text-slate-500">{block.startTime} - {block.endTime}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleImportRoutine(m.suggestedRoutine!)}
                      className="w-full py-1.5 rounded bg-rpg-discipline hover:opacity-90 text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 mt-2"
                    >
                      Apply Routine to Calendar <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}

      </div>

      {/* Quick Action Chips */}
      <div className="p-2 border-t border-rpg-border/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950/20">
        {[
          { label: 'Critique My Schedule', trigger: 'Analyze My Schedule' },
          { label: 'Generate Focus Routine', trigger: 'Generate Routine' },
          { label: 'Give Me Motivation', trigger: 'Give Motivation' }
        ].map(chip => (
          <button
            key={chip.label}
            onClick={() => handleSend(chip.trigger)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-rpg-border/30 text-[10px] font-bold text-slate-300 hover:text-white transition-all"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input controls */}
      <div className="p-3.5 border-t border-rpg-border/20 bg-slate-950/60 flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask Oracle to critique schedule, motivate, generate routine..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-rpg-border/60 text-white placeholder-slate-700 text-xs font-semibold focus:outline-none focus:border-rpg-level transition-all"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend(inputText);
          }}
        />
        <button
          onClick={() => handleSend(inputText)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-rpg-level to-indigo-600 text-white font-bold hover:opacity-90 active:scale-95 transition-all shadow-md shadow-rpg-level/10"
        >
          <Send className="w-4 h-4 fill-current" />
        </button>
      </div>

    </div>
  );
};
