import { IndustryPage } from "@/components/IndustryPage";

const LinkedInProfessionalPhotos = () => (
  <IndustryPage
    title="LinkedIn Professional Photos"
    metaDescription="Get a LinkedIn headshot that attracts recruiters and opportunities."
    headline="LinkedIn Photos That Open Doors"
    subheadline="Your LinkedIn photo is your first impression. Make it count."
    benefits={["14x more profile views", "Optimized for LinkedIn", "Includes banner with Pro plan"]}
    beforeImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"
    afterImage="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop"
    testimonial={{ quote: "3x more recruiter messages within a week of updating my photo.", author: "Jennifer C.", role: "Marketing Director" }}
  />
);

export default LinkedInProfessionalPhotos;
