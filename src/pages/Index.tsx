import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import { HeroSection } from "@/components/HeroSection";
import { SectionHeading } from "@/components/SectionHeading";
import { IndustryTiles } from "@/components/IndustryTiles";
import { PricingCards } from "@/components/PricingCards";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { Testimonials } from "@/components/Testimonials";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <>
      <SEO
        title="AI-Generated Professional Headshots | ETHINX"
        description="Get studio-quality professional headshots in minutes with AI. T-DOG Certified, privacy-first, verified likeness. Starting at $29 AUD."
      />

      <HeroSection />

      <section className="py-20 md:py-32">
        <div className="container">
          <SectionHeading
            badge="Transformations"
            title="See the Results"
            description="From everyday selfies to studio-quality headshots. Click any industry to explore before & after examples."
          />
          <IndustryTiles />
        </div>
      </section>

      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container">
          <SectionHeading
            badge="How it works"
            title="Four Simple Steps"
            description="Get your professional headshots in as little as 12 hours."
          />
          <HowItWorksSteps />
          <div className="text-center mt-12">
            <Button variant="outline" size="lg" asChild>
              <Link to="/how-it-works">Learn more <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container">
          <SectionHeading
            badge="Pricing"
            title="Simple, Transparent Pricing"
            description="Choose the plan that fits your needs. All plans include our T-DOG quality guarantee."
          />
          <PricingCards />
        </div>
      </section>

      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container">
          <SectionHeading
            badge="Testimonials"
            title="Loved by Professionals"
            description="Join thousands of satisfied customers who've transformed their online presence."
          />
          <Testimonials />
        </div>
      </section>

      <section className="py-20 md:py-32 bg-gradient-radial-bottom">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-secondary/50 border border-gold/20 p-8 md:p-16 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-[100px]" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Ready to Transform Your Image?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Join 10,000+ professionals who've upgraded their headshots with ETHINX.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="gold" size="xl" asChild>
                  <a href="https://app.ethinx.solutions/start">Upload Photos <ArrowRight className="h-5 w-5" /></a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/pricing">View pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Index;
