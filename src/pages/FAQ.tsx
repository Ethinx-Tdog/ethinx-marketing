import { SEO } from "@/components/SEO";
import { SectionHeading } from "@/components/SectionHeading";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const faqs = [
  { q: "How does ETHINX create professional headshots?", a: "Our AI is trained on millions of professional headshots. Upload 10-20 selfies, and we generate studio-quality results." },
  { q: "What is T-DOG Certification?", a: "T-DOG guarantees photoreal results. If it doesn't look like you, we regenerate or refund." },
  { q: "How long does delivery take?", a: "Starter: 24h, Professional: 12h, Ultimate: 12h priority." },
  { q: "What photos should I upload?", a: "10-20 clear selfies with good lighting, various angles. Avoid filters or sunglasses." },
  { q: "Can I use these commercially?", a: "Yes! All plans include full commercial usage rights." },
  { q: "Is my data secure?", a: "Photos are encrypted and auto-deleted after 30 days. Never shared." },
  { q: "What if I'm not satisfied?", a: "We regenerate for free or provide a full refund under our T-DOG guarantee." },
  { q: "Do you offer team discounts?", a: "Yes! Ultimate plan includes team discounts. Contact support for enterprise pricing." },
];

const FAQ = () => {
  return (
    <>
      <SEO title="FAQ" description="Get answers about ETHINX AI headshots, pricing, delivery, and more." />
      <section className="py-20 md:py-32">
        <div className="container max-w-3xl">
          <SectionHeading badge="FAQ" title="Frequently Asked Questions" description="Everything you need to know about AI-generated headshots." />
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="bg-secondary/50 border border-border/50 rounded-xl px-6 data-[state=open]:border-gold/30">
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-gold py-6">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <div className="mt-16 text-center p-8 rounded-2xl bg-secondary/50 border border-border/50">
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-6">We're here to help.</p>
            <Button variant="outline" asChild><a href="mailto:support@ethinx.solutions">Contact Support</a></Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQ;
