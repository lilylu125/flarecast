import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { CheckIn } from '../types';

interface TrendChartProps {
  checkIns: CheckIn[];
  childName: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ checkIns, childName }) => {
  // Use last 14 days
  const recent14 = checkIns.slice(-14);
  const [selectedPoint, setSelectedPoint] = useState<CheckIn | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  if (recent14.length === 0) {
    return null;
  }

  // Chart dimensions
  const width = 500;
  const height = 180;
  const paddingX = 30;
  const paddingY = 25;
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;

  // Min and max scores for plotting (0 to 100)
  const minY = 0;
  const maxY = 100;

  const points = recent14.map((item, index) => {
    const x = paddingX + (index / (recent14.length - 1)) * plotWidth;
    const y = paddingY + plotHeight - ((item.skinScore - minY) / (maxY - minY)) * plotHeight;
    return { x, y, item };
  });

  // Construct SVG Path line
  const linePath = points.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }, '');

  // Construct area path
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - paddingY} L ${points[0].x.toFixed(1)} ${height - paddingY} Z`;

  // Average score
  const avgScore = Math.round(
    recent14.reduce((sum, c) => sum + c.skinScore, 0) / recent14.length
  );

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between text-left"
      >
        <h3 className="text-sm font-bold text-[#2C3E38] tracking-tight">14-Day Skin Score Trend</h3>
        <span className="flex items-center gap-2">
          <span className="text-xs text-[#5C736C]">
            Avg <span className="text-sm font-black text-[#426C63]">{avgScore}</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-[#426C63] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* SVG Chart (hidden until opened) */}
      {isOpen && (
      <div className="relative w-full overflow-hidden mt-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6FA79A" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#6FA79A" stop-opacity="0.02" />
            </linearGradient>
          </defs>

          {/* Reference horizontal guide lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#E8E2D6"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={width - paddingX + 4}
            y={paddingY + 3}
            fill="#8FA8A0"
            fontSize="9"
            fontWeight="bold"
          >
            100 Calm
          </text>

          <line
            x1={paddingX}
            y1={paddingY + plotHeight * 0.5}
            x2={width - paddingX}
            y2={paddingY + plotHeight * 0.5}
            stroke="#E8E2D6"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <text
            x={width - paddingX + 4}
            y={paddingY + plotHeight * 0.5 + 3}
            fill="#C4A35A"
            fontSize="9"
          >
            50 Mod
          </text>

          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#E8E2D6"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Shaded Area */}
          <path d={areaPath} fill="url(#trendGrad)" />

          {/* Main Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#6FA79A"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Dots */}
          {points.map((pt, idx) => {
            const isSelected = selectedPoint?.id === pt.item.id;
            const isLowFlare = pt.item.skinScore < 50;

            return (
              <g
                key={pt.item.id}
                className="cursor-pointer"
                onClick={() => setSelectedPoint(pt.item)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 6.5 : 4}
                  fill={isLowFlare ? '#D9644F' : '#6FA79A'}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-200"
                />
                {/* Date label for first, mid, and last */}
                {(idx === 0 || idx === Math.floor(points.length / 2) || idx === points.length - 1) && (
                  <text
                    x={pt.x}
                    y={height - 8}
                    fill="#6A857D"
                    fontSize="9.5"
                    textAnchor="middle"
                    fontWeight={idx === points.length - 1 ? '700' : '400'}
                  >
                    {pt.item.displayDate}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Selected Point Callout Banner */}
        {selectedPoint ? (
          <div className="mt-3 p-3 bg-[#F2F7F6] rounded-2xl border border-[#6FA79A]/20 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-[#2C3E38]">
                {selectedPoint.displayDate}: Score {selectedPoint.skinScore}/100
              </span>
              <p className="text-[#5C736C] line-clamp-1">
                {selectedPoint.aiAnalysis?.description || 'Routine check-in logged'}
              </p>
            </div>
            <button
              onClick={() => setSelectedPoint(null)}
              className="text-[#578C80] font-semibold hover:underline shrink-0 ml-2"
            >
              Close
            </button>
          </div>
        ) : null}
      </div>
      )}
    </div>
  );
};
