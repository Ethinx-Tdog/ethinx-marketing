import { useState } from "react";
import { SEO } from "@/components/SEO";
import { SectionHeading } from "@/components/SectionHeading";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const industries = [
  { id: "all", name: "All" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "real-estate", name: "Real Estate" },
  { id: "tradie", name: "Tradie" },
  { id: "job-seeker", name: "Job Seeker" },
  { id: "dating", name: "Dating" },
  { id: "influencer", name: "Influencer" },
];

const examples = [
  { id: 1, industry: "linkedin", before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop", after: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop" },
  { id: 2, industry: "linkedin", before: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop", after: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=800&fit=crop" },
  { id: 3, industry: "real-estate", before: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop", after: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop" },
  { id: 4, industry: "tradie", before: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&h=800&fit=crop", after: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop" },
  { id: 5, industry: "dating", before: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop", after: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop" },
  { id: 6, industry: "influencer", before: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop", after: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop" },
];

const Examples = () => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? examples : examples.filter((e) => e.industry === filter);

  return (
    <>
      <SEO title="Examples" description="See real before and after AI headshot transformations. Browse by industry." />
      <section className="py-20 md:py-32">
        <div className="container">
          <SectionHeading badge="Examples" title="Real Transformations" description="See how everyday selfies become stunning professional headshots." />
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {industries.map((i) => (
              <button key={i.id} onClick={() => setFilter(i.id)} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-all", filter === i.id ? "bg-gold text-charcoal" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}>{i.name}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ex) => (<BeforeAfterSlider key={ex.id} before={ex.before} after={ex.after} />))}
          </div>
          <div className="text-center mt-16">
            <Button variant="gold" size="lg" asChild><a href="https://app.ethinx.solutions/start">Create Your Own</a></Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Examples;
