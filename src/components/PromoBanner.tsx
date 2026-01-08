import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, X } from "lucide-react";

export default function PromoBanner() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    // Check if reset param is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("resetBanner") === "true") {
      localStorage.removeItem("promoBannerDismissed");
      return false;
    }
    return localStorage.getItem("promoBannerDismissed") === "true";
  });

  // Clean up URL param after reset
  useEffect(() => {
    if (searchParams.get("resetBanner") === "true") {
      searchParams.delete("resetBanner");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Countdown timer - ends 7 days from now
  useEffect(() => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

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
  }, []);

  const dismissBanner = () => {
    setBannerDismissed(true);
    localStorage.setItem("promoBannerDismissed", "true");
  };

  if (bannerDismissed) return null;

  return (
    <div className="bg-gradient-gold text-primary-foreground py-2.5 px-4 relative">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 pr-8">
        <p className="text-sm font-medium">
          🎉 Use code <span className="font-bold">WELCOME10</span> for 10% off!
        </p>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Clock className="h-3.5 w-3.5" />
          <span>Ends in:</span>
          <div className="flex gap-1">
            <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{timeLeft.days}d</span>
            <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{String(timeLeft.hours).padStart(2, '0')}h</span>
            <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{String(timeLeft.minutes).padStart(2, '0')}m</span>
            <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </div>
      <button
        onClick={dismissBanner}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-primary-foreground/20 rounded transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}