import { Link } from "react-router-dom";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/faq", label: "FAQ" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src="/brand/ethinx-mark.png"
              alt="ETHINX"
              className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
            />
          </Link>

          {/* Links */}
          <nav className="flex items-center gap-6 md:gap-8">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Contact */}
          <a
            href="mailto:support@ethinx.solutions"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            support@ethinx.solutions
          </a>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ETHINX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
