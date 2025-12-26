import { IndustryPage } from "@/components/IndustryPage";

const DatingProfilePictures = () => (
  <IndustryPage
    title="Dating Profile Pictures"
    metaDescription="Get more matches with AI-enhanced dating profile photos."
    headline="Dating Photos That Get Matches"
    subheadline="Stand out with photos that show the real, best version of you."
    benefits={["Natural and approachable look", "Multiple lifestyle shots", "Confidence-boosting quality"]}
    beforeImage="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop"
    afterImage="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop"
    testimonial={{ quote: "Matched with my girlfriend within the first week of updating my photos.", author: "Mike R.", role: "ETHINX Customer" }}
  />
);

export default DatingProfilePictures;
