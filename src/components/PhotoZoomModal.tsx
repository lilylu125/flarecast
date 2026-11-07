import React, { useState, useRef } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CheckIn } from '../types';

interface PhotoZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  checkIn?: CheckIn | null;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  title?: string;
}

export const PhotoZoomModal: React.FC<PhotoZoomModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  checkIn,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  title,
}) => {
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  if (!isOpen || !photoUrl) return null;

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(4, Math.round((prev + 0.5) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomScale > 1) {
      setPosition({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for dragging when zoomed
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale > 1 && e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && zoomScale > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div className="relative w-full max-w-2xl bg-[#1C2623] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border border-white/10 text-white">
        {/* Top Controls Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6FA79A]">
              Skin Photo Inspection
            </span>
            {checkIn && (
              <span className="text-xs text-white/70">
                · {checkIn.displayDate} ({checkIn.bodyArea})
              </span>
            )}
            {title && !checkIn && (
              <span className="text-xs text-white/70">· {title}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-white/10 rounded-full p-0.5 border border-white/10">
              <button
                onClick={handleZoomOut}
                disabled={zoomScale <= 1}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold px-2 text-white">
                {zoomScale}x
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomScale >= 4}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white disabled:opacity-30 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoomScale > 1 && (
                <button
                  onClick={handleResetZoom}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#F4A98A] hover:text-white transition-colors"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Zoomable Image Viewport Canvas */}
        <div
          className={`relative flex-1 min-h-[350px] sm:min-h-[460px] bg-black/60 flex items-center justify-center overflow-hidden ${
            zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
          }`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={() => {
            if (zoomScale === 1) handleZoomIn();
          }}
        >
          {/* Previous / Next navigation chevrons */}
          {hasPrev && onPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
                onPrev();
              }}
              className="absolute left-3 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/15"
              title="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {hasNext && onNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
                onNext();
              }}
              className="absolute right-3 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/15"
              title="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Target Photo with Transform Pan and Zoom */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{
              transform: `scale(${zoomScale}) translate(${position.x / zoomScale}px, ${position.y / zoomScale}px)`,
            }}
          >
            <img
              src={photoUrl}
              alt="High resolution skin inspection"
              className="max-h-[60vh] max-w-[90%] object-contain select-none pointer-events-none rounded-xl"
            />
          </div>

          {/* Quick Helper Floating Badge */}
          {zoomScale === 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] text-white/80 border border-white/10 pointer-events-none">
              Click photo or tap + to zoom in · Inspect barrier texture
            </div>
          )}
          {zoomScale > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#6FA79A]/80 backdrop-blur-md text-[11px] text-white font-bold border border-white/10 pointer-events-none">
              Drag to pan across skin surface
            </div>
          )}
        </div>

        {/* Bottom Details Footer */}
        {checkIn && (
          <div className="p-4 bg-black/40 border-t border-white/10 text-xs text-white/90 space-y-1.5 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#88C5B8]">
                  Score: {checkIn.skinScore} / 100
                </span>
                <span className="text-white/40">·</span>
                <span>Itch: {checkIn.itchScore} / 5</span>
                {checkIn.tags.length > 0 && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-white/70">
                      Tags: {checkIn.tags.join(', ')}
                    </span>
                  </>
                )}
              </div>

              {checkIn.productUsed && (
                <span className="text-[#F4A98A] font-semibold">
                  Applied: {checkIn.productUsed.name} ({checkIn.productUsed.amount})
                </span>
              )}
            </div>

            {checkIn.aiAnalysis?.description && (
              <p className="text-[11px] text-white/70 italic line-clamp-2">
                "{checkIn.aiAnalysis.description}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
