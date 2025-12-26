import { SEO } from "@/components/SEO";

const Terms = () => {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="ETHINX terms of service. Read our terms and conditions for using our AI headshot service."
      />

      <section className="py-20 md:py-32">
        <div className="container max-w-3xl">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-8">
            Terms of Service
          </h1>
          <p className="text-muted-foreground mb-8">
            Last updated: December 2024
          </p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                1. Service Description
              </h2>
              <p className="text-muted-foreground">
                ETHINX provides AI-generated professional headshots based on photos you upload. Our service transforms your selfies into studio-quality professional images using artificial intelligence technology.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                2. Acceptable Use
              </h2>
              <p className="text-muted-foreground">
                You may only upload photos of yourself or individuals who have given explicit consent. You may not use our service to create misleading, fraudulent, or harmful content. All generated headshots must be used for legitimate personal or professional purposes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                3. Intellectual Property
              </h2>
              <p className="text-muted-foreground">
                You retain full ownership and commercial usage rights to your generated headshots. You grant ETHINX a limited license to process your uploaded photos solely for the purpose of generating your headshots.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                4. Quality Guarantee
              </h2>
              <p className="text-muted-foreground">
                Our T-DOG Certification guarantees photoreal results that accurately represent your likeness. If your generated headshots do not meet this standard, we will regenerate them at no additional cost or provide a full refund.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                5. Payment and Refunds
              </h2>
              <p className="text-muted-foreground">
                All prices are in Australian Dollars (AUD). Payment is required before processing begins. Refunds are available under our satisfaction guarantee if the generated headshots fail to meet our quality standards.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                6. Limitation of Liability
              </h2>
              <p className="text-muted-foreground">
                ETHINX is not liable for any indirect, incidental, or consequential damages arising from the use of our service. Our total liability is limited to the amount paid for the service.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                7. Changes to Terms
              </h2>
              <p className="text-muted-foreground">
                We reserve the right to update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                8. Contact
              </h2>
              <p className="text-muted-foreground">
                For questions about these terms, please contact us at support@ethinx.solutions.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
};

export default Terms;
