import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface PricingSelectorProps {
  onSelectPlan: (plan: PricingPlan) => void;
  currentPlan?: PricingPlan | null;
}

export default function PricingSelector({ onSelectPlan, currentPlan = null }: PricingSelectorProps) {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(currentPlan);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order");

    if (!error && data) {
      const parsed = data.map((plan) => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || "[]"),
      })) as PricingPlan[];
      
      setPlans(parsed);
      
      if (parsed.length > 0 && !selectedPlan) {
        const proPlan = parsed.find((p) => p.id.includes("pro_")) || parsed[1];
        if (proPlan) {
          setSelectedPlan(proPlan);
          onSelectPlan(proPlan);
        }
      }
    }
    setLoading(false);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const getPlanInterval = (interval: string | null) => {
    switch (interval) {
      case "month":
        return "/mo";
      case "year":
        return "/yr";
      default:
        return "";
    }
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    onSelectPlan(plan);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading plans...</span>
      </div>
    );
  }

  const oneTimePlans = plans.filter((p) => p.interval === "one_time");
  const subscriptionPlans = plans.filter((p) => p.interval !== "one_time");

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Plan</h2>
        <p className="text-muted-foreground">Select the perfect plan for your needs</p>
      </div>

      {/* One-time Plans */}
      {oneTimePlans.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">One-Time Purchase</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {oneTimePlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const isFeatured = plan.id.includes("pro_");

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative cursor-pointer transition-all hover:shadow-lg",
                    isSelected && "ring-2 ring-primary shadow-lg",
                    isFeatured && "border-primary"
                  )}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isFeatured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">{formatPrice(plan.price_cents)}</span>
                      <span className="text-muted-foreground text-sm"> one-time</span>
                    </div>
                    {plan.credits_included > 0 && (
                      <CardDescription className="mt-1">
                        {plan.credits_included} credit{plan.credits_included > 1 ? "s" : ""} included
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4 mr-1" /> Selected
                        </>
                      ) : (
                        "Select Plan"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      {subscriptionPlans.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Subscriptions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {subscriptionPlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const isFeatured = plan.id.includes("pro_") || plan.id.includes("annual");

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative cursor-pointer transition-all hover:shadow-lg",
                    isSelected && "ring-2 ring-primary shadow-lg",
                    isFeatured && "border-primary"
                  )}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isFeatured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {plan.interval === "year" ? "Best Value" : "Popular"}
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-4xl font-bold">{formatPrice(plan.price_cents)}</span>
                      <span className="text-muted-foreground text-sm">{getPlanInterval(plan.interval)}</span>
                    </div>
                    {plan.credits_included > 0 && (
                      <CardDescription className="mt-1">
                        {plan.credits_included} credits{plan.interval === "year" ? "/year" : "/month"}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4 mr-1" /> Selected
                        </>
                      ) : (
                        "Select Plan"
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Credit Packs CTA */}
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
          <div>
            <h4 className="font-semibold">Need more flexibility?</h4>
            <p className="text-sm text-muted-foreground">Buy credit packs and use as needed</p>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/credits")}>
            View Credit Packs →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
