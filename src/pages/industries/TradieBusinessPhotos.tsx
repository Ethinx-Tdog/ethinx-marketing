import { IndustryPage } from "@/components/IndustryPage";

const TradieBusinessPhotos = () => (
  <IndustryPage
    title="Tradie Business Photos"
    metaDescription="Professional headshots for tradies. Build trust and win more jobs."
    headline="Professional Photos for Tradies"
    subheadline="Show customers you're the real deal with professional business photos."
    benefits={["Build credibility with customers", "Stand out on Google My Business", "Perfect for quotes & invoices"]}
    testimonial={{ quote: "My quote conversion rate went up significantly after updating my photos.", author: "Dave T.", role: "Owner, Thompson Electrical" }}
  />
);

export default TradieBusinessPhotos;
