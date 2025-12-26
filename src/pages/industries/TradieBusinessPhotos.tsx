import { IndustryPage } from "@/components/IndustryPage";

const TradieBusinessPhotos = () => (
  <IndustryPage
    title="Tradie Business Photos"
    metaDescription="Professional headshots for tradies. Build trust and win more jobs."
    headline="Professional Photos for Tradies"
    subheadline="Show customers you're the real deal with professional business photos."
    benefits={["Build credibility with customers", "Stand out on Google My Business", "Perfect for quotes & invoices"]}
    beforeImage="https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&h=800&fit=crop"
    afterImage="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop"
    testimonial={{ quote: "My quote conversion rate went up significantly after updating my photos.", author: "Dave T.", role: "Owner, Thompson Electrical" }}
  />
);

export default TradieBusinessPhotos;
