import { IndustryPage } from "@/components/IndustryPage";

const SocialInfluencerPhotos = () => {
  return (
    <IndustryPage
      title="Influencer & Creator Photos - Level Up Your Content"
      metaDescription="Professional photos for influencers and content creators. Elevate your brand with stunning, consistent imagery across all platforms."
      headline="Creator Photos That Build Your Brand"
      subheadline="Elevate your content with professional-quality photos. Perfect for profile pics, thumbnails, and brand partnerships."
      benefits={[
        "Consistent, professional look across all platforms",
        "Stand out to brand partnership opportunities",
        "Multiple styles for diverse content needs",
        "Quick turnaround for fast-moving social trends",
      ]}
      beforeImage="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop"
      afterImage="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop"
      testimonial={{
        quote: "My engagement went up 40% after updating my profile photos. Brands started reaching out more frequently too.",
        author: "Emma Davis",
        role: "Lifestyle Creator, 150K Followers",
      }}
    />
  );
};

export default SocialInfluencerPhotos;
