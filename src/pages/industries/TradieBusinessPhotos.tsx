import { IndustryPage } from "@/components/IndustryPage";

const TradieBusinessPhotos = () => {
  return (
    <IndustryPage
      title="Tradie Business Photos - Professional Headshots for Tradies"
      metaDescription="Professional headshots for tradies and tradespeople. Build trust with customers and stand out from competitors with quality business photos."
      headline="Professional Photos for Tradies Who Mean Business"
      subheadline="Show potential customers you're the real deal. Get professional headshots that build trust and help win more jobs."
      benefits={[
        "Build credibility and trust with new customers",
        "Stand out on Google My Business and directory listings",
        "Perfect for quotes, invoices, and business vehicles",
        "Show customers the professional behind the trade",
      ]}
      beforeImage="https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&h=800&fit=crop"
      afterImage="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop"
      testimonial={{
        quote: "Customers now see me as a professional, not just another tradie. My conversion rate on quotes has gone up significantly since updating my photos.",
        author: "Dave Thompson",
        role: "Owner, Thompson Electrical",
      }}
    />
  );
};

export default TradieBusinessPhotos;
