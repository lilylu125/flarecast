import React, { useState } from 'react';
import { X, UserPlus, Heart } from 'lucide-react';
import { ChildProfile } from '../types';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChild: (child: ChildProfile) => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({
  isOpen,
  onClose,
  onAddChild,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(2);
  const [color, setColor] = useState('#6FA79A');
  const [reminderTime, setReminderTime] = useState('19:30');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProfile: ChildProfile = {
      id: `child-${Date.now()}`,
      name: name.trim(),
      age,
      avatarColor: color,
      reminderTime,
      calmPlan: {
        moisturizerRoutine: 'Apply gentle emollient ointment 2x daily after warm soak',
        prescribedRoutine: 'Doctor-prescribed cream on active flare areas only',
        bathRoutine: '10-minute lukewarm rinse, pat dry gently',
        knownTriggers: ['Dry cold air', 'Wool fabrics', 'Scented detergents'],
        doctorName: 'Pediatric Care Team',
      },
    };

    onAddChild(newProfile);
    onClose();
  };

  const colors = ['#6FA79A', '#F4A98A', '#578C80', '#D9644F', '#8C74AC', '#4B88A2'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#6FA79A]" />
            <h3 className="text-base font-bold text-[#2C3E38]">Add Child Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1">
              Child's First Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Leo, Emma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                min="0"
                max="17"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2C3E38] mb-1">
                Evening Reminder
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-[#FAF6EF] border border-[#EBE4D8] text-xs focus:outline-none focus:ring-2 focus:ring-[#6FA79A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#2C3E38] mb-1.5">
              Profile Accent Color
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full h-11 rounded-2xl bg-[#6FA79A] text-white font-bold text-xs shadow-md shadow-[#6FA79A]/20 hover:bg-[#578C80] transition-colors"
          >
            Create Profile & Start Tracking
          </button>
        </form>
      </div>
    </div>
  );
};
