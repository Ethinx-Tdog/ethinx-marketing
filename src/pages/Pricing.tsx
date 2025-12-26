import { SEO } from "@/components/SEO";
import { SectionHeading } from "@/components/SectionHeading";
import { PricingCards } from "@/components/PricingCards";
import { TrustStrip } from "@/components/TrustBadge";
import { Check } from "lucide-react";

const guarantees = [
  "100% satisfaction guarantee",
  "If it doesn't look like you, we regenerate or refund",
  "Secure payment processing",
  "30-day download access",
  "Commercial usage rights included",
  "Privacy-first: your photos are never shared",
];

const Pricing = () => {
  return (
    <>
      <SEO title="Pricing" description="Affordable AI-generated professional headshots starting at $29 AUD. Choose from Starter, Professional, or Ultimate plans." />
      <section className="py-20 md:py-32 bg-gradient-radial">
        <div className="container">
          <SectionHeading badge="Pricing" title="Invest in Your Professional Image" description="Transparent pricing with no hidden fees. All plans include our T-DOG quality guarantee." />
          <PricingCards />
          <div className="mt-16 p-8 rounded-2xl bg-secondary/50 border border-border/50">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6 text-center">Every Plan Includes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guarantees.map((g) => (
                <div key={g} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-gold shrink-0" />
                  <span className="text-muted-foreground text-sm">{g}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16"><TrustStrip /></div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
