import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertTriangle,
  X,
  Loader2,
  Smile,
  Meh,
  Frown,
  ZoomIn,
  Volume2,
  VolumeX,
  Check,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CheckIn, BodyArea, ProductAmount, ChildProfile } from '../types';
import { generateSkinSvg } from '../utils/mockSkinImages';
import { PhotoZoomModal } from './PhotoZoomModal';

interface CheckInFlowProps {
  isOpen: boolean;
  onClose: () => void;
  child: ChildProfile;
  previousCheckIns: CheckIn[];
  onSaveCheckIn: (checkIn: CheckIn) => void;
  onTriggerRedFlag: (reason: string) => void;
}

export const CheckInFlow: React.FC<CheckInFlowProps> = ({
  isOpen,
  onClose,
  child,
  previousCheckIns,
  onSaveCheckIn,
  onTriggerRedFlag,
}) => {
  // Simplified 1-screen check-in state
  const [bodyArea, setBodyArea] = useState<BodyArea>('face');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [skipPhoto, setSkipPhoto] = useState<boolean>(false);
  const [ghostOpacity, setGhostOpacity] = useState<number>(35);
  const [showGhost, setShowGhost] = useState<boolean>(true);

  // Itch score 1-5 (defaults to 2: mild)
  const [itchScore, setItchScore] = useState<number>(2);

  // Quick tags
  const [selectedTags, setSelectedTags] = useState<string[]>(['Bath']);

  // Product & Calm Routine
  const [appliedProduct, setAppliedProduct] = useState<string>('Ceramide Barrier Balm');
  const [productAmount, setProductAmount] = useState<ProductAmount>('medium dab');
  const [calmPlanDone, setCalmPlanDone] = useState<boolean>(true);

  // Submission & AI Analysis
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [isZoomOpen, setIsZoomOpen] = useState<boolean>(false);
  const [isSpeakingAssessment, setIsSpeakingAssessment] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Find previous check-in photo for ghost overlay
  const previousAreaCheckIn = previousCheckIns
    .filter((c) => c.bodyArea === bodyArea && c.photoUrl)
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setPhotoDataUrl(loadEvent.target?.result as string);
        setSkipPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUseSamplePhoto = (severity: 'mild' | 'moderate' | 'flare' = 'mild') => {
    const sample = generateSkinSvg({
      bodyArea,
      severity,
      seed: Math.floor(Math.random() * 100) + 1,
    });
    setPhotoDataUrl(sample);
    setSkipPhoto(false);
  };

  const toggleTag = (tag: string) => {
    if (tag === '⚠️ Fever / Blistering') {
      onTriggerRedFlag('Parent reported fever, crusting, or spreading blisters.');
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let finalPhoto = skipPhoto ? '' : photoDataUrl;
    if (!finalPhoto && !skipPhoto) {
      finalPhoto = generateSkinSvg({ bodyArea, severity: 'mild', seed: 44 });
    }

    try {
      const res = await fetch('/api/analyze-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: finalPhoto,
          bodyArea,
          itchScore,
          tags: selectedTags,
          childName: child.name,
        }),
      });

      const data = await res.json();
      setAnalysisResult(data);

      if (data.redFlagsDetected) {
        setIsSubmitting(false);
        onClose();
        onTriggerRedFlag(data.redFlagReason || 'Clinical infection warning detected');
        return;
      }

      // Compute skin score (0-100)
      const rednessPenalty = (data.rednessScore ?? 1) * 15;
      const itchPenalty = (itchScore - 1) * 12;
      const scratchPenalty = (data.scratchScore ?? 0) * 10;
      const computedScore = Math.max(
        25,
        Math.min(96, 100 - (rednessPenalty + itchPenalty + scratchPenalty))
      );

      const today = new Date();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const displayDate = `${monthNames[today.getMonth()]} ${today.getDate()}`;

      const newCheckIn: CheckIn = {
        id: `checkin-${child.id}-${Date.now()}`,
        childId: child.id,
        date: today.toISOString().split('T')[0],
        displayDate,
        timestamp: today.getTime(),
        bodyArea,
        photoUrl: finalPhoto,
        itchScore,
        tags: selectedTags,
        productUsed: appliedProduct
          ? {
              name: appliedProduct,
              amount: productAmount,
            }
          : undefined,
        calmPlanDone,
        skinScore: computedScore,
        aiAnalysis: data,
      };

      onSaveCheckIn(newCheckIn);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#6FA79A', '#F4A98A', '#E8B04B'],
        });
      } catch {
        // Safe fallback
      }

      setIsCelebrationOpen(true);
    } catch (err) {
      console.error('Failed to analyze check-in:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpeakAssessment = () => {
    if (!('speechSynthesis' in window) || !analysisResult) return;

    if (isSpeakingAssessment) {
      window.speechSynthesis.cancel();
      setIsSpeakingAssessment(false);
      return;
    }

    window.speechSynthesis.cancel();
    const textToSpeak = `${child.name}'s assessment: ${analysisResult.description}. Status is ${analysisResult.overallStatus}. Redness level ${analysisResult.rednessScore || 1} out of 3. Tomorrow's forecast has been updated, and rain water is showering your care garden.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeakingAssessment(true);
    utterance.onend = () => setIsSpeakingAssessment(false);
    utterance.onerror = () => setIsSpeakingAssessment(false);

    window.speechSynthesis.speak(utterance);
  };

  const bodyAreas: { key: BodyArea; label: string }[] = [
    { key: 'face', label: 'Face / Cheeks' },
    { key: 'elbows', label: 'Elbow Creases' },
    { key: 'knees', label: 'Behind Knees' },
    { key: 'hands', label: 'Hands / Wrists' },
    { key: 'torso', label: 'Neck / Torso' },
    { key: 'other', label: 'Other Spot' },
  ];

  const quickTagsList = [
    'Bath',
    'Daycare',
    'Sweaty/hot',
    'New product',
    'New food',
    'Bad night',
    'Stress',
    'Pet contact',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#6FA79A]/20">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#FAF6EF]">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#6FA79A]">
                Quick 1-Screen Check-In
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-[#426C63] font-bold">
                Under 10s · 3 Taps
              </span>
            </div>
            <h2 id="checkin-title" className="text-base font-bold text-[#2C3E38]">
              Log {child.name}'s Skin Status
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Check-in"
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unified 1-Screen Content (No multi-step wizard!) */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* 1. Body Area Picker (1-tap chips) */}
          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">
              1. Where is the affected spot?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {bodyAreas.map((area) => (
                <button
                  key={area.key}
                  type="button"
                  onClick={() => setBodyArea(area.key)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold transition-all text-center ${
                    bodyArea === area.key
                      ? 'bg-[#6FA79A] text-white shadow-sm'
                      : 'bg-[#F2F7F6] text-[#426C63] hover:bg-[#E2EDE9]'
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Itch Level (1-tap large buttons) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#2C3E38]">
                2. How itchy was {child.name} today?
              </label>
              <span className="text-xs font-black text-[#578C80]">
                Level {itchScore} of 5
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { val: 1, label: 'Calm', icon: Smile, color: 'text-[#6FA79A]' },
                { val: 2, label: 'Mild', icon: Smile, color: 'text-[#6FA79A]' },
                { val: 3, label: 'Rubbing', icon: Meh, color: 'text-[#E8B04B]' },
                { val: 4, label: 'Scratch', icon: Frown, color: 'text-[#F4A98A]' },
                { val: 5, label: 'Distress', icon: Frown, color: 'text-[#D9644F]' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = itchScore === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setItchScore(item.val)}
                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#E8F2F0] border-2 border-[#6FA79A] shadow-xs'
                        : 'bg-[#FAF6EF] border border-[#EBE4D8] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-0.5 ${isSelected ? 'text-[#3B665E]' : item.color}`} />
                    <span className={`text-[10px] font-bold ${isSelected ? 'text-[#2C3E38]' : 'text-slate-600'}`}>
                      {item.val}·{item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Photo & Alignment (Simple, 1-tap, or optional skip!) */}
          <div className="bg-[#FAF6EF] rounded-2xl p-3.5 border border-[#EBE4D8] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2C3E38] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#6FA79A]" />
                <span>3. Photo of affected skin</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setSkipPhoto(!skipPhoto);
                  if (!skipPhoto) setPhotoDataUrl('');
                }}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  skipPhoto
                    ? 'bg-[#E8F2F0] text-[#3B665E]'
                    : 'text-[#5C736C] hover:text-[#2C3E38]'
                }`}
              >
                {skipPhoto ? '✓ Skipped photo' : 'Skip photo today'}
              </button>
            </div>

            {!skipPhoto ? (
              <div className="flex items-center gap-3">
                {/* Photo Preview Box with Ghost Overlay */}
                <div className="relative w-20 h-20 bg-white rounded-xl border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                  {photoDataUrl ? (
                    <>
                      <img
                        src={photoDataUrl}
                        alt="Skin preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setIsZoomOpen(true)}
                        className="absolute bottom-1 right-1 p-1 bg-black/60 rounded text-white"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <Camera className="w-6 h-6 text-slate-300" />
                  )}

                  {showGhost && previousAreaCheckIn?.photoUrl && !photoDataUrl && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ opacity: ghostOpacity / 100 }}
                    >
                      <img
                        src={previousAreaCheckIn.photoUrl}
                        alt="Ghost guide"
                        className="w-full h-full object-cover saturate-50"
                      />
                    </div>
                  )}
                </div>

                {/* Photo Action Buttons */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-9 px-3 rounded-xl bg-white border border-[#6FA79A]/40 text-[#426C63] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F2F7F6] shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{photoDataUrl ? 'Change Photo' : 'Snap / Upload'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUseSamplePhoto('mild')}
                      className="h-9 px-3 rounded-xl bg-[#F2F7F6] text-[#578C80] font-bold text-xs flex items-center justify-center gap-1 hover:bg-[#E2EDE9]"
                      title="1-tap instant sample skin"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#E8B04B]" />
                      <span>Sample</span>
                    </button>
                  </div>

                  {/* Ghost Alignment Guide Toggle */}
                  {previousAreaCheckIn?.photoUrl && (
                    <div className="flex items-center justify-between text-[11px] text-[#5C736C]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-[#6FA79A]" />
                        <span>Ghost from {previousAreaCheckIn.displayDate}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowGhost(!showGhost)}
                        className="font-bold text-[#578C80] hover:underline"
                      >
                        {showGhost ? 'Hide Ghost' : 'Show Ghost'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#5C736C] italic py-1">
                Photo skipped — AI will evaluate flare score using itch rating and environmental context.
              </p>
            )}
          </div>

          {/* 4. Quick Exposure Tags (1-tap toggle) */}
          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">
              4. Daily exposures (Tap to toggle)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickTagsList.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#6FA79A] text-white shadow-2xs'
                        : 'bg-[#F2F7F6] text-[#426C63] hover:bg-[#E2EDE9]'
                    }`}
                  >
                    {active && '✓ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Product Applied & Calm Routine (Quick check) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#5C736C] mb-1">
                  Product Applied
                </label>
                <select
                  value={appliedProduct}
                  onChange={(e) => setAppliedProduct(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs font-medium text-[#2C3E38]"
                >
                  <option value="Ceramide Barrier Balm">Ceramide Barrier Balm (Active Trial)</option>
                  <option value="Hydrocortisone 1% (Calm Plan)">Hydrocortisone 1% (Calm Plan)</option>
                  <option value="Gentle Calming Emollient">Gentle Calming Emollient</option>
                  <option value="Oat Soothing Lotion">Oat Soothing Lotion</option>
                  <option value="None">None applied</option>
                </select>
              </div>

              {appliedProduct !== 'None' && (
                <div className="w-28">
                  <label className="block text-[11px] font-bold text-[#5C736C] mb-1">
                    Amount
                  </label>
                  <select
                    value={productAmount}
                    onChange={(e) => setProductAmount(e.target.value as ProductAmount)}
                    className="w-full h-9 px-2 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs font-medium text-[#2C3E38]"
                  >
                    <option value="small dab">Small dab</option>
                    <option value="medium dab">Medium dab</option>
                    <option value="large dab">Large dab</option>
                    <option value="½ FTU">½ FTU</option>
                    <option value="1 FTU">1 FTU</option>
                  </select>
                </div>
              )}
            </div>

            {/* Calm Plan Checkbox */}
            <label className="p-3 rounded-2xl bg-[#F2F7F6] border border-[#6FA79A]/20 flex items-center justify-between cursor-pointer hover:bg-[#E8F2F0] transition-colors">
              <div>
                <span className="text-xs font-bold text-[#2C3E38] block">
                  Calm Routine Completed Today
                </span>
                <span className="text-[11px] text-[#5C736C]">
                  Lukewarm soak + moisture seal within 3 minutes
                </span>
              </div>
              <input
                type="checkbox"
                checked={calmPlanDone}
                onChange={(e) => setCalmPlanDone(e.target.checked)}
                className="w-5 h-5 accent-[#6FA79A] rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Red Flag Warning */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => toggleTag('⚠️ Fever / Blistering')}
              className="w-full p-2.5 rounded-xl bg-[#FDEEEB] border border-[#D9644F]/20 text-left flex items-center gap-2 hover:bg-[#FCDFD8] transition-colors"
            >
              <AlertTriangle className="w-4 h-4 text-[#D9644F] shrink-0" />
              <span className="text-xs font-bold text-[#D9644F]">
                Child has fever, yellow crusting, or spreading blisters?
              </span>
            </button>
          </div>
        </div>

        {/* 1-Tap Save Action Footer */}
        <div className="p-4 border-t border-slate-100 bg-[#FAF6EF] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#5C736C] hover:text-[#2C3E38]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-12 px-7 rounded-2xl bg-[#6FA79A] text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-[#6FA79A]/25 hover:bg-[#578C80] transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI Scanning Skin...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#E8B04B]" />
                <span>Save Check-In (1 Tap)</span>
              </>
            )}
          </button>
        </div>

        {/* CELEBRATION MODAL ON SUCCESS (With Audio Read-Aloud for accessibility) */}
        {isCelebrationOpen && analysisResult && (
          <div className="absolute inset-0 z-20 bg-white p-6 flex flex-col justify-between overflow-y-auto animate-fade-in">
            <div className="space-y-4 text-center pt-2">
              <div className="w-14 h-14 rounded-full bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-7 h-7 text-[#E8B04B]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6FA79A]">
                  Check-in Logged Successfully
                </span>
                <h3 className="text-xl font-black text-[#2C3E38] mt-1">
                  Tomorrow's Forecast Updated!
                </h3>
                <p className="text-xs text-[#5C736C] mt-1">
                  🌧️ Fresh rain water is watering {child.name}'s care garden 🌱
                </p>
              </div>

              {/* AI Assessment Card with Spoken Voice button */}
              <div className="bg-[#FAF6EF] rounded-2xl p-4 text-left border border-[#EBE4D8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#426C63] flex items-center gap-1.5">
                    <span>Gemini Vision Assessment</span>
                  </span>

                  <button
                    type="button"
                    onClick={handleSpeakAssessment}
                    aria-label="Listen to assessment"
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                      isSpeakingAssessment
                        ? 'bg-[#E8F2F0] text-[#3B665E] border border-[#6FA79A]'
                        : 'bg-white text-[#578C80] border border-[#6FA79A]/30 hover:bg-[#F2F7F6]'
                    }`}
                  >
                    {isSpeakingAssessment ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-[#D9644F]" />
                        <span>Stop voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#6FA79A]" />
                        <span>Listen aloud 🔊</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-[#2C3E38] leading-relaxed italic">
                  "{analysisResult.description}"
                </p>

                {/* Score breakdown 0-3 */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EBE4D8] text-center text-xs">
                  <div className="p-1.5 rounded-lg bg-white">
                    <span className="text-[10px] text-[#5C736C] block">Redness</span>
                    <span className="font-bold text-[#2C3E38]">
                      {analysisResult.rednessScore ?? 1} / 3
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white">
                    <span className="text-[10px] text-[#5C736C] block">Swelling</span>
                    <span className="font-bold text-[#2C3E38]">
                      {analysisResult.swellingScore ?? 0} / 3
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white">
                    <span className="text-[10px] text-[#5C736C] block">Scratches</span>
                    <span className="font-bold text-[#2C3E38]">
                      {analysisResult.scratchScore ?? 0} / 3
                    </span>
                  </div>
                </div>

                {/* Disclaimer */}
                <p className="text-[10px] text-[#6A857D] text-center border-t border-[#EBE4D8] pt-2">
                  {analysisResult.disclaimer ||
                    'This is not a diagnosis — worth discussing with your doctor.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsCelebrationOpen(false);
                onClose();
              }}
              className="w-full h-12 rounded-2xl bg-[#6FA79A] text-white font-bold text-sm shadow-md shadow-[#6FA79A]/20 hover:bg-[#578C80] transition-colors mt-4 flex items-center justify-center gap-2"
            >
              <span>Done — Watch Plant Rain Shower 🌱</span>
            </button>
          </div>
        )}
      </div>

      {/* PHOTO ZOOM MODAL */}
      <PhotoZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        photoUrl={photoDataUrl}
        title={`${child.name}'s ${bodyArea} preview`}
      />
    </div>
  );
};
