import { Check, X, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePricing } from "@/contexts/PricingContext";
import { getUpsellsForIndustry, getIndustryUpsell, getPackageById, UPSELLS } from "@/lib/pricing-config";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

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

  const pkg = selectedPackage ? getPackageById(selectedPackage) : null;
  const industryUpsell = getIndustryUpsell(industry);
  const addons = UPSELLS.filter((u) => u.isAddon);

  if (!pkg) return null;

  const handleCheckout = () => {
    const upsellParams = selectedUpsells.length > 0 ? `&upsells=${selectedUpsells.join(",")}` : "";
    window.location.href = `https://app.ethinx.solutions/start?plan=${pkg.id}&industry=${industry}${upsellParams}`;
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
        </div>

        {/* Footer with total and CTA */}
        <div className="flex items-center justify-between border-t border-border/50 pt-4">
          <div>
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-gold">${totalPrice} AUD</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={closeUpsellModal}>
              Skip
            </Button>
            <Button variant="gold" onClick={handleCheckout}>
              Continue to Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UpsellModal;
