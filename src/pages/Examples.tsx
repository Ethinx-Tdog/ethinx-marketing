import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import StyleTiles from "@/components/StyleTiles";
import { featuredExamples } from "@/data/examples";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function Examples() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Real <span className="text-[#FBBF24]">Transformations</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          See the difference professional AI headshots make. Slide to compare
          before and after photos from real customers.
        </p>
        <Link to="/pricing">
          <Button className="bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-black font-semibold">
            Get Your Headshots
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* Featured Examples Grid - Personal examples (Nicole, Luke, Jimmy, etc.) */}
      {featuredExamples.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-6">
            Featured Examples
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredExamples.map((p, i) => (
              <BeforeAfterSlider
                key={i}
                before={p.before}
                after={p.after}
                alt={p.alt}
              />
            ))}
          </div>
        </section>
      )}

      {/* Style Tiles Section - Industry examples behind buttons */}
      <StyleTiles />

      {/* CTA Section */}
      <section className="text-center py-16 border-t border-white/10 mt-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to <span className="text-[#FBBF24]">Transform</span> Your Image?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join thousands of professionals who have upgraded their online
          presence with AI-powered headshots.
        </p>
        <Link to="/pricing">
          <Button
            size="lg"
            className="bg-[#FBBF24] hover:bg-[#FBBF24]/90 text-black font-semibold"
          >
            View Pricing Plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
