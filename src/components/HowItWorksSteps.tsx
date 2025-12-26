import { Upload, Sparkles, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Photos",
    description: "Share 10-20 selfies from different angles. We'll use these to train your personal AI model.",
  },
  {
    icon: Sparkles,
    title: "AI Magic Happens",
    description: "Our AI creates studio-quality headshots with perfect lighting, backgrounds, and professional styling.",
  },
  {
    icon: Download,
    title: "Download & Shine",
    description: "Get your professional headshots delivered to your inbox. Download anytime for 30 days.",
  },
];

export function HowItWorksSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
      {steps.map((step, idx) => (
        <div key={idx} className="relative text-center">
          {/* Connector line */}
          {idx < steps.length - 1 && (
            <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/50 to-transparent" />
          )}

          {/* Step number */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
            <div className="relative h-24 w-24 rounded-full bg-gradient-gold flex items-center justify-center">
              <step.icon className="h-10 w-10 text-primary-foreground" />
            </div>
            <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-sm font-bold text-primary">
              {idx + 1}
            </span>
          </div>

          {/* Content */}
          <h3 className="text-xl font-display font-semibold text-foreground mb-3">
            {step.title}
          </h3>
          <p className="text-muted-foreground">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
