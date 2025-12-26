import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/pricing", label: "Pricing" },
  { href: "/examples", label: "Examples" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container flex h-16 md:h-18 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img
            src="/brand/ethinx-mark.png"
            alt="ETHINX"
            className="h-7 md:h-8 w-auto"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.parentElement!.innerHTML = '<span class="text-xl font-display font-bold text-gradient-gold">ETHINX</span>';
            }}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-sm font-medium transition-colors link-underline py-1",
                location.pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pricing">See pricing</Link>
          </Button>
          <Button variant="gold" size="sm" asChild>
            <a href="https://app.ethinx.solutions/start">Upload Photos</a>
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-charcoal border-t border-border/50">
          <nav className="container py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-base font-medium py-3 px-4 rounded-lg transition-colors",
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 mt-4 border-t border-border">
              <Button variant="outline" asChild>
                <Link to="/pricing" onClick={() => setIsOpen(false)}>
                  See pricing
                </Link>
              </Button>
              <Button variant="gold" asChild>
                <a href="https://app.ethinx.solutions/start">Upload Photos</a>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
