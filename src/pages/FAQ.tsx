import { SEO } from "@/components/SEO";
import { SectionHeading } from "@/components/SectionHeading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "How does ETHINX create professional headshots?",
    answer:
      "ETHINX uses advanced AI technology trained on millions of professional headshots. You upload 10-20 selfies, and our AI learns your unique facial features to generate studio-quality headshots with perfect lighting, professional backgrounds, and natural expressions.",
  },
  {
    question: "What is T-DOG Certification?",
    answer:
      "T-DOG (True Digital Original Guarantee) is our quality assurance process. Every headshot is reviewed to ensure it's photoreal and accurately represents your likeness. If the results don't look like you, we'll regenerate them or provide a full refund.",
  },
  {
    question: "How long does it take to receive my headshots?",
    answer:
      "Turnaround times depend on your plan: Starter (24 hours), Professional (12 hours), Ultimate (12 hours). You'll receive an email notification when your headshots are ready for download.",
  },
  {
    question: "What kind of photos should I upload?",
    answer:
      "Upload 10-20 clear selfies with good lighting. Include a variety of angles (front, slight left/right), expressions, and if possible, different lighting conditions. Avoid heavy filters, sunglasses, or photos where your face is partially obscured.",
  },
  {
    question: "Can I use these headshots commercially?",
    answer:
      "Yes! All plans include full commercial usage rights. You can use your AI-generated headshots on LinkedIn, company websites, marketing materials, business cards, and any other professional purpose.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. Your photos are encrypted during upload and storage. We never share your images with third parties. Your original uploads and generated headshots are automatically deleted from our servers after 30 days.",
  },
  {
    question: "What if I'm not satisfied with the results?",
    answer:
      "We offer a satisfaction guarantee. If your headshots don't accurately represent your likeness (verified through our T-DOG certification process), we'll regenerate them at no extra cost or provide a full refund.",
  },
  {
    question: "Do you offer team or bulk discounts?",
    answer:
      "Yes! Our Ultimate plan includes team discounts for organizations. Contact us at support@ethinx.solutions for custom enterprise pricing for teams of 10 or more.",
  },
];

const FAQ = () => {
  return (
    <>
      <SEO
        title="FAQ - Frequently Asked Questions"
        description="Get answers to common questions about ETHINX AI-generated professional headshots, pricing, turnaround times, and more."
      />

      <section className="py-20 md:py-32">
        <div className="container max-w-3xl">
          <SectionHeading
            badge="FAQ"
            title="Frequently Asked Questions"
            description="Everything you need to know about getting your AI-generated professional headshots."
          />

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact */}
          <div className="mt-16 text-center p-8 rounded-2xl bg-card border border-border">
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6">
              We're here to help. Reach out to our support team.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:support@ethinx.solutions">
                Contact Support
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
