import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt?: string;
  afterAlt?: string;
  className?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt = "Before",
  afterAlt = "After",
  className = "",
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 640px)");
    
    setPrefersReducedMotion(motionQuery.matches);
    setIsMobile(mobileQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    const handleMobileChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    
    motionQuery.addEventListener("change", handleMotionChange);
    mobileQuery.addEventListener("change", handleMobileChange);
    
    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      mobileQuery.removeEventListener("change", handleMobileChange);
    };
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  if (prefersReducedMotion || isMobile) {
    return (
      <div className={cn("grid grid-cols-2 gap-1 rounded-xl overflow-hidden", className)}>
        <div className="relative aspect-[4/5]">
          <img 
            src={beforeImage} 
            alt={beforeAlt} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-2 left-2 bg-charcoal/90 text-foreground text-xs px-2 py-1 rounded font-medium">
            Before
          </span>
        </div>
        <div className="relative aspect-[4/5]">
          <img 
            src={afterImage} 
            alt={afterAlt} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <span className="absolute bottom-2 right-2 bg-gold text-charcoal text-xs px-2 py-1 rounded font-medium">
            After
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full aspect-[4/5] rounded-xl overflow-hidden cursor-ew-resize select-none border border-border/50",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setIsDragging(false)}
    >
      <img
        src={afterImage}
        alt={afterAlt}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        loading="lazy"
      />

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${containerRef.current ? (containerRef.current.offsetWidth / (sliderPosition / 100)) : 100}px`, maxWidth: "none" }}
          draggable={false}
          loading="lazy"
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-0.5 bg-gold cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gold rounded-full flex items-center justify-center shadow-gold">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-charcoal rounded-full" />
            <div className="w-0.5 h-4 bg-charcoal rounded-full" />
          </div>
        </div>
      </div>

      <span className="absolute bottom-3 left-3 bg-charcoal/90 text-foreground text-xs font-medium px-2 py-1 rounded">
        Before
      </span>
      <span className="absolute bottom-3 right-3 bg-gold text-charcoal text-xs font-medium px-2 py-1 rounded">
        After
      </span>
    </div>
  );
}

export default BeforeAfterSlider;
