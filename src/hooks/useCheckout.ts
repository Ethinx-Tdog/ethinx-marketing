import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentPromoGroup } from "@/lib/promo-ab";
import type { PackageId, UpsellId } from "@/lib/pricing-config";

interface CheckoutParams {
  packageId: PackageId;
  upsellIds?: UpsellId[];
  email: string;
  photoFiles?: string[];
}

interface CheckoutResult {
  url: string;
  sessionId: string;
  orderToken: string;
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = async (params: CheckoutParams): Promise<CheckoutResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Gather promo metadata
      const promoGroup = getCurrentPromoGroup();
      const promoVariant = promoGroup === "banner_flash" ? "flash" : promoGroup === "banner_default" ? "default" : null;
      const sourcePage = window.location.pathname;

      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: {
          email: params.email,
          package_name: params.packageId,
          upsell_ids: params.upsellIds || [],
          photo_files: params.photoFiles || [],
          promo_code: promoVariant,
          source_page: sourcePage,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || "Failed to create checkout session");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.url) {
        throw new Error("No checkout URL returned");
      }

      return {
        url: data.url,
        sessionId: data.sessionId,
        orderToken: data.orderToken,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToCheckout = async (params: CheckoutParams): Promise<void> => {
    const result = await createCheckout(params);
    if (result?.url) {
      window.open(result.url, "_blank");
    }
  };

  return {
    createCheckout,
    redirectToCheckout,
    isLoading,
    error,
  };
}
