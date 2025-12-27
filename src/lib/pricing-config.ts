import type { LucideIcon } from "lucide-react";
import { Building2, Wrench, Stethoscope, Palette, FileText, Zap } from "lucide-react";

export type IndustryId = "corporate" | "real_estate" | "tradie" | "healthcare" | "creative";
export type PackageId = "starter" | "professional" | "ultimate";
export type UpsellId = "real_estate" | "tradie" | "healthcare" | "creative" | "bio_suite" | "rush_3h";

export interface Package {
  id: PackageId;
  name: string;
  price: number;
  photos: number;
  outfits: number;
  features: string[];
  popular?: boolean;
  badge?: string;
}

export interface Upsell {
  id: UpsellId;
  name: string;
  price: number;
  description: string;
  icon: LucideIcon;
  forIndustries?: IndustryId[]; // If undefined, available to all
  isAddon?: boolean; // Generic add-ons like rush delivery
}

export interface Industry {
  id: IndustryId;
  name: string;
  icon: LucideIcon;
  suggestedUpsell?: UpsellId;
}

export const PACKAGES: Package[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    photos: 15,
    outfits: 3,
    features: [
      "15 professional headshots",
      "3 outfit styles",
      "3 background options",
      "24-hour delivery",
      "Commercial usage rights",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 89,
    photos: 30,
    outfits: 5,
    popular: true,
    badge: "T-DOG Certified",
    features: [
      "30 professional headshots",
      "5 outfit styles",
      "8 background options",
      "12-hour priority delivery",
      "T-DOG Certified quality",
      "LinkedIn banner included",
      "Profile optimization tips",
      "Commercial usage rights",
    ],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    price: 149,
    photos: 50,
    outfits: 8,
    features: [
      "50 professional headshots",
      "8 outfit styles",
      "Unlimited backgrounds",
      "6-hour express delivery",
      "15 lifestyle location shots",
      "Complete social media pack",
      "Dating profile kit",
      "Team discounts available",
      "Commercial usage rights",
    ],
  },
];

export const UPSELLS: Upsell[] = [
  {
    id: "real_estate",
    name: "Real Estate Power-Up",
    price: 59,
    description: "Luxury backdrops, 'Sold' signs, property settings",
    icon: Building2,
    forIndustries: ["real_estate"],
  },
  {
    id: "tradie",
    name: "Tradie Bundle",
    price: 49,
    description: "On-site gear, high-vis vests, tools & workshop settings",
    icon: Wrench,
    forIndustries: ["tradie"],
  },
  {
    id: "healthcare",
    name: "Healthcare Pack",
    price: 49,
    description: "Clinical settings, lab coats, medical environments",
    icon: Stethoscope,
    forIndustries: ["healthcare"],
  },
  {
    id: "creative",
    name: "Creative Studio",
    price: 45,
    description: "Studio aesthetic, urban settings, artistic backdrops",
    icon: Palette,
    forIndustries: ["creative"],
  },
  {
    id: "bio_suite",
    name: "Bio Suite",
    price: 29,
    description: "Professional bio writing + optimized captions",
    icon: FileText,
    isAddon: true,
  },
  {
    id: "rush_3h",
    name: "3-Hour Rush",
    price: 25,
    description: "Priority processing with 3-hour delivery",
    icon: Zap,
    isAddon: true,
  },
];

export const INDUSTRIES: Industry[] = [
  { id: "corporate", name: "Corporate", icon: Building2 },
  { id: "real_estate", name: "Real Estate", icon: Building2, suggestedUpsell: "real_estate" },
  { id: "tradie", name: "Tradie", icon: Wrench, suggestedUpsell: "tradie" },
  { id: "healthcare", name: "Healthcare", icon: Stethoscope, suggestedUpsell: "healthcare" },
  { id: "creative", name: "Creative", icon: Palette, suggestedUpsell: "creative" },
];

export const getPackageById = (id: PackageId): Package | undefined =>
  PACKAGES.find((p) => p.id === id);

export const getUpsellById = (id: UpsellId): Upsell | undefined =>
  UPSELLS.find((u) => u.id === id);

export const getIndustryById = (id: IndustryId): Industry | undefined =>
  INDUSTRIES.find((i) => i.id === id);

export const getUpsellsForIndustry = (industryId: IndustryId): Upsell[] => {
  return UPSELLS.filter((u) => {
    if (u.isAddon) return true; // Add-ons always available
    if (!u.forIndustries) return true; // No restriction
    return u.forIndustries.includes(industryId);
  });
};

export const getIndustryUpsell = (industryId: IndustryId): Upsell | undefined => {
  const industry = getIndustryById(industryId);
  if (!industry?.suggestedUpsell) return undefined;
  return getUpsellById(industry.suggestedUpsell);
};
