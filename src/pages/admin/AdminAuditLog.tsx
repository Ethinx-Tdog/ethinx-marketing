import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  LogOut, 
  ClipboardList,
  Loader2,
  Users
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

interface AuditEntry {
  id: string;
  ts: string;
  actor_user_id: string;
  action: string;
  target_email: string | null;
}

export default function AdminAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  // Check if current user is admin
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase.rpc("get_admins");
        
        if (error) {
          console.error("Error checking admin access:", error);
          navigate("/");
          return;
        }

        const isAdmin = data?.some((admin: { user_id: string }) => admin.user_id === user.id);
        if (!isAdmin) {
          toast.error("Access denied: Admin privileges required");
          navigate("/");
          return;
        }

        setIsCheckingAccess(false);
        fetchAuditLog();
      } catch (err) {
        console.error("Error checking admin access:", err);
        navigate("/");
      }
    };

    checkAdminAccess();
  }, [user, navigate]);

  const fetchAuditLog = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("admin_audit")
        .select("id, ts, actor_user_id, action, target_email")
        .order("ts", { ascending: false })
        .limit(50);

      if (error) {
        throw new Error(error.message);
      }

      setEntries(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch audit log";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("grant")) return "bg-green-500/20 text-green-400";
    if (action.includes("revoke")) return "bg-red-500/20 text-red-400";
    return "bg-muted text-muted-foreground";
  };

  if (isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin - Audit Log" description="View admin activity log" />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/users" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
              <p className="text-sm text-muted-foreground">
                {entries.length} recent {entries.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Link to="/admin/users">
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Users
              </Button>
            </Link>
            <Button onClick={fetchAuditLog} variant="outline" size="sm" disabled={isLoading}>
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
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/20 p-2">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recent Actions</p>
                <p className="text-2xl font-bold text-foreground">{entries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor User ID</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No audit entries found
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(entry.ts)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {entry.actor_user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionBadgeVariant(entry.action)}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {entry.target_email || "-"}
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
