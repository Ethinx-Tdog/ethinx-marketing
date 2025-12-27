import { Link } from "react-router-dom";
import { Shield, Clock, Award, Sparkles, Lock, BadgeCheck } from "lucide-react";
import TrustStrip from "@/components/TrustStrip";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { testimonials } from "@/data/testimonials";
import { featuredExamples } from "@/data/examples";
import { Star } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function Index() {
  // Pick 3 sample transformations
  const sampleTransformations = featuredExamples.slice(0, 3);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-radial">
        <div className="mx-auto max-w-7xl px-4 py-20 md:py-28 text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
            <img src={BRAND.TDOG} alt="T-DOG Certified" className="h-4 w-4" />
            Trusted by professionals across industries
          </p>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight">
            AI-Generated{" "}
            <span className="text-gradient-gold">Professional Headshots</span>
            <br className="hidden md:block" /> in Minutes
          </h1>
          
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Verified likeness. Privacy-first. T-DOG Certified.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-gold-lg"
            >
              See Pricing
            </Link>
            <Link
              to="/examples"
              className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3.5 font-semibold text-foreground transition-all hover:bg-secondary"
            >
              See Examples
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
              Sample Transformations
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              See real before & after results. Drag the slider to compare.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {sampleTransformations.map((pair, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-border bg-card">
                <BeforeAfterSlider
                  before={pair.before}
                  after={pair.after}
                  alt={pair.alt}
                />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Link
              to="/examples"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              View all examples
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Our Clients Say
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Join thousands of professionals who trust ETHINX
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="flex flex-col p-6 rounded-2xl bg-card border border-border hover-lift"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <blockquote className="flex-1 text-foreground mb-4 leading-relaxed text-sm">
                  "{t.quote}"
                </blockquote>
                <div className="pt-4 border-t border-border">
                  <p className="font-medium text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ETHINX */}
      <section className="py-16 md:py-24 bg-gradient-radial-bottom">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why ETHINX
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
    </main>
  );
}
