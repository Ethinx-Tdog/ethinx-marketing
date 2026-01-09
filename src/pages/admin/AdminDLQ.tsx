import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  LogOut,
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface DLQEntry {
  id: string;
  order_id: string;
  original_payload: {
    order_id: string;
    order_token: string;
    email: string;
    results: string[];
    zip_key: string;
  };
  error_message: string;
  failed_at: string;
  retry_count: number;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export default function AdminDLQ() {
  const [entries, setEntries] = useState<DLQEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<DLQEntry | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const { signOut, user } = useAuth();

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("order_dlq")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries((data as DLQEntry[]) || []);
    } catch (err) {
      console.error("Failed to fetch DLQ entries:", err);
      toast.error("Failed to load dead-letter queue");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleRetry = async (entry: DLQEntry) => {
    setIsRetrying(entry.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        toast.error("Please sign in to retry");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retry-dlq`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ dlq_id: entry.id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Retry failed");
      }

      toast.success("Order requeued for processing");
      fetchEntries();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Retry failed";
      toast.error(message);
    } finally {
      setIsRetrying(null);
    }
  };

  const handleResolve = async () => {
    if (!selectedEntry) return;
    setIsResolving(true);

    try {
      const { error } = await supabase
        .from("order_dlq")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          resolution_notes: resolutionNotes || "Manually resolved",
        })
        .eq("id", selectedEntry.id);

      if (error) throw error;

      toast.success("Entry marked as resolved");
      setShowResolveDialog(false);
      setResolutionNotes("");
      setSelectedEntry(null);
      fetchEntries();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resolve";
      toast.error(message);
    } finally {
      setIsResolving(false);
    }
  };

  const unresolvedCount = entries.filter((e) => !e.resolved_at).length;
  const resolvedCount = entries.filter((e) => e.resolved_at).length;

  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd MMM HH:mm");
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin - Dead Letter Queue" description="Manage failed orders" />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Dead Letter Queue</h1>
              <p className="text-sm text-muted-foreground">
                {unresolvedCount} unresolved, {resolvedCount} resolved
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm">
                Orders
              </Button>
            </Link>
            <Button onClick={fetchEntries} variant="outline" size="sm">
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
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-500/20 p-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unresolved</p>
                <p className="text-2xl font-bold text-red-500">{unresolvedCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/20 p-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-500">{resolvedCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold text-foreground">{entries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* DLQ Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Error</TableHead>
                <TableHead>Retries</TableHead>
                <TableHead>Failed At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin" />
                    Loading...
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                    No entries in dead-letter queue
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id} className={entry.resolved_at ? "opacity-60" : ""}>
                    <TableCell>
                      <Link
                        to={`/admin/orders/${entry.order_id}`}
                        className="font-mono text-sm text-primary hover:underline"
                      >
                        {entry.order_id.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {entry.original_payload?.email || "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="line-clamp-2 text-sm text-red-400">
                        {entry.error_message}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.retry_count}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(entry.failed_at)}
                    </TableCell>
                    <TableCell>
                      {entry.resolved_at ? (
                        <Badge variant="outline" className="bg-green-500/20 text-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/20 text-red-500">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!entry.resolved_at && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(entry)}
                            disabled={isRetrying === entry.id}
                            title="Retry processing"
                          >
                            <RotateCcw
                              className={cn("h-4 w-4", isRetrying === entry.id && "animate-spin")}
                            />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowResolveDialog(true);
                            }}
                            title="Mark as resolved"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {entry.resolved_at && entry.resolution_notes && (
                        <span className="text-xs text-muted-foreground">
                          {entry.resolution_notes}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Entry</DialogTitle>
            <DialogDescription>
              Mark this DLQ entry as resolved. Add optional notes about the resolution.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Resolution notes (optional)"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleResolve} disabled={isResolving}>
              {isResolving ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
