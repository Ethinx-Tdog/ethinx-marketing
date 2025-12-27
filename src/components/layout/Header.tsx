import { Link, NavLink } from "react-router-dom";
import { BRAND } from "@/lib/brand";

export default function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={BRAND.LOGO} alt="ETHINX logo" className="h-8 w-auto" />
        </Link>
        <div className="ml-auto flex items-center gap-5 text-sm">
          <NavLink to="/how-it-works" className="hover:text-white/90">How it works</NavLink>
          <NavLink to="/examples" className="hover:text-white/90">Examples</NavLink>
          <NavLink to="/pricing" className="hover:text-white/90">Pricing</NavLink>
          <NavLink to="/faq" className="hover:text-white/90">FAQ</NavLink>
        </div>
        <div className="flex items-center gap-2">
          <a href="/pricing" className="rounded-lg bg-[#FBBF24] px-4 py-2 font-medium text-black">Get started</a>
        </div>
      </nav>
    </header>
  );
}
