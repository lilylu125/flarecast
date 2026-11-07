import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Columns,
  Sparkles,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  ZoomIn,
  Trash2,
} from 'lucide-react';
import { CheckIn, BodyArea } from '../types';
import { PhotoZoomModal } from './PhotoZoomModal';

interface PhotoTimelineProps {
  checkIns: CheckIn[];
  childName: string;
  onDeleteCheckIn?: (id: string) => void;
}

export const PhotoTimeline: React.FC<PhotoTimelineProps> = ({ checkIns, childName, onDeleteCheckIn }) => {
  const [selectedArea, setSelectedArea] = useState<string>('all');
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareA, setCompareA] = useState<CheckIn | null>(null);
  const [compareB, setCompareB] = useState<CheckIn | null>(null);

  // Zoom Lightbox modal state
  const [zoomedCheckIn, setZoomedCheckIn] = useState<CheckIn | null>(null);

  // Time-lapse modal state
  const [isTimelapseOpen, setIsTimelapseOpen] = useState<boolean>(false);
  const [timelapseArea, setTimelapseArea] = useState<BodyArea>('face');
  const [timelapseIndex, setTimelapseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1000); // ms

  // Filtered photos
  const filteredCheckIns = checkIns.filter(
    (c) => selectedArea === 'all' || c.bodyArea === selectedArea
  );

  // Sort chronological for timelapse
  const timelapsePhotos = checkIns
    .filter((c) => c.bodyArea === timelapseArea && c.photoUrl)
    .sort((a, b) => a.timestamp - b.timestamp);

  // Timelapse auto-play effect
  useEffect(() => {
    let timer: any;
    if (isPlaying && timelapsePhotos.length > 0) {
      timer = setInterval(() => {
        setTimelapseIndex((prev) => (prev + 1) % timelapsePhotos.length);
      }, playSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timelapsePhotos.length, playSpeed]);

  // Group check-ins into week buckets
  const groupPhotosByWeek = () => {
    const sortedDesc = [...filteredCheckIns].sort((a, b) => b.timestamp - a.timestamp);
    const thisWeek: CheckIn[] = [];
    const lastWeek: CheckIn[] = [];
    const earlier: CheckIn[] = [];

    const now = Date.now();
    const oneWeekMs = 7 * 86400000;
    const twoWeeksMs = 14 * 86400000;

    sortedDesc.forEach((c) => {
      const diff = now - c.timestamp;
      if (diff <= oneWeekMs) {
        thisWeek.push(c);
      } else if (diff <= twoWeeksMs) {
        lastWeek.push(c);
      } else {
        earlier.push(c);
      }
    });

    return [
      { label: 'This Week', items: thisWeek },
      { label: 'Last Week (Flare & Recovery)', items: lastWeek },
      { label: '2–3 Weeks Ago (Baseline)', items: earlier },
    ];
  };

  const weekGroups = groupPhotosByWeek();

  // Zoom navigation helpers
  const currentZoomIndex = zoomedCheckIn
    ? filteredCheckIns.findIndex((c) => c.id === zoomedCheckIn.id)
    : -1;
  const hasPrevZoom = currentZoomIndex > 0;
  const hasNextZoom = currentZoomIndex >= 0 && currentZoomIndex < filteredCheckIns.length - 1;

  const handlePrevZoom = () => {
    if (hasPrevZoom) setZoomedCheckIn(filteredCheckIns[currentZoomIndex - 1]);
  };

  const handleNextZoom = () => {
    if (hasNextZoom) setZoomedCheckIn(filteredCheckIns[currentZoomIndex + 1]);
  };

  // Helper to handle compare selection
  const handleSelectForCompare = (item: CheckIn) => {
    if (!compareA) {
      setCompareA(item);
    } else if (!compareB && compareA.id !== item.id) {
      setCompareB(item);
    } else {
      setCompareA(item);
      setCompareB(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl p-4 border border-[#6FA79A]/15 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-4 h-4 text-[#578C80] shrink-0" />
          {['all', 'face', 'elbows', 'knees', 'hands'].map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedArea === area
                  ? 'bg-[#6FA79A] text-white shadow-sm'
                  : 'bg-[#F2F7F6] text-[#426C63] hover:bg-[#E2EDE9]'
              }`}
            >
              {area === 'all' ? 'All Areas' : area.charAt(0).toUpperCase() + area.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Compare toggle */}
          <button
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              if (!isCompareMode && filteredCheckIns.length >= 2) {
                setCompareA(filteredCheckIns[0]);
                setCompareB(filteredCheckIns[filteredCheckIns.length - 1]);
              }
            }}
            className={`h-9 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
              isCompareMode
                ? 'bg-[#F4A98A] text-white shadow-sm'
                : 'bg-[#FAF6EF] text-[#2C3E38] hover:bg-[#F2ECE0] border border-[#EBE4D8]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>{isCompareMode ? 'Exit Compare' : 'Compare 2 Dates'}</span>
          </button>

          {/* Time-lapse trigger */}
          <button
            onClick={() => {
              setIsTimelapseOpen(true);
              setTimelapseIndex(0);
              setIsPlaying(true);
            }}
            className="h-9 px-3.5 rounded-xl bg-[#6FA79A] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#578C80] transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Time-lapse</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Compare Panel if Active */}
      {isCompareMode && (
        <div className="bg-white rounded-3xl p-5 border-2 border-[#F4A98A]/50 shadow-md animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F4A98A]" />
              <h3 className="text-sm font-bold text-[#2C3E38]">
                Side-by-Side Comparison Mode
              </h3>
            </div>
            <p className="text-xs text-[#5C736C]">
              Tap any photo in the gallery below to swap comparison slots
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Slot A */}
            {/* Slot A */}
            <div className="bg-[#FAF6EF] p-3 rounded-2xl border border-[#EBE4D8] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#578C80] block">
                  Photo A {compareA ? `· ${compareA.displayDate}` : '(Select below)'}
                </span>
                {compareA && (
                  <button
                    onClick={() => setZoomedCheckIn(compareA)}
                    className="text-[11px] font-bold text-[#578C80] flex items-center gap-1 hover:underline"
                    title="Zoom in on Photo A"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>
                )}
              </div>
              {compareA ? (
                <>
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={compareA.photoUrl}
                      alt="Compare A"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Score: {compareA.skinScore}/100</span>
                      <span>Itch: {compareA.itchScore}/5</span>
                    </div>
                    <p className="text-[11px] text-[#5C736C] line-clamp-2">
                      {compareA.aiAnalysis?.description || 'Routine log'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="aspect-square rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                  Select a photo
                </div>
              )}
            </div>

            {/* Slot B */}
            <div className="bg-[#FAF6EF] p-3 rounded-2xl border border-[#EBE4D8] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#B8684C] block">
                  Photo B {compareB ? `· ${compareB.displayDate}` : '(Select below)'}
                </span>
                {compareB && (
                  <button
                    onClick={() => setZoomedCheckIn(compareB)}
                    className="text-[11px] font-bold text-[#B8684C] flex items-center gap-1 hover:underline"
                    title="Zoom in on Photo B"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>
                )}
              </div>
              {compareB ? (
                <>
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={compareB.photoUrl}
                      alt="Compare B"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Score: {compareB.skinScore}/100</span>
                      <span>Itch: {compareB.itchScore}/5</span>
                    </div>
                    <p className="text-[11px] text-[#5C736C] line-clamp-2">
                      {compareB.aiAnalysis?.description || 'Routine log'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="aspect-square rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                  Select a photo
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grouped Gallery by Week */}
      {weekGroups.map((group) => {
        if (group.items.length === 0) return null;
        return (
          <div key={group.label} className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-4 h-4 text-[#6FA79A]" />
              <h3 className="text-sm font-bold text-[#2C3E38]">{group.label}</h3>
              <span className="text-xs text-[#5C736C]">
                ({group.items.length} photos)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {group.items.map((item) => {
                const isSelectedA = compareA?.id === item.id;
                const isSelectedB = compareB?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isCompareMode) {
                        handleSelectForCompare(item);
                      } else {
                        setZoomedCheckIn(item);
                      }
                    }}
                    className={`bg-white rounded-2xl p-2.5 border transition-all cursor-pointer group ${
                      isSelectedA
                        ? 'ring-2 ring-[#6FA79A] border-transparent shadow-md'
                        : isSelectedB
                        ? 'ring-2 ring-[#F4A98A] border-transparent shadow-md'
                        : 'border-[#6FA79A]/15 hover:shadow-md'
                    }`}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-2">
                      <img
                        src={item.photoUrl}
                        alt={`Skin on ${item.displayDate}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-2.5 h-2.5" />
                        <span>Zoom</span>
                      </div>
                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
                        {item.skinScore} pts
                      </div>
                      {onDeleteCheckIn && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete the ${item.displayDate} check-in?`)) onDeleteCheckIn(item.id);
                          }}
                          className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-white/90 text-[#D9644F] hover:bg-white shadow-sm"
                          aria-label={`Delete ${item.displayDate} check-in`}
                          title="Delete check-in"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#2C3E38]">
                          {item.displayDate}
                        </span>
                        <span className="text-[10px] font-semibold text-[#578C80] capitalize">
                          {item.bodyArea}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C736C] line-clamp-1">
                        {item.aiAnalysis?.description || 'Daily check-in'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* TIME-LAPSE PLAYER MODAL */}
      {isTimelapseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-[#6FA79A]">
                  Progression Player
                </span>
                <h3 className="text-base font-bold text-[#2C3E38]">
                  {childName}'s Skin Evolution
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsTimelapseOpen(false);
                  setIsPlaying(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Area Selector for Timelapse */}
            <div className="flex items-center gap-1.5">
              {(['face', 'elbows', 'knees'] as BodyArea[]).map((area) => (
                <button
                  key={area}
                  onClick={() => {
                    setTimelapseArea(area);
                    setTimelapseIndex(0);
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    timelapseArea === area
                      ? 'bg-[#6FA79A] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            {/* Active Timelapse Frame */}
            {timelapsePhotos.length > 0 ? (
              <div className="space-y-3">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                  <img
                    src={timelapsePhotos[timelapseIndex]?.photoUrl}
                    alt="Timelapse frame"
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />

                  {/* Frame Overlay Info */}
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-sm block">
                        {timelapsePhotos[timelapseIndex]?.displayDate}
                      </span>
                      <span className="text-[11px] text-white/80">
                        Frame {timelapseIndex + 1} of {timelapsePhotos.length}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-[#FBD5C5]">
                        Score: {timelapsePhotos[timelapseIndex]?.skinScore}/100
                      </span>
                      <span className="text-[11px] block text-white/70">
                        Itch: {timelapsePhotos[timelapseIndex]?.itchScore}/5
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Scrubber */}
                <input
                  type="range"
                  min="0"
                  max={timelapsePhotos.length - 1}
                  value={timelapseIndex}
                  onChange={(e) => setTimelapseIndex(Number(e.target.value))}
                  className="w-full accent-[#6FA79A]"
                />

                {/* Playback Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setTimelapseIndex(
                          (prev) => (prev - 1 + timelapsePhotos.length) % timelapsePhotos.length
                        )
                      }
                      className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-10 px-5 rounded-full bg-[#6FA79A] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-[#6FA79A]/25 hover:bg-[#578C80]"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Play</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        setTimelapseIndex((prev) => (prev + 1) % timelapsePhotos.length)
                      }
                      className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-400">Speed:</span>
                    <button
                      onClick={() => setPlaySpeed(1200)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        playSpeed === 1200 ? 'bg-[#6FA79A] text-white' : 'text-slate-600'
                      }`}
                    >
                      1x
                    </button>
                    <button
                      onClick={() => setPlaySpeed(600)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        playSpeed === 600 ? 'bg-[#6FA79A] text-white' : 'text-slate-600'
                      }`}
                    >
                      2x
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-center text-slate-500 py-6">
                No photos logged yet for {timelapseArea}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* PHOTO ZOOM LIGHTBOX MODAL */}
      <PhotoZoomModal
        isOpen={!!zoomedCheckIn}
        onClose={() => setZoomedCheckIn(null)}
        photoUrl={zoomedCheckIn?.photoUrl || ''}
        checkIn={zoomedCheckIn}
        onPrev={handlePrevZoom}
        onNext={handleNextZoom}
        hasPrev={hasPrevZoom}
        hasNext={hasNextZoom}
      />
    </div>
  );
};
