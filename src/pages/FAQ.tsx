import { ChevronDown } from "lucide-react";
import { BRAND } from "@/lib/brand";
import SEO from "@/components/SEO";

const faqs = [
  {
    q: "How many photos should I upload?",
    a: "We recommend 5–10 clear photos with your face visible. Include different angles and good lighting. Avoid sunglasses, heavy filters, or group shots.",
  },
  {
    q: "What file size and format are accepted?",
    a: "We accept JPEG and PNG files up to 10MB each. Higher resolution photos produce better results.",
  },
  {
    q: "How long does it take to get my headshots?",
    a: "Standard delivery is 6–24 hours depending on your plan. Rush options are available for same-day delivery.",
  },
  {
    q: "What is T-DOG Certified?",
    a: "T-DOG (True Digital Original Guarantee) is our quality standard. It means your headshot is verified to maintain your authentic likeness—not an AI-generated stranger. If it doesn't look like you, we regenerate or refund.",
    id: "tdog",
  },
  {
    q: "Do I own the photos?",
    a: "Yes! You receive full commercial usage rights for personal and business use. Use them on LinkedIn, your website, business cards, or anywhere else.",
  },
  {
    q: "How is my data handled?",
    a: "Your photos are encrypted at rest and in transit. Source photos are automatically deleted after 30 days. We never share your data with third parties.",
  },
  {
    q: "Can I request a refund?",
    a: "Absolutely. If your T-DOG Certified headshots don't look like you, we'll regenerate them for free or provide a full refund. Just contact us within 7 days of delivery.",
  },
  {
    q: "What styles are available?",
    a: "We offer industry-specific styles including Corporate, Real Estate, Tradie, Health, and Creative. Each is optimized for that profession's needs and expectations.",
  },
  {
    q: "Can I use these for official documents?",
    a: "Our headshots are designed for professional use—LinkedIn, websites, business cards, etc. For government IDs or passports, check your local requirements as AI-generated photos may not be accepted.",
  },
  {
    q: "How do I delete my data?",
    a: "Source photos are automatically deleted after 30 days. If you want immediate deletion, contact support@ethinx.solutions and we'll remove your data within 24 hours.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal. All payments are processed securely through Stripe.",
  },
  {
    q: "Can I get headshots for my team?",
    a: "Yes! Our Ultimate plan includes team discounts. Contact us for custom pricing on larger orders.",
  },
];

export default function FAQ() {
  return (
    <>
      <SEO
        title="FAQ — ETHINX"
        description="Find answers about ETHINX AI headshots: upload requirements, delivery times, T-DOG guarantee, privacy, refunds, and more."
      />
      <main className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Frequently Asked <span className="text-gradient-gold">Questions</span>
          </h1>
          <p className="text-muted-foreground">
            Everything you need to know about ETHINX headshots
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              id={faq.id}
              className="group rounded-xl border border-border bg-card overflow-hidden"
            >
              <summary className="flex items-center justify-between cursor-pointer p-5 font-medium hover:bg-secondary/50 transition-colors">
                {faq.q}
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-5 text-muted-foreground leading-relaxed">
                {faq.a}
              </div>
            </details>
          ))}
        </div>

        {/* T-DOG Badge Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card px-6 py-3">
            <img src={BRAND.TDOG} alt="T-DOG Certified" className="h-8 w-8" />
            <span className="text-sm font-medium">
              All headshots are T-DOG Certified
            </span>
          </div>
        </div>
      </main>
    </>
  );
}
