import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check, Lock, Zap, Sparkles, CreditCard, Loader2, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/Layout";

interface CreditPack {
  id: string;
  credits: number;
  price_cents: number;
  savings: string;
  popular: boolean;
}

const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_10", credits: 10, price_cents: 1500, savings: "Save 25%", popular: false },
  { id: "pack_25", credits: 25, price_cents: 3000, savings: "Save 40%", popular: true },
  { id: "pack_100", credits: 100, price_cents: 9000, savings: "Best value", popular: false },
  { id: "pack_500", credits: 500, price_cents: 40000, savings: "Save 55%", popular: false },
];

const FAQS = [
  {
    q: "Do credits expire?",
    a: "No, credits never expire. Use them whenever you need.",
  },
  {
    q: "Can I share credits with my team?",
    a: "Yes! Credits are transferable within your organization.",
  },
  {
    q: "What if I don't use all my credits?",
    a: "Unused credits roll over indefinitely. No pressure to use them.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes, unused credits are refundable within 30 days of purchase.",
  },
];

export default function CreditStore() {
  const [selectedPack, setSelectedPack] = useState<CreditPack>(CREDIT_PACKS[1]);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setUserCredits(data.balance);
      }
    }
  };

  const handleBuyCredits = async () => {
    if (!userId) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to buy credits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: session, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          type: "credit_pack",
          credit_pack_id: selectedPack.id,
          credits: selectedPack.credits,
          amount_cents: selectedPack.price_cents,
          success_url: `${window.location.origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/credits`,
        },
      });

      if (error) throw error;
      if (!session?.url) throw new Error("No checkout URL returned");

      window.location.href = session.url;
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePricePerCredit = (pack: CreditPack) => {
    return (pack.price_cents / 100 / pack.credits).toFixed(2);
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <Layout>
      <div className="container max-w-6xl py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Buy Credits</h1>
          <p className="text-muted-foreground text-lg">
            Flexible credits that never expire. Use for any service.
          </p>
          {userId && (
            <div className="flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-muted-foreground">Current balance:</span>
              <Badge variant="secondary" className="text-lg px-3 py-1">
                {userCredits} credits
              </Badge>
              <span className="text-sm text-muted-foreground">
                ({formatPrice(userCredits * 150)} value)
              </span>
            </div>
          )}
        </div>

        {/* Credit Packs Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CREDIT_PACKS.map((pack) => {
            const isSelected = selectedPack.id === pack.id;

            return (
              <Card
                key={pack.id}
                className={cn(
                  "relative cursor-pointer transition-all hover:shadow-lg",
                  isSelected && "ring-2 ring-primary shadow-lg",
                  pack.popular && "border-primary"
                )}
                onClick={() => setSelectedPack(pack)}
              >
                {pack.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-2 pt-6">
                  <div className="space-y-1">
                    <span className="text-5xl font-bold">{pack.credits}</span>
                    <p className="text-muted-foreground text-sm">credits</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{formatPrice(pack.price_cents)}</div>
                    <div className="text-xs text-muted-foreground">
                      ${calculatePricePerCredit(pack)} per credit
                    </div>
                  </div>

                  {pack.savings && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {pack.savings}
                    </Badge>
                  )}

                  <ul className="text-sm text-left space-y-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Use for any service
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Never expire
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Transferable
                    </li>
                  </ul>

                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPack(pack);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check className="h-4 w-4 mr-1" /> Selected
                      </>
                    ) : (
                      "Select"
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Checkout Section */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>{selectedPack.credits} Credits</span>
                  <span>{formatPrice(selectedPack.price_cents)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Price per credit</span>
                  <span>${calculatePricePerCredit(selectedPack)}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatPrice(selectedPack.price_cents)}</span>
              </div>

              <Button className="w-full" size="lg" onClick={handleBuyCredits} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Buy ${selectedPack.credits} Credits`
                )}
              </Button>

              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Secure payment with Stripe
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Instant credit delivery
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enterprise CTA */}
          <Card className="bg-muted/50">
            <CardContent className="flex flex-col justify-center h-full py-8 text-center space-y-4">
              <h3 className="text-xl font-semibold">Need more than 500 credits?</h3>
              <p className="text-muted-foreground">
                Contact us for enterprise pricing and custom plans.
              </p>
              <Button variant="outline" onClick={() => (window.location.href = "/contact")}>
                <Mail className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="max-w-2xl mx-auto">
            {FAQS.map((faq, idx) => (
              <AccordionItem key={idx} value={`faq-${idx}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Layout>
  );
}
