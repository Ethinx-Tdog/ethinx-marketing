import { Routes, Route, Navigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Index from "@/pages/Index";
import Examples from "@/pages/Examples";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import HowItWorks from "@/pages/HowItWorks";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/examples" element={<Examples />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
