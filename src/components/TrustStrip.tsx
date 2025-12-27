import { BRAND } from "@/lib/brand";
import { Shield, Clock } from "lucide-react";

export default function TrustStrip() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4">
        <img src={BRAND.TDOG} alt="T-DOG Certified badge" className="h-10 w-auto" />
        <div>
          <div className="font-medium text-foreground">T-DOG Certified</div>
          <div className="text-xs text-muted-foreground">Verified likeness or money back</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-medium text-foreground">Secure Payments</div>
          <div className="text-xs text-muted-foreground">256-bit SSL encryption</div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="font-medium text-foreground">30-Day Access</div>
          <div className="text-xs text-muted-foreground">Download anytime within 30 days</div>
        </div>
      </div>
    </div>
  );
}
