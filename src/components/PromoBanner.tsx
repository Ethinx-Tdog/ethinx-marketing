import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, X, Zap } from "lucide-react";
import { trackImpression, trackDismissed, trackCtaClicked, trackAbAssigned } from "@/lib/promo-analytics";
import { getPromoGroup, resetPromoGroup, type PromoGroup } from "@/lib/promo-ab";

// Known promo codes configuration
export const KNOWN_PROMOS: Record<string, { discount: string; expiryDays: number; variant?: "default" | "flash" }> = {
  WELCOME10: { discount: "10% off", expiryDays: 3, variant: "default" },
  FLASH20: { discount: "20% off", expiryDays: 1, variant: "flash" },
  SAVE15: { discount: "15% off", expiryDays: 5, variant: "default" },
};

interface PromoBannerProps {
  code?: string;
  discount?: string;
  expiryDays?: number;
  forceVariant?: "default" | "flash";
}

export default function PromoBanner({ 
  code: propCode,
  discount: propDiscount,
  expiryDays: propExpiryDays,
  forceVariant,
}: PromoBannerProps) {
  const [searchParams] = useSearchParams();
  
  // Check URL param for code
  const urlCode = searchParams.get("code")?.toUpperCase();
  const matchedPromo = urlCode && KNOWN_PROMOS[urlCode] ? KNOWN_PROMOS[urlCode] : null;
  
  // Determine final values - URL param takes precedence
  const code = matchedPromo ? urlCode! : (propCode || "WELCOME10");
  const discount = matchedPromo?.discount || propDiscount || "10% off";
  const expiryDays = matchedPromo?.expiryDays ?? propExpiryDays ?? 7;
  const urlForceVariant = matchedPromo?.variant || forceVariant;
  const [, setSearchParams] = useSearchParams();
  const impressionTracked = useRef(false);
  const abAssignmentTracked = useRef(false);

  const [abGroup, setAbGroup] = useState<PromoGroup | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("resetBanner") === "true") {
      localStorage.removeItem("promoBannerDismissed");
      return false;
    }
    return localStorage.getItem("promoBannerDismissed") === "true";
  });

  // Handle A/B group assignment and URL param resets
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Reset A/B group if requested
    if (urlParams.get("resetPromoAB") === "true") {
      resetPromoGroup();
      urlParams.delete("resetPromoAB");
      window.history.replaceState({}, "", `${window.location.pathname}${urlParams.toString() ? `?${urlParams}` : ""}`);
    }

    // Get or assign A/B group
    const group = getPromoGroup();
    setAbGroup(group);

    // Track A/B assignment once per session
    if (!abAssignmentTracked.current) {
      abAssignmentTracked.current = true;
      trackAbAssigned(group);
    }
  }, []);

  // Track impression once when banner is shown (not control group)
  useEffect(() => {
    if (abGroup && abGroup !== "control" && !bannerDismissed && !impressionTracked.current) {
      impressionTracked.current = true;
      const variant = abGroup === "banner_flash" ? "flash" : "default";
      trackImpression(code, variant, abGroup);
    }
  }, [abGroup, bannerDismissed, code]);

  // Clean up URL param after reset
  useEffect(() => {
    if (searchParams.get("resetBanner") === "true") {
      searchParams.delete("resetBanner");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Countdown timer
  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + expiryDays);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDays]);

  // URL-forced variant takes precedence over A/B group
  const variant = urlForceVariant || (abGroup === "banner_flash" ? "flash" : "default");

  const dismissBanner = () => {
    trackDismissed(code, variant, abGroup);
    setBannerDismissed(true);
    localStorage.setItem("promoBannerDismissed", "true");
  };

  const handleCodeClick = () => {
    trackCtaClicked(code, variant, abGroup);
    navigator.clipboard.writeText(code).catch(() => {});
  };

  // Don't render if: control group (unless URL code), dismissed, or not yet assigned
  // URL code bypasses control group
  if (!abGroup || (abGroup === "control" && !matchedPromo) || bannerDismissed) return null;

  const isFlash = variant === "flash";

  return (
    <div 
      className={`py-2.5 px-4 relative ${
        isFlash 
          ? "bg-black text-gold border-b border-gold/30" 
          : "bg-gradient-gold text-primary-foreground"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 pr-8">
        <p className="text-sm font-medium flex items-center gap-1.5">
          {isFlash ? (
            <>
              <Zap className="h-4 w-4 fill-current" />
              <span className="font-bold uppercase tracking-wide">Flash Sale!</span>
            </>
          ) : (
            "🎉"
          )}{" "}
          Use code{" "}
          <button
            onClick={handleCodeClick}
            className="font-bold underline underline-offset-2 hover:no-underline cursor-pointer"
            title="Click to copy"
          >
            {code}
          </button>{" "}
          for {discount}!
        </p>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Clock className="h-3.5 w-3.5" />
          <span>Ends in:</span>
          <div className="flex gap-1">
            <span className={`rounded px-1.5 py-0.5 ${isFlash ? "bg-gold/20" : "bg-primary-foreground/20"}`}>
              {timeLeft.days}d
            </span>
            <span className={`rounded px-1.5 py-0.5 ${isFlash ? "bg-gold/20" : "bg-primary-foreground/20"}`}>
              {String(timeLeft.hours).padStart(2, '0')}h
            </span>
            <span className={`rounded px-1.5 py-0.5 ${isFlash ? "bg-gold/20" : "bg-primary-foreground/20"}`}>
              {String(timeLeft.minutes).padStart(2, '0')}m
            </span>
            <span className={`rounded px-1.5 py-0.5 ${isFlash ? "bg-gold/20" : "bg-primary-foreground/20"}`}>
              {String(timeLeft.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={dismissBanner}
        className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
          isFlash ? "hover:bg-gold/20 text-gold" : "hover:bg-primary-foreground/20"
        }`}
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
