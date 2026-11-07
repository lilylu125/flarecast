import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertTriangle,
  ArrowRight,
  X,
  Loader2,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CheckIn, BodyArea, ProductAmount, ChildProfile } from '../types';
import { generateSkinSvg } from '../utils/mockSkinImages';

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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Photo & Area
  const [bodyArea, setBodyArea] = useState<BodyArea>('face');
  const [photoDataUrl, setPhotoDataUrl] = useState<string>('');
  const [ghostOpacity, setGhostOpacity] = useState<number>(35); // 0 to 100
  const [showGhost, setShowGhost] = useState<boolean>(true);

  // Step 2: Itch level 1-5
  const [itchScore, setItchScore] = useState<number>(2);

  // Step 3: Quick tags
  const [selectedTags, setSelectedTags] = useState<string[]>(['Bath']);

  // Step 4: Product applied
  const [appliedProduct, setAppliedProduct] = useState<string>('Ceramide Barrier Balm');
  const [productAmount, setProductAmount] = useState<ProductAmount>('medium dab');
  const [calmPlanDone, setCalmPlanDone] = useState<boolean>(true);

  // Submission & AI Analysis State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);

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
  };

  const toggleTag = (tag: string) => {
    if (tag === '⚠️ Fever / Blistering') {
      onTriggerRedFlag('Parent reported fever or spreading blister symptoms.');
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let finalPhoto = photoDataUrl;
    if (!finalPhoto) {
      finalPhoto = generateSkinSvg({ bodyArea, severity: 'mild', seed: 44 });
    }

    try {
      // Call server Gemini API endpoint
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

      // Compute composite skin score (0-100)
      // High itch and high redness lower the score
      const rednessPenalty = (data.rednessScore ?? 1) * 15;
      const itchPenalty = (itchScore - 1) * 12;
      const scratchPenalty = (data.scratchScore ?? 0) * 10;
      const computedScore = Math.max(25, Math.min(96, 100 - (rednessPenalty + itchPenalty + scratchPenalty)));

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

      // Trigger celebratory confetti
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

  const quickTagsList = [
    'New product',
    'New food',
    'Bad night',
    'Daycare',
    'Sweaty/hot',
    'Stress',
    'Bath',
    'Pet contact',
  ];

  const bodyAreas: { key: BodyArea; label: string }[] = [
    { key: 'face', label: 'Face / Cheeks' },
    { key: 'elbows', label: 'Elbow Creases' },
    { key: 'knees', label: 'Behind Knees' },
    { key: 'hands', label: 'Hands / Wrists' },
    { key: 'torso', label: 'Neck / Torso' },
    { key: 'other', label: 'Other Spot' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-[#FAF6EF]">
          <div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#6FA79A]">
              10-Second Check-In · Step {step} of 4
            </span>
            <h2 className="text-base font-bold text-[#2C3E38]">
              {step === 1 && "Snap Today's Area Photo"}
              {step === 2 && 'Itch & Body Location'}
              {step === 3 && 'Daily Exposure Tags'}
              {step === 4 && 'Product & Calm Routine'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* STEP 1: Photo & Ghost Overlay */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Body Area Picker First */}
              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">
                  Affected Body Area
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {bodyAreas.map((area) => (
                    <button
                      key={area.key}
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

              {/* Viewfinder with Ghost Overlay */}
              <div className="relative w-full aspect-square bg-[#FAF6EF] rounded-2xl border-2 border-dashed border-[#6FA79A]/40 overflow-hidden flex flex-col items-center justify-center group">
                {/* Active Photo if captured */}
                {photoDataUrl ? (
                  <img
                    src={photoDataUrl}
                    alt="Captured skin"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center mx-auto shadow-sm">
                      <Camera className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-[#5C736C]">
                      Capture photo or choose an instant test image
                    </p>
                  </div>
                )}

                {/* Ghost Overlay of previous photo */}
                {showGhost && previousAreaCheckIn?.photoUrl && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-200"
                    style={{ opacity: ghostOpacity / 100 }}
                  >
                    <img
                      src={previousAreaCheckIn.photoUrl}
                      alt="Previous alignment guide"
                      className="w-full h-full object-cover filter contrast-125 saturate-50"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium backdrop-blur-sm">
                      Ghost: {previousAreaCheckIn.displayDate}
                    </div>
                  </div>
                )}

                {/* Viewfinder alignment crosshairs */}
                <div className="absolute inset-8 pointer-events-none border border-white/40 rounded-2xl" />
              </div>

              {/* Ghost Overlay Controls */}
              {previousAreaCheckIn?.photoUrl && (
                <div className="bg-[#FAF6EF] rounded-xl p-3 border border-[#EBE4D8] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#426C63] font-medium">
                    <Layers className="w-4 h-4 text-[#6FA79A]" />
                    <span>Ghost alignment guide</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="10"
                      max="70"
                      value={ghostOpacity}
                      onChange={(e) => setGhostOpacity(Number(e.target.value))}
                      className="w-20 accent-[#6FA79A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGhost(!showGhost)}
                      className="text-[11px] font-bold text-[#578C80] hover:underline"
                    >
                      {showGhost ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions for Photo */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 rounded-xl bg-white border border-[#6FA79A]/40 text-[#426C63] font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-[#F2F7F6]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload / Snap</span>
                </button>

                <button
                  onClick={() => handleUseSamplePhoto('mild')}
                  className="h-11 rounded-xl bg-[#F2F7F6] text-[#578C80] font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#E2EDE9]"
                >
                  <Sparkles className="w-4 h-4 text-[#E8B04B]" />
                  <span>Use Test Photo</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Itch Scale & Area */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#2C3E38]">
                    How itchy was {child.name} today?
                  </label>
                  <span className="text-sm font-black text-[#578C80]">
                    Level {itchScore} of 5
                  </span>
                </div>

                {/* Visual Itch Faces Slider */}
                <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#EBE4D8] space-y-4">
                  <div className="flex justify-between items-center px-1 text-center">
                    <div
                      onClick={() => setItchScore(1)}
                      className={`cursor-pointer transition-transform ${itchScore === 1 ? 'scale-110 font-bold text-[#6FA79A]' : 'opacity-50'}`}
                    >
                      <Smile className="w-7 h-7 mx-auto mb-1 text-[#6FA79A]" />
                      <span className="text-[10px] block">1 · Calm</span>
                    </div>
                    <div
                      onClick={() => setItchScore(2)}
                      className={`cursor-pointer transition-transform ${itchScore === 2 ? 'scale-110 font-bold text-[#6FA79A]' : 'opacity-50'}`}
                    >
                      <Smile className="w-7 h-7 mx-auto mb-1 text-[#6FA79A]" />
                      <span className="text-[10px] block">2 · Mild</span>
                    </div>
                    <div
                      onClick={() => setItchScore(3)}
                      className={`cursor-pointer transition-transform ${itchScore === 3 ? 'scale-110 font-bold text-[#E8B04B]' : 'opacity-50'}`}
                    >
                      <Meh className="w-7 h-7 mx-auto mb-1 text-[#E8B04B]" />
                      <span className="text-[10px] block">3 · Rubbing</span>
                    </div>
                    <div
                      onClick={() => setItchScore(4)}
                      className={`cursor-pointer transition-transform ${itchScore === 4 ? 'scale-110 font-bold text-[#F4A98A]' : 'opacity-50'}`}
                    >
                      <Frown className="w-7 h-7 mx-auto mb-1 text-[#F4A98A]" />
                      <span className="text-[10px] block">4 · Scratching</span>
                    </div>
                    <div
                      onClick={() => setItchScore(5)}
                      className={`cursor-pointer transition-transform ${itchScore === 5 ? 'scale-110 font-bold text-[#D9644F]' : 'opacity-50'}`}
                    >
                      <Frown className="w-7 h-7 mx-auto mb-1 text-[#D9644F]" />
                      <span className="text-[10px] block">5 · Distressed</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={itchScore}
                    onChange={(e) => setItchScore(Number(e.target.value))}
                    className="w-full accent-[#6FA79A] h-2 bg-[#E2DBD0] rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Area verification */}
              <div className="bg-[#F2F7F6] p-3 rounded-xl flex items-center justify-between text-xs">
                <span className="text-[#5C736C]">Logging for:</span>
                <span className="font-bold text-[#426C63] capitalize">
                  {bodyArea} of {child.name}
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: Quick Tags */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  What happened today? (Tap all that apply)
                </label>
                <p className="text-[11px] text-[#5C736C] mb-3">
                  Flarecast correlates these with weather and skin scores to discover patterns.
                </p>

                <div className="flex flex-wrap gap-2">
                  {quickTagsList.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-[#6FA79A] text-white shadow-sm'
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

              {/* Red Flag Quick Safety Trigger */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => toggleTag('⚠️ Fever / Blistering')}
                  className="w-full p-3 rounded-2xl bg-[#FDEEEB] border border-[#D9644F]/30 text-left flex items-start gap-3 hover:bg-[#FCDFD8] transition-colors"
                >
                  <AlertTriangle className="w-5 h-5 text-[#D9644F] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-[#D9644F]">
                      Child has fever, oozing, or spreading blisters?
                    </span>
                    <p className="text-[11px] text-[#8C3A2A] mt-0.5">
                      Tap here immediately for urgent infection safety guidance.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Product Applied & Amount */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">
                  Applied Product
                </label>
                <select
                  value={appliedProduct}
                  onChange={(e) => setAppliedProduct(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs font-medium text-[#2C3E38] focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
                >
                  <option value="Ceramide Barrier Balm">Ceramide Barrier Balm (Active Trial)</option>
                  <option value="Hydrocortisone 1% (Calm Plan)">Hydrocortisone 1% (Calm Plan)</option>
                  <option value="Gentle Calming Emollient">Gentle Calming Emollient</option>
                  <option value="Oat Soothing Lotion">Oat Soothing Lotion</option>
                  <option value="None">None applied</option>
                </select>
              </div>

              {appliedProduct !== 'None' && (
                <div>
                  <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">
                    Amount Applied
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['small dab', 'medium dab', 'large dab', '½ FTU', '1 FTU', '2 FTU'] as ProductAmount[]).map(
                      (amt) => (
                        <button
                          key={amt}
                          onClick={() => setProductAmount(amt)}
                          className={`py-2 px-2 rounded-xl text-xs font-medium transition-all text-center ${
                            productAmount === amt
                              ? 'bg-[#F4A98A] text-white font-bold shadow-sm'
                              : 'bg-[#FDF4F0] text-[#B8684C] hover:bg-[#FBD5C5]'
                          }`}
                        >
                          {amt}
                        </button>
                      )
                    )}
                  </div>
                  <span className="text-[10px] text-[#5C736C] block mt-1">
                    FTU = Fingertip Unit (from adult fingertip to first crease)
                  </span>
                </div>
              )}

              {/* Calm Plan Checkbox */}
              <div className="bg-[#F2F7F6] p-3.5 rounded-2xl border border-[#6FA79A]/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#2C3E38] block">
                    Calm Plan Routine Completed?
                  </span>
                  <span className="text-[11px] text-[#5C736C]">
                    Lukewarm soak + moisture seal
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={calmPlanDone}
                  onChange={(e) => setCalmPlanDone(e.target.checked)}
                  className="w-5 h-5 accent-[#6FA79A] rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="p-4 border-t border-slate-100 bg-[#FAF6EF] flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2 text-xs font-bold text-[#5C736C] hover:text-[#2C3E38]"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#5C736C]"
            >
              Cancel
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as any)}
              className="h-11 px-6 rounded-xl bg-[#6FA79A] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-[#578C80] transition-colors"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 px-6 rounded-xl bg-[#6FA79A] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#6FA79A]/20 hover:bg-[#578C80] transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Scanning Skin...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Check-In</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* CELEBRATION MODAL OVERLAY ON SUCCESS */}
        {isCelebrationOpen && analysisResult && (
          <div className="absolute inset-0 z-20 bg-white p-6 flex flex-col justify-between overflow-y-auto animate-fade-in">
            <div className="space-y-4 text-center pt-2">
              <div className="w-14 h-14 rounded-full bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center mx-auto shadow-md">
                <Sparkles className="w-7 h-7 text-[#E8B04B]" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6FA79A]">
                  Check-in Saved & Analyzed
                </span>
                <h3 className="text-xl font-black text-[#2C3E38] mt-1">
                  Tomorrow's Forecast Updated!
                </h3>
                <p className="text-xs text-[#5C736C] mt-1">
                  🌧️ Fresh rain water showered {child.name}'s care garden! Plant hydrated & growing strong 🌱
                </p>
              </div>

              {/* AI Vision Analysis Card */}
              <div className="bg-[#FAF6EF] rounded-2xl p-4 text-left border border-[#EBE4D8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#426C63]">
                    Gemini Vision Assessment
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      analysisResult.overallStatus === 'green'
                        ? 'bg-[#E8F2F0] text-[#426C63]'
                        : analysisResult.overallStatus === 'yellow'
                        ? 'bg-[#FEF6E8] text-[#C4A35A]'
                        : 'bg-[#FDEEEB] text-[#D9644F]'
                    }`}
                  >
                    {analysisResult.overallStatus} status
                  </span>
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

                {/* Mandatory safety disclaimer */}
                <p className="text-[10px] text-[#6A857D] text-center border-t border-[#EBE4D8] pt-2">
                  {analysisResult.disclaimer ||
                    'This is not a diagnosis — worth discussing with your doctor.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCelebrationOpen(false);
                onClose();
              }}
              className="w-full h-12 rounded-2xl bg-[#6FA79A] text-white font-bold text-sm shadow-md shadow-[#6FA79A]/20 hover:bg-[#578C80] transition-colors mt-4"
            >
              Done — View Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
