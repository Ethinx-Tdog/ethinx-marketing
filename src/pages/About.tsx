import { BRAND } from "@/lib/brand";
import { BadgeCheck, Shield, Zap } from "lucide-react";

export default function About() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-6">
          About <span className="text-gradient-gold">ETHINX</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We're on a mission to make professional headshots accessible, affordable, and authentic for everyone.
        </p>
      </section>

      {/* Founder Blurb */}
      <section className="mb-16">
        <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            ETHINX was born from a simple frustration: professional headshots were either expensive, 
            time-consuming, or resulted in photos that didn't actually look like you. We set out to change that.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Using cutting-edge AI technology combined with rigorous quality standards, we've created a service 
            that delivers studio-quality headshots in minutes—not days. And with our T-DOG Certification, 
            we guarantee every image actually looks like you.
          </p>
        </div>
      </section>

      {/* T-DOG Explanation */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">What is T-DOG Certified?</h2>
        <div className="flex flex-col md:flex-row items-center gap-8 rounded-2xl border border-border bg-card p-8">
          <img 
            src={BRAND.TDOG} 
            alt="T-DOG Certified badge" 
            className="w-24 h-24 object-contain"
          />
          <div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              <strong className="text-foreground">T-DOG</strong> stands for our quality assurance standard: 
              <strong className="text-primary"> True Digital Original Guarantee</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Every headshot we produce is verified to maintain your authentic likeness. If your results 
              don't look like you, we'll regenerate them for free or provide a full refund. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">Our Values</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center p-6 rounded-xl border border-border bg-card">
            <BadgeCheck className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Authenticity</h3>
            <p className="text-sm text-muted-foreground">Your headshot should look like you, not a AI-generated stranger.</p>
          </div>
          <div className="text-center p-6 rounded-xl border border-border bg-card">
            <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Privacy First</h3>
            <p className="text-sm text-muted-foreground">Your photos are encrypted and auto-deleted after 30 days.</p>
          </div>
          <div className="text-center p-6 rounded-xl border border-border bg-card">
            <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Speed</h3>
            <p className="text-sm text-muted-foreground">Studio-quality results in hours, not weeks.</p>
          </div>
        </div>
      </section>

      {/* Brand Logo Row */}
      <section>
        <h2 className="text-lg font-medium text-muted-foreground text-center mb-6">Trusted By</h2>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-50">
          <div className="h-8 w-24 bg-muted rounded" aria-label="Partner logo placeholder" />
          <div className="h-8 w-28 bg-muted rounded" aria-label="Partner logo placeholder" />
          <div className="h-8 w-20 bg-muted rounded" aria-label="Partner logo placeholder" />
          <div className="h-8 w-32 bg-muted rounded" aria-label="Partner logo placeholder" />
        </div>
      </section>
    </main>
  );
}
