import { Link } from "react-router-dom";
import { PricingCards } from "@/components/PricingCards";
import { IndustrySelector } from "@/components/IndustrySelector";
import { UpsellModal } from "@/components/UpsellModal";
import { PricingProvider } from "@/contexts/PricingContext";
import StyleTiles from "@/components/StyleTiles";
import { BRAND } from "@/lib/brand";
import { Shield, CreditCard, BadgeCheck } from "lucide-react";

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

        {/* Trust Row - Payment Security */}
        <div className="max-w-3xl mx-auto mt-8 mb-12 px-4">
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

        {/* T-DOG Guarantee Badge */}
        <div className="max-w-3xl mx-auto mb-12 px-4">
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
            <span className="ml-auto text-primary group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
        
        {/* Industry Examples - Style Tiles with Modal */}
        <StyleTiles />
        
        <UpsellModal />
      </section>
    </PricingProvider>
  );
}
