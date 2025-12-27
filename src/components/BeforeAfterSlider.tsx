import React, { useRef, useState, useEffect, useCallback } from "react";
import { BRAND } from "@/lib/brand";
export default function BeforeAfterSlider({ before, after }:{
  before: string; after: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [xPct, setXPct] = useState(50);
  const [dragging, setDragging] = useState(false);

  const setFromClientX = useCallback((clientX:number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clamped = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setXPct((clamped / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMove = (e:MouseEvent) => dragging && setFromClientX(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, setFromClientX]);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black"
      onTouchMove={(e)=> setFromClientX(e.touches[0].clientX)}
      onTouchStart={()=> setDragging(true)}
      onTouchEnd={()=> setDragging(false)}
    >
      {/* AFTER base */}
      <img src={after} className="absolute inset-0 h-full w-full object-cover" alt="after" />
      
      {/* T-DOG badge on after image */}
      <img 
        src={BRAND.TDOG} 
        alt="T-DOG Certified" 
        className="pointer-events-none absolute right-3 bottom-10 h-8 w-8 object-contain opacity-90"
      />

      {/* BEFORE clipped to slider position */}
      <div style={{ width: `${xPct}%` }} className="absolute inset-0 overflow-hidden">
        <img src={before} className="absolute inset-0 h-full w-full object-cover" alt="before" />
      </div>

      {/* Handle + divider */}
      <div
        role="slider"
        aria-valuenow={Math.round(xPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onMouseDown={()=> setDragging(true)}
        onKeyDown={(e)=> {
          if (e.key === "ArrowLeft") setXPct(p => Math.max(0, p - 2));
          if (e.key === "ArrowRight") setXPct(p => Math.min(100, p + 2));
        }}
        style={{ left: `calc(${xPct}% - 11px)` }}
        className="absolute top-0 bottom-0 w-[22px] cursor-col-resize bg-white/5 backdrop-blur-sm"
      >
        <div className="absolute top-1/2 left-1/2 h-10 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-white/70" />
      </div>

      {/* Labels */}
      <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs">Before</div>
      <div className="pointer-events-none absolute right-2 bottom-2 rounded bg-black/60 px-2 py-1 text-xs">After</div>
    </div>
  );
}
