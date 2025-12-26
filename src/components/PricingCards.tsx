import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PricingPlan {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
  planId: string;
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: 29,
    planId: "starter",
    features: [
      "10 professional headshots",
      "3 background options",
      "2 outfit styles",
      "24-hour delivery",
    ],
  },
  {
    name: "Professional",
    price: 59,
    planId: "professional",
    popular: true,
    features: [
      "25 professional headshots",
      "8 background options",
      "5 outfit styles",
      "12-hour priority delivery",
      "LinkedIn banner included",
      "Profile optimization tips",
    ],
  },
  {
    name: "Ultimate",
    price: 79,
    planId: "ultimate",
    features: [
      "40 professional headshots",
      "Unlimited backgrounds",
      "8 outfit styles",
      '15 "impossible location" lifestyle shots',
      "Complete social media pack",
      "Dating profile kit",
      "Team discounts available",
    ],
  },
];

export function PricingCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            "relative flex flex-col p-6 lg:p-8 rounded-2xl border transition-all duration-300 hover-lift",
            plan.popular
              ? "bg-gradient-to-b from-primary/10 to-card border-primary/50"
              : "bg-card border-border"
          )}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-gradient-gold text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold">
              <Star className="h-4 w-4" />
              Most Popular
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              {plan.name}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl lg:text-5xl font-bold text-gradient-gold">
                ${plan.price}
              </span>
              <span className="text-muted-foreground text-sm">AUD</span>
            </div>
          </div>

          <ul className="flex-1 space-y-3 mb-8">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            variant={plan.popular ? "gold" : "outline"}
            size="lg"
            className="w-full"
            asChild
          >
            <a href={`https://app.ethinx.solutions/start?plan=${plan.planId}`}>
              Choose {plan.name}
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}
