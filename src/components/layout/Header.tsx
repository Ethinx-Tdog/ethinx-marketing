import { useState, useEffect, useCallback } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { BRAND } from "@/lib/brand";

const navLinks = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/examples", label: "Examples" },
  { to: "/pricing", label: "Pricing" },
  { to: "/faq", label: "FAQ" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeMenu]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl overflow-visible">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-8 h-20 md:h-24 py-4 md:py-5">
        {/* Logo */}
        <Link to="/" className="flex items-center group" aria-label="ETHINX Home">
          <img 
            src={BRAND.LOGO} 
            alt="ETHINX logo" 
            className="h-10 md:h-14 w-auto object-contain antialiased transform-gpu drop-shadow-[0_0_15px_rgba(245,158,11,0.1)] animate-fade-in transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]" 
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-primary ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/pricing"
            className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-gold"
          >
            Upload Photos
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs border-l border-border shadow-2xl transform lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          backgroundColor: "#000000",
          transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <img src={BRAND.LOGO} alt="ETHINX logo" className="h-10 w-auto" />
          <button
            onClick={closeMenu}
            className="p-2 text-foreground hover:text-primary transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link, index) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `block px-4 py-3 rounded-r-lg text-base font-medium transition-all duration-300 border-l-2 ${
                  isActive
                    ? "border-l-primary bg-primary/10 text-primary"
                    : "border-l-transparent text-foreground hover:border-l-primary/50 hover:bg-secondary"
                } ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`
              }
              style={{ 
                transitionDelay: isOpen ? `${(index + 1) * 75}ms` : '0ms'
              }}
            >
              {link.label}
            </NavLink>
          ))}

          <div 
            className={`mt-6 pt-4 border-t border-border space-y-3 transition-all duration-300 ${
              isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            }`}
            style={{ 
              transitionDelay: isOpen ? `${(navLinks.length + 1) * 75}ms` : '0ms'
            }}
          >
            <Link
              to="/pricing"
              onClick={closeMenu}
              className="block w-full text-center rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              Upload Photos
            </Link>
            <Link
              to="/contact"
              onClick={closeMenu}
              className="block w-full text-center rounded-lg border border-border px-5 py-3 font-medium text-foreground transition-all hover:bg-secondary"
            >
              Contact Us
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
