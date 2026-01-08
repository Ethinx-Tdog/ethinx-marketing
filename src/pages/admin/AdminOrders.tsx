import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, startOfDay, endOfDay, subDays, startOfMonth, startOfWeek } from "date-fns";
import {
  Search, 
  Filter, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Eye,
  LogOut,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  CalendarIcon,
  X,
  Download
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  order_token: string;
  email: string;
  package_name: string;
  photo_count: number;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/20" },
  paid: { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/20" },
  processing: { icon: RefreshCw, color: "text-purple-500", bg: "bg-purple-500/20" },
  completed: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/20" },
  failed: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/20" },
  refunded: { icon: RefreshCw, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "pending" | "paid" | "processing" | "completed" | "failed" | "refunded");
      }

      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }

      if (dateTo) {
        // Add 1 day to include the entire end date
        const endDate = new Date(dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt("created_at", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, dateFrom, dateTo]);

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const applyDatePreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case "today":
        setDateFrom(startOfDay(today));
        setDateTo(endOfDay(today));
        break;
      case "yesterday":
        const yesterday = subDays(today, 1);
        setDateFrom(startOfDay(yesterday));
        setDateTo(endOfDay(yesterday));
        break;
      case "last7":
        setDateFrom(startOfDay(subDays(today, 6)));
        setDateTo(endOfDay(today));
        break;
      case "last30":
        setDateFrom(startOfDay(subDays(today, 29)));
        setDateTo(endOfDay(today));
        break;
      case "thisWeek":
        setDateFrom(startOfWeek(today, { weekStartsOn: 1 }));
        setDateTo(endOfDay(today));
        break;
      case "thisMonth":
        setDateFrom(startOfMonth(today));
        setDateTo(endOfDay(today));
        break;
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      order.email.toLowerCase().includes(query) ||
      order.order_token.toLowerCase().includes(query) ||
      order.package_name?.toLowerCase().includes(query)
    );
  });

  // Calculate stats from all orders (not filtered)
  const stats = {
    total: orders.length,
    revenue: orders
      .filter((o) => o.status === "paid" || o.status === "processing" || o.status === "completed")
      .reduce((sum, o) => sum + o.amount_cents, 0),
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    failed: orders.filter((o) => o.status === "failed").length,
  };

  const [isExporting, setIsExporting] = useState(false);

  const exportCSV = async () => {
    setIsExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) {
        toast.error("Please sign in to export");
        return;
      }

      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom.toISOString());
      if (dateTo) params.set("to", dateTo.toISOString());
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("q", searchQuery);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-orders?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Orders exported successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (cents: number, currency: string) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn("gap-1", config.bg, config.color)}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{status}</span>
      </Badge>
    );
  };

  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin - Orders" description="Manage orders" />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Orders</h1>
              <p className="text-sm text-muted-foreground">
                {filteredOrders.length} orders found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Link to="/admin/promo-analytics">
              <Button variant="outline" size="sm">
                <TrendingUp className="mr-2 h-4 w-4" />
                Promo Analytics
              </Button>
            </Link>
            <Button onClick={exportCSV} variant="outline" size="sm" disabled={isExporting}>
              <Download className={cn("mr-2 h-4 w-4", isExporting && "animate-pulse")} />
              Export CSV
            </Button>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={signOut} variant="ghost" size="sm">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gold/20 p-2">
                <ShoppingCart className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-green-500">
                  {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(stats.revenue / 100)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paid / Processing</p>
                <p className="text-2xl font-bold text-blue-500">{stats.paid + stats.processing}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-500">
            <Clock className="mr-1 h-3 w-3" /> {stats.pending} Pending
          </Badge>
          <Badge variant="outline" className="bg-blue-500/20 text-blue-500">
            <CheckCircle className="mr-1 h-3 w-3" /> {stats.paid} Paid
          </Badge>
          <Badge variant="outline" className="bg-purple-500/20 text-purple-500">
            <RefreshCw className="mr-1 h-3 w-3" /> {stats.processing} Processing
          </Badge>
          <Badge variant="outline" className="bg-green-500/20 text-green-500">
            <CheckCircle className="mr-1 h-3 w-3" /> {stats.completed} Completed
          </Badge>
          {stats.failed > 0 && (
            <Badge variant="outline" className="bg-red-500/20 text-red-500">
              <XCircle className="mr-1 h-3 w-3" /> {stats.failed} Failed
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email or order token..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Date Presets & Range */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => applyDatePreset("today")}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => applyDatePreset("yesterday")}>Yesterday</Button>
              <Button variant="outline" size="sm" onClick={() => applyDatePreset("last7")}>Last 7 days</Button>
              <Button variant="outline" size="sm" onClick={() => applyDatePreset("last30")}>Last 30 days</Button>
              <Button variant="outline" size="sm" onClick={() => applyDatePreset("thisMonth")}>This month</Button>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd MMM") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">–</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd MMM") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            
            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <Package className="mx-auto mb-2 h-8 w-8" />
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-1 text-xs">
                        {order.order_token.slice(0, 8)}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{order.email}</TableCell>
                    <TableCell>
                      <span className="capitalize">{order.package_name || "—"}</span>
                      {order.photo_count > 0 && (
                        <span className="ml-1 text-muted-foreground">
                          ({order.photo_count} photos)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-gold">
                      {formatPrice(order.amount_cents, order.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
