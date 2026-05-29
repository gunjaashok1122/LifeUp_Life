import React from 'react';

interface TrendGraphProps {
  data: number[]; // Array of percentages (0-100)
  months: string[]; // X-axis labels
  color: string; // Line color
  gradientId: string; // Unique id for gradient definition
  stopColor: string; // Gradient stop color
  title: string;
  currentValue: number;
  onClick?: () => void;
}

export const TrendGraph: React.FC<TrendGraphProps> = ({
  data,
  months,
  color,
  gradientId,
  stopColor,
  title,
  currentValue,
  onClick
}) => {
  // SVG size: 320 x 140
  const width = 320;
  const height = 140;
  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate points
  const points = data.map((val, idx) => {
    const x = paddingLeft + (idx / (data.length - 1)) * chartWidth;
    // Map 0-100 value to chartHeight (y=0 is at top)
    const y = paddingTop + chartHeight - (val / 100) * chartHeight;
    return { x, y };
  });

  // Calculate smooth Bezier line path
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
  }

  // Calculate area path (closing the bottom coordinates)
  let areaPath = '';
  if (points.length > 0) {
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const bottomY = paddingTop + chartHeight;
    areaPath = `${linePath} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`;
  }

  return (
    <div 
      onClick={onClick}
      className={`w-full p-4 rounded-xl bg-slate-950/40 border border-rpg-border/20 space-y-2 transition-all ${
        onClick 
          ? 'cursor-pointer hover:scale-[1.02] hover:bg-slate-900/60 hover:border-indigo-500/50 active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0.02)] hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]' 
          : ''
      }`}
    >
      <div className="flex justify-between items-center text-xs font-bold text-slate-400">
        <span>{title}</span>
        <span style={{ color }} className="font-extrabold">{currentValue}%</span>
      </div>
      
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible select-none">
        {/* Y Axis Grid Lines & Ticks */}
        {[25, 50, 75].map((yVal, idx) => {
          const y = paddingTop + chartHeight - (yVal / 100) * chartHeight;
          return (
            <g key={idx} opacity="0.15">
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="#cbd5e1" 
                strokeDasharray="3,3" 
              />
              <text 
                x={paddingLeft - 8} 
                y={y + 3} 
                fill="#cbd5e1" 
                fontSize="8" 
                textAnchor="end"
                fontWeight="bold"
              >
                {yVal}%
              </text>
            </g>
          );
        })}

        {/* X Axis Months */}
        {months.map((month, idx) => {
          const x = paddingLeft + (idx / (months.length - 1)) * chartWidth;
          const y = height - 8;
          return (
            <text
              key={idx}
              x={x}
              y={y}
              fill="#94a3b8"
              fontSize="8"
              textAnchor="middle"
              fontWeight="bold"
              opacity="0.7"
            >
              {month}
            </text>
          );
        })}

        {/* Shaded Area Under Curve */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
          />
        )}

        {/* Line Path */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Highlight current month point */}
        {points.length > 0 && (
          <g>
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill={color}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="8"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              opacity="0.4"
              className="animate-ping"
            />
          </g>
        )}

        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stopColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={stopColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
