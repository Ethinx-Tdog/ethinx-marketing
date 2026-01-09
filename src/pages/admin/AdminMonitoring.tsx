import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
  Server,
  LogOut,
  Bot,
} from "lucide-react";
import { AIVoiceChat } from "@/components/AIVoiceChat";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";

interface Heartbeat {
  id: string;
  function_name: string;
  status: string;
  last_beat_at: string;
  total_runs: number;
  total_failures: number;
  consecutive_failures: number;
  last_result: unknown;
}

interface JobResponse {
  id: string;
  order_id: string;
  response_status: string;
  response_code: number | null;
  error_message: string | null;
  attempt_number: number;
  duration_ms: number | null;
  created_at: string;
}

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  response_time_ms: number;
  checks: {
    database: { status: string; latency_ms?: number; error?: string };
    cron_jobs: { status: string; healthy: number; warning: number; critical: number };
    queue: { status: string; pending: number; processing: number; failed: number };
  };
}

export default function AdminMonitoring() {
  const { signOut } = useAuth();
  const [heartbeats, setHeartbeats] = useState<Heartbeat[]>([]);
  const [jobHistory, setJobHistory] = useState<JobResponse[]>([]);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [heartbeatsRes, jobsRes] = await Promise.all([
        supabase
          .from("cron_heartbeats")
          .select("*")
          .order("function_name"),
        supabase
          .from("job_response_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (heartbeatsRes.error) throw heartbeatsRes.error;
      if (jobsRes.error) throw jobsRes.error;

      setHeartbeats(heartbeatsRes.data || []);
      setJobHistory(jobsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err);
      toast.error("Failed to load monitoring data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHealthCheck = async () => {
    setHealthLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-check`
      );
      const data = await response.json();
      setHealthCheck(data);
    } catch (err) {
      console.error("Failed to fetch health check:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHealthCheck();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData();
      fetchHealthCheck();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
    fetchHealthCheck();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      healthy: "default",
      warning: "secondary",
      critical: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  const getResponseStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: "bg-green-500/10 text-green-600 border-green-500/20",
      error: "bg-red-500/10 text-red-600 border-red-500/20",
      retry: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    };
    return (
      <Badge variant="outline" className={cn("capitalize", colors[status])}>
        {status}
      </Badge>
    );
  };

  // Calculate stats
  const totalRuns = heartbeats.reduce((sum, h) => sum + h.total_runs, 0);
  const totalFailures = heartbeats.reduce((sum, h) => sum + h.total_failures, 0);
  const successRate = totalRuns > 0 ? ((totalRuns - totalFailures) / totalRuns * 100).toFixed(1) : "100";
  const healthyCount = heartbeats.filter((h) => h.status === "healthy").length;

  return (
    <div className="min-h-screen bg-muted/30">
      <SEO 
        title="System Monitoring | Admin"
        description="Monitor cron jobs and system health"
      />
      
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Monitoring
              </h1>
              <p className="text-sm text-muted-foreground">
                Cron heartbeats & job history
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Real-time Health Check Widget */}
        <Card className={cn(
          "border-2",
          healthCheck?.status === "healthy" && "border-green-500/50 bg-green-500/5",
          healthCheck?.status === "degraded" && "border-yellow-500/50 bg-yellow-500/5",
          healthCheck?.status === "unhealthy" && "border-red-500/50 bg-red-500/5"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </div>
              {healthLoading ? (
                <Badge variant="outline">Loading...</Badge>
              ) : healthCheck ? (
                <Badge 
                  variant={healthCheck.status === "healthy" ? "default" : healthCheck.status === "degraded" ? "secondary" : "destructive"}
                  className="capitalize"
                >
                  {healthCheck.status}
                </Badge>
              ) : (
                <Badge variant="outline">Unknown</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthCheck ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Database Status */}
                <div className="p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-1">
                    {healthCheck.checks.database.status === "healthy" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">Database</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthCheck.checks.database.latency_ms 
                      ? `${healthCheck.checks.database.latency_ms}ms latency`
                      : healthCheck.checks.database.error || "Unknown"
                    }
                  </div>
                </div>

                {/* Cron Jobs Status */}
                <div className="p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-1">
                    {healthCheck.checks.cron_jobs.status === "healthy" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : healthCheck.checks.cron_jobs.status === "degraded" ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">Cron Jobs</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthCheck.checks.cron_jobs.healthy} healthy, {healthCheck.checks.cron_jobs.warning} warning, {healthCheck.checks.cron_jobs.critical} critical
                  </div>
                </div>

                {/* Queue Status */}
                <div className="p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-1">
                    {healthCheck.checks.queue.status === "healthy" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">Job Queue</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthCheck.checks.queue.pending} pending, {healthCheck.checks.queue.processing} processing, {healthCheck.checks.queue.failed} failed
                  </div>
                </div>

                {/* Response Time */}
                <div className="p-3 rounded-lg bg-background border">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Response Time</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {healthCheck.response_time_ms}ms
                  </div>
                </div>
              </div>
            ) : healthLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading health data...</div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">Unable to fetch health status</div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Server className="h-4 w-4" />
                Cron Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthyCount}/{heartbeats.length}
              </div>
              <p className="text-xs text-muted-foreground">healthy</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total Runs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRuns.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">all time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{successRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalFailures} failures
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobHistory.length}</div>
              <p className="text-xs text-muted-foreground">last 50</p>
            </CardContent>
          </Card>
        </div>

        {/* Heartbeats Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Cron Heartbeats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : heartbeats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No heartbeats recorded yet
              </div>
            ) : (
              <div className="grid gap-4">
                {heartbeats.map((hb) => (
                  <div
                    key={hb.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-background"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(hb.status)}
                      <div>
                        <div className="font-medium">{hb.function_name}</div>
                        <div className="text-sm text-muted-foreground">
                          Last beat: {formatDistanceToNow(new Date(hb.last_beat_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div>{hb.total_runs.toLocaleString()} runs</div>
                        <div className="text-muted-foreground">
                          {hb.total_failures} failures
                        </div>
                      </div>
                      {getStatusBadge(hb.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job History Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Job Response History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : jobHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No job history yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Attempt</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobHistory.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(job.created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/admin/orders/${job.order_id}`}
                            className="font-mono text-xs hover:underline text-primary"
                          >
                            {job.order_id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell>{getResponseStatusBadge(job.response_status)}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {job.response_code || "-"}
                        </TableCell>
                        <TableCell className="text-center">{job.attempt_number}</TableCell>
                        <TableCell className="text-sm">
                          {job.duration_ms ? `${job.duration_ms}ms` : "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {job.error_message || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ETHINX AI Agent */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              ETHINX Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIVoiceChat />
          </CardContent>
        </Card>

        {/* Admin Nav */}
        <div className="flex gap-2 flex-wrap">
          <Link to="/admin/orders">
            <Button variant="outline" size="sm">Orders</Button>
          </Link>
          <Link to="/admin/dlq">
            <Button variant="outline" size="sm">Dead Letter Queue</Button>
          </Link>
          <Link to="/admin/promo-analytics">
            <Button variant="outline" size="sm">Promo Analytics</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
