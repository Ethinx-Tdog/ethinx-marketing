import { SEO } from "@/components/SEO";

const Terms = () => (
  <>
    <SEO title="Terms of Service" description="ETHINX terms of service for AI headshot generation." />
    <section className="py-20 md:py-32">
      <div className="container max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>
        <div className="space-y-8 text-muted-foreground">
          <div><h2 className="text-xl font-semibold text-foreground mb-3">1. Service Description</h2><p>ETHINX provides AI-generated professional headshots from your uploaded photos.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">2. Acceptable Use</h2><p>Only upload photos of yourself or with consent. No misleading or harmful content.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">3. Intellectual Property</h2><p>You retain full ownership and commercial rights to generated headshots.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">4. Quality Guarantee</h2><p>T-DOG Certification: if results don't match your likeness, we regenerate or refund.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">5. Payments</h2><p>All prices in AUD. Payment required before processing. Refunds per satisfaction guarantee.</p></div>
        </div>
      </div>
    </section>
  </>
);

export default Terms;
