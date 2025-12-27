import { IndustryPage } from "@/components/IndustryPage";

const RealEstateHeadshots = () => (
  <IndustryPage
    title="Real Estate Agent Headshots"
    metaDescription="Stand out with AI-generated professional headshots for real estate agents."
    headline="Real Estate Headshots That Close Deals"
    subheadline="First impressions matter. Get studio-quality headshots that convey trust and professionalism."
    benefits={["Build instant credibility", "Perfect for listings & marketing", "Multiple background options"]}
    testimonial={{ quote: "My new headshots transformed my marketing. More inquiries, more deals.", author: "Sarah M.", role: "Senior Agent, RE/MAX" }}
  />
);

export default RealEstateHeadshots;
