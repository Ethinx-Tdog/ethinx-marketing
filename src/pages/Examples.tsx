import { useState } from "react";
import { SEO } from "@/components/SEO";
import { SectionHeading } from "@/components/SectionHeading";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const industries = [
  { id: "all", name: "All Industries" },
  { id: "real-estate", name: "Real Estate" },
  { id: "tradie", name: "Tradies" },
  { id: "dating", name: "Dating" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "job-seeker", name: "Job Seekers" },
  { id: "influencer", name: "Influencers" },
];

const examples = [
  {
    id: 1,
    industry: "real-estate",
    before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop",
  },
  {
    id: 2,
    industry: "real-estate",
    before: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop",
  },
  {
    id: 3,
    industry: "tradie",
    before: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop",
  },
  {
    id: 4,
    industry: "tradie",
    before: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop",
  },
  {
    id: 5,
    industry: "dating",
    before: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
  },
  {
    id: 6,
    industry: "dating",
    before: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop",
  },
  {
    id: 7,
    industry: "linkedin",
    before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop",
  },
  {
    id: 8,
    industry: "linkedin",
    before: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=800&fit=crop",
  },
  {
    id: 9,
    industry: "job-seeker",
    before: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop",
  },
  {
    id: 10,
    industry: "job-seeker",
    before: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop",
  },
  {
    id: 11,
    industry: "influencer",
    before: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
  },
  {
    id: 12,
    industry: "influencer",
    before: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop",
    after: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop",
  },
];

const Examples = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredExamples =
    activeFilter === "all"
      ? examples
      : examples.filter((ex) => ex.industry === activeFilter);

  return (
    <>
      <SEO
        title="Examples - AI Professional Headshot Transformations"
        description="See real before and after transformations. Browse examples by industry: Real Estate, LinkedIn, Dating, and more."
      />

      <section className="py-20 md:py-32">
        <div className="container">
          <SectionHeading
            badge="Examples"
            title="Real Transformations"
            description="See how everyday selfies become stunning professional headshots. Filter by industry to see relevant examples."
          />

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {industries.map((industry) => (
              <button
                key={industry.id}
                onClick={() => setActiveFilter(industry.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeFilter === industry.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                {industry.name}
              </button>
            ))}
          </div>

          {/* Examples Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExamples.map((example) => (
              <BeforeAfterSlider
                key={example.id}
                beforeImage={example.before}
                afterImage={example.after}
                beforeAlt={`Before ${example.industry}`}
                afterAlt={`After ${example.industry}`}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Button variant="gold" size="lg" asChild>
              <a href="https://app.ethinx.solutions/start">
                Create Your Own Transformation
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Examples;
