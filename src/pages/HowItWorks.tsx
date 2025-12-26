import { SEO } from "@/components/SEO";
import { SectionHeading } from "@/components/SectionHeading";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { TrustStrip } from "@/components/TrustBadge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, Clock, Shield, Sparkles } from "lucide-react";
import { LucideIcon } from "lucide-react";

const features: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Camera, title: "No Studio Required", description: "Take photos with your smartphone in natural lighting." },
  { icon: Sparkles, title: "Advanced AI", description: "Trained on millions of professional headshots." },
  { icon: Clock, title: "Fast Turnaround", description: "Get headshots in as little as 12 hours." },
  { icon: Shield, title: "Privacy First", description: "Photos encrypted and auto-deleted after 30 days." },
];

const HowItWorks = () => {
  return (
    <>
      <SEO title="How It Works" description="Learn how ETHINX creates stunning AI headshots in 4 simple steps." />
      <section className="py-20 md:py-32 bg-gradient-radial">
        <div className="container">
          <SectionHeading badge="How it works" title="From Selfie to Stunning" description="Our AI transforms your everyday photos into professional headshots." />
          <HowItWorksSteps />
        </div>
      </section>
      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container">
          <SectionHeading badge="Why ETHINX" title="The Smart Way to Get Headshots" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex gap-4 p-6 rounded-2xl bg-card border border-border/50 hover-lift">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-gold/10 flex items-center justify-center"><Icon className="h-6 w-6 text-gold" /></div>
                  <div><h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3><p className="text-muted-foreground text-sm">{f.description}</p></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="py-20 md:py-32">
        <div className="container"><TrustStrip /><div className="text-center mt-12"><Button variant="gold" size="xl" asChild><a href="https://app.ethinx.solutions/start">Get Started <ArrowRight className="h-5 w-5" /></a></Button></div></div>
      </section>
    </>
  );
};

export default HowItWorks;
