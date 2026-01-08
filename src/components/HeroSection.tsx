import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustStrip } from "@/components/TrustBadge";
import { Link } from "react-router-dom";
import { HeroUploadButton } from "@/components/HeroUploadButton";

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute inset-0 bg-gradient-radial-bottom" />
      
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[120px] animate-glow" />

      <div className="container relative z-10 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 text-sm">
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            <span className="text-muted-foreground">Trusted by 10,000+ professionals</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="text-foreground">AI-Generated</span>
            <br />
            <span className="text-gradient-gold">Professional Headshots</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Get studio-quality photos in minutes — verified likeness, privacy-first, T-DOG Certified.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <HeroUploadButton variant="gold" size="xl" className="group" />
            <Button variant="outline" size="xl" asChild>
              <Link to="/examples" className="group">
                <Play className="h-5 w-5" />
                See examples
              </Link>
            </Button>
          </div>

          <TrustStrip />
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex justify-center pt-2">
          <div className="w-1 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
