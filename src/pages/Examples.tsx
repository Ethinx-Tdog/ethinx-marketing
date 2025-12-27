import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StyleTiles from "@/components/StyleTiles";
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

        {/* Style Tiles Section - Industry examples */}
        <StyleTiles />

        {/* CTA Section */}
        <section className="text-center py-16 border-t border-border mt-16">
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
