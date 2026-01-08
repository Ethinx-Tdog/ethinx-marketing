import { Routes, Route } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import PromoBanner from "@/components/PromoBanner";
import { UpsellModal } from "@/components/UpsellModal";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAdmin } from "@/components/RequireAdmin";
import Index from "@/pages/Index";
import Examples from "@/pages/Examples";
import Pricing from "@/pages/Pricing";
import FAQ from "@/pages/FAQ";
import HowItWorks from "@/pages/HowItWorks";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import CheckoutSuccess from "@/pages/checkout/CheckoutSuccess";
import CheckoutCancel from "@/pages/checkout/CheckoutCancel";
import OrderStatus from "@/pages/OrderStatus";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminOrderDetail from "@/pages/admin/AdminOrderDetail";

// Industry pages
import RealEstateHeadshots from "@/pages/industries/RealEstateHeadshots";
import TradieBusinessPhotos from "@/pages/industries/TradieBusinessPhotos";
import DatingProfilePictures from "@/pages/industries/DatingProfilePictures";
import LinkedInProfessionalPhotos from "@/pages/industries/LinkedInProfessionalPhotos";
import JobSeekerHeadshots from "@/pages/industries/JobSeekerHeadshots";
import SocialInfluencerPhotos from "@/pages/industries/SocialInfluencerPhotos";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <ScrollToTop />
        <PromoBanner />
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/examples" element={<Examples />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Industry pages */}
            <Route path="/real-estate-headshots" element={<RealEstateHeadshots />} />
            <Route path="/tradie-business-photos" element={<TradieBusinessPhotos />} />
            <Route path="/dating-profile-pictures" element={<DatingProfilePictures />} />
            <Route path="/linkedin-professional-photos" element={<LinkedInProfessionalPhotos />} />
            <Route path="/job-seeker-headshots" element={<JobSeekerHeadshots />} />
            <Route path="/social-influencer-photos" element={<SocialInfluencerPhotos />} />
            
            {/* Checkout pages */}
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/checkout/cancel" element={<CheckoutCancel />} />
            <Route path="/order-status" element={<OrderStatus />} />
            
            {/* Admin pages */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/orders" element={<RequireAdmin><AdminOrders /></RequireAdmin>} />
            <Route path="/admin/orders/:orderId" element={<RequireAdmin><AdminOrderDetail /></RequireAdmin>} />
            
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <UpsellModal />
      </div>
    </AuthProvider>
  );
}
