import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Sparkles, Loader2, MessageSquareText } from 'lucide-react';
import { ChildProfile } from '../types';
import { WeatherForecastResult } from '../utils/weatherForecast';

interface AudioSummaryCardProps {
  child: ChildProfile;
  latestScore: number;
  weather: WeatherForecastResult;
  onOpenAssistant?: () => void;
}

export const AudioSummaryCard: React.FC<AudioSummaryCardProps> = ({
  child,
  latestScore,
  weather,
  onOpenAssistant,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(false);
  const [scriptText, setScriptText] = useState<string>('');
  const [showTranscript, setShowTranscript] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const todayWeather = weather.days[0];
  const flareRisk = todayWeather?.riskLevel || 'Low';
  const tempC = todayWeather?.tempMaxC ?? 20;
  const humidity = todayWeather?.humidityPercent ?? 45;

  // Fetch or generate the daily audio summary script
  useEffect(() => {
    let isMounted = true;
    const fetchAudioScript = async () => {
      setIsLoadingScript(true);
      try {
        const res = await fetch('/api/generate-daily-audio-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childName: child.name,
            skinScore: latestScore,
            flareRisk,
            tempC,
            humidity,
            calmRoutine: child.calmPlan.moisturizerRoutine || 'Lukewarm soak & moisturizer',
          }),
        });
        const data = await res.json();
        if (isMounted && data.script) {
          setScriptText(data.script);
        }
      } catch (err) {
        console.warn('Fallback audio script used:', err);
        if (isMounted) {
          setScriptText(
            `Good morning! ${child.name}'s skin score is ${latestScore} out of 100, and today's flare risk is ${flareRisk}. Humidity is at ${humidity} percent and temperature is ${tempC} degrees Celsius. Remember your evening lukewarm soak and seal routine. You are doing a wonderful job!`
          );
        }
      } finally {
        if (isMounted) setIsLoadingScript(false);
      }
    };

    fetchAudioScript();

    return () => {
      isMounted = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [child.id, latestScore, flareRisk, tempC, humidity]);

  const handlePlayAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device. Please read the transcript below.');
      setShowTranscript(true);
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
      return;
    }

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const textToSpeak =
      scriptText ||
      `Good morning! ${child.name}'s skin score is ${latestScore}, with a ${flareRisk} flare risk today. Humidity is ${humidity} percent. Remember your soothing calm routine!`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    // Pick a natural gentle voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en'))
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleRestart = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setTimeout(handlePlayAudio, 100);
    }
  };

  return (
    <div
      role="region"
      aria-label="Accessible Audio Summary"
      className="bg-white rounded-3xl p-4 sm:p-5 border border-[#6FA79A]/20 shadow-sm transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Info Zone */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center shrink-0 shadow-2xs">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#578C80]">
                Accessibility Audio Briefing
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF6EF] text-[#B8684C] font-bold">
                Spoken AI Summary
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#2C3E38]">
              Listen to {child.name}'s Daily Flare Forecast
            </h3>
            <p className="text-xs text-[#5C736C]">
              Hands-free spoken summary of skin score, risk & calm plan
            </p>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            type="button"
            onClick={handlePlayAudio}
            disabled={isLoadingScript}
            aria-label={isPlaying ? 'Pause audio summary' : 'Play audio summary'}
            className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
              isPlaying
                ? 'bg-[#E8F2F0] text-[#3B665E] border border-[#6FA79A]/40'
                : 'bg-[#6FA79A] text-white hover:bg-[#578C80]'
            }`}
          >
            {isLoadingScript ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Audio</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Play Summary</span>
              </>
            )}
          </button>

          {isPlaying && (
            <button
              type="button"
              onClick={handleRestart}
              title="Restart audio"
              aria-label="Restart audio summary"
              className="w-10 h-10 rounded-xl bg-[#F2F7F6] text-[#426C63] flex items-center justify-center hover:bg-[#E2EDE9]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            aria-expanded={showTranscript}
            aria-label="Toggle text transcript"
            className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showTranscript
                ? 'bg-[#FAF6EF] border-[#EBE4D8] text-[#2C3E38]'
                : 'bg-white border-slate-200 text-[#5C736C] hover:bg-slate-50'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>{showTranscript ? 'Hide Text' : 'Transcript'}</span>
          </button>
        </div>
      </div>

      {/* Animated Sound Wave Bar when Playing */}
      {isPlaying && (
        <div className="mt-3 pt-3 border-t border-[#6FA79A]/15 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#426C63]">Speaking:</span>
            <div className="flex items-center gap-1 h-4 px-2">
              <span className="w-1 h-3 bg-[#6FA79A] rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-1 h-4 bg-[#6FA79A] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 h-2 bg-[#6FA79A] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              <span className="w-1 h-4 bg-[#6FA79A] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-1 h-2.5 bg-[#6FA79A] rounded-full animate-bounce" style={{ animationDelay: '0.25s' }} />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5C736C]">
            <span>Speed:</span>
            <button
              onClick={() => {
                const nextRate = speechRate === 1 ? 1.25 : speechRate === 1.25 ? 0.9 : 1;
                setSpeechRate(nextRate);
              }}
              className="px-2 py-0.5 rounded bg-[#FAF6EF] font-bold text-[#426C63] hover:bg-[#EBE4D8]"
            >
              {speechRate}x
            </button>
          </div>
        </div>
      )}

      {/* Transcript Text Box (Accessible closed captions) */}
      {showTranscript && (
        <div className="mt-3 p-3 bg-[#FAF6EF] rounded-2xl border border-[#EBE4D8] text-xs text-[#2C3E38] leading-relaxed animate-fade-in space-y-1">
          <span className="text-[10px] uppercase font-bold text-[#578C80] block">
            Audio Transcript
          </span>
          <p className="italic">"{scriptText || 'Loading daily script...'}"</p>
        </div>
      )}
    </div>
  );
};
