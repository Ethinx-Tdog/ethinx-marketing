export type Pair = { before: string; after: string; alt: string };
export type StyleBlock = {
  id: "corporate" | "realestate" | "tradie" | "health" | "creative";
  label: string;
  male: Pair[];
  female: Pair[];
};

// Personal/featured examples (Nicole, Luke, Jimmy, etc.)
export const featuredExamples: Pair[] = [
  { before: "/examples/nicole/before.jpg", after: "/examples/nicole/after.jpg", alt: "Nicole before and after" },
  { before: "/examples/jimmy/before.jpg", after: "/examples/jimmy/after.jpg", alt: "Jimmy before and after" },
  { before: "/examples/luke/before (1).jpg", after: "/examples/luke/after.jpg", alt: "Luke before and after" },
  { before: "/examples/cody/before.jpg", after: "/examples/cody/after.jpg", alt: "Cody before and after" },
  { before: "/examples/boys/before.jpg", after: "/examples/boys/after.jpg", alt: "Boys before and after" },
  { before: "/examples/brian/before.jpg", after: "/examples/brian/after (1).jpg", alt: "Brian before and after" },
];

// Industry-specific styles (behind tiles/buttons)
export const styles: StyleBlock[] = [
  {
    id: "tradie",
    label: "Tradie",
    male: [
      {
        before: "/examples/tradie/male/tradie_male_before.jpg",
        after: "/examples/tradie/male/tradie_male_after.jpg",
        alt: "Tradie male before and after",
      },
    ],
    female: [],
  },
  {
    id: "creative",
    label: "Creative",
    male: [
      {
        before: "/examples/creative/male/creative_male_before.jpg",
        after: "/examples/creative/male/creative_male_after.jpg",
        alt: "Creative male before and after",
      },
    ],
    female: [
      {
        before: "/examples/creative/female/creative_female_before.jpg",
        after: "/examples/creative/female/creative_female_after.jpg",
        alt: "Creative female before and after",
      },
    ],
  },
  {
    id: "corporate",
    label: "Corporate",
    male: [
      {
        before: "/examples/corporate/male/corporate_male_before.jpg",
        after: "/examples/corporate/male/corporate_male_after.jpg",
        alt: "Corporate male before and after",
      },
    ],
    female: [
      {
        before: "/examples/corporate/female/corporate_female_before.jpg",
        after: "/examples/corporate/female/corporate_female_after.png",
        alt: "Corporate female before and after",
      },
    ],
  },
  {
    id: "realestate",
    label: "Real Estate",
    male: [],
    female: [
      {
        before: "/examples/realestate/female/realestate_female_before.jpg",
        after: "/examples/realestate/female/realestate_female_after.jpg",
        alt: "Real estate female before and after",
      },
    ],
  },
  {
    id: "health",
    label: "Health",
    male: [
      {
        before: "/examples/health/male/health_male_before.jpg",
        after: "/examples/health/male/health_male_after.jpg",
        alt: "Health male before and after",
      },
    ],
    female: [
      {
        before: "/examples/health/female/health_female_before.jpg",
        after: "/examples/health/female/health_female_after.png",
        alt: "Health female before and after",
      },
    ],
  },
];

// Legacy export for backward compatibility
export const examplePairs = featuredExamples.map((p) => ({
  before: p.before,
  after: p.after,
}));
