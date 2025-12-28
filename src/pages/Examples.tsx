import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StyleTiles from "@/components/StyleTiles";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { featuredExamples } from "@/data/examples";
import SEO from "@/components/SEO";

export default function Examples() {
  return (
    <>
      <SEO
        title="Examples — ETHINX"
        description="See real AI headshot transformations. Browse by style: Corporate, Real Estate, Tradie, Health, Creative."
      />
      <main className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Real <span className="text-gradient-gold">Transformations</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            See the difference professional AI headshots make. Click a style to view
            before and after comparisons.
          </p>
          <Link to="/pricing">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Get Your Headshots
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>

        {/* Featured Examples - Personal transformations */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Featured <span className="text-gradient-gold">Transformations</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredExamples.map((pair, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-border bg-card">
                <BeforeAfterSlider
                  before={pair.before}
                  after={pair.after}
                  alt={pair.alt}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Style Tiles Section - Industry examples */}
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            Browse by <span className="text-gradient-gold">Industry</span>
          </h2>
          <StyleTiles />
        </section>

        {/* CTA Section */}
        <section className="text-center py-16 border-t border-border">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="text-gradient-gold">Transform</span> Your Image?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join thousands of professionals who have upgraded their online
            presence with AI-powered headshots.
          </p>
          <Link to="/pricing">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              View Pricing Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </section>
      </main>
    </>
  );
}
