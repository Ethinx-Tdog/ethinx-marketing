import { Link } from "react-router-dom";
import { Shield, CreditCard, BadgeCheck, Check, Award, Clock, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import PromoBanner from "@/components/PromoBanner";
import { usePricing } from "@/contexts/PricingContext";
import { IndustrySelector } from "@/components/IndustrySelector";
import type { PackageId } from "@/lib/pricing-config";

interface Plan {
  id: PackageId;
  name: string;
  price: number;
  photos: number;
  delivery: string;
  popular?: boolean;
  tdogCertified?: boolean;
  features: string[];
  highlight?: string;
}

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    photos: 15,
    delivery: "24h delivery",
    features: [
      "15 professional headshots",
      "3 outfit styles",
      "3 background options",
      "24-hour delivery",
      "Commercial usage rights",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 89,
    photos: 30,
    delivery: "12h priority",
    popular: true,
    tdogCertified: true,
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
    id: "ultimate",
    name: "Ultimate",
    price: 149,
    photos: 50,
    delivery: "6h express",
    tdogCertified: true,
    highlight: "AI Bio Suite",
    features: [
      "50 professional headshots",
      "8 outfit styles",
      "Unlimited backgrounds",
      "6-hour express delivery",
      "AI Bio Suite included",
      "15 lifestyle location shots",
      "Complete social media pack",
      "Team discounts available",
      "Commercial usage rights",
    ],
  },
];

export default function Pricing() {
  const { selectPackage, industry } = usePricing();

  return (
    <>
      <SEO
        title="Pricing — ETHINX"
        description="Choose your AI headshot package. Starting from $49 AUD. T-DOG Certified quality with money-back guarantee."
      />
      <PromoBanner />
      <main className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Choose Your <span className="text-gradient-gold">Package</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Professional AI headshots tailored to your industry. All prices in AUD.
            </p>
          </div>

          {/* Industry Selector */}
          <div className="mb-12">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Select your industry for tailored recommendations
            </p>
            <IndustrySelector />
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto mb-12">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col p-8 rounded-2xl border-2 ${
                  plan.popular
                    ? "border-primary bg-card shadow-gold-lg"
                    : "border-border bg-card hover:border-primary/30 transition-colors"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground shadow-gold">
                      <Award className="h-3.5 w-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* T-DOG Badge */}
                {plan.tdogCertified && (
                  <div className="absolute -top-2 -right-2">
                    <img 
                      src={BRAND.TDOG} 
                      alt="T-DOG Certified" 
                      className="h-12 w-12 drop-shadow-lg"
                    />
                  </div>
                )}

                {/* Highlight tag */}
                {plan.highlight && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs font-medium text-primary">
                      <Sparkles className="h-3 w-3" />
                      {plan.highlight}
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gradient-gold">${plan.price}</span>
                    <span className="text-muted-foreground">AUD</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>{plan.photos} headshots</span>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {plan.delivery}
                    </span>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Button
                    onClick={() => selectPackage(plan.id)}
                    className={`w-full font-semibold ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-gold"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Choose {plan.name}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Limited-time codes apply at checkout
                  </p>
                </div>
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
                  <span className="font-semibold text-foreground">T-DOG Certified Quality Control</span>
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
