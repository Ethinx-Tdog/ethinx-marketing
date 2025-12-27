import { Link } from "react-router-dom";
import { Building2, Wrench, Heart, Briefcase, UserSearch, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Industry {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
}

const industries: Industry[] = [
  { id: "real-estate", name: "Real Estate", icon: Building2, href: "/real-estate-headshots" },
  { id: "tradie", name: "Tradies", icon: Wrench, href: "/tradie-business-photos" },
  { id: "dating", name: "Dating", icon: Heart, href: "/dating-profile-pictures" },
  { id: "linkedin", name: "LinkedIn", icon: Briefcase, href: "/linkedin-professional-photos" },
  { id: "job-seeker", name: "Job Seekers", icon: UserSearch, href: "/job-seeker-headshots" },
  { id: "influencer", name: "Influencers", icon: Camera, href: "/social-influencer-photos" },
];

export function IndustryTiles() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {industries.map((industry) => {
        const IconComponent = industry.icon;
        return (
          <Link
            key={industry.id}
            to={industry.href}
            className={cn(
              "group relative aspect-square rounded-xl overflow-hidden border border-border/50 transition-all duration-300 hover-lift",
              "bg-secondary hover:border-gold/30"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/50 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
              <IconComponent className="h-8 w-8 text-gold" />
              <span className="text-sm font-medium text-foreground text-center">
                {industry.name}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default IndustryTiles;
