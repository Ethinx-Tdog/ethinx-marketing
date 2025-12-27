export default function Index() {
  return (
    <section className="text-center">
      <p className="mx-auto inline-block rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">
        T-DOG Certified • 30-day access • Secure
      </p>
      <h1 className="mt-6 text-4xl md:text-5xl font-semibold">
        AI-Generated <span style={{color:"#FBBF24"}}>Professional Headshots</span>
      </h1>
      <p className="mt-4 text-white/80">Studio-quality photos in minutes — verified likeness, privacy-first.</p>
      <div className="mt-8 flex justify-center gap-3">
        <a href="/examples" className="rounded-lg border border-white/20 px-5 py-2 font-medium text-white/90">See examples</a>
        <a href="/pricing" className="rounded-lg bg-[#FBBF24] px-5 py-2 font-medium text-black">View pricing</a>
      </div>
    </section>
  );
}
