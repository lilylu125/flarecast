import React, { useState, useEffect } from 'react';
import { Sparkles, Award, Clock, Heart, CloudRain, Droplets, CheckCircle } from 'lucide-react';

interface GrowingPlantProps {
  streakDays: number;
  checkInsThisWeek: number;
  weeklyGoal: number; // e.g. 5
  childName: string;
  reminderTime: string;
  lastWateredTimestamp?: number;
}

export const GrowingPlant: React.FC<GrowingPlantProps> = ({
  streakDays,
  checkInsThisWeek,
  weeklyGoal = 5,
  childName,
  reminderTime,
  lastWateredTimestamp,
}) => {
  // Rain water animation state
  const [isRaining, setIsRaining] = useState<boolean>(false);
  const [rainMessage, setRainMessage] = useState<string>('');

  // Stages: seed (1-2), sprout (3-5), leaves (6-13), flower (14+)
  let stage: 'seed' | 'sprout' | 'leaves' | 'flower' = 'seed';
  let stageName = 'Seed Stage';

  if (streakDays >= 14) {
    stage = 'flower';
    stageName = 'Blooming Flower';
  } else if (streakDays >= 6) {
    stage = 'leaves';
    stageName = 'Leafy Sprout';
  } else if (streakDays >= 3) {
    stage = 'sprout';
    stageName = 'Green Sprout';
  }

  // Trigger rain shower when lastWateredTimestamp updates
  useEffect(() => {
    if (lastWateredTimestamp) {
      triggerRainAnimation(
        `🌧️ Fresh check-in rain water showering ${childName}'s plant! New growth unlocked 🌱`
      );
    }
  }, [lastWateredTimestamp]);

  const triggerRainAnimation = (msg?: string) => {
    setIsRaining(true);
    setRainMessage(
      msg || `🌧️ Fresh check-in rain water showering ${childName}'s plant! Leaves nourished and thriving.`
    );
    const timer = setTimeout(() => {
      setIsRaining(false);
      setRainMessage('');
    }, 10000);
    return () => clearTimeout(timer);
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#E8F2F0] flex items-center justify-center text-[#6FA79A]">
            <Heart className="w-4 h-4 fill-[#6FA79A]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2C3E38] tracking-tight">
              {childName}'s Care Garden
            </h3>
            <p className="text-xs text-[#5C736C]">
              Goal: {weeklyGoal} of 7 days · Daily consistent care
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Automatic Rain Indicator (Triggers automatically after logging) */}
          {isRaining ? (
            <div className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-[#E8F2F0] text-[#3B665E] border border-[#6FA79A]/40 shadow-xs animate-pulse">
              <CloudRain className="w-3.5 h-3.5 animate-bounce text-[#6FA79A]" />
              <span>Rain Shower Active 🌧️</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full text-xs font-semibold text-[#5C736C] bg-[#FAF6EF] border border-[#EBE4D8] flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-[#6FA79A]" />
              <span>Rains on log</span>
            </div>
          )}

          <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF6EF] border border-[#EBE4D8] rounded-full text-xs font-bold text-[#578C80]">
            <Sparkles className="w-3.5 h-3.5 text-[#E8B04B]" />
            <span>{streakDays} Day Streak</span>
          </div>
        </div>
      </div>

      {/* Rain Water Shower Alert Message if Active */}
      {rainMessage && (
        <div className="p-3 bg-gradient-to-r from-[#E8F2F0] via-[#E2F0EC] to-[#E8F2F0] rounded-2xl border border-[#6FA79A]/30 text-xs font-bold text-[#3B665E] flex items-center justify-between animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-[#6FA79A] animate-bounce shrink-0" />
            <span>{rainMessage}</span>
          </div>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/70 text-[#426C63]">
            Nourishing
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        {/* Plant Visual with Rain Water Shower SVG */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center bg-[#FAF6EF] rounded-2xl p-4 border border-[#EBE4D8]/60 relative overflow-hidden min-h-[170px]">
          <svg
            viewBox="0 0 160 155"
            className={`w-40 h-36 select-none transition-transform duration-500 ${
              isRaining ? 'animate-plant-grow' : 'hover:scale-105'
            }`}
          >
            <defs>
              <linearGradient id="potGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#E5987A" />
                <stop offset="100%" stop-color="#C87A5C" />
              </linearGradient>
              <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color={isRaining ? '#9EE0D2' : '#88C5B8'} />
                <stop offset="100%" stop-color={isRaining ? '#437F72' : '#558E82'} />
              </linearGradient>
              <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#E2F0ED" />
                <stop offset="100%" stop-color="#B7D9D2" />
              </linearGradient>
            </defs>

            {/* Terra cotta pot shadow & body */}
            <ellipse cx="80" cy="130" rx="34" ry="7" fill="#C87A5C" opacity="0.3" />
            <polygon points="56,101 104,101 98,137 62,137" fill="url(#potGrad)" />
            <rect x="52" y="95" width="56" height="8" rx="3" fill="#D98A6C" />
            <ellipse cx="80" cy="95" rx="27" ry="4" fill="#6A4132" />

            {/* Soil (darkens to rich moist brown when rain water is falling) */}
            <ellipse
              cx="80"
              cy="97"
              rx="24"
              ry="3"
              fill={isRaining ? '#311F17' : '#4A2E23'}
              className="transition-colors duration-700"
            />

            {/* Ripple splashes at soil when raining */}
            {isRaining && (
              <g stroke="#6FA79A" fill="none" opacity="0.75">
                <ellipse cx="74" cy="97" rx="5" ry="1.5" className="animate-splash" />
                <ellipse cx="86" cy="97" rx="6" ry="1.8" className="animate-splash" style={{ animationDelay: '0.4s' }} />
              </g>
            )}

            {/* Plant Stage Art */}
            {stage === 'seed' && (
              <g>
                <circle cx="80" cy="94" r="5" fill="#7D5840" />
                <path
                  d="M 80 89 Q 82 84 85 82"
                  stroke="#88C5B8"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  fill="none"
                />
              </g>
            )}

            {stage === 'sprout' && (
              <g>
                {/* Stem */}
                <path
                  d="M 80 97 Q 78 78 80 62"
                  stroke="#578C80"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  fill="none"
                />
                {/* 2 baby leaves */}
                <path d="M 80 64 Q 68 57 66 66 Q 72 72 80 67" fill="url(#leafGrad)" />
                <path d="M 80 64 Q 92 57 94 66 Q 88 72 80 67" fill="url(#leafGrad)" />
              </g>
            )}

            {stage === 'leaves' && (
              <g>
                {/* Multi-leaf lush plant */}
                <path
                  d="M 80 97 Q 82 74 79 50"
                  stroke="#578C80"
                  stroke-width="4"
                  stroke-linecap="round"
                  fill="none"
                />
                {/* Lower leaf left */}
                <path d="M 80 79 Q 58 72 54 86 Q 66 92 80 82" fill="url(#leafGrad)" />
                {/* Lower leaf right */}
                <path d="M 80 75 Q 102 69 106 82 Q 94 90 80 78" fill="url(#leafGrad)" />
                {/* Mid leaf left */}
                <path d="M 80 62 Q 56 50 60 61 Q 70 66 80 63" fill="url(#leafGrad)" />
                {/* Mid leaf right */}
                <path d="M 79 60 Q 104 48 100 60 Q 90 65 79 61" fill="url(#leafGrad)" />
                {/* Top sprout */}
                <path d="M 79 50 Q 74 34 79 32 Q 84 34 79 50" fill="#9CD4C8" />

                {/* Fresh dew drops on leaves when raining */}
                {isRaining && (
                  <g fill="#AEE8DC" opacity="0.9">
                    <circle cx="68" cy="76" r="2" />
                    <circle cx="95" cy="73" r="2.2" />
                    <circle cx="67" cy="57" r="1.8" />
                    <circle cx="93" cy="55" r="1.8" />
                  </g>
                )}
              </g>
            )}

            {stage === 'flower' && (
              <g>
                <path
                  d="M 80 97 Q 82 72 80 48"
                  stroke="#578C80"
                  stroke-width="4"
                  stroke-linecap="round"
                  fill="none"
                />
                <path d="M 80 78 Q 56 72 56 86 Q 68 90 80 80" fill="url(#leafGrad)" />
                <path d="M 80 75 Q 104 69 104 83 Q 92 90 80 77" fill="url(#leafGrad)" />
                {/* Flower petals */}
                <circle cx="80" cy="42" r="16" fill="#F4A98A" opacity="0.9" />
                <circle cx="70" cy="37" r="9" fill="#FBD5C5" />
                <circle cx="90" cy="37" r="9" fill="#FBD5C5" />
                <circle cx="80" cy="29" r="9" fill="#FBD5C5" />
                <circle cx="73" cy="49" r="8" fill="#FBD5C5" />
                <circle cx="87" cy="49" r="8" fill="#FBD5C5" />
                <circle cx="80" cy="41" r="6" fill="#E8B04B" />
              </g>
            )}

            {/* RAIN CLOUD & FALLING WATER DROPS WHEN ACTIVE */}
            {isRaining && (
              <g className="animate-fade-in">
                {/* Soft Rain Cloud overhead */}
                <g className="animate-cloud-float">
                  <path
                    d="M 64 22 A 10 10 0 0 1 82 17 A 13 13 0 0 1 103 21 A 9 9 0 0 1 106 31 L 58 31 A 8 8 0 0 1 64 22 Z"
                    fill="url(#cloudGrad)"
                    stroke="#8DB7AF"
                    stroke-width="1.2"
                  />
                </g>

                {/* Stream of falling raindrops */}
                <g fill="#6FA79A">
                  {/* Drop 1 */}
                  <path
                    d="M 67 33 Q 66 38 67 40 A 2 2 0 0 0 70 40 Q 71 38 70 33 Z"
                    className="animate-rain-fall"
                    style={{ animationDelay: '0s' }}
                  />
                  {/* Drop 2 */}
                  <path
                    d="M 80 34 Q 79 39 80 41 A 2 2 0 0 0 83 41 Q 84 39 83 34 Z"
                    className="animate-rain-fall"
                    style={{ animationDelay: '0.35s' }}
                  />
                  {/* Drop 3 */}
                  <path
                    d="M 93 33 Q 92 38 93 40 A 2 2 0 0 0 96 40 Q 97 38 96 33 Z"
                    className="animate-rain-fall"
                    style={{ animationDelay: '0.65s' }}
                  />
                  {/* Drop 4 */}
                  <path
                    d="M 74 36 Q 73 40 74 42 A 1.8 1.8 0 0 0 77 42 Q 78 40 77 36 Z"
                    className="animate-rain-fall"
                    style={{ animationDelay: '0.15s' }}
                  />
                  {/* Drop 5 */}
                  <path
                    d="M 87 35 Q 86 40 87 42 A 1.8 1.8 0 0 0 90 42 Q 91 40 90 35 Z"
                    className="animate-rain-fall"
                    style={{ animationDelay: '0.5s' }}
                  />
                </g>
              </g>
            )}
          </svg>

          <div className="text-center mt-1 flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#426C63]">{stageName}</span>
            {isRaining && (
              <span className="text-[10px] font-extrabold text-[#6FA79A] animate-pulse">
                · Hydrating 💧
              </span>
            )}
          </div>
        </div>

        {/* Milestone & Reassurance */}
        <div className="sm:col-span-7 space-y-2.5">
          <div className="bg-[#F2F7F6] rounded-2xl p-3 border border-[#6FA79A]/15">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-[#578C80]" />
              <span className="text-xs font-bold text-[#2C3E38]">
                Milestone Unlocked: Pattern Insight
              </span>
            </div>
            <p className="text-xs text-[#4A645D] leading-relaxed">
              "Flares for {childName} correlate strongly with 2 consecutive dry days under 30% humidity."
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-[#5C736C] px-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#6FA79A]" />
              Reminder: {reminderTime} (Bath time)
            </span>
            <span className="font-semibold text-[#578C80] flex items-center gap-1">
              <Droplets className="w-3.5 h-3.5 text-[#6FA79A]" />
              {checkInsThisWeek}/5 Rain drops logged
            </span>
          </div>

          <div className="w-full bg-[#E8E2D6] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#6FA79A] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (checkInsThisWeek / 5) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
