import React, { useState } from 'react';
import { ShieldCheck, Check, Edit2, AlertCircle, Sparkles, X } from 'lucide-react';
import { ChildProfile, FlareRisk } from '../types';

interface CalmPlanCardProps {
  child: ChildProfile;
  forecastRisk: FlareRisk;
  isCalmPlanDoneToday: boolean;
  onToggleDoneToday: () => void;
  onUpdatePlan: (updatedPlan: ChildProfile['calmPlan']) => void;
}

export const CalmPlanCard: React.FC<CalmPlanCardProps> = ({
  child,
  forecastRisk,
  isCalmPlanDoneToday,
  onToggleDoneToday,
  onUpdatePlan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [moisturizer, setMoisturizer] = useState(child.calmPlan.moisturizerRoutine);
  const [prescribed, setPrescribed] = useState(child.calmPlan.prescribedRoutine);
  const [bath, setBath] = useState(child.calmPlan.bathRoutine);
  const [doctorName, setDoctorName] = useState(child.calmPlan.doctorName || '');

  const isRiskElevated = forecastRisk === 'Medium' || forecastRisk === 'High';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePlan({
      moisturizerRoutine: moisturizer,
      prescribedRoutine: prescribed,
      bathRoutine: bath,
      knownTriggers: child.calmPlan.knownTriggers,
      doctorName,
    });
    setIsEditing(false);
  };

  return (
    <>
      <div
        className={`rounded-3xl p-5 border shadow-sm transition-all ${
          isRiskElevated
            ? 'bg-white border-[#F4A98A]/50 ring-1 ring-[#F4A98A]/30'
            : 'bg-white border-[#6FA79A]/15'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                isRiskElevated ? 'bg-[#FDF4F0] text-[#B8684C]' : 'bg-[#E8F2F0] text-[#6FA79A]'
              }`}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#2C3E38] whitespace-nowrap">
                  {child.name}'s Care Plan
                </h3>
                {isRiskElevated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF4F0] text-[#D9644F] whitespace-nowrap">
                    High risk today
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="h-9 px-3 rounded-xl border border-[#6FA79A]/40 bg-white text-[#426C63] font-bold text-xs flex items-center gap-1.5 whitespace-nowrap hover:bg-[#F2F7F6] transition-colors"
              title="Edit care plan"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit plan</span>
            </button>

            <button
              onClick={onToggleDoneToday}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isCalmPlanDoneToday
                  ? 'bg-[#E8F2F0] text-[#426C63] border border-[#6FA79A]/30'
                  : 'bg-[#6FA79A] text-white shadow-sm hover:bg-[#578C80]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isCalmPlanDoneToday ? 'Done today' : 'Mark done'}</span>
            </button>
          </div>
        </div>

        {/* Routine Steps Checklist */}
        <div className="space-y-2 text-xs">
          <button type="button" onClick={() => setIsEditing(true)} title="Tap to edit" className="w-full text-left p-3 rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8] space-y-1 hover:border-[#6FA79A]/50 hover:bg-[#F2F7F6] transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#578C80] block">
              1. Soak & Seal Moisture Rule
            </span>
            <p className="text-[#2C3E38] font-medium leading-relaxed">
              {child.calmPlan.moisturizerRoutine}
            </p>
          </button>

          <button type="button" onClick={() => setIsEditing(true)} title="Tap to edit" className="w-full text-left p-3 rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8] space-y-1 hover:border-[#6FA79A]/50 hover:bg-[#F2F7F6] transition-colors">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B8684C] block">
              2. Active Flare Spot Routine
            </span>
            <p className="text-[#2C3E38] font-medium leading-relaxed">
              {child.calmPlan.prescribedRoutine}
            </p>
          </button>
        </div>

        {isRiskElevated && (
          <div className="mt-3 p-3 bg-[#FDF4F0] rounded-2xl border border-[#F4A98A]/30 flex items-center gap-2 text-xs text-[#B8684C]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#D9644F]" />
            <span>
              Dry/cold weather alert today: Ensure evening moisturizer is applied immediately after lukewarm soak.
            </span>
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6FA79A]">
                  Doctor-Prescribed Protocol
                </span>
                <h3 className="text-base font-bold text-[#2C3E38]">
                  Edit Care Plan for {child.name}
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  Doctor / Clinic Name
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Sarah Lin, Pediatric Dermatology"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  Daily Moisturizing & Bath Routine
                </label>
                <textarea
                  rows={2}
                  value={moisturizer}
                  onChange={(e) => setMoisturizer(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  Prescribed Flare Treatment (Ointment / Frequency)
                </label>
                <textarea
                  rows={2}
                  value={prescribed}
                  onChange={(e) => setPrescribed(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-[#6FA79A] text-white font-bold text-xs shadow-sm hover:bg-[#578C80]"
                >
                  Save Care Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
