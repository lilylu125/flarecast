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
  ChevronDown,
} from 'lucide-react';
import { WeatherForecastResult } from '../utils/weatherForecast';
import { FlareRisk, IndoorSensorData } from '../types';
import { useIndoorSensor, DRY_AIR_THRESHOLD } from '../hooks/useIndoorSensor';

interface ForecastSectionProps {
  weather: WeatherForecastResult;
  childName: string;
  latestSkinScore: number;
  previousWeekAvgScore: number;
  onRefreshWeather?: () => void;
  isLoadingWeather?: boolean;
  /** Opens the check-in flow when the indoor sensor's reminder alarm fires or its button is pressed. */
  onSensorCheckInPrompt?: () => void;
  /** Shown on the right of the skin status card (the growing plant). */
  plantSlot?: React.ReactNode;
}

const TOO_HUMID_THRESHOLD = 60;

const indoorStatusFor = (humidity: number): IndoorSensorData['status'] =>
  humidity < DRY_AIR_THRESHOLD ? 'Dry Air Alert' : humidity > TOO_HUMID_THRESHOLD ? 'Too Humid' : 'Ideal';

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  weather,
  childName,
  latestSkinScore,
  previousWeekAvgScore,
  onRefreshWeather,
  isLoadingWeather,
  onSensorCheckInPrompt,
  plantSlot,
}) => {
  // Live ESP32 indoor sensor over USB (Web Serial). Falls back to simulated data when not connected.
  const [showOutlook, setShowOutlook] = React.useState(false);
  const acknowledgeRef = React.useRef<(() => Promise<void>) | null>(null);
  const sensor = useIndoorSensor({
    onCheckInPrompt: () => {
      onSensorCheckInPrompt?.();
      void acknowledgeRef.current?.(); // silence the device alarm once the check-in screen opens
    },
  });
  acknowledgeRef.current = sensor.acknowledge;

  const isLiveSensor = sensor.status === 'connected' && sensor.reading !== null;
  const indoor: IndoorSensorData = isLiveSensor
    ? {
        roomName: weather.currentIndoor.roomName,
        tempC: Math.round(sensor.reading!.t * 10) / 10,
        humidityPercent: Math.round(sensor.reading!.h),
        status: indoorStatusFor(sensor.reading!.h),
        message: '',
      }
    : weather.currentIndoor;

  const todayForecast = weather.days[0];
  const forecastRisk = todayForecast?.riskLevel || 'Low';
  // Dry indoor air from the live sensor raises a Low forecast to Medium.
  const liveDryAir = isLiveSensor && sensor.isDryAir;
  const currentRisk: FlareRisk = liveDryAir && forecastRisk === 'Low' ? 'Medium' : forecastRisk;
  const riskReason = liveDryAir
    ? `Indoor humidity is ${indoor.humidityPercent}% in the ${indoor.roomName.toLowerCase()} — dry air can dry out ${childName}'s skin. ${todayForecast?.riskReason || ''}`.trim()
    : todayForecast?.riskReason || weather.headlineSummary;

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
    statusSummary = `Skin barrier is compromised with heightened redness and itching. Care Plan recommended.`;
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

        {/* Score (left) · Current skin status (middle) · Plant (right) */}
        <div className="relative grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-4 sm:gap-x-6">
          {/* Score */}
          <div className="flex flex-col items-center shrink-0">
            <span className={`text-6xl sm:text-7xl font-black tracking-tight tabular-nums leading-none ${scoreTextClass}`}>
              {latestSkinScore}
            </span>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
            <span className="text-[10px] text-[#5C736C] font-semibold">Skin Score</span>
          </div>

          {/* Current skin status */}
          <div className="min-w-0 space-y-2 col-span-2 sm:col-span-1 order-3 sm:order-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C736C]">
                Current Skin Status
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-semibold text-[#426C63]">{childName}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border shadow-2xs tracking-wide">
              <span
                className={`w-2 h-2 rounded-full ${
                  latestSkinScore >= 75 ? 'bg-[#578C80]' : latestSkinScore >= 50 ? 'bg-[#E8B04B]' : 'bg-[#D9644F]'
                }`}
              />
              <span className={statusBadgeLabel === 'Active Flare Alert' ? 'text-[#D9644F]' : latestSkinScore >= 75 ? 'text-[#426C63]' : 'text-[#B88A3B]'}>
                {statusBadgeLabel}
              </span>
            </div>

            <div className={`text-xs font-bold flex items-center gap-1 ${comparisonColor}`}>
              <ComparisonIcon className="w-4 h-4 shrink-0" />
              <span>{comparisonText}</span>
            </div>

          </div>

          {/* Plant */}
          {plantSlot && <div className="justify-self-end order-2 sm:order-3">{plantSlot}</div>}
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

      {/* 2. BENTO: weather forecast (left) + indoor sensor (right) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        {/* Weather forecast */}
        <div
          className={`sm:col-span-3 rounded-3xl p-5 shadow-sm border transition-all relative overflow-hidden ${
            currentRisk === 'High'
              ? 'bg-gradient-to-br from-white via-[#FFF5F3] to-[#FDF0EC] border-[#D9644F]/30'
              : currentRisk === 'Medium'
              ? 'bg-gradient-to-br from-white via-[#FFFDF8] to-[#FCF8EE] border-[#E8B04B]/35'
              : 'bg-gradient-to-br from-white via-[#F6FAF9] to-[#EFF7F5] border-[#6FA79A]/20'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#5C736C]">
                <MapPin className="w-3.5 h-3.5 text-[#6FA79A] shrink-0" />
                <span className="font-semibold truncate">{weather.locationName}</span>
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C736C]">Flare risk</span>
                <span
                  className={`text-xl sm:text-2xl font-black ${
                    currentRisk === 'High' ? 'text-[#D9644F]' : currentRisk === 'Medium' ? 'text-[#B88A3B]' : 'text-[#426C63]'
                  }`}
                >
                  {currentRisk}
                </span>
              </div>
            </div>
            <div className="p-2.5 rounded-2xl bg-white shadow-sm border border-black/5 shrink-0">
              {todayForecast && getWeatherIcon(todayForecast.conditionIcon, currentRisk)}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#2C3E38] font-medium mt-3 leading-relaxed bg-white/70 p-3 rounded-2xl border border-black/5">
            {riskReason}
          </p>

          {/* 3-day outlook: hidden by default */}
          <button
            type="button"
            onClick={() => setShowOutlook((v) => !v)}
            aria-expanded={showOutlook}
            className="mt-3 w-full flex items-center justify-between text-xs font-bold text-[#426C63] px-1 py-1"
          >
            <span>3-day outlook</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showOutlook ? 'rotate-180' : ''}`} />
          </button>

          {showOutlook && (
            <div className="grid grid-cols-3 gap-2 mt-1">
              {weather.days.map((day, idx) => (
                <div
                  key={day.date}
                  className={`p-2.5 rounded-2xl text-center text-xs ${
                    idx === 0 ? 'bg-white shadow-sm border border-[#6FA79A]/30' : 'bg-white/60 border border-black/5'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#5C736C] block">{day.dayName}</span>
                  <div className="my-1 flex justify-center">{getWeatherIcon(day.conditionIcon, day.riskLevel)}</div>
                  <div className="font-bold text-[#2C3E38]">
                    {day.tempMaxC}° / {day.tempMinC}°
                  </div>
                  <span className="text-[10px] text-slate-500 block">{day.humidityPercent}% RH</span>
                  <span
                    className={`text-[10px] font-bold block mt-0.5 ${
                      day.riskLevel === 'High' ? 'text-[#D9644F]' : day.riskLevel === 'Medium' ? 'text-[#B88A3B]' : 'text-[#426C63]'
                    }`}
                  >
                    {day.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Indoor sensor */}
        <div className="sm:col-span-2 bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-[#2C3E38] flex items-center gap-1.5 min-w-0">
              <Droplets className="w-4 h-4 text-[#6FA79A] shrink-0" />
              <span className="truncate">{indoor.roomName}</span>
            </h4>
            {isLiveSensor && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#426C63] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#578C80] animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8] p-3 text-center">
              <Thermometer className="w-4 h-4 text-[#F4A98A] mx-auto" />
              <div className="text-xl font-black text-[#2C3E38] mt-1 tabular-nums">{indoor.tempC}°</div>
              <div className="text-[10px] font-semibold text-[#5C736C]">Temp</div>
            </div>
            <div
              className={`rounded-2xl border p-3 text-center ${
                indoor.status === 'Ideal'
                  ? 'bg-[#E8F2F0] border-[#6FA79A]/30'
                  : indoor.status === 'Too Humid'
                  ? 'bg-[#FEF6E8] border-[#E8B04B]/35'
                  : 'bg-[#FDEEEB] border-[#D9644F]/30'
              }`}
            >
              <Droplets
                className={`w-4 h-4 mx-auto ${
                  indoor.status === 'Ideal' ? 'text-[#426C63]' : indoor.status === 'Too Humid' ? 'text-[#B88A3B]' : 'text-[#D9644F]'
                }`}
              />
              <div
                className={`text-xl font-black mt-1 tabular-nums ${
                  indoor.status === 'Ideal' ? 'text-[#426C63]' : indoor.status === 'Too Humid' ? 'text-[#B88A3B]' : 'text-[#D9644F]'
                }`}
              >
                {indoor.humidityPercent}%
              </div>
              <div className="text-[10px] font-semibold text-[#5C736C]">Humidity</div>
            </div>
          </div>

          <span
            className={`mt-2 self-start px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
              indoor.status === 'Ideal'
                ? 'bg-[#E8F2F0] text-[#426C63]'
                : indoor.status === 'Too Humid'
                ? 'bg-[#FEF6E8] text-[#B88A3B]'
                : 'bg-[#FDEEEB] text-[#D9644F]'
            }`}
          >
            {indoor.status === 'Ideal' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {indoor.status === 'Dry Air Alert' ? 'Dry air · aim for 40–50%' : indoor.status === 'Too Humid' ? 'Humid · aim for 40–50%' : 'Ideal'}
          </span>

          <div className="mt-auto pt-3">
            {sensor.supported ? (
              sensor.status === 'connected' ? (
                <button
                  onClick={() => void sensor.disconnect()}
                  className="w-full text-[11px] font-bold px-3 py-2 rounded-xl border border-[#EBE4D8] text-[#5C736C] hover:bg-[#FAF6EF]"
                >
                  {sensor.alarmOn ? "Reminder ringing · Disconnect" : 'Disconnect sensor'}
                </button>
              ) : (
                <button
                  onClick={() => void sensor.connect()}
                  disabled={sensor.status === 'connecting'}
                  className="w-full text-[11px] font-bold px-3 py-2 rounded-xl bg-[#6FA79A] text-white hover:bg-[#578C80] disabled:opacity-60"
                >
                  {sensor.status === 'connecting' ? 'Connecting…' : 'Connect sensor'}
                </button>
              )
            ) : (
              <span className="text-[11px] text-[#5C736C]">Live sensor works in Chrome on a laptop</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
