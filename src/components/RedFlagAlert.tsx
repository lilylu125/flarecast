import React from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, X } from 'lucide-react';

interface RedFlagAlertProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string | null;
  childName?: string;
  doctorName?: string;
}

export const RedFlagAlert: React.FC<RedFlagAlertProps> = ({
  isOpen,
  onClose,
  reason,
  childName = 'Child',
  doctorName = 'Pediatrician',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-[#D9644F]/40 space-y-5">
        {/* Top Warning Banner */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDEEEB] rounded-full text-xs font-bold text-[#D9644F]">
            <ShieldAlert className="w-4 h-4 text-[#D9644F]" />
            <span>Clinical Red Flag Warning</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Icon and Urgent Headline */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#D9644F] flex items-center justify-center shrink-0 text-white shadow-md shadow-[#D9644F]/30">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#2C3E38] leading-tight">
              Please Contact Your Doctor Today
            </h2>
            <p className="text-xs text-[#5C736C] mt-1">
              Safety check triggered for {childName}
            </p>
          </div>
        </div>

        {/* Clinical Message Card */}
        <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#EBE4D8] space-y-2 text-sm text-[#2C3E38] leading-relaxed">
          <p className="font-semibold text-[#D9644F]">
            "These can be signs of infection. Please contact your doctor today, or seek urgent care if blisters are spreading quickly."
          </p>
          {reason && (
            <p className="text-xs text-[#6A857D] pt-1 border-t border-[#EBE4D8]">
              <strong>Detected signs:</strong> {reason}
            </p>
          )}
        </div>

        {/* Pediatric Quick Actions */}
        <div className="space-y-2.5 pt-1">
          {/* Demo placeholder number — replace with the family's real pediatrician before launch */}
          <a
            href="tel:+15550100123"
            className="w-full h-12 rounded-2xl bg-[#D9644F] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D9644F]/25 hover:bg-[#C2523E] transition-colors"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call {doctorName || 'your pediatrician'}</span>
          </a>
          <p className="text-[11px] text-center text-[#6A857D]">
            Placeholder number for demo: (555) 010-0123
          </p>

          <button
            onClick={onClose}
            className="w-full h-11 rounded-2xl bg-[#F2F7F6] text-[#426C63] font-semibold text-xs flex items-center justify-center hover:bg-[#E2EDE9] transition-colors"
          >
            I understand — Dismiss warning
          </button>
        </div>
      </div>
    </div>
  );
};
