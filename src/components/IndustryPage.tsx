import { ArrowRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { TrustBadge } from "@/components/TrustBadge";

interface IndustryPageProps {
  title: string;
  metaDescription: string;
  headline: string;
  subheadline: string;
  benefits: string[];
  beforeImage: string;
  afterImage: string;
  testimonial: {
    quote: string;
    author: string;
    role: string;
  };
}

export function IndustryPage({
  title,
  metaDescription,
  headline,
  subheadline,
  benefits,
  beforeImage,
  afterImage,
  testimonial,
}: IndustryPageProps) {
  return (
    <>
      <SEO title={title} description={metaDescription} />

      <section className="py-20 md:py-32 bg-gradient-radial">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {headline}
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {subheadline}
              </p>

              <ul className="space-y-4 mb-8">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="h-6 w-6 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-gold" />
                    </span>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Button variant="gold" size="lg" asChild>
                  <a href="https://app.ethinx.solutions/start" className="group">
                    Get Started
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>

              <div className="pt-8 border-t border-border/50">
                <TrustBadge variant="tdog" />
              </div>
            </div>

            <div className="lg:order-first">
              <BeforeAfterSlider
                before={beforeImage}
                after={afterImage}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32 bg-secondary/30">
        <div className="container max-w-3xl">
          <blockquote className="text-center">
            <p className="font-display text-xl md:text-2xl text-foreground mb-6 leading-relaxed">
              "{testimonial.quote}"
            </p>
            <footer>
              <cite className="not-italic">
                <span className="font-semibold text-foreground">{testimonial.author}</span>
                <span className="text-muted-foreground"> — {testimonial.role}</span>
              </cite>
            </footer>
          </blockquote>
        </div>
      </section>
    </>
  );
}

export default IndustryPage;
