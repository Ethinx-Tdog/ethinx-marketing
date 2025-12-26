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
      <SEO
        title="Pricing - AI Professional Headshots"
        description="Affordable AI-generated professional headshots starting at $29 AUD. Choose from Starter, Professional, or Ultimate plans."
      />

      <section className="py-20 md:py-32">
        <div className="container">
          <SectionHeading
            badge="Pricing"
            title="Invest in Your Professional Image"
            description="Transparent pricing with no hidden fees. All plans include our T-DOG quality guarantee."
          />

          <PricingCards />

          {/* Guarantees */}
          <div className="mt-16 p-8 rounded-2xl bg-card border border-border">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6 text-center">
              Every Plan Includes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guarantees.map((guarantee) => (
                <div key={guarantee} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-muted-foreground">{guarantee}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Strip */}
          <div className="mt-16">
            <TrustStrip />
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
