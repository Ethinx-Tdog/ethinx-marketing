import { BRAND } from "@/lib/brand";

export default function TrustStrip() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <img src={BRAND.TDOG} alt="T-DOG Certified badge" className="h-10 w-auto" />
        <div>
          <div className="font-medium">T-DOG Certified</div>
          <div className="text-xs text-white/70">QC-checked photoreal likeness. Regenerate or refund if not you.</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="h-10 w-10 rounded-full border border-white/15" />
        <div>
          <div className="font-medium">Privacy-first</div>
          <div className="text-xs text-white/70">End-to-end encryption. Auto-delete source photos in 30 days.</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="h-10 w-10 rounded-full border border-white/15" />
        <div>
          <div className="font-medium">Fast delivery</div>
          <div className="text-xs text-white/70">From 6–24 hours depending on plan.</div>
        </div>
      </div>
    </div>
  );
}