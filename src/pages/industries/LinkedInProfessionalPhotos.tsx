import { IndustryPage } from "@/components/IndustryPage";

const LinkedInProfessionalPhotos = () => {
  return (
    <IndustryPage
      title="LinkedIn Professional Photos - Stand Out to Recruiters"
      metaDescription="Get a LinkedIn headshot that attracts recruiters and opportunities. Professional, approachable photos optimized for LinkedIn's algorithm."
      headline="LinkedIn Photos That Open Doors"
      subheadline="Your LinkedIn photo is often the first impression you make. Get a headshot that commands attention and attracts opportunities."
      benefits={[
        "14x more profile views with a professional photo",
        "Optimized sizing and format for LinkedIn",
        "Professional yet approachable appearance",
        "Includes LinkedIn banner with Professional plan",
      ]}
      beforeImage="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop"
      afterImage="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop"
      testimonial={{
        quote: "Within a week of updating my photo, I had 3x more recruiter messages. It's amazing how much a professional headshot impacts your visibility.",
        author: "Jennifer Chen",
        role: "Marketing Director",
      }}
    />
  );
};

export default LinkedInProfessionalPhotos;
