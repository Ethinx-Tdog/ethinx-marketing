import { IndustryPage } from "@/components/IndustryPage";

const DatingProfilePictures = () => {
  return (
    <IndustryPage
      title="Dating Profile Pictures - Get More Matches with Better Photos"
      metaDescription="Transform your dating profile with AI-enhanced photos. Get natural, authentic-looking pictures that show the best version of you."
      headline="Dating Photos That Get More Matches"
      subheadline="Stand out in the swipe with photos that show the real, best version of you. Natural, authentic, and undeniably attractive."
      benefits={[
        "Look natural and approachable, never fake",
        "Multiple lifestyle shots for a complete profile",
        "Perfect lighting that makes you look your best",
        "Confidence-boosting photos that get more right swipes",
      ]}
      beforeImage="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop"
      afterImage="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop"
      testimonial={{
        quote: "I matched with my now-girlfriend within the first week of updating my photos. The difference in quality matches was incredible.",
        author: "Mike Roberts",
        role: "ETHINX Customer",
      }}
    />
  );
};

export default DatingProfilePictures;
