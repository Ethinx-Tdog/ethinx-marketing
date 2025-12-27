import { Link } from "react-router-dom";
import { Shield, CreditCard, BadgeCheck, Check } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Plan {
  name: string;
  price: number;
  photos: number;
  popular?: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: 49,
    photos: 15,
    features: [
      "15 professional headshots",
      "3 outfit styles",
      "3 background options",
      "24-hour delivery",
      "Commercial usage rights",
    ],
  },
  {
    name: "Professional",
    price: 89,
    photos: 30,
    popular: true,
    features: [
      "30 professional headshots",
      "5 outfit styles",
      "8 background options",
      "12-hour priority delivery",
      "T-DOG Certified quality",
      "LinkedIn banner included",
      "Commercial usage rights",
    ],
  },
  {
    name: "Ultimate",
    price: 149,
    photos: 50,
    features: [
      "50 professional headshots",
      "8 outfit styles",
      "Unlimited backgrounds",
      "6-hour express delivery",
      "15 lifestyle location shots",
      "Complete social media pack",
      "Team discounts available",
      "Commercial usage rights",
    ],
  },
];

export default function Pricing() {
  return (
    <>
      <SEO
        title="Pricing — ETHINX"
        description="Choose your AI headshot package. Starting from $49 AUD. T-DOG Certified quality with money-back guarantee."
      />
      <main className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Choose Your <span className="text-gradient-gold">Package</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional AI headshots tailored to your industry. All prices in AUD.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto mb-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-8 rounded-2xl border ${
                  plan.popular
                    ? "border-primary bg-card shadow-gold"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      <BadgeCheck className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">AUD</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {plan.photos} headshots
                  </p>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled
                        className={`w-full ${
                          plan.popular
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        } opacity-70 cursor-not-allowed`}
                      >
                        Choose {plan.name}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>

          {/* Trust Row */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6 px-8 rounded-xl border border-border bg-card/50">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <span>Secure checkout powered by Stripe</span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-border" />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span>256-bit SSL encryption</span>
              </div>
            </div>
          </div>

          {/* T-DOG Guarantee */}
          <div className="max-w-3xl mx-auto">
            <Link
              to="/faq#tdog"
              className="flex items-center justify-center gap-4 py-5 px-8 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors group"
            >
              <img src={BRAND.TDOG} alt="T-DOG Certified" className="h-12 w-12" />
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-foreground">T-DOG Certified</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Money-back guarantee if it doesn't look like you
                </p>
              </div>
              <span className="ml-auto text-primary group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
