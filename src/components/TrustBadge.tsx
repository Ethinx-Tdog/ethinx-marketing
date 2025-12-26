import { Shield, Lock, Download } from "lucide-react";

interface TrustBadgeProps {
  variant?: "tdog" | "secure" | "download";
  className?: string;
}

export function TrustBadge({ variant = "tdog", className = "" }: TrustBadgeProps) {
  if (variant === "tdog") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src="/brand/t-dog-certified.png"
          alt="T-DOG Certified"
          className="h-10 w-10 object-contain"
        />
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">T-DOG Certified</p>
          <p className="text-xs text-muted-foreground">
            QC-checked photoreal results. If it doesn't look like you, we regenerate or refund.
          </p>
        </div>
      </div>
    );
  }

  if (variant === "secure") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">Secure Payments</p>
          <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
        <Download className="h-5 w-5 text-primary" />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold text-foreground">30-Day Access</p>
        <p className="text-xs text-muted-foreground">Download anytime</p>
      </div>
    </div>
  );
}

export function TrustStrip() {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-6 md:gap-12 py-8 px-4 bg-secondary/30 rounded-2xl border border-border">
      <TrustBadge variant="tdog" />
      <div className="hidden md:block w-px h-12 bg-border" />
      <TrustBadge variant="secure" />
      <div className="hidden md:block w-px h-12 bg-border" />
      <TrustBadge variant="download" />
    </div>
  );
}
