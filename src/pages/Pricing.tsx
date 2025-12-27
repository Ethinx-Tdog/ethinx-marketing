import { PricingCards } from "@/components/PricingCards";
import { IndustrySelector } from "@/components/IndustrySelector";
import { UpsellModal } from "@/components/UpsellModal";
import { PricingProvider } from "@/contexts/PricingContext";

export default function Pricing() {
  return (
    <PricingProvider>
      <section className="py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient-gold">
            Choose Your Package
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional AI headshots tailored to your industry. All prices in AUD.
          </p>
          
          {/* Industry Selector */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-3">Select your industry for personalized recommendations</p>
            <IndustrySelector />
          </div>
        </div>

        <PricingCards />
        <UpsellModal />
      </section>
    </PricingProvider>
  );
}
