import { IndustryPage } from "@/components/IndustryPage";

const SocialInfluencerPhotos = () => (
  <IndustryPage
    title="Influencer & Creator Photos"
    metaDescription="Professional photos for influencers and content creators."
    headline="Creator Photos That Build Your Brand"
    subheadline="Elevate your content with professional-quality photos across all platforms."
    benefits={["Consistent look across platforms", "Stand out to brand partners", "Quick turnaround"]}
    beforeImage="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop"
    afterImage="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop"
    testimonial={{ quote: "Engagement up 40% after updating my profile photos.", author: "Emma D.", role: "Lifestyle Creator, 150K Followers" }}
  />
);

export default SocialInfluencerPhotos;
