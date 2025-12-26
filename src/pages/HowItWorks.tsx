import { SEO } from "@/components/SEO";
import { SectionHeading } from "@/components/SectionHeading";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { TrustStrip } from "@/components/TrustBadge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, Clock, Shield, Sparkles } from "lucide-react";

const features = [
  {
    icon: Camera,
    title: "No Studio Required",
    description: "Take photos with your smartphone in natural lighting. No expensive photographer needed.",
  },
  {
    icon: Sparkles,
    title: "Advanced AI Technology",
    description: "Our AI has been trained on millions of professional headshots to ensure perfect results.",
  },
  {
    icon: Clock,
    title: "Fast Turnaround",
    description: "Get your professional headshots in as little as 12 hours with our priority processing.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your photos are encrypted, never shared, and automatically deleted after processing.",
  },
];

const HowItWorks = () => {
  return (
    <>
      <SEO
        title="How It Works - AI Professional Headshots"
        description="Learn how ETHINX creates stunning professional headshots from your selfies. Simple 3-step process with AI technology."
      />

      <section className="py-20 md:py-32">
        <div className="container">
          <SectionHeading
            badge="How it works"
            title="From Selfie to Stunning"
            description="Our AI-powered process transforms your everyday photos into professional headshots in three simple steps."
          />

          <HowItWorksSteps />
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-32 bg-card/50">
        <div className="container">
          <SectionHeading
            badge="Why Choose ETHINX"
            title="The Smart Way to Get Professional Headshots"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-6 rounded-2xl bg-card border border-border hover-lift"
              >
                <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="py-20 md:py-32">
        <div className="container">
          <TrustStrip />

          <div className="text-center mt-12">
            <Button variant="gold" size="xl" asChild>
              <a href="https://app.ethinx.solutions/start" className="group">
                Get Started Now
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HowItWorks;
