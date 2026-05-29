import React from 'react';

interface HeatMapProps {
  completedDates: string[]; // YYYY-MM-DD
  onDateClick?: (dateStr: string) => void;
}

export const HeatMap: React.FC<HeatMapProps> = ({ completedDates, onDateClick }) => {
  // Get days in the current month
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Number of days in current month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // Day of the week for the 1st of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Create array for empty placeholders (before first day)
  const blanks = Array(firstDayIndex).fill(null);
  
  // Create array of days [1, 2, ... daysInMonth]
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Combine blanks and days
  const gridCells = [...blanks, ...days];

  const getDayStatus = (dayNum: number | null): 'future' | 'none' | 'completed' => {
    if (dayNum === null) return 'none';
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const cellDate = new Date(year, month, dayNum);
    const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (cellDate > currentDate) {
      return 'future';
    }

    return completedDates.includes(dateStr) ? 'completed' : 'none';
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="p-3 rounded-xl bg-rpg-card/60 border border-rpg-border/30 backdrop-blur-md w-full max-w-[340px] mx-auto">
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-xs font-semibold text-slate-300">
          {monthNames[month]} {year}
        </h4>
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-rpg-discipline/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-rpg-discipline" />
          <span>More</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center justify-items-center">
        {/* Week Day Labels */}
        {weekDays.map((wd, i) => (
          <span key={i} className="text-[10px] font-bold text-slate-500 w-10 h-10 flex items-center justify-center">
            {wd}
          </span>
        ))}

        {/* Heatmap Grid Cells */}
        {gridCells.map((cell, index) => {
          if (cell === null) {
            return <div key={`blank-${index}`} className="w-10 h-10" />;
          }

          const status = getDayStatus(cell);
          const isToday = cell === today.getDate();

          let bgClass = 'bg-slate-800/40 border-slate-700/30';
          if (status === 'completed') {
            bgClass = 'bg-rpg-discipline border-rpg-discipline/60 shadow-[0_0_8px_rgba(16,185,129,0.4)] text-slate-900 font-semibold';
          } else if (status === 'future') {
            bgClass = 'bg-slate-900/20 border-slate-800/20 text-slate-600 cursor-not-allowed';
          }

          const isClickable = status !== 'future';
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(cell).padStart(2, '0')}`;

          return (
            <button
              key={`day-${cell}`}
              onClick={() => {
                if (isClickable && onDateClick) {
                  onDateClick(dateStr);
                }
              }}
              disabled={!isClickable}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs border transition-all duration-200 ${bgClass} ${
                isToday && status !== 'completed' ? 'border-rpg-xp text-rpg-xp font-semibold bg-rpg-xp/10' : ''
              } ${isClickable ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
              title={cell ? `Day ${cell}` : ''}
            >
              {cell}
            </button>
          );
        })}
      </div>
    </div>
  );
};
