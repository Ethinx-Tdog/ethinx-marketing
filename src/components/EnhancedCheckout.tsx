import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import PricingSelector from "./PricingSelector";
import AddOnSelector, { type AddOn } from "./AddOnSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Lock, Loader2, CreditCard, ShieldCheck, Zap, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PricingPlan {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  interval: "one_time" | "month" | "year" | null;
  credits_included: number;
  features: string[];
  is_active: boolean;
  display_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface EnhancedCheckoutProps {
  userId?: string | null;
  initialOrderData?: Record<string, unknown>;
}

const ADD_ONS: AddOn[] = [
  { id: "priority", name: "Priority Processing", description: "Jump to front of queue", price_cents: 999 },
  { id: "detailed_report", name: "Detailed Analysis", description: "In-depth insights + recommendations", price_cents: 1499 },
  { id: "export", name: "Excel Export", description: "Downloadable spreadsheet", price_cents: 499 },
  { id: "api_access", name: "API Access", description: "Programmatic access for 24h", price_cents: 2999 },
];

export default function EnhancedCheckout({ userId, initialOrderData }: EnhancedCheckoutProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [userCredits, setUserCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadUserCredits();
    }
  }, [userId]);

  const loadUserCredits = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .single();

    if (data) {
      setUserCredits(data.balance);
    }
  };

  const calculateTotal = () => {
    let total = selectedPlan ? selectedPlan.price_cents : 0;
    selectedAddOns.forEach((addOn) => {
      total += addOn.price_cents;
    });
    return total;
  };

  const handleCheckout = async () => {
    if (!selectedPlan) {
      toast({ title: "Please select a plan", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const totalCents = calculateTotal();
      const creditsNeeded = Math.ceil(totalCents / 100);

      const orderData: Record<string, unknown> = {
        user_id: userId,
        plan_id: selectedPlan.id,
        amount_cents: totalCents,
        metadata: {
          add_ons: selectedAddOns.map((a) => ({ id: a.id, name: a.name })),
          use_credits: useCredits,
          credits_available: userCredits,
        },
      };

      // If paying fully with credits - use secure edge function
      if (useCredits && userCredits >= creditsNeeded && totalCents > 0) {
        // Get user email from auth session
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email;

        if (!userEmail) {
          throw new Error("Please log in to use credits");
        }

        // Call secure edge function instead of direct DB insert
        const { data: creditOrderResult, error: creditOrderError } = await supabase.functions.invoke(
          "create-credit-order",
          {
            body: {
              plan_id: selectedPlan.id,
              add_on_ids: selectedAddOns.map((a) => a.id),
              email: userEmail,
            },
          }
        );

        if (creditOrderError) {
          throw new Error(creditOrderError.message || "Failed to create order");
        }

        if (!creditOrderResult?.success) {
          throw new Error(creditOrderResult?.error || "Order creation failed");
        }

        toast({ 
          title: "Order completed!", 
          description: `Used ${creditOrderResult.credits_used} credits. ${creditOrderResult.remaining_credits} remaining.` 
        });
        window.location.href = `/order/${creditOrderResult.order_token}`;
        return;
      }

      // Stripe checkout
      const { data: session, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          order_data: orderData,
          plan_id: selectedPlan.id,
          add_on_ids: selectedAddOns.map((a) => a.id),
        },
      });

      if (error) throw error;
      if (!session?.url) throw new Error("No checkout URL returned");

      window.location.href = session.url;
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalCents = calculateTotal();
  const canUseCredits = userCredits > 0 && totalCents > 0;
  const creditsNeeded = Math.ceil(totalCents / 100);
  const hasEnoughCredits = userCredits >= creditsNeeded;

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        {userId && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Your credits:</span>
            <Badge variant="secondary" className="font-semibold">
              {userCredits}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/credits")}>
              Buy more
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Plan & Add-ons */}
        <div className="lg:col-span-2 space-y-8">
          <PricingSelector onSelectPlan={setSelectedPlan} currentPlan={selectedPlan} />

          <Separator />

          <AddOnSelector addOns={ADD_ONS} selectedAddOns={selectedAddOns} onSelectAddOns={setSelectedAddOns} />

          {/* Credit Payment Option */}
          {canUseCredits && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="use-credits"
                    checked={useCredits}
                    onCheckedChange={(checked) => setUseCredits(checked === true)}
                    disabled={!hasEnoughCredits}
                  />
                  <label htmlFor="use-credits" className="font-medium cursor-pointer">
                    Pay with credits
                  </label>
                </div>
                <p className="text-sm text-muted-foreground pl-6">
                  Use {creditsNeeded} of your {userCredits} credits
                  {useCredits && hasEnoughCredits && ` (${userCredits - creditsNeeded} remaining)`}
                </p>
                {!hasEnoughCredits && (
                  <p className="text-sm text-destructive pl-6">
                    You need {creditsNeeded - userCredits} more credits
                  </p>
                )}
                {useCredits && hasEnoughCredits && (
                  <p className="text-sm font-semibold text-primary pl-6">
                    Savings: {formatPrice(totalCents)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-4">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Line items */}
              <div className="space-y-2">
                {selectedPlan && (
                  <div className="flex justify-between text-sm">
                    <span>{selectedPlan.name}</span>
                    <span>{formatPrice(selectedPlan.price_cents)}</span>
                  </div>
                )}
                {selectedAddOns.map((addOn) => (
                  <div key={addOn.id} className="flex justify-between text-sm text-muted-foreground">
                    <span>+ {addOn.name}</span>
                    <span>{formatPrice(addOn.price_cents)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <div className="text-right">
                  {useCredits && hasEnoughCredits && totalCents > 0 ? (
                    <>
                      <span className="line-through text-muted-foreground text-sm mr-2">
                        {formatPrice(totalCents)}
                      </span>
                      <span className="text-primary">FREE</span>
                    </>
                  ) : (
                    <span>{formatPrice(totalCents)}</span>
                  )}
                </div>
              </div>

              {/* Checkout Button */}
              <Button className="w-full" size="lg" onClick={handleCheckout} disabled={!selectedPlan || loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : useCredits && hasEnoughCredits ? (
                  "Complete with Credits"
                ) : (
                  "Proceed to Payment"
                )}
              </Button>

              {/* Secure checkout */}
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </CardContent>
          </Card>

          {/* Value Props */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">30-day money-back guarantee</p>
                <p className="text-muted-foreground text-xs">If not satisfied, get a full refund</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Zap className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Priority support</p>
                <p className="text-muted-foreground text-xs">Get help within 4 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <RefreshCw className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-medium">Flexible credits</p>
                <p className="text-muted-foreground text-xs">Unused credits roll over monthly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
