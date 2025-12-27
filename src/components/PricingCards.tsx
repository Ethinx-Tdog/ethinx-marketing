import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PACKAGES } from "@/lib/pricing-config";
import { usePricing } from "@/contexts/PricingContext";
import { BRAND } from "@/lib/brand";

export function PricingCards() {
  const { selectPackage } = usePricing();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {PACKAGES.map((plan) => (
        <div
          key={plan.id}
          className={cn(
            "relative flex flex-col p-6 lg:p-8 rounded-2xl border transition-all duration-300 hover-lift",
            plan.popular
              ? "bg-gradient-to-b from-gold/10 to-card border-gold/30 shadow-gold"
              : "bg-card border-border/50 hover:border-gold/20"
          )}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gradient-gold text-charcoal px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">
              <Star className="h-3.5 w-3.5" />
              Most Popular
            </div>
          )}

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-display font-semibold text-foreground">
                {plan.name}
              </h3>
              {plan.badge && (
                <img 
                  src={BRAND.TDOG} 
                  alt={plan.badge} 
                  className="h-6 w-6 object-contain" 
                  title={plan.badge}
                />
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl lg:text-5xl font-bold text-gradient-gold">
                ${plan.price}
              </span>
              <span className="text-muted-foreground text-sm">AUD</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {plan.photos} photos • {plan.outfits} outfits
            </p>
          </div>

          <ul className="flex-1 space-y-3 mb-8">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            variant={plan.popular ? "gold" : "outline"}
            size="lg"
            className="w-full"
            onClick={() => selectPackage(plan.id)}
          >
            Choose {plan.name}
          </Button>
        </div>
      ))}
    </div>
  );
}

export default PricingCards;
