import React from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  Sparkles,
  MapPin,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { WeatherForecastResult } from '../utils/weatherForecast';
import { FlareRisk } from '../types';

interface ForecastSectionProps {
  weather: WeatherForecastResult;
  childName: string;
  latestSkinScore: number;
  previousWeekAvgScore: number;
  onRefreshWeather?: () => void;
  isLoadingWeather?: boolean;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  weather,
  childName,
  latestSkinScore,
  previousWeekAvgScore,
  onRefreshWeather,
  isLoadingWeather,
}) => {
  const todayForecast = weather.days[0];
  const currentRisk = todayForecast?.riskLevel || 'Low';

  // Compare today's score to last week's avg
  const scoreDiff = latestSkinScore - previousWeekAvgScore;
  let comparisonText = 'Consistent with last week';
  let comparisonColor = 'text-[#5C736C]';
  let ComparisonIcon = Minus;

  if (scoreDiff > 3) {
    comparisonText = `+${scoreDiff} pts better than last week`;
    comparisonColor = 'text-[#426C63]';
    ComparisonIcon = TrendingUp;
  } else if (scoreDiff < -3) {
    comparisonText = `${Math.abs(scoreDiff)} pts lower than last week`;
    comparisonColor = 'text-[#D9644F]';
    ComparisonIcon = TrendingDown;
  }

  // Determine skin status details
  let statusBadgeLabel = 'Calm Skin Barrier';
  let statusColorClass = 'text-[#426C63] bg-[#E8F2F0] border-[#6FA79A]/30';
  let scoreTextClass = 'text-[#426C63]';
  let statusSummary = `${childName}'s skin barrier is supple and retaining hydration well.`;

  if (latestSkinScore < 50) {
    statusBadgeLabel = 'Active Flare Alert';
    statusColorClass = 'text-[#D9644F] bg-[#FDEEEB] border-[#D9644F]/30';
    scoreTextClass = 'text-[#D9644F]';
    statusSummary = `Skin barrier is compromised with heightened redness and itching. Calm Plan recommended.`;
  } else if (latestSkinScore < 75) {
    statusBadgeLabel = 'Moderate Dryness / Sensitivity';
    statusColorClass = 'text-[#B88A3B] bg-[#FEF6E8] border-[#E8B04B]/35';
    scoreTextClass = 'text-[#B88A3B]';
    statusSummary = `Mild surface dryness or slight redness detected. Keep moisture sealed after bath.`;
  }

  // Weather icon mapping
  const getWeatherIcon = (icon: string, risk: FlareRisk) => {
    if (icon === 'rain') return <CloudRain className="w-8 h-8 text-[#578C80]" />;
    if (icon === 'wind') return <Wind className="w-8 h-8 text-[#E8B04B]" />;
    if (icon === 'cloud') return <Cloud className="w-8 h-8 text-[#6FA79A]" />;
    return <Sun className="w-8 h-8 text-[#E8B04B]" />;
  };

  return (
    <div className="space-y-4">
      {/* 1. HERO BIG SKIN STATUS SCORE CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-[#6FA79A]/20 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div
          className={`absolute -top-16 -right-16 w-52 h-52 rounded-full blur-3xl opacity-25 pointer-events-none ${
            latestSkinScore >= 75
              ? 'bg-[#6FA79A]'
              : latestSkinScore >= 50
              ? 'bg-[#E8B04B]'
              : 'bg-[#D9644F]'
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C736C]">
                Current Skin Status
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-[#426C63]">{childName}</span>
            </div>

            {/* Status Badge */}
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs tracking-wide">
              <span
                className={`w-2 h-2 rounded-full ${
                  latestSkinScore >= 75
                    ? 'bg-[#578C80]'
                    : latestSkinScore >= 50
                    ? 'bg-[#E8B04B]'
                    : 'bg-[#D9644F]'
                }`}
              />
              <span className={statusBadgeLabel === 'Active Flare Alert' ? 'text-[#D9644F]' : latestSkinScore >= 75 ? 'text-[#426C63]' : 'text-[#B88A3B]'}>
                {statusBadgeLabel}
              </span>
            </div>
          </div>

          {/* Comparison kicker */}
          <div className="flex items-center gap-1.5 sm:text-right">
            <div className={`text-xs font-bold flex items-center gap-1 ${comparisonColor} bg-[#FAF6EF] px-3 py-1.5 rounded-xl border border-[#EBE4D8]`}>
              <ComparisonIcon className="w-4 h-4 shrink-0" />
              <span>{comparisonText}</span>
            </div>
          </div>
        </div>

        {/* BOLD, PROMINENT SCORE DISPLAY */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <span className={`text-6xl sm:text-7xl font-black tracking-tight tabular-nums ${scoreTextClass}`}>
              {latestSkinScore}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">
                / 100
              </span>
              <span className="text-xs text-[#5C736C] font-semibold">
                Daily Barrier Score
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#4A645D] max-w-sm leading-relaxed sm:text-right">
            {statusSummary}
          </p>
        </div>

        {/* Interactive Visual Spectrum Meter (0 to 100) */}
        <div className="mt-5 space-y-2">
          <div className="relative w-full h-3.5 rounded-full overflow-hidden bg-slate-100 shadow-inner">
            {/* Color spectrum gradient: Flare (Red) -> Sensitivity (Yellow/Peach) -> Calm (Sage) */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'linear-gradient(to right, #D9644F 0%, #F4A98A 35%, #E8B04B 55%, #88C5B8 80%, #578C80 100%)',
              }}
            />
            {/* Dark fill overlay for remaining unachieved score */}
            <div
              className="absolute top-0 bottom-0 right-0 bg-white/70 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, 100 - latestSkinScore)}%` }}
            />
          </div>

          {/* Pointer indicator and spectrum labels */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-0.5">
            <span className="text-[#D9644F]">0 Flare</span>
            <span className="text-[#B88A3B]">50 Moderate</span>
            <span className="text-[#426C63]">100 Calm Barrier</span>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S FORECAST & RISK PREDICTION CARD */}
      <div
        className={`rounded-3xl p-5 sm:p-6 shadow-sm border transition-all relative overflow-hidden ${
          currentRisk === 'High'
            ? 'bg-gradient-to-br from-white via-[#FFF5F3] to-[#FDF0EC] border-[#D9644F]/30'
            : currentRisk === 'Medium'
            ? 'bg-gradient-to-br from-white via-[#FFFDF8] to-[#FCF8EE] border-[#E8B04B]/35'
            : 'bg-gradient-to-br from-white via-[#F6FAF9] to-[#EFF7F5] border-[#6FA79A]/20'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-[#5C736C]">
              <MapPin className="w-3.5 h-3.5 text-[#6FA79A]" />
              <span className="font-semibold">{weather.locationName}</span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C736C]">
                Today's Flare Risk
              </span>
              <span
                className={`text-xl sm:text-2xl font-black ${
                  currentRisk === 'High'
                    ? 'text-[#D9644F]'
                    : currentRisk === 'Medium'
                    ? 'text-[#B88A3B]'
                    : 'text-[#426C63]'
                }`}
              >
                {currentRisk} Risk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white shadow-sm border border-black/5">
              {todayForecast && getWeatherIcon(todayForecast.conditionIcon, currentRisk)}
            </div>
          </div>
        </div>

        {/* One-line Plain-language Reason */}
        <p className="text-xs sm:text-sm text-[#2C3E38] font-medium mt-3 leading-relaxed bg-white/70 backdrop-blur-sm p-3 rounded-2xl border border-black/5">
          "{todayForecast?.riskReason || weather.headlineSummary}"
        </p>

        {/* 3-Day Micro Forecast Strip */}
        <div className="mt-4 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C736C] uppercase tracking-wider">
              3-Day Weather & Flare Outlook
            </span>
            <span className="text-[11px] text-[#578C80] font-semibold">
              Powered by Open-Meteo
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {weather.days.map((day, idx) => {
              const isToday = idx === 0;
              return (
                <div
                  key={day.date}
                  className={`p-2.5 rounded-2xl text-center text-xs transition-colors ${
                    isToday
                      ? 'bg-white shadow-sm border border-[#6FA79A]/30'
                      : 'bg-white/60 border border-black/5'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#5C736C] block">
                    {day.dayName}
                  </span>
                  <div className="my-1 flex justify-center">
                    {getWeatherIcon(day.conditionIcon, day.riskLevel)}
                  </div>
                  <div className="font-bold text-[#2C3E38]">
                    {day.tempMaxF}° / {day.tempMinF}°
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {day.humidityPercent}% RH
                  </span>
                  <span
                    className={`text-[10px] font-bold block mt-0.5 ${
                      day.riskLevel === 'High'
                        ? 'text-[#D9644F]'
                        : day.riskLevel === 'Medium'
                        ? 'text-[#B88A3B]'
                        : 'text-[#426C63]'
                    }`}
                  >
                    {day.riskLevel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. INDOOR SENSOR CARD */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#6FA79A]/15 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FAF6EF] flex items-center justify-center text-[#578C80]">
              <Droplets className="w-4 h-4 text-[#6FA79A]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#2C3E38]">
                Indoor Sensor: {weather.currentIndoor.roomName}
              </h4>
              <p className="text-[11px] text-[#5C736C]">
                Simulated real-time nursery telemetry
              </p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDEEEB] text-[#D9644F] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {weather.currentIndoor.status}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#FAF6EF] p-3 rounded-2xl border border-[#EBE4D8] text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 font-bold text-[#2C3E38]">
              <Thermometer className="w-4 h-4 text-[#F4A98A]" />
              <span>{weather.currentIndoor.tempF}°F</span>
            </div>
            <div className="flex items-center gap-1 font-black text-[#D9644F]">
              <Droplets className="w-4 h-4" />
              <span>{weather.currentIndoor.humidityPercent}% RH (Very Dry)</span>
            </div>
          </div>

          <span className="text-[11px] text-[#4A645D] font-medium hidden sm:inline">
            Ideal nursery humidity: 40%–50%
          </span>
        </div>
      </div>
    </div>
  );
};
