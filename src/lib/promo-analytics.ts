import { supabase } from "@/integrations/supabase/client";

type PromoEventType = "promo_banner_impression" | "promo_banner_dismissed" | "promo_banner_cta_clicked";

interface PromoEventPayload {
  event_type: PromoEventType;
  promo_code: string;
  variant: "default" | "flash";
  page_path: string;
  session_id?: string;
  order_id?: string;
}

// Generate or retrieve a session ID for correlating events
const getSessionId = (): string => {
  const key = "promo_session_id";
  let sessionId = sessionStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(key, sessionId);
  }
  return sessionId;
};

export const trackPromoEvent = async (
  eventType: PromoEventType,
  promoCode: string,
  variant: "default" | "flash",
  orderId?: string
): Promise<void> => {
  try {
    const payload: PromoEventPayload = {
      event_type: eventType,
      promo_code: promoCode,
      variant: variant,
      page_path: window.location.pathname,
      session_id: getSessionId(),
    };

    if (orderId) {
      payload.order_id = orderId;
    }

    const { error } = await supabase.from("promo_events").insert(payload);

    if (error) {
      console.error("[PromoAnalytics] Failed to track event:", error.message);
    }
  } catch (err) {
    // Fail silently - analytics should not break the app
    console.error("[PromoAnalytics] Error:", err);
  }
};

// Convenience functions
export const trackImpression = (promoCode: string, variant: "default" | "flash") =>
  trackPromoEvent("promo_banner_impression", promoCode, variant);

export const trackDismissed = (promoCode: string, variant: "default" | "flash") =>
  trackPromoEvent("promo_banner_dismissed", promoCode, variant);

export const trackCtaClicked = (promoCode: string, variant: "default" | "flash") =>
  trackPromoEvent("promo_banner_cta_clicked", promoCode, variant);
