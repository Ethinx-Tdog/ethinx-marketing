import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, Wrench, Heart, Briefcase, UserSearch, Camera, X } from "lucide-react";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { cn } from "@/lib/utils";

interface Industry {
  id: string;
  name: string;
  icon: React.ElementType;
  href: string;
  thumbnail: string;
  sliders: Array<{
    before: string;
    after: string;
  }>;
}

const industries: Industry[] = [
  {
    id: "real-estate",
    name: "Real Estate",
    icon: Building2,
    href: "/real-estate-headshots",
    thumbnail: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=200&fit=crop",
    sliders: [
      {
        before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop",
      },
      {
        before: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop",
      },
    ],
  },
  {
    id: "tradie",
    name: "Tradies",
    icon: Wrench,
    href: "/tradie-business-photos",
    thumbnail: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200&h=200&fit=crop",
    sliders: [
      {
        before: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop",
      },
      {
        before: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop",
      },
    ],
  },
  {
    id: "dating",
    name: "Dating Profiles",
    icon: Heart,
    href: "/dating-profile-pictures",
    thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop",
    sliders: [
      {
        before: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
      },
      {
        before: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop",
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Briefcase,
    href: "/linkedin-professional-photos",
    thumbnail: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
    sliders: [
      {
        before: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=800&fit=crop",
      },
      {
        before: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=800&fit=crop",
      },
    ],
  },
  {
    id: "job-seeker",
    name: "Job Seekers",
    icon: UserSearch,
    href: "/job-seeker-headshots",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    sliders: [
      {
        before: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop",
      },
      {
        before: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=800&fit=crop",
      },
    ],
  },
  {
    id: "influencer",
    name: "Influencers",
    icon: Camera,
    href: "/social-influencer-photos",
    thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop",
    sliders: [
      {
        before: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=800&fit=crop",
      },
      {
        before: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=800&fit=crop",
        after: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop",
      },
    ],
  },
];

export function IndustryTiles() {
  const [activeIndustry, setActiveIndustry] = useState<Industry | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {industries.map((industry) => (
          <button
            key={industry.id}
            onClick={() => setActiveIndustry(industry)}
            className={cn(
              "group relative aspect-square rounded-xl overflow-hidden border border-border transition-all duration-300 hover-lift",
              "bg-card hover:border-primary/50"
            )}
          >
            <img
              src={industry.thumbnail}
              alt={industry.name}
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
              <industry.icon className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium text-foreground text-center">
                {industry.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {activeIndustry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={() => setActiveIndustry(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveIndustry(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <activeIndustry.icon className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-display font-semibold">
                {activeIndustry.name} Headshots
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeIndustry.sliders.map((slider, idx) => (
                <BeforeAfterSlider
                  key={idx}
                  beforeImage={slider.before}
                  afterImage={slider.after}
                  beforeAlt={`${activeIndustry.name} before ${idx + 1}`}
                  afterAlt={`${activeIndustry.name} after ${idx + 1}`}
                />
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                to={activeIndustry.href}
                className="text-primary hover:underline text-sm font-medium"
                onClick={() => setActiveIndustry(null)}
              >
                Learn more about {activeIndustry.name.toLowerCase()} headshots →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
