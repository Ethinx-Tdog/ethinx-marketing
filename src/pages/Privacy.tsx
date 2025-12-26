import { SEO } from "@/components/SEO";

const Privacy = () => {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="ETHINX privacy policy. Learn how we protect your data and respect your privacy."
      />

      <section className="py-20 md:py-32">
        <div className="container max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: December 2024
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                1. Information We Collect
              </h2>
              <p className="text-muted-foreground">
                We collect photos you upload for generating headshots, payment information processed securely through our payment provider, and basic contact information (email address) for account management and delivery of your headshots.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                2. How We Use Your Information
              </h2>
              <p className="text-muted-foreground">
                Your photos are used solely for generating your AI headshots. We do not use your images to train our models or share them with third parties. Payment information is processed securely and never stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                3. Data Retention
              </h2>
              <p className="text-muted-foreground">
                Your uploaded photos and generated headshots are stored for 30 days after processing to allow for downloads and potential regenerations. After this period, all images are automatically and permanently deleted from our servers.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                4. Security
              </h2>
              <p className="text-muted-foreground">
                We use industry-standard 256-bit SSL encryption for all data transfers. Your photos are stored in encrypted form on secure servers. Access to user data is strictly limited to authorized personnel only.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                5. Your Rights
              </h2>
              <p className="text-muted-foreground">
                You have the right to request deletion of your data at any time. Contact us at support@ethinx.solutions to exercise your data rights.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                6. Contact Us
              </h2>
              <p className="text-muted-foreground">
                For any privacy-related questions, please contact us at support@ethinx.solutions.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
};

export default Privacy;
