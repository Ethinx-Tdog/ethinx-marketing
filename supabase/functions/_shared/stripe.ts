import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";
import { env } from "./env.ts";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});
