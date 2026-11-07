import React from 'react';
import { Camera, ShieldCheck, CalendarCheck } from 'lucide-react';

interface ProgressRingsProps {
  checkIns: { current: number; goal: number };
  calmPlan: { current: number; goal: number };
  photos: { current: number; goal: number };
}

export const ProgressRings: React.FC<ProgressRingsProps> = ({
  checkIns,
  calmPlan,
  photos,
}) => {
  // SVG Ring dimensions
  const size = 150;
  const strokeWidth = 9;
  const center = size / 2;

  // Ring 1 (Outer): Check-ins
  const r1 = 60;
  const c1 = 2 * Math.PI * r1;
  const pct1 = Math.min(1, checkIns.current / checkIns.goal);
  const offset1 = c1 - pct1 * c1;

  // Ring 2 (Middle): Calm Plan
  const r2 = 47;
  const c2 = 2 * Math.PI * r2;
  const pct2 = Math.min(1, calmPlan.current / calmPlan.goal);
  const offset2 = c2 - pct2 * c2;

  // Ring 3 (Inner): Photos
  const r3 = 34;
  const c3 = 2 * Math.PI * r3;
  const pct3 = Math.min(1, photos.current / photos.goal);
  const offset3 = c3 - pct3 * c3;

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#2C3E38] tracking-tight">
          Weekly Care Rings
        </h3>
        <span className="text-xs text-[#5C736C]">Goal resets Monday</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Concentric Activity Rings SVG */}
        <div className="relative shrink-0 flex items-center justify-center">
          <svg width={size} height={size} className="-rotate-90 transform">
            {/* Background tracks */}
            <circle
              cx={center}
              cy={center}
              r={r1}
              stroke="#E2EDE9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={center}
              cy={center}
              r={r2}
              stroke="#FCE8E0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx={center}
              cy={center}
              r={r3}
              stroke="#E5EFF2"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Foreground strokes */}
            {/* Outer Ring: Check-ins (#6FA79A) */}
            <circle
              cx={center}
              cy={center}
              r={r1}
              stroke="#6FA79A"
              strokeWidth={strokeWidth}
              strokeDasharray={c1}
              strokeDashoffset={offset1}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />

            {/* Middle Ring: Calm Plan (#F4A98A) */}
            <circle
              cx={center}
              cy={center}
              r={r2}
              stroke="#F4A98A"
              strokeWidth={strokeWidth}
              strokeDasharray={c2}
              strokeDashoffset={offset2}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />

            {/* Inner Ring: Photos (#578C80) */}
            <circle
              cx={center}
              cy={center}
              r={r3}
              stroke="#438B86"
              strokeWidth={strokeWidth}
              strokeDasharray={c3}
              strokeDashoffset={offset3}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-700 ease-out"
            />
          </svg>

          {/* Center Summary Counter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-black text-[#2C3E38] tracking-tight">
              {Math.round(((pct1 + pct2 + pct3) / 3) * 100)}%
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#6FA79A] tracking-wider">
              On Track
            </span>
          </div>
        </div>

        {/* Ring Legends */}
        <div className="w-full space-y-2.5">
          {/* Ring 1 */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#F2F7F6]/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#6FA79A]" />
              <div className="flex items-center gap-1.5 font-medium text-[#2C3E38]">
                <CalendarCheck className="w-3.5 h-3.5 text-[#6FA79A]" />
                Check-ins
              </div>
            </div>
            <div className="font-bold text-[#426C63]">
              {checkIns.current}/{checkIns.goal} days
            </div>
          </div>

          {/* Ring 2 */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#FDF4F0]/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F4A98A]" />
              <div className="flex items-center gap-1.5 font-medium text-[#2C3E38]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#F4A98A]" />
                Calm Plan Routine
              </div>
            </div>
            <div className="font-bold text-[#B8684C]">
              {calmPlan.current}/{calmPlan.goal} done
            </div>
          </div>

          {/* Ring 3 */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#EFF6F6]/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#438B86]" />
              <div className="flex items-center gap-1.5 font-medium text-[#2C3E38]">
                <Camera className="w-3.5 h-3.5 text-[#438B86]" />
                Skin Photos
              </div>
            </div>
            <div className="font-bold text-[#356E6B]">
              {photos.current}/{photos.goal} logged
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
