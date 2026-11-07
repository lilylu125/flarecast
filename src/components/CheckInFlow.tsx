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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Product & Calm Routine
  const [appliedProduct, setAppliedProduct] = useState<string>('None');
  const [productAmount, setProductAmount] = useState<ProductAmount>('medium dab');
  const [calmPlanDone, setCalmPlanDone] = useState<boolean>(false);
  const [showMoreDetails, setShowMoreDetails] = useState<boolean>(false);

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
      let data: any;
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

        if (!res.ok) throw new Error(`AI check failed (${res.status})`);
        data = await res.json();
      } catch (aiErr) {
        // AI unavailable (offline, quota, no server): still save the check-in with a simple estimate.
        console.warn('AI skin check unavailable, saving without it:', aiErr);
        data = {
          description: 'Saved. The AI photo check is unavailable right now, so this estimate uses the itch rating only.',
          rednessScore: itchScore >= 4 ? 2 : itchScore === 3 ? 1 : 0,
          swellingScore: 0,
          scratchScore: itchScore >= 4 ? 1 : 0,
          overallStatus: itchScore >= 3 ? 'yellow' : 'green',
          redFlagsDetected: false,
          disclaimer: 'This is not a diagnosis — worth discussing with your doctor.',
        };
      }
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
        productUsed: appliedProduct && appliedProduct !== 'None'
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
    const textToSpeak = `${child.name}'s assessment: ${analysisResult.description}. Status is ${analysisResult.overallStatus}. Redness level ${analysisResult.rednessScore || 1} out of 3. Next steps: ${getNextSteps(analysisResult.overallStatus, selectedTags).map((n) => n.text).join('. ')}.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;

    utterance.onstart = () => setIsSpeakingAssessment(true);
    utterance.onend = () => setIsSpeakingAssessment(false);
    utterance.onerror = () => setIsSpeakingAssessment(false);

    window.speechSynthesis.speak(utterance);
  };

  const bodyAreas: { key: BodyArea; label: string }[] = [
    { key: 'face', label: 'Face' },
    { key: 'hands', label: 'Hands' },
    { key: 'elbows', label: 'Elbows' },
    { key: 'knees', label: 'Knees' },
    { key: 'torso', label: 'Body' },
    { key: 'other', label: 'Other' },
  ];

  const quickTagsList = [
    'Bath',
    'Swimming (chlorine)',
    'Daycare/School',
    'Sports / sweaty',
    'New product',
    'New food',
    'Bad night',
    'Pet contact',
  ];

  const itchOptions = [
    { val: 1, label: 'None', icon: Smile, color: 'text-[#6FA79A]' },
    { val: 2, label: 'Mild', icon: Smile, color: 'text-[#6FA79A]' },
    { val: 3, label: 'Some', icon: Meh, color: 'text-[#E8B04B]' },
    { val: 4, label: 'A lot', icon: Frown, color: 'text-[#F4A98A]' },
    { val: 5, label: 'Severe', icon: Frown, color: 'text-[#D9644F]' },
  ];

  const status: 'green' | 'yellow' | 'red' = analysisResult?.overallStatus || 'green';
  const nextSteps = analysisResult ? getNextSteps(status, selectedTags) : [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkin-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-[#6FA79A]/20">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#FAF6EF]">
          <h2 id="checkin-title" className="text-base font-bold text-[#2C3E38]">
            Log {child.name}'s skin
          </h2>
          <button
            onClick={onClose}
            aria-label="Close check-in"
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          {/* 1. Photo: the whole tile is the button */}
          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">1. Photo</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />

            {skipPhoto ? (
              <button
                type="button"
                onClick={() => setSkipPhoto(false)}
                className="w-full py-3 rounded-2xl border border-dashed border-[#6FA79A]/40 text-xs font-semibold text-[#5C736C] hover:bg-[#F2F7F6]"
              >
                Photo skipped · tap to add one
              </button>
            ) : (
              <>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-dashed border-[#6FA79A]/50 bg-[#F2F7F6] hover:bg-[#E8F2F0] transition-colors flex flex-col items-center justify-center gap-2"
                    aria-label={photoDataUrl ? 'Retake photo' : 'Take a photo'}
                  >
                    {photoDataUrl ? (
                      <>
                        <img src={photoDataUrl} alt="Skin preview" className="absolute inset-0 w-full h-full object-cover" />
                        <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-bold">
                          Tap to retake
                        </span>
                      </>
                    ) : (
                      <>
                        {showGhost && previousAreaCheckIn?.photoUrl && (
                          <img
                            src={previousAreaCheckIn.photoUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover saturate-50 pointer-events-none"
                            style={{ opacity: ghostOpacity / 100 }}
                          />
                        )}
                        <span className="relative w-12 h-12 rounded-full bg-[#6FA79A] text-white flex items-center justify-center shadow-md">
                          <Camera className="w-6 h-6" />
                        </span>
                        <span className="relative text-sm font-bold text-[#2C3E38]">Tap to take a photo</span>
                      </>
                    )}
                  </button>

                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setIsZoomOpen(true)}
                      className="absolute bottom-2 right-2 p-1.5 bg-black/60 rounded-lg text-white"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleUseSamplePhoto('mild')}
                    className="font-bold text-[#578C80] hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#E8B04B]" />
                    Use a test image
                  </button>
                  {previousAreaCheckIn?.photoUrl && !photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => setShowGhost(!showGhost)}
                      className="font-semibold text-[#5C736C] hover:underline flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {showGhost ? 'Hide last photo' : 'Show last photo'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSkipPhoto(true);
                      setPhotoDataUrl('');
                    }}
                    className="font-semibold text-[#5C736C] hover:underline"
                  >
                    Skip photo
                  </button>
                </div>
              </>
            )}
          </div>

          {/* 2. Where */}
          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">2. Where?</label>
            <div className="grid grid-cols-6 gap-1.5">
              {bodyAreas.map((area) => (
                <button
                  key={area.key}
                  type="button"
                  onClick={() => setBodyArea(area.key)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
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

          {/* 3. Itch */}
          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">3. How itchy?</label>
            <div className="grid grid-cols-5 gap-1.5">
              {itchOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = itchScore === item.val;
                return (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => setItchScore(item.val)}
                    className={`py-2.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-[#E8F2F0] border-2 border-[#6FA79A]'
                        : 'bg-[#FAF6EF] border border-[#EBE4D8] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-0.5 ${isSelected ? 'text-[#3B665E]' : item.color}`} />
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-[#2C3E38]' : 'text-slate-600'}`}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Daily exposures (none selected by default) */}
          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">
              4. Daily exposures (tap to select)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickTagsList.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
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

          {/* Optional details, collapsed by default */}
          <div className="rounded-2xl border border-[#EBE4D8]">
            <button
              type="button"
              onClick={() => setShowMoreDetails(!showMoreDetails)}
              className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-[#426C63]"
            >
              <span>Cream used & routine (optional)</span>
              <span>{showMoreDetails ? '−' : '+'}</span>
            </button>

            {showMoreDetails && (
              <div className="px-4 pb-4 space-y-2.5">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] font-bold text-[#5C736C] mb-1">Cream</label>
                    <select
                      value={appliedProduct}
                      onChange={(e) => setAppliedProduct(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs font-medium text-[#2C3E38]"
                    >
                      <option value="None">None</option>
                      <option value="Ceramide Barrier Balm">Ceramide Barrier Balm</option>
                      <option value="Hydrocortisone 1% (Care Plan)">Hydrocortisone 1%</option>
                      <option value="Gentle Calming Emollient">Gentle Calming Emollient</option>
                      <option value="Oat Soothing Lotion">Oat Soothing Lotion</option>
                    </select>
                  </div>
                  {appliedProduct !== 'None' && (
                    <div className="w-28">
                      <label className="block text-[11px] font-bold text-[#5C736C] mb-1">Amount</label>
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

                <label className="px-3 py-2.5 rounded-xl bg-[#F2F7F6] flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-[#2C3E38]">Care Plan done today</span>
                  <input
                    type="checkbox"
                    checked={calmPlanDone}
                    onChange={(e) => setCalmPlanDone(e.target.checked)}
                    className="w-5 h-5 accent-[#6FA79A] rounded cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Red flag shortcut */}
          <button
            type="button"
            onClick={() => toggleTag('⚠️ Fever / Blistering')}
            className="w-full p-2.5 rounded-xl bg-[#FDEEEB] border border-[#D9644F]/20 text-left flex items-center gap-2 hover:bg-[#FCDFD8] transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-[#D9644F] shrink-0" />
            <span className="text-xs font-bold text-[#D9644F]">Fever, yellow crusts or spreading blisters?</span>
          </button>
        </div>

        {/* Save */}
        <div className="p-4 border-t border-slate-100 bg-[#FAF6EF] shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-[#6FA79A] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#6FA79A]/25 hover:bg-[#578C80] transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking skin…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save check-in</span>
              </>
            )}
          </button>
        </div>

        {/* RESULT + NEXT STEPS */}
        {isCelebrationOpen && analysisResult && (
          <div className="absolute inset-0 z-20 bg-white p-6 flex flex-col justify-between overflow-y-auto animate-fade-in">
            <div className="space-y-4">
              <div className="text-center pt-2">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                    status === 'red' ? 'bg-[#FDEEEB] text-[#D9644F]' : status === 'yellow' ? 'bg-[#FEF6E8] text-[#B88A3B]' : 'bg-[#E8F2F0] text-[#426C63]'
                  }`}
                >
                  {status === 'red' ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
                </div>
                <h3 className="text-xl font-black text-[#2C3E38] mt-3">Check-in saved</h3>
              </div>

              {/* AI assessment */}
              <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#EBE4D8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#426C63]">AI skin check</span>
                  <button
                    type="button"
                    onClick={handleSpeakAssessment}
                    aria-label="Listen to assessment"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#578C80] border border-[#6FA79A]/30 hover:bg-[#F2F7F6]"
                  >
                    {isSpeakingAssessment ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-[#D9644F]" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#6FA79A]" />
                        Listen
                      </>
                    )}
                  </button>
                </div>
                <p className="text-sm text-[#2C3E38] leading-relaxed">{analysisResult.description}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    ['Redness', analysisResult.rednessScore ?? 1],
                    ['Swelling', analysisResult.swellingScore ?? 0],
                    ['Scratches', analysisResult.scratchScore ?? 0],
                  ].map(([label, val]) => (
                    <div key={label as string} className="p-1.5 rounded-lg bg-white">
                      <span className="text-[10px] text-[#5C736C] block">{label}</span>
                      <span className="font-bold text-[#2C3E38]">{val} / 3</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next steps */}
              <div
                className={`rounded-2xl p-4 border space-y-2 ${
                  status === 'red' ? 'bg-[#FDEEEB] border-[#D9644F]/30' : status === 'yellow' ? 'bg-[#FEF6E8] border-[#E8B04B]/35' : 'bg-[#F2F7F6] border-[#6FA79A]/20'
                }`}
              >
                <span className="text-xs font-black text-[#2C3E38]">Next steps</span>
                <ol className="space-y-1.5">
                  {nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#2C3E38]">
                      <span className="w-5 h-5 rounded-full bg-white text-[11px] font-black flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className={step.urgent ? 'font-bold text-[#D9644F]' : ''}>{step.text}</span>
                    </li>
                  ))}
                </ol>
                {status !== 'green' && (
                  <a
                    href="tel:+15550100123"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#D9644F] hover:underline"
                  >
                    Call {child.calmPlan.doctorName || 'your doctor'} (demo number)
                  </a>
                )}
                <p className="text-[10px] text-[#6A857D]">Not a diagnosis. Your doctor's advice comes first.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                setIsCelebrationOpen(false);
                onClose();
              }}
              className="w-full h-12 rounded-2xl bg-[#6FA79A] text-white font-bold text-sm shadow-md hover:bg-[#578C80] transition-colors mt-4"
            >
              Done
            </button>
          </div>
        )}
      </div>

      <PhotoZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        photoUrl={photoDataUrl}
        title={`${child.name}'s ${bodyArea} preview`}
      />
    </div>
  );
};

/** Plain-language next steps after a check-in, based on the AI status and today's exposures. */
function getNextSteps(status: 'green' | 'yellow' | 'red', tags: string[]): { text: string; urgent?: boolean }[] {
  const steps: { text: string; urgent?: boolean }[] = [];
  if (status === 'red') {
    steps.push({ text: 'Contact your doctor today.', urgent: true });
    steps.push({ text: "Follow your doctor's flare plan until you hear back." });
  } else if (status === 'yellow') {
    steps.push({ text: 'Do your Care Plan routine tonight.' });
    steps.push({ text: 'Moisturize within 3 minutes after bath.' });
    steps.push({ text: 'Not better in 2–3 days? Book a doctor visit.' });
  } else {
    steps.push({ text: 'Skin looks calm. Keep your usual routine.' });
  }
  if (tags.includes('Swimming (chlorine)')) steps.push({ text: 'After swimming, rinse off chlorine and moisturize right away.' });
  if (tags.includes('Sports / sweaty')) steps.push({ text: 'Rinse off sweat and change into dry clothes after activity.' });
  if (tags.includes('Daycare/School')) steps.push({ text: 'Pack moisturizer for daycare/school.' });
  steps.push({ text: 'Log again tomorrow to keep the forecast accurate.' });
  return steps;
}
