import React, { useState } from 'react';
import { BookOpen, ChevronRight, ShieldCheck } from 'lucide-react';
import { TRUSTED_TIPS } from '../utils/mockData';
import { TrustedTip } from '../types';

export const TrustedTipsCard: React.FC = () => {
  const [tipIndex, setTipIndex] = useState(0);
  const currentTip: TrustedTip = TRUSTED_TIPS[tipIndex] || TRUSTED_TIPS[0];

  const handleNext = () => {
    setTipIndex((prev) => (prev + 1) % TRUSTED_TIPS.length);
  };

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-[#2C3E38]">
            Pediatric Tip of the Day
          </span>
        </div>

        <button
          onClick={handleNext}
          className="text-xs text-[#578C80] font-semibold flex items-center gap-1 hover:underline"
        >
          <span>Next tip ({tipIndex + 1}/{TRUSTED_TIPS.length})</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="bg-[#FAF6EF] rounded-2xl p-3.5 border border-[#EBE4D8] space-y-1">
        <h4 className="text-xs font-bold text-[#2C3E38]">{currentTip.title}</h4>
        <p className="text-xs text-[#4A645D] leading-relaxed">
          {currentTip.content}
        </p>
        {currentTip.sourceHint && (
          <span className="text-[10px] text-[#7A938C] block pt-1">
            Source: {currentTip.sourceHint}
          </span>
        )}
      </div>
    </div>
  );
};
