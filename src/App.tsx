import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Examples from "./pages/Examples";
import HowItWorks from "./pages/HowItWorks";
import FAQ from "./pages/FAQ";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import RealEstateHeadshots from "./pages/industries/RealEstateHeadshots";
import TradieBusinessPhotos from "./pages/industries/TradieBusinessPhotos";
import DatingProfilePictures from "./pages/industries/DatingProfilePictures";
import LinkedInProfessionalPhotos from "./pages/industries/LinkedInProfessionalPhotos";
import JobSeekerHeadshots from "./pages/industries/JobSeekerHeadshots";
import SocialInfluencerPhotos from "./pages/industries/SocialInfluencerPhotos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/examples" element={<Examples />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/real-estate-headshots" element={<RealEstateHeadshots />} />
              <Route path="/tradie-business-photos" element={<TradieBusinessPhotos />} />
              <Route path="/dating-profile-pictures" element={<DatingProfilePictures />} />
              <Route path="/linkedin-professional-photos" element={<LinkedInProfessionalPhotos />} />
              <Route path="/job-seeker-headshots" element={<JobSeekerHeadshots />} />
              <Route path="/social-influencer-photos" element={<SocialInfluencerPhotos />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
