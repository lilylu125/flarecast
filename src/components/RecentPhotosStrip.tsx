import React, { useState } from 'react';
import { Images, ChevronDown, ChevronUp } from 'lucide-react';
import { CheckIn } from '../types';
import { PhotoTimeline } from './PhotoTimeline';

interface RecentPhotosStripProps {
  checkIns: CheckIn[];
  childName: string;
  /** How many recent photos to show before expanding. */
  count?: number;
}

const statusDot: Record<string, string> = {
  green: 'bg-[#578C80]',
  yellow: 'bg-[#E8B04B]',
  red: 'bg-[#D9644F]',
};

const statusFromScore = (score: number) => (score >= 75 ? 'green' : score >= 50 ? 'yellow' : 'red');

export const RecentPhotosStrip: React.FC<RecentPhotosStripProps> = ({ checkIns, childName, count = 5 }) => {
  const [expanded, setExpanded] = useState(false);
  const withPhotos = checkIns.filter((c) => c.photoUrl);
  const recent = withPhotos.slice(-count);

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#6FA79A]/15 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#E8F2F0] flex items-center justify-center text-[#6FA79A]">
            <Images className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2C3E38] tracking-tight">Photo Log</h3>
            <p className="text-xs text-[#5C736C]">
              {expanded ? `All of ${childName}'s photos` : `Last ${recent.length} check-ins`}
            </p>
          </div>
        </div>

        {withPhotos.length > 0 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-[#EBE4D8] text-[#578C80] hover:bg-[#F2F7F6] flex items-center gap-1"
          >
            {expanded ? (
              <>
                Collapse <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {withPhotos.length === 0 ? (
        <p className="text-xs text-[#5C736C] bg-[#FAF6EF] rounded-2xl p-4 text-center">
          No photos yet. Snap today's check-in to start {childName}'s photo log.
        </p>
      ) : expanded ? (
        <PhotoTimeline checkIns={checkIns} childName={childName} />
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {recent.map((c) => {
            const status = c.aiAnalysis?.overallStatus || statusFromScore(c.skinScore);
            return (
              <button
                key={c.id}
                onClick={() => setExpanded(true)}
                className="group text-left"
                title={`${c.displayDate} · ${c.bodyArea} · score ${c.skinScore}`}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-[#EBE4D8] bg-[#FAF6EF]">
                  <img
                    src={c.photoUrl}
                    alt={`${childName}'s ${c.bodyArea} on ${c.displayDate}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className={`absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${statusDot[status]}`} />
                </div>
                <div className="mt-1 flex items-center justify-between px-0.5">
                  <span className="text-[10px] font-bold text-[#2C3E38]">{c.displayDate}</span>
                  <span className="text-[10px] font-semibold text-[#5C736C] tabular-nums">{c.skinScore}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
