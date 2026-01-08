import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
  ArrowLeft,
  RefreshCw,
  LogOut,
  Eye,
  XCircle,
  ShoppingCart,
  TrendingUp,
  Tag,
  BarChart3,
  CalendarIcon,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

interface PromoEvent {
  id: string;
  event_type: string;
  promo_code: string;
  variant: string;
  page_path: string;
  session_id: string | null;
  ab_group: string | null;
  order_id: string | null;
  created_at: string;
}

interface PromoStats {
  code: string;
  views: number;
  dismissed: number;
  ctaClicks: number;
  conversions: number;
  viewToClickRate: number;
  clickToConversionRate: number;
  overallConversionRate: number;
}

interface ABStats {
  group: string;
  views: number;
  dismissed: number;
  conversions: number;
  conversionRate: number;
}

export default function AdminPromoAnalytics() {
  const [events, setEvents] = useState<PromoEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(subDays(new Date(), 7));
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const { signOut, user } = useAuth();

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("promo_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("created_at", startOfDay(dateFrom).toISOString());
      }

      if (dateTo) {
        query = query.lte("created_at", endOfDay(dateTo).toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents((data as PromoEvent[]) || []);
    } catch (err) {
      console.error("Failed to fetch promo events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [dateFrom, dateTo]);

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
      case "last7":
        setDateFrom(startOfDay(subDays(today, 6)));
        setDateTo(endOfDay(today));
        break;
      case "last30":
        setDateFrom(startOfDay(subDays(today, 29)));
        setDateTo(endOfDay(today));
        break;
    }
  };

  // Calculate promo code stats
  const promoStats: PromoStats[] = (() => {
    const codeMap = new Map<string, { views: number; dismissed: number; ctaClicks: number; conversions: number }>();

    events.forEach((e) => {
      if (!e.promo_code) return;
      const code = e.promo_code;
      if (!codeMap.has(code)) {
        codeMap.set(code, { views: 0, dismissed: 0, ctaClicks: 0, conversions: 0 });
      }
      const stats = codeMap.get(code)!;
      
      switch (e.event_type) {
        case "viewed":
          stats.views++;
          break;
        case "dismissed":
          stats.dismissed++;
          break;
        case "cta_clicked":
          stats.ctaClicks++;
          break;
        case "coupon_used":
          stats.conversions++;
          break;
      }
    });

    return Array.from(codeMap.entries()).map(([code, s]) => ({
      code,
      views: s.views,
      dismissed: s.dismissed,
      ctaClicks: s.ctaClicks,
      conversions: s.conversions,
      viewToClickRate: s.views > 0 ? (s.ctaClicks / s.views) * 100 : 0,
      clickToConversionRate: s.ctaClicks > 0 ? (s.conversions / s.ctaClicks) * 100 : 0,
      overallConversionRate: s.views > 0 ? (s.conversions / s.views) * 100 : 0,
    }));
  })();

  // Calculate A/B group stats
  const abStats: ABStats[] = (() => {
    const groupMap = new Map<string, { views: number; dismissed: number; conversions: number }>();

    events.forEach((e) => {
      const group = e.ab_group || "unknown";
      if (!groupMap.has(group)) {
        groupMap.set(group, { views: 0, dismissed: 0, conversions: 0 });
      }
      const stats = groupMap.get(group)!;
      
      switch (e.event_type) {
        case "viewed":
          stats.views++;
          break;
        case "dismissed":
          stats.dismissed++;
          break;
        case "coupon_used":
          stats.conversions++;
          break;
      }
    });

    return Array.from(groupMap.entries()).map(([group, s]) => ({
      group,
      views: s.views,
      dismissed: s.dismissed,
      conversions: s.conversions,
      conversionRate: s.views > 0 ? (s.conversions / s.views) * 100 : 0,
    }));
  })();

  // Overall stats
  const totalViews = events.filter((e) => e.event_type === "viewed").length;
  const totalDismissed = events.filter((e) => e.event_type === "dismissed").length;
  const totalCtaClicks = events.filter((e) => e.event_type === "cta_clicked").length;
  const totalConversions = events.filter((e) => e.event_type === "coupon_used").length;
  const overallConversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;
  const dismissRate = totalViews > 0 ? (totalDismissed / totalViews) * 100 : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const EventBadge = ({ type }: { type: string }) => {
    const config: Record<string, { color: string; bg: string }> = {
      viewed: { color: "text-blue-500", bg: "bg-blue-500/20" },
      dismissed: { color: "text-yellow-500", bg: "bg-yellow-500/20" },
      cta_clicked: { color: "text-purple-500", bg: "bg-purple-500/20" },
      coupon_used: { color: "text-green-500", bg: "bg-green-500/20" },
      ab_assigned: { color: "text-muted-foreground", bg: "bg-muted" },
    };
    const c = config[type] || config.ab_assigned;
    return (
      <Badge variant="outline" className={cn("gap-1", c.bg, c.color)}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin - Promo Analytics" description="Promo code performance metrics" />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Promo Analytics</h1>
              <p className="text-sm text-muted-foreground">
                {events.length} events in selected period
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Button onClick={fetchEvents} variant="outline" size="sm">
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
        {/* Date Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => applyDatePreset("today")}>Today</Button>
            <Button variant="outline" size="sm" onClick={() => applyDatePreset("last7")}>Last 7 days</Button>
            <Button variant="outline" size="sm" onClick={() => applyDatePreset("last30")}>Last 30 days</Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "dd MMM") : "From"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
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
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>

          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Overview Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/20 p-2">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-2xl font-bold text-foreground">{totalViews}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/20 p-2">
                <XCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dismissed</p>
                <p className="text-2xl font-bold text-foreground">{totalDismissed}</p>
                <p className="text-xs text-muted-foreground">{dismissRate.toFixed(1)}% rate</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/20 p-2">
                <Tag className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CTA Clicks</p>
                <p className="text-2xl font-bold text-foreground">{totalCtaClicks}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <ShoppingCart className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold text-green-500">{totalConversions}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gold/20 p-2">
                <TrendingUp className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold text-gold">{overallConversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Code Performance */}
        <div className="mb-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <BarChart3 className="h-5 w-5 text-gold" />
            Promo Code Performance
          </h2>
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Dismissed</TableHead>
                  <TableHead className="text-right">CTA Clicks</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">View → Click</TableHead>
                  <TableHead className="text-right">Click → Conv</TableHead>
                  <TableHead className="text-right">Overall Conv</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No promo code data available
                    </TableCell>
                  </TableRow>
                ) : (
                  promoStats.map((s) => (
                    <TableRow key={s.code}>
                      <TableCell className="font-mono font-medium">{s.code || "(empty)"}</TableCell>
                      <TableCell className="text-right">{s.views}</TableCell>
                      <TableCell className="text-right">{s.dismissed}</TableCell>
                      <TableCell className="text-right">{s.ctaClicks}</TableCell>
                      <TableCell className="text-right font-medium text-green-500">{s.conversions}</TableCell>
                      <TableCell className="text-right">{s.viewToClickRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{s.clickToConversionRate.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-medium text-gold">{s.overallConversionRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* A/B Group Performance */}
        <div className="mb-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 text-gold" />
            A/B Group Performance
          </h2>
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Dismissed</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No A/B group data available
                    </TableCell>
                  </TableRow>
                ) : (
                  abStats.map((s) => (
                    <TableRow key={s.group}>
                      <TableCell className="font-medium">
                        <Badge variant="outline" className={cn(
                          s.group === "banner_flash" ? "bg-charcoal text-gold border-gold/30" :
                          s.group === "banner_default" ? "bg-gold/20 text-gold" :
                          s.group === "control" ? "bg-muted text-muted-foreground" :
                          "bg-muted"
                        )}>
                          {s.group}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{s.views}</TableCell>
                      <TableCell className="text-right">{s.dismissed}</TableCell>
                      <TableCell className="text-right font-medium text-green-500">{s.conversions}</TableCell>
                      <TableCell className="text-right font-medium text-gold">{s.conversionRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Recent Events */}
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Tag className="h-5 w-5 text-gold" />
            Recent Events
          </h2>
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>A/B Group</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading events...
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  events.slice(0, 50).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <EventBadge type={event.event_type} />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{event.promo_code || "—"}</TableCell>
                      <TableCell>{event.variant}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{event.ab_group || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{event.page_path}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(event.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
