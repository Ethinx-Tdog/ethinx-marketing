import { Link } from "react-router-dom";
import { BRAND } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <img src={BRAND.LOGO} alt="ETHINX logo" className="h-8 w-auto" />
          <p className="text-white/70 text-sm">AI-Generated professional headshots in minutes.</p>
        </div>
        <div className="text-sm grid grid-cols-2 gap-3">
          <Link to="/how-it-works" className="hover:text-white/90">How it works</Link>
          <Link to="/examples" className="hover:text-white/90">Examples</Link>
          <Link to="/pricing" className="hover:text-white/90">Pricing</Link>
          <Link to="/faq" className="hover:text-white/90">FAQ</Link>
          <Link to="/privacy" className="hover:text-white/90">Privacy</Link>
          <Link to="/terms" className="hover:text-white/90">Terms</Link>
        </div>
        <div className="text-sm text-white/70">
          <div>Contact: <a href="mailto:support@ethinx.solutions" className="underline">support@ethinx.solutions</a></div>
          <div className="mt-2">© {new Date().getFullYear()} ETHINX. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
