import { supabase } from "@/integrations/supabase/client";
import { getCurrentPromoGroup, type PromoGroup } from "./promo-ab";

type PromoEventType = "viewed" | "dismissed" | "cta_clicked" | "ab_assigned";

interface PromoEventPayload {
  event_type: PromoEventType;
  promo_code: string;
  variant: "default" | "flash";
  page_path: string;
  session_id?: string;
  order_id?: string;
  ab_group?: string;
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
  abGroup?: PromoGroup | null,
  orderId?: string
): Promise<void> => {
  try {
    const payload: PromoEventPayload = {
      event_type: eventType,
      promo_code: promoCode,
      variant: variant,
      page_path: window.location.pathname,
      session_id: getSessionId(),
      ab_group: abGroup || getCurrentPromoGroup() || undefined,
    };

    if (orderId) {
      payload.order_id = orderId;
    }

    // Use secure edge function instead of direct DB insert
    // This provides server-side validation and rate limiting
    const { error } = await supabase.functions.invoke("track-promo", {
      body: payload,
    });

    if (error) {
      console.error("[PromoAnalytics] Failed to track event:", error.message);
    }
  } catch (err) {
    // Fail silently - analytics should not break the app
    console.error("[PromoAnalytics] Error:", err);
  }
};

// Convenience functions
export const trackImpression = (promoCode: string, variant: "default" | "flash", abGroup?: PromoGroup | null) =>
  trackPromoEvent("viewed", promoCode, variant, abGroup);

export const trackDismissed = (promoCode: string, variant: "default" | "flash", abGroup?: PromoGroup | null) =>
  trackPromoEvent("dismissed", promoCode, variant, abGroup);

export const trackCtaClicked = (promoCode: string, variant: "default" | "flash", abGroup?: PromoGroup | null) =>
  trackPromoEvent("cta_clicked", promoCode, variant, abGroup);

export const trackAbAssigned = (abGroup: PromoGroup) =>
  trackPromoEvent("ab_assigned", "", "default", abGroup);
