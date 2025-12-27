import TrustStrip from "@/components/TrustStrip";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="mx-auto inline-block rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">
          Trusted by professionals across corporate, tradie, real estate, and creative industries
        </p>
        <h1 className="mt-6 text-4xl md:text-6xl font-semibold">
          AI-Generated <span style={{color:"#FBBF24"}}>Professional Headshots</span> in Minutes
        </h1>
        <p className="mt-4 text-white/80 max-w-2xl mx-auto">
          Upload 5–10 photos and get studio-quality portraits optimized for LinkedIn, resumes, websites, and social—T-DOG Certified for likeness and quality.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/pricing" className="rounded-lg bg-[#FBBF24] px-5 py-3 font-medium text-black">See pricing</Link>
          <Link to="/examples" className="rounded-lg border border-white/20 px-5 py-3 font-medium text-white/90">See examples</Link>
        </div>
        <TrustStrip />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="text-2xl font-semibold mb-4">Why ETHINX</h2>
        <ul className="grid gap-4 md:grid-cols-3 text-white/80">
          <li className="rounded-xl border border-white/10 p-4">Photoreal results matched to your industry</li>
          <li className="rounded-xl border border-white/10 p-4">Fast turnaround with rush options</li>
          <li className="rounded-xl border border-white/10 p-4">Privacy-first with auto-deletion in 30 days</li>
        </ul>
      </section>
    </main>
  );
}
