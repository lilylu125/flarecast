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
        <div className="flex items-start justify-between mb-3">
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
                <h3 className="text-sm font-bold text-[#2C3E38]">
                  {child.name}'s Calm Plan
                </h3>
                {isRiskElevated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF4F0] text-[#D9644F]">
                    Elevated Risk Active
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5C736C]">
                Prescribed by {child.calmPlan.doctorName || 'Doctor'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Edit doctor routine"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={onToggleDoneToday}
              className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                isCalmPlanDoneToday
                  ? 'bg-[#E8F2F0] text-[#426C63] border border-[#6FA79A]/30'
                  : 'bg-[#6FA79A] text-white shadow-sm hover:bg-[#578C80]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isCalmPlanDoneToday ? 'Routine Done Today' : 'Mark Done Today'}</span>
            </button>
          </div>
        </div>

        {/* Routine Steps Checklist */}
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#578C80] block">
              1. Soak & Seal Moisture Rule
            </span>
            <p className="text-[#2C3E38] font-medium leading-relaxed">
              {child.calmPlan.moisturizerRoutine}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8] space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#B8684C] block">
              2. Active Flare Spot Routine
            </span>
            <p className="text-[#2C3E38] font-medium leading-relaxed">
              {child.calmPlan.prescribedRoutine}
            </p>
          </div>
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
                  Edit Calm Plan for {child.name}
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
                  Save Calm Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
