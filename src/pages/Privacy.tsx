import { SEO } from "@/components/SEO";

const Privacy = () => (
  <>
    <SEO title="Privacy Policy" description="ETHINX privacy policy. Learn how we protect your data." />
    <section className="py-20 md:py-32">
      <div className="container max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>
        <div className="space-y-8 text-muted-foreground">
          <div><h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2><p>We collect photos you upload, payment info (processed securely), and your email for account management.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2><p>Photos are used solely for generating headshots. We never train models on your images or share them.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">3. Data Retention</h2><p>All photos and generated headshots are automatically deleted 30 days after processing.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">4. Security</h2><p>256-bit SSL encryption. Encrypted storage. Strictly limited access.</p></div>
          <div><h2 className="text-xl font-semibold text-foreground mb-3">5. Your Rights</h2><p>Request deletion anytime at support@ethinx.solutions.</p></div>
        </div>
      </div>
    </section>
  </>
);

export default Privacy;
