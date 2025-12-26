import { IndustryPage } from "@/components/IndustryPage";

const RealEstateHeadshots = () => (
  <IndustryPage
    title="Real Estate Agent Headshots"
    metaDescription="Stand out with AI-generated professional headshots for real estate agents."
    headline="Real Estate Headshots That Close Deals"
    subheadline="First impressions matter. Get studio-quality headshots that convey trust and professionalism."
    benefits={["Build instant credibility", "Perfect for listings & marketing", "Multiple background options"]}
    beforeImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"
    afterImage="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop"
    testimonial={{ quote: "My new headshots transformed my marketing. More inquiries, more deals.", author: "Sarah M.", role: "Senior Agent, RE/MAX" }}
  />
);

export default RealEstateHeadshots;
