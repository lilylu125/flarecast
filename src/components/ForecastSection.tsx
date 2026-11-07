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
          "{riskReason}"
        </p>

        {/* 3-Day Micro Forecast Strip */}
        <div className="mt-4 pt-4 border-t border-black/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#5C736C] uppercase tracking-wider">
              3-Day Weather & Flare Outlook
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
                    {day.tempMaxC}°C / {day.tempMinC}°C
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
        <div className="flex items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#FAF6EF] flex items-center justify-center text-[#578C80]">
              <Droplets className="w-4 h-4 text-[#6FA79A]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#2C3E38]">
                Indoor Sensor: {indoor.roomName}
              </h4>
              <p className="text-[11px] text-[#5C736C] flex items-center gap-1">
                {isLiveSensor ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#578C80] animate-pulse" />
                    Live from your Flarecast sensor
                  </>
                ) : sensor.status === 'connected' ? (
                  'Connected · waiting for first reading…'
                ) : null}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
              indoor.status === 'Ideal'
                ? 'bg-[#E8F2F0] text-[#426C63]'
                : indoor.status === 'Too Humid'
                ? 'bg-[#FEF6E8] text-[#B88A3B]'
                : 'bg-[#FDEEEB] text-[#D9644F]'
            }`}
          >
            {indoor.status === 'Ideal' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {indoor.status}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#FAF6EF] p-3 rounded-2xl border border-[#EBE4D8] text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 font-bold text-[#2C3E38]">
              <Thermometer className="w-4 h-4 text-[#F4A98A]" />
              <span>
                {indoor.tempC}°C
              </span>
            </div>
            <div
              className={`flex items-center gap-1 font-black ${
                indoor.status === 'Ideal' ? 'text-[#426C63]' : indoor.status === 'Too Humid' ? 'text-[#B88A3B]' : 'text-[#D9644F]'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>
                {indoor.humidityPercent}% RH
                {indoor.status === 'Dry Air Alert' ? ' (Very Dry)' : indoor.status === 'Too Humid' ? ' (Humid)' : ''}
              </span>
            </div>
          </div>

          <span className="text-[11px] text-[#4A645D] font-medium hidden sm:inline">
            Ideal nursery humidity: 40%–50%
          </span>
        </div>

        {/* Connect / disconnect the ESP32 over USB */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          {sensor.supported ? (
            sensor.status === 'connected' ? (
              <>
                <span className="text-[11px] text-[#426C63] font-semibold">
                  {sensor.alarmOn ? 'Photo reminder ringing — open today\'s check-in' : 'Sensor connected over USB'}
                </span>
                <button
                  onClick={() => void sensor.disconnect()}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl border border-[#EBE4D8] text-[#5C736C] hover:bg-[#FAF6EF]"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <>
                <span />
                <button
                  onClick={() => void sensor.connect()}
                  disabled={sensor.status === 'connecting'}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-[#6FA79A] text-white hover:bg-[#578C80] disabled:opacity-60"
                >
                  {sensor.status === 'connecting' ? 'Connecting…' : 'Connect indoor sensor'}
                </button>
              </>
            )
          ) : (
            <span className="text-[11px] text-[#5C736C]">Live sensor works in Chrome on a laptop</span>
          )}
        </div>
      </div>
    </div>
  );
};
