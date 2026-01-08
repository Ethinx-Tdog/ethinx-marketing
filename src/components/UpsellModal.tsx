import { useState } from "react";
import { Check, Sparkles, Loader2, Tag, X, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePricing } from "@/contexts/PricingContext";
import { getIndustryUpsell, getPackageById, UPSELLS } from "@/lib/pricing-config";
import { cn } from "@/lib/utils";
import { useCheckout } from "@/hooks/useCheckout";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PromoValidation {
  valid: boolean;
  promoCodeId?: string;
  code?: string;
  discountLabel?: string;
  discountPercent?: number | null;
  discountAmountCents?: number | null;
  message?: string;
}

export function UpsellModal() {
  const {
    isUpsellModalOpen,
    closeUpsellModal,
    industry,
    selectedPackage,
    selectedUpsells,
    toggleUpsell,
    totalPrice,
  } = usePricing();

  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoValidation | null>(null);
  const { redirectToCheckout, isLoading, error } = useCheckout();

  const pkg = selectedPackage ? getPackageById(selectedPackage) : null;
  const industryUpsell = getIndustryUpsell(industry);
  const addons = UPSELLS.filter((u) => u.isAddon);

  if (!pkg) return null;

  // Calculate discounted price
  const calculateDiscountedPrice = () => {
    if (!appliedPromo?.valid) return totalPrice;
    
    if (appliedPromo.discountPercent) {
      return Math.round(totalPrice * (1 - appliedPromo.discountPercent / 100));
    }
    if (appliedPromo.discountAmountCents) {
      return Math.max(0, totalPrice - appliedPromo.discountAmountCents / 100);
    }
    return totalPrice;
  };

  const discountedPrice = calculateDiscountedPrice();
  const hasDiscount = appliedPromo?.valid && discountedPrice < totalPrice;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error("Please enter a promo code");
      return;
    }

    setPromoLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("validate-promo", {
        body: { promoCode: promoCode.trim() },
      });

      if (fnError) {
        toast.error("Failed to validate promo code");
        return;
      }

      if (data?.valid) {
        setAppliedPromo(data);
        toast.success(`Promo applied: ${data.discountLabel}`);
      } else {
        toast.error(data?.message || "Invalid promo code");
        setAppliedPromo(null);
      }
    } catch (err) {
      toast.error("Failed to validate promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const handleCheckout = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    await redirectToCheckout({
      packageId: pkg.id,
      upsellIds: selectedUpsells,
      email,
    });

    if (error) {
      toast.error(error);
    }
  };

  return (
    <Dialog open={isUpsellModalOpen} onOpenChange={(open) => !open && closeUpsellModal()}>
      <DialogContent className="max-w-lg border-gold/30 bg-charcoal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <Sparkles className="h-5 w-5 text-gold" />
            Power Up Your {pkg.name} Pack
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected package summary */}
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4">
            <div>
              <p className="font-medium text-foreground">{pkg.name} Package</p>
              <p className="text-sm text-muted-foreground">
                {pkg.photos} photos • {pkg.outfits} outfits
              </p>
            </div>
            <span className="text-lg font-bold text-gold">${pkg.price}</span>
          </div>

          {/* Industry-specific upsell (highlighted) */}
          {industryUpsell && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gold">
                Recommended for You
              </p>
              <button
                onClick={() => toggleUpsell(industryUpsell.id)}
                className={cn(
                  "w-full rounded-lg border-2 p-4 text-left transition-all",
                  selectedUpsells.includes(industryUpsell.id)
                    ? "border-gold bg-gold/10"
                    : "border-border/50 bg-card hover:border-gold/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-gold/20 p-2">
                      <industryUpsell.icon className="h-5 w-5 text-gold" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{industryUpsell.name}</p>
                      <p className="text-sm text-muted-foreground">{industryUpsell.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gold">+${industryUpsell.price}</span>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                        selectedUpsells.includes(industryUpsell.id)
                          ? "border-gold bg-gold text-charcoal"
                          : "border-muted-foreground"
                      )}
                    >
                      {selectedUpsells.includes(industryUpsell.id) && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Generic add-ons */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Add-ons
            </p>
            <div className="grid gap-2">
              {addons.map((addon) => (
                <button
                  key={addon.id}
                  onClick={() => toggleUpsell(addon.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-left transition-all",
                    selectedUpsells.includes(addon.id)
                      ? "border-gold/50 bg-gold/5"
                      : "border-border/50 bg-card hover:border-gold/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <addon.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{addon.name}</p>
                      <p className="text-xs text-muted-foreground">{addon.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gold">+${addon.price}</span>
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        selectedUpsells.includes(addon.id)
                          ? "border-gold bg-gold text-charcoal"
                          : "border-muted-foreground"
                      )}
                    >
                      {selectedUpsells.includes(addon.id) && <Check className="h-2.5 w-2.5" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Promo code input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Promo Code
            </label>
            {appliedPromo?.valid ? (
              <div className="flex items-center justify-between rounded-lg border border-green-500/50 bg-green-500/10 p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-400">
                    {appliedPromo.code} — {appliedPromo.discountLabel}
                  </span>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter code (e.g. WELCOME10)"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  className="bg-card border-border/50 uppercase"
                  disabled={promoLoading}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="shrink-0"
                >
                  {promoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <label htmlFor="checkout-email" className="text-sm font-medium text-foreground">
              Email for delivery
            </label>
            <Input
              id="checkout-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border/50"
            />
          </div>
        </div>

        {/* Footer with total and CTA */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <div className="flex items-baseline gap-2">
              {hasDiscount ? (
                <>
                  <p className="text-2xl font-bold text-gold">${discountedPrice} AUD</p>
                  <p className="text-lg text-muted-foreground line-through">${totalPrice}</p>
                </>
              ) : (
                <p className="text-2xl font-bold text-gold">${totalPrice} AUD</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeUpsellModal} disabled={isLoading}>
              Skip
            </Button>
            <Button variant="gold" onClick={handleCheckout} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Checkout"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UpsellModal;
