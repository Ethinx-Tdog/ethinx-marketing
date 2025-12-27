import { Routes, Route, Link, Navigate } from "react-router-dom";
import Home from "./pages/Index";
import Examples from "./pages/Examples";
import Pricing from "./pages/Pricing";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link to="/" className="font-semibold tracking-wide">ETHINX</Link>
          <div className="ml-auto flex gap-4 text-sm">
            <Link to="/examples">Examples</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/examples" element={<Examples />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
