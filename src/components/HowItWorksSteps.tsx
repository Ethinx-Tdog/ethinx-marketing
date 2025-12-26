import { Upload, Sparkles, Palette, Download } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: Upload,
    title: "Upload Your Photos",
    description: "Share 10-20 selfies from different angles. We'll use these to train your personal AI model.",
  },
  {
    icon: Palette,
    title: "Choose Your Style",
    description: "Select backgrounds, outfits, and settings that match your professional needs.",
  },
  {
    icon: Sparkles,
    title: "AI Generates Magic",
    description: "Our AI creates studio-quality headshots with perfect lighting and professional styling.",
  },
  {
    icon: Download,
    title: "Download & Shine",
    description: "Get your professional headshots delivered to your inbox. Download anytime for 30 days.",
  },
];

export function HowItWorksSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
      {steps.map((step, idx) => {
        const IconComponent = step.icon;
        return (
          <div key={idx} className="relative text-center">
            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-gold/30 to-transparent" />
            )}

            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="absolute inset-0 bg-gold/10 rounded-full blur-xl scale-150" />
              <div className="relative h-20 w-20 rounded-full bg-secondary border border-gold/20 flex items-center justify-center">
                <IconComponent className="h-8 w-8 text-gold" />
              </div>
              <span className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-gold text-charcoal flex items-center justify-center text-sm font-bold">
                {idx + 1}
              </span>
            </div>

            <h3 className="text-lg font-display font-semibold text-foreground mb-3">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export default HowItWorksSteps;
