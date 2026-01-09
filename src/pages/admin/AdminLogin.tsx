import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminLogin() {
  const { user, isAdmin, isLoading, signIn, signUp, signOut } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || "/admin/orders";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in as admin, redirect
  if (!isLoading && user && isAdmin) {
    return <Navigate to={from} replace />;
  }

  // If logged in but not admin
  if (!isLoading && user && !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <SEO title="Access Denied" description="Admin access required" />
        <Lock className="mb-4 h-12 w-12 text-destructive" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Your account doesn't have admin privileges.
        </p>
        <Button onClick={() => signOut()} variant="outline">
          Sign Out
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    if (mode === "register") {
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      setIsSubmitting(true);
      console.log("[AdminLogin] Attempting signup for:", email);
      
      const { error, user: newUser } = await signUp(email, password);
      console.log("[AdminLogin] Signup result:", { error, newUser });
      
      setIsSubmitting(false);

      if (error) {
        console.error("[AdminLogin] Signup error:", error);
        toast.error(error.message || "Failed to create account");
      } else if (newUser) {
        console.log("[AdminLogin] User created:", newUser.id);
        toast.success("Account created! Signing you in...");
        // Auto-confirm is enabled, so try to sign in immediately
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          console.error("[AdminLogin] Auto sign-in failed:", signInError);
          toast.error("Account created but sign-in failed. Please try signing in manually.");
          setMode("login");
        }
      } else {
        console.warn("[AdminLogin] No error but no user returned");
        toast.error("Signup returned no user. Please try again.");
      }
    } else {
      setIsSubmitting(true);
      const { error } = await signIn(email, password);
      setIsSubmitting(false);

      if (error) {
        toast.error(error.message || "Failed to sign in");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <SEO title="Admin Login" description="Sign in to admin dashboard" />

      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/20">
            <Lock className="h-7 w-7 text-gold" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "register" ? "Create Admin Account" : "Admin Login"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "register" 
              ? "Register to request admin access" 
              : "Sign in to access the admin dashboard"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "register" ? "Creating Account..." : "Signing in..."}
              </>
            ) : (
              mode === "register" ? "Create Account" : "Sign In"
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setConfirmPassword("");
              }}
              className="text-sm text-gold hover:underline"
            >
              {mode === "login" 
                ? "Need an account? Register" 
                : "Already have an account? Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
