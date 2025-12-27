import React, { useRef, useState, useEffect, useCallback } from "react";
import { BRAND } from "@/lib/brand";
import { Skeleton } from "@/components/ui/skeleton";

interface BeforeAfterSliderProps {
  before: string;
  after: string;
  alt?: string;
}

export default function BeforeAfterSlider({
  before,
  after,
  alt = "Before and after comparison",
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [xPct, setXPct] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);

  const isLoading = !beforeLoaded || !afterLoaded;

  const setFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clamped = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setXPct((clamped / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => dragging && setFromClientX(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, setFromClientX]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setXPct((p) => Math.max(0, p - 5));
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setXPct((p) => Math.min(100, p + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/5] overflow-hidden rounded-xl border border-white/10 bg-black select-none"
      onTouchMove={(e) => setFromClientX(e.touches[0].clientX)}
      onTouchStart={() => setDragging(true)}
      onTouchEnd={() => setDragging(false)}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <Skeleton className="absolute inset-0 h-full w-full bg-muted/20" />
      )}

      {/* AFTER base */}
      <img
        src={after}
        className="absolute inset-0 h-full w-full object-cover"
        alt={`${alt} - after`}
        loading="lazy"
        onLoad={() => setAfterLoaded(true)}
        style={{ opacity: afterLoaded ? 1 : 0 }}
      />

      {/* T-DOG badge on after image */}
      <img
        src={BRAND.TDOG}
        alt="T-DOG Certified"
        className="pointer-events-none absolute right-3 bottom-10 h-8 w-8 object-contain opacity-90"
      />

      {/* BEFORE clipped to slider position */}
      <div
        style={{ width: `${xPct}%` }}
        className="absolute inset-0 overflow-hidden"
      >
        <img
          src={before}
          className="absolute inset-0 h-full w-full object-cover"
          alt={`${alt} - before`}
          loading="lazy"
          onLoad={() => setBeforeLoaded(true)}
          style={{
            opacity: beforeLoaded ? 1 : 0,
            width: containerRef.current
              ? `${containerRef.current.offsetWidth}px`
              : "100%",
            maxWidth: "none",
          }}
        />
      </div>

      {/* Handle + divider - Brand Gold #FBBF24 */}
      <div
        role="slider"
        aria-label="Comparison slider"
        aria-valuenow={Math.round(xPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onMouseDown={() => setDragging(true)}
        onKeyDown={handleKeyDown}
        style={{ left: `calc(${xPct}% - 16px)` }}
        className="absolute top-0 bottom-0 w-8 cursor-col-resize flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
      >
        {/* Vertical line */}
        <div className="h-full w-[2px] bg-[#FBBF24] shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
        {/* Handle circle */}
        <div className="absolute top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border-2 border-[#FBBF24] bg-black/80 flex items-center justify-center shadow-lg">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-[#FBBF24] rounded-full" />
            <div className="w-0.5 h-4 bg-[#FBBF24] rounded-full" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
        Before
      </div>
      <div className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
        After
      </div>
    </div>
  );
}
