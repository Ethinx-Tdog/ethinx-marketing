import { cn } from "@/lib/utils";
import { INDUSTRIES } from "@/lib/pricing-config";
import { usePricing } from "@/contexts/PricingContext";

export function IndustrySelector() {
  const { industry, setIndustry } = usePricing();

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {INDUSTRIES.map((ind) => {
        const IconComponent = ind.icon;
        const isActive = industry === ind.id;
        
        return (
          <button
            key={ind.id}
            onClick={() => setIndustry(ind.id)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-gold text-charcoal"
                : "bg-card border border-border/50 text-muted-foreground hover:border-gold/50 hover:text-foreground"
            )}
          >
            <IconComponent className="h-4 w-4" />
            {ind.name}
          </button>
        );
      })}
    </div>
  );
}

export default IndustrySelector;
