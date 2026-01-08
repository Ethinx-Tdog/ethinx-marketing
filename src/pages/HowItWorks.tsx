import PromoBanner from "@/components/PromoBanner";

export default function HowItWorks() {
  const steps = [
    { n: 1, t: "Upload 5–10 photos", d: "Different angles, good lighting, clear face." },
    { n: 2, t: "Pick your style & plan", d: "Corporate, Real Estate, Tradie, Health, Creative." },
    { n: 3, t: "We generate & QC", d: "AI + automated checks; T-DOG Certification for likeness." },
    { n: 4, t: "Delivery & download", d: "Email + portal access for 30 days." }
  ];
  return (
    <>
      <PromoBanner />
      <main className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl md:text-4xl font-semibold mb-6">How it works</h1>
      <ol className="grid gap-4 md:grid-cols-4">
        {steps.map(s => (
          <li key={s.n} className="rounded-xl border border-white/10 p-4">
            <div className="text-[#FBBF24] font-semibold">{s.n}</div>
            <div className="font-medium">{s.t}</div>
            <div className="text-white/70 text-sm">{s.d}</div>
          </li>
        ))}
      </ol>
      </main>
    </>
  );
}
