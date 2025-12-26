import { IndustryPage } from "@/components/IndustryPage";

const RealEstateHeadshots = () => {
  return (
    <IndustryPage
      title="Real Estate Agent Headshots - Professional Photos for Agents"
      metaDescription="Stand out in the competitive real estate market with AI-generated professional headshots. Build trust and close more deals with a polished image."
      headline="Real Estate Agent Headshots That Close Deals"
      subheadline="In real estate, first impressions are everything. Get studio-quality headshots that convey trust, professionalism, and approachability."
      benefits={[
        "Build instant credibility with potential clients",
        "Stand out on property listings and marketing materials",
        "Perfect for yard signs, business cards, and websites",
        "Multiple backgrounds for different marketing needs",
      ]}
      beforeImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"
      afterImage="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop"
      testimonial={{
        quote: "My new headshots have completely transformed my marketing. I've noticed more inquiries and my clients always comment on how professional I look.",
        author: "Sarah Mitchell",
        role: "Senior Real Estate Agent, RE/MAX",
      }}
    />
  );
};

export default RealEstateHeadshots;
