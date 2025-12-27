export default function FAQ() {
  const faqs = [
    { q: "What photos should I upload?", a: "5–10 clear selfies or photos with your face visible, different angles, good lighting." },
    { q: "How long does it take?", a: "6–24 hours depending on plan. Rush options available." },
    { q: "What is T-DOG Certified?", a: "Our quality standard—photoreal likeness verified. If it doesn't look like you, we regenerate or refund." },
    { q: "Do I own the photos?", a: "Yes. You get full usage rights for personal/business use." },
    { q: "How is my data handled?", a: "Encrypted at rest and in transit. Source photos auto-delete after 30 days." }
  ];
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold mb-6">Frequently Asked Questions</h1>
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <details key={i} className="rounded-xl border border-white/10 p-4">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-white/80">{f.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
