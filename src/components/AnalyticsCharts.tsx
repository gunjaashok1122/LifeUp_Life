import React from 'react';

// --- Bar Chart for Focus Hours ---
interface BarChartProps {
  data: { label: string; value: number }[]; // value represents focus hours
}

export const FocusBarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value), 4); // Default height floor
  const height = 140;
  const width = 320;
  const paddingX = 35;
  const paddingY = 20;

  const chartHeight = height - paddingY * 2;
  const chartWidth = width - paddingX * 2;
  const barWidth = 24;
  const gap = (chartWidth - barWidth * data.length) / (data.length - 1);

  return (
    <div className="w-full p-4 rounded-2xl bg-rpg-card/60 border border-rpg-border/30 backdrop-blur-md">
      <h4 className="text-sm font-semibold text-slate-300 mb-3">Focus Hours (Weekly)</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="barGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingY + chartHeight - ratio * chartHeight;
          const valLabel = Math.round(ratio * maxValue);
          return (
            <g key={idx} opacity="0.15">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#cbd5e1" strokeDasharray="3,3" />
              <text x={paddingX - 8} y={y + 4} fill="#cbd5e1" fontSize="9" textAnchor="end">{valLabel}h</text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const x = paddingX + idx * (barWidth + gap);
          const barHeight = (item.value / maxValue) * chartHeight;
          const y = paddingY + chartHeight - barHeight;

          return (
            <g key={idx} className="group">
              {/* Tooltip on hover */}
              <title>{`${item.label}: ${item.value} hrs`}</title>
              
              {/* Main Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill="url(#barGlow)"
                className="transition-all duration-300 hover:fill-rpg-level"
              />
              
              {/* Glowing Outline */}
              {item.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                  opacity="0.3"
                  className="group-hover:opacity-100 transition-opacity"
                />
              )}

              {/* X Axis Label */}
              <text
                x={x + barWidth / 2}
                y={height - paddingY + 14}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
                fontWeight="500"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};


// --- Line Chart for Habit Completion Rates ---
interface LineChartProps {
  data: { label: string; rate: number }[]; // rate represents completion percentage (0 - 100)
}

export const HabitLineChart: React.FC<LineChartProps> = ({ data }) => {
  const height = 140;
  const width = 320;
  const paddingX = 35;
  const paddingY = 20;

  const chartHeight = height - paddingY * 2;
  const chartWidth = width - paddingX * 2;

  // Convert values to coordinate points
  const points = data.map((d, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (d.rate / 100) * chartHeight;
    return { x, y, label: d.label, rate: d.rate };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  // For area fill below the line
  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${paddingY + chartHeight} L ${points[0].x} ${paddingY + chartHeight} Z`
    : '';

  return (
    <div className="w-full p-4 rounded-2xl bg-rpg-card/60 border border-rpg-border/30 backdrop-blur-md">
      <h4 className="text-sm font-semibold text-slate-300 mb-3">Habit Completion Success Rate</h4>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y Axis Gridlines */}
        {[0, 25, 50, 75, 100].map((val, idx) => {
          const y = paddingY + chartHeight - (val / 100) * chartHeight;
          return (
            <g key={idx} opacity="0.15">
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#cbd5e1" strokeDasharray="3,3" />
              <text x={paddingX - 8} y={y + 4} fill="#cbd5e1" fontSize="9" textAnchor="end">{val}%</text>
            </g>
          );
        })}

        {/* Area Fill */}
        {areaD && <path d={areaD} fill="url(#areaGrad)" />}

        {/* Main Line */}
        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx} className="group">
            <title>{`${p.label}: ${p.rate}%`}</title>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#0b0f19"
              stroke="#10b981"
              strokeWidth="2.5"
              className="hover:r-[6] transition-all cursor-pointer"
            />
            {/* X Labels */}
            {idx % 2 === 0 && (
              <text
                x={p.x}
                y={height - paddingY + 14}
                fill="#94a3b8"
                fontSize="9"
                textAnchor="middle"
                fontWeight="500"
              >
                {p.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};


// --- Pie/Donut Chart for Task Category Distributions ---
interface PieChartProps {
  data: { name: string; count: number; color: string }[];
}

export const CategoryDonutChart: React.FC<PieChartProps> = ({ data }) => {
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const size = 140;
  const radius = 45;
  const strokeWidth = 14;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="w-full p-4 rounded-2xl bg-rpg-card/60 border border-rpg-border/30 backdrop-blur-md flex items-center justify-between">
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-slate-300 mb-3">Time Distribution</h4>
        <div className="space-y-1.5">
          {data.map((item, idx) => {
            const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-400 font-medium capitalize truncate w-16">{item.name}</span>
                <span className="text-white font-semibold ml-auto">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative w-[140px] h-[140px] flex items-center justify-center">
        {total === 0 ? (
          <div className="text-center text-xs text-slate-500 font-medium">No Tasks<br/>Recorded</div>
        ) : (
          <svg width={size} height={size} className="transform -rotate-90">
            {data.map((item, idx) => {
              if (item.count === 0) return null;
              const angle = (item.count / total) * circumference;
              const dashOffset = circumference - angle;
              const rotationOffset = currentOffset;
              currentOffset += angle;

              return (
                <circle
                  key={idx}
                  stroke={item.color}
                  fill="transparent"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  r={radius}
                  cx={center}
                  cy={center}
                  className="transition-all duration-500 ease-out"
                  transform={`rotate(${(rotationOffset / circumference) * 360} ${center} ${center})`}
                  style={{ filter: `drop-shadow(0 0 2px ${item.color}33)` }}
                />
              );
            })}
          </svg>
        )}
        {total > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-base font-bold text-white">{total}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
          </div>
        )}
      </div>
    </div>
  );
};
