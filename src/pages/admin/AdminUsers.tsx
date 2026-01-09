import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  LogOut, 
  Shield, 
  ShieldOff, 
  UserPlus,
  Users,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { cn } from "@/lib/utils";

interface Admin {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isGranting, setIsGranting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  // Check if current user is admin via get_admins RPC
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

        // If user is not in the admin list, redirect
        const isAdmin = data?.some((admin: Admin) => admin.user_id === user.id);
        if (!isAdmin) {
          toast.error("Access denied: Admin privileges required");
          navigate("/");
          return;
        }

        setAdmins(data || []);
        setIsCheckingAccess(false);
        setIsLoading(false);
      } catch (err) {
        console.error("Error checking admin access:", err);
        navigate("/");
      }
    };

    checkAdminAccess();
  }, [user, navigate]);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_admins");

      if (error) {
        throw new Error(error.message);
      }

      setAdmins(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch admins";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const grantAdmin = async () => {
    if (!newAdminEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setIsGranting(true);
    try {
      const { data, error } = await supabase.rpc("grant_admin", {
        p_email: newAdminEmail.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as { success: boolean; message?: string; error?: string };

      if (!result.success) {
        throw new Error(result.error || "Failed to grant admin");
      }

      toast.success(result.message || "Admin access granted");
      setNewAdminEmail("");
      setIsDialogOpen(false);
      fetchAdmins();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to grant admin";
      toast.error(message);
    } finally {
      setIsGranting(false);
    }
  };

  const revokeAdmin = async (email: string) => {
    try {
      const { data, error } = await supabase.rpc("revoke_admin", {
        p_email: email,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as { success: boolean; message?: string; error?: string };

      if (!result.success) {
        throw new Error(result.error || "Failed to revoke admin");
      }

      toast.success(result.message || "Admin access revoked");
      fetchAdmins();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to revoke admin";
      toast.error(message);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Show loading while checking access
  if (isCheckingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Admin - User Management" description="Manage admin users" />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/orders" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">User Management</h1>
              <p className="text-sm text-muted-foreground">
                {admins.length} admin{admins.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Link to="/admin/orders">
              <Button variant="outline" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Orders
              </Button>
            </Link>
            <Button onClick={fetchAdmins} variant="outline" size="sm" disabled={isLoading}>
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
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Admins</p>
                <p className="text-2xl font-bold text-foreground">{admins.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Admin Users</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Admin User</DialogTitle>
                <DialogDescription>
                  Enter the email of a registered user to grant admin access.
                  The user must already have an account.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="user@example.com"
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && grantAdmin()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={grantAdmin} disabled={isGranting}>
                  {isGranting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Grant Admin
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Admins Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.user_id}>
                    <TableCell className="font-medium">{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/20 text-primary">
                        <Shield className="mr-1 h-3 w-3" />
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(admin.created_at)}
                    </TableCell>
                    <TableCell>
                      {admin.email !== user?.email ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                              <ShieldOff className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revoke Admin Access</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to revoke admin access from {admin.email}?
                                They will no longer be able to access the admin panel.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => revokeAdmin(admin.email)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Revoke Access
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-xs text-muted-foreground">You</span>
                      )}
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
