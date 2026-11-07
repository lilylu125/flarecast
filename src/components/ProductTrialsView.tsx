import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calendar,
  X,
  TrendingUp,
  ZoomIn,
} from 'lucide-react';
import { ProductTrial, ProductType, ChildProfile } from '../types';
import { PhotoZoomModal } from './PhotoZoomModal';

interface ProductTrialsViewProps {
  trials: ProductTrial[];
  child: ChildProfile;
  onAddTrial: (trial: ProductTrial) => void;
}

export const ProductTrialsView: React.FC<ProductTrialsViewProps> = ({
  trials,
  child,
  onAddTrial,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCompletedTrial, setSelectedCompletedTrial] = useState<ProductTrial | null>(
    trials.find((t) => t.status === 'completed') || null
  );
  const [zoomedPhotoData, setZoomedPhotoData] = useState<{ url: string; title: string } | null>(null);

  // New trial form state
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('moisturizer');
  const [durationDays, setDurationDays] = useState(14);
  const [notes, setNotes] = useState('');

  const activeTrials = trials.filter((t) => t.status === 'active');
  const completedTrials = trials.filter((t) => t.status === 'completed');

  const handleSubmitNewTrial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTrial: ProductTrial = {
      id: `trial-${Date.now()}`,
      childId: child.id,
      name: name.trim(),
      type,
      startDate: new Date().toISOString().split('T')[0],
      durationDays,
      status: 'active',
      baselineScore: 78,
      daysLogged: 1,
      avgAmount: 'Medium dab',
      notes: notes.trim() || undefined,
    };

    onAddTrial(newTrial);
    setName('');
    setNotes('');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Start Trial CTA */}
      <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#6FA79A]">
            Scientific Method for Sensitive Skin
          </span>
          <h2 className="text-base font-bold text-[#2C3E38] mt-0.5">
            Product Trials & Verdicts
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-4 rounded-2xl bg-[#6FA79A] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#6FA79A]/20 hover:bg-[#578C80] transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Start a Trial</span>
        </button>
      </div>

      {/* Active Trial Spotlight */}
      {activeTrials.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#578C80] px-1">
            Currently In Progress
          </h3>
          {activeTrials.map((trial) => {
            const progressPct = Math.min(100, Math.round((trial.daysLogged / trial.durationDays) * 100));

            return (
              <div
                key={trial.id}
                className="bg-white rounded-3xl p-5 border-2 border-[#6FA79A]/30 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#E8F2F0] text-[#6FA79A] flex items-center justify-center shrink-0">
                      <FlaskConical className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#2C3E38]">{trial.name}</h4>
                      <p className="text-xs text-[#5C736C] capitalize">
                        {trial.type} · Started {trial.startDate}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8F2F0] text-[#426C63]">
                    Day {trial.daysLogged} of {trial.durationDays}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-[#5C736C]">
                    <span>Trial Progress</span>
                    <span className="font-bold text-[#426C63]">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#EAE4D8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6FA79A] rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#5C736C] pt-1 border-t border-slate-100">
                  <span>Logged from check-ins: {trial.daysLogged} days</span>
                  <span>Avg amount: {trial.avgAmount}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2-Week Completed Trial Report Spotlight */}
      {selectedCompletedTrial && (
        <div className="bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E8B04B]" />
              <h3 className="text-sm font-bold text-[#2C3E38]">
                2-Week Trial Report: {selectedCompletedTrial.name}
              </h3>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                selectedCompletedTrial.verdict === 'Helped'
                  ? 'bg-[#E8F2F0] text-[#426C63]'
                  : selectedCompletedTrial.verdict === 'Worse'
                  ? 'bg-[#FDEEEB] text-[#D9644F]'
                  : 'bg-[#FAF6EF] text-[#B88A3B]'
              }`}
            >
              {selectedCompletedTrial.verdict === 'Helped' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {selectedCompletedTrial.verdict === 'Worse' && <AlertCircle className="w-3.5 h-3.5" />}
              {selectedCompletedTrial.verdict === 'No clear change' && <HelpCircle className="w-3.5 h-3.5" />}
              Verdict: {selectedCompletedTrial.verdict}
            </span>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8]">
              <span className="text-[10px] uppercase font-semibold text-[#5C736C] block">
                Baseline Score
              </span>
              <span className="text-lg font-black text-[#2C3E38]">
                {selectedCompletedTrial.baselineScore}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#E8F2F0] border border-[#6FA79A]/20">
              <span className="text-[10px] uppercase font-semibold text-[#426C63] block">
                Ending Score
              </span>
              <span className="text-lg font-black text-[#426C63]">
                {selectedCompletedTrial.endScore ?? '--'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8]">
              <span className="text-[10px] uppercase font-semibold text-[#5C736C] block">
                Days Applied
              </span>
              <span className="text-lg font-black text-[#2C3E38]">
                {selectedCompletedTrial.daysLogged} / {selectedCompletedTrial.durationDays}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#FAF6EF] border border-[#EBE4D8]">
              <span className="text-[10px] uppercase font-semibold text-[#5C736C] block">
                Net Shift
              </span>
              <span className="text-lg font-black text-[#578C80] flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +
                {(selectedCompletedTrial.endScore ?? 0) -
                  selectedCompletedTrial.baselineScore}{' '}
                pts
              </span>
            </div>
          </div>

          {/* Before & After Photo Evidence */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#D9644F] block">
                Worst Day (Baseline Flare)
              </span>
              <div
                onClick={() =>
                  selectedCompletedTrial.worstPhotoUrl &&
                  setZoomedPhotoData({
                    url: selectedCompletedTrial.worstPhotoUrl,
                    title: `${selectedCompletedTrial.name} · Worst Day`,
                  })
                }
                className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200 cursor-zoom-in relative group"
              >
                <img
                  src={selectedCompletedTrial.worstPhotoUrl}
                  alt="Worst skin day"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-1 opacity-90 group-hover:opacity-100">
                  <ZoomIn className="w-2.5 h-2.5" />
                  <span>Zoom</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#426C63] block">
                Best Day (After 14 Days)
              </span>
              <div
                onClick={() =>
                  selectedCompletedTrial.bestPhotoUrl &&
                  setZoomedPhotoData({
                    url: selectedCompletedTrial.bestPhotoUrl,
                    title: `${selectedCompletedTrial.name} · Best Day`,
                  })
                }
                className="aspect-square rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200 cursor-zoom-in relative group"
              >
                <img
                  src={selectedCompletedTrial.bestPhotoUrl}
                  alt="Best skin day"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-1 opacity-90 group-hover:opacity-100">
                  <ZoomIn className="w-2.5 h-2.5" />
                  <span>Zoom</span>
                </div>
              </div>
            </div>
          </div>

          {selectedCompletedTrial.notes && (
            <p className="text-xs text-[#4A645D] bg-[#F2F7F6] p-3 rounded-xl italic">
              "{selectedCompletedTrial.notes}"
            </p>
          )}
        </div>
      )}

      {/* "My Products" Summary List */}
      <div className="bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#2C3E38]">
          "My Products" Complete Trial History
        </h3>

        <div className="divide-y divide-slate-100">
          {trials.map((trial) => (
            <div
              key={trial.id}
              onClick={() => {
                if (trial.status === 'completed') {
                  setSelectedCompletedTrial(trial);
                }
              }}
              className="py-3 flex items-center justify-between cursor-pointer hover:bg-[#FAF6EF]/70 px-2 rounded-xl transition-colors"
            >
              <div>
                <span className="text-xs font-bold text-[#2C3E38] block">{trial.name}</span>
                <span className="text-[11px] text-[#5C736C]">
                  {trial.type} · {trial.status === 'active' ? 'Active Trial' : `Completed ${trial.endDate || ''}`}
                </span>
              </div>

              <div className="text-right">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    trial.verdict === 'Helped'
                      ? 'bg-[#E8F2F0] text-[#426C63]'
                      : trial.verdict === 'Worse'
                      ? 'bg-[#FDEEEB] text-[#D9644F]'
                      : trial.verdict === 'No clear change'
                      ? 'bg-[#FAF6EF] text-[#B88A3B]'
                      : 'bg-[#F2F7F6] text-[#578C80]'
                  }`}
                >
                  {trial.verdict || 'Testing...'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* START TRIAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#2C3E38]">
                Start a New Product Trial
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewTrial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  Product Name & Brand
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ceramide Barrier Cream, Colloidal Wash"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  Product Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ProductType)}
                  className="w-full h-11 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
                >
                  <option value="moisturizer">Moisturizer / Emollient</option>
                  <option value="prescribed cream">Doctor Prescribed Cream</option>
                  <option value="soap">Cleanser / Soap</option>
                  <option value="other">Other / Supplement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  Trial Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDurationDays(14)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      durationDays === 14
                        ? 'bg-[#6FA79A] text-white border-[#6FA79A]'
                        : 'bg-[#FAF6EF] text-[#2C3E38] border-[#EBE4D8]'
                    }`}
                  >
                    14 Days (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDurationDays(7)}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      durationDays === 7
                        ? 'bg-[#6FA79A] text-white border-[#6FA79A]'
                        : 'bg-[#FAF6EF] text-[#2C3E38] border-[#EBE4D8]'
                    }`}
                  >
                    7 Days (Quick test)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                  Target Skin Area or Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Trying for bedtime flare on inner elbows"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-2xl bg-[#6FA79A] text-white font-bold text-xs shadow-md shadow-[#6FA79A]/20 hover:bg-[#578C80] transition-colors"
              >
                Launch Trial for {child.name}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO ZOOM MODAL */}
      <PhotoZoomModal
        isOpen={!!zoomedPhotoData}
        onClose={() => setZoomedPhotoData(null)}
        photoUrl={zoomedPhotoData?.url || ''}
        title={zoomedPhotoData?.title}
      />
    </div>
  );
};
