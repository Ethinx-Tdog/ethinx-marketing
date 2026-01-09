import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  LogOut,
  User,
  Calendar,
  Coins,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface CreditSummary {
  balance: number;
  total_earned: number;
  total_spent: number;
  last_transaction: string | null;
  monthly_usage: {
    this_month: number;
    last_month: number;
  };
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  price_cents: number;
  interval: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface Order {
  id: string;
  order_token: string;
  status: string;
  amount_cents: number;
  package_name: string | null;
  created_at: string;
  paid_at: string | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pending: { icon: Clock, color: "text-yellow-500" },
  paid: { icon: CheckCircle, color: "text-blue-500" },
  processing: { icon: RefreshCw, color: "text-purple-500" },
  completed: { icon: CheckCircle, color: "text-green-500" },
  failed: { icon: XCircle, color: "text-red-500" },
  refunded: { icon: AlertCircle, color: "text-orange-500" },
};

export default function AccountDashboard() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [creditSummary, setCreditSummary] = useState<CreditSummary | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load credit summary
      const { data: credits } = await supabase
        .from("user_credits")
        .select("balance, total_earned, total_spent, last_top_up")
        .eq("user_id", user.id)
        .single();

      if (credits) {
        setCreditSummary({
          balance: credits.balance || 0,
          total_earned: credits.total_earned || 0,
          total_spent: credits.total_spent || 0,
          last_transaction: credits.last_top_up,
          monthly_usage: { this_month: 0, last_month: 0 },
        });
      } else {
        setCreditSummary({
          balance: 0,
          total_earned: 0,
          total_spent: 0,
          last_transaction: null,
          monthly_usage: { this_month: 0, last_month: 0 },
        });
      }

      // Load transactions
      const { data: txns } = await supabase
        .from("credit_transactions")
        .select("id, amount, type, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setTransactions((txns as CreditTransaction[]) || []);

      // Load subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, plan_name, status, price_cents, interval, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      setSubscription(sub as Subscription | null);

      // Load orders
      const { data: userOrders } = await supabase
        .from("orders")
        .select("id, order_token, status, amount_cents, package_name, created_at, paid_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setOrders((userOrders as Order[]) || []);
    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast({
        title: "Error loading data",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "MMM d, yyyy");
    } catch {
      return date;
    }
  };

  const formatDateTime = (date: string) => {
    try {
      return format(new Date(date), "MMM d, yyyy h:mm a");
    } catch {
      return date;
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container max-w-6xl py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="container max-w-6xl py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{creditSummary?.balance || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatPrice((creditSummary?.balance || 0) * 150)} value
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{creditSummary?.total_earned || 0}</div>
                  <p className="text-xs text-muted-foreground">credits purchased + bonus</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{creditSummary?.total_spent || 0}</div>
                  <p className="text-xs text-muted-foreground">credits used</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground">total orders</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Banner */}
        {subscription && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-primary/10 rounded-full">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{subscription.plan_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(subscription.price_cents)}/{subscription.interval}
                    {subscription.cancel_at_period_end && " • Cancels at period end"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                  {subscription.status}
                </Badge>
                {subscription.current_period_end && (
                  <span className="text-sm text-muted-foreground">
                    Renews {formatDate(subscription.current_period_end)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!subscription && !loading && (
          <Card className="bg-muted/50">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div>
                <h3 className="font-semibold">No Active Subscription</h3>
                <p className="text-sm text-muted-foreground">
                  Subscribe for monthly credits and priority features
                </p>
              </div>
              <Button onClick={() => navigate("/pricing")}>
                <Plus className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Transactions and Orders */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Credit History</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Transactions</h2>
              <Button variant="outline" size="sm" onClick={() => navigate("/credits")}>
                <Plus className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No transactions yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Purchase credits to get started
                  </p>
                  <Button onClick={() => navigate("/credits")}>Buy Credits</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-muted-foreground">
                          {formatDateTime(tx.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{tx.description || "-"}</TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            tx.amount > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {tx.amount > 0 ? "+" : ""}
                          {tx.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Order History</h2>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No orders yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your order history will appear here
                  </p>
                  <Button onClick={() => navigate("/pricing")}>Browse Services</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                      const StatusIcon = statusConfig.icon;

                      return (
                        <TableRow key={order.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(order.created_at)}
                          </TableCell>
                          <TableCell className="font-medium capitalize">
                            {order.package_name?.replace(/_/g, " ") || "Order"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
                              <span className="capitalize">{order.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(order.amount_cents)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/order-status?token=${order.order_token}`)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
