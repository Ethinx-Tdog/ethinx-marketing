import { Link } from "react-router-dom";
import { Sparkles, Lock, BadgeCheck, ArrowRight, Star } from "lucide-react";
import TrustStrip from "@/components/TrustStrip";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import HowItWorksSteps from "@/components/HowItWorksSteps";
import StyleTiles from "@/components/StyleTiles";
import PromoBanner from "@/components/PromoBanner";
import { testimonials } from "@/data/testimonials";
import { featuredExamples } from "@/data/examples";
import { BRAND } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function Index() {
  // Pick 3 sample transformations for homepage
  const sampleTransformations = featuredExamples.slice(0, 3);
  // --- ETHINX BRIDGE START ---
  useEffect(() => {
    // 1. Define the Checkout Logic
    const API_URL = "http://localhost:8000"; // Docker Backend URL

    async function triggerCheckout(offerKey: string) {
      try {
        console.log("Initiating checkout for:", offerKey);
        const response = await fetch(`${API_URL}/checkout/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offer_key: offerKey,
            email: "guest@ethinx.com",
          }),
        });

        const data = await response.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          alert("Checkout Error: " + (data.detail || "Unknown error"));
        }
      } catch (error) {
        console.error("Payment failed:", error);
        alert("Connection Error. Is Docker running?");
      }
    }

    // 2. Attach to Buttons (Wait 1s for layout to load)
    const timer = setTimeout(() => {
      // Map your Button IDs to Stripe Keys here
      const products: Record<string, string> = {
        "buy-rush-3h": "rush_3h",
        "buy-bio-suite": "bio_suite",
        "buy-creative": "creative_studio",
      };

      Object.keys(products).forEach((id) => {
        const btn = document.getElementById(id);
        if (btn) {
          console.log("Attached checkout to:", id);
          // Clone to remove old listeners (safety)
          const newBtn = btn.cloneNode(true);
          btn.parentNode?.replaceChild(newBtn, btn);
          newBtn.addEventListener("click", () => triggerCheckout(products[id]));
        } else {
          console.warn("Could not find button with ID:", id);
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
  // --- ETHINX BRIDGE END ---

  return (
    <main>
      {/* Promo Banner */}
      <PromoBanner />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-radial">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
            <img src={BRAND.TDOG} alt="T-DOG Certified" className="h-4 w-4" />
            Trusted by professionals across industries
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
            AI-Generated <span className="text-gradient-gold">Professional Headshots</span>
            <br className="hidden md:block" /> in Minutes
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Verified likeness. Privacy-first. T-DOG Certified.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="lg"
                    disabled
                    className="bg-primary text-primary-foreground font-semibold opacity-70 cursor-not-allowed"
                  >
                    Upload Photos
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Link to="/examples">
              <Button size="lg" variant="outline" className="border-border font-semibold">
                See Examples
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <TrustStrip />
        </div>
      </section>

      {/* Sample Transformations */}
      <section className="py-16 md:py-24 bg-gradient-dark">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Sample <span className="text-gradient-gold">Transformations</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              See real before & after results. Drag the slider to compare.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {sampleTransformations.map((pair, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-border bg-card">
                <BeforeAfterSlider before={pair.before} after={pair.after} alt={pair.alt} />
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/examples" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              View all examples
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Explore by Style */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <StyleTiles />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Our <span className="text-gradient-gold">Clients</span> Say
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Join thousands of professionals who trust ETHINX</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.slice(0, 6).map((t, idx) => (
              <div key={idx} className="flex flex-col p-6 rounded-2xl bg-card border border-border hover-lift">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="flex-1 text-foreground mb-4 leading-relaxed text-sm">"{t.quote}"</blockquote>
                <div className="pt-4 border-t border-border">
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <HowItWorksSteps />

      {/* Why ETHINX */}
      <section className="py-16 md:py-24 bg-gradient-radial-bottom">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why <span className="text-gradient-gold">ETHINX</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              The professional headshot solution built for modern professionals
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover-lift">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Photoreal Results</h3>
              <p className="text-muted-foreground text-sm">
                AI-generated headshots matched to your industry that look like you, not a stranger.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover-lift">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy & Control</h3>
              <p className="text-muted-foreground text-sm">
                Encrypted uploads, auto-delete after 30 days. Your data stays yours.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-8 rounded-2xl border border-border bg-card hover-lift">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                <BadgeCheck className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Money-Back Guarantee</h3>
              <p className="text-muted-foreground text-sm">
                T-DOG Certified means verified likeness. If it doesn't look like you, we regenerate or refund.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to <span className="text-gradient-gold">Transform</span> Your Image?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of professionals who have upgraded their online presence with AI-powered headshots.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/pricing">
              <Button size="lg" className="bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/examples">
              <Button size="lg" variant="outline" className="border-border font-semibold">
                See More Examples
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
