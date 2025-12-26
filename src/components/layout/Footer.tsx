import { Link } from "react-router-dom";

const footerLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/faq", label: "FAQ" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-charcoal">
      <div className="container py-12 md:py-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <Link to="/" className="flex items-center">
            <img
              src="/brand/ethinx-mark.png"
              alt="ETHINX"
              className="h-5 w-auto opacity-60 hover:opacity-100 transition-opacity"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<span class="text-lg font-display font-semibold text-gradient-gold opacity-60 hover:opacity-100">ETHINX</span>';
              }}
            />
          </Link>

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

          <a
            href="mailto:support@ethinx.solutions"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            support@ethinx.solutions
          </a>
        </div>

        <div className="mt-10 pt-8 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} ETHINX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
