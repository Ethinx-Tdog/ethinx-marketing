export type Pair = { before: string; after: string; alt: string };
export type StyleBlock = {
  id: "jobseeker" | "realestate" | "tradie" | "health" | "dreamscene";
  label: string;
  male: Pair[];
  female: Pair[];
};

// Personal/featured examples (Nicole, Luke, Jimmy, etc.)
export const featuredExamples: Pair[] = [
  { before: "/examples/nicole/before.jpg", after: "/examples/nicole/after.jpg", alt: "Nicole before and after" },
  { before: "/examples/jimmy/before.jpg", after: "/examples/jimmy/after.jpg", alt: "Jimmy before and after" },
  { before: "/examples/luke/before.jpg", after: "/examples/luke/after.jpg", alt: "Luke before and after" },
  { before: "/examples/cody/before.jpg", after: "/examples/cody/after.jpg", alt: "Cody before and after" },
  { before: "/examples/boys/before.jpg", after: "/examples/boys/after.jpg", alt: "Boys before and after" },
  { before: "/examples/brian/before.jpg", after: "/examples/brian/after.jpg", alt: "Brian before and after" },
];

// Industry-specific styles - using flat folder structure
export const styles: StyleBlock[] = [
  {
    id: "tradie",
    label: "Tradie",
    male: [
      {
        before: "/examples/tradie-male/before.jpg",
        after: "/examples/tradie-male/after.jpg",
        alt: "Tradie male before and after",
      },
    ],
    female: [], // No tradie female examples yet
  },
  {
    id: "dreamscene",
    label: "Dream Scene",
    male: [
      {
        before: "/examples/creative-male/before.jpg",
        after: "/examples/creative-male/after.jpg",
        alt: "Dream Scene male before and after",
      },
    ],
    female: [
      {
        before: "/examples/creative-female/before.jpg",
        after: "/examples/creative-female/after.jpg",
        alt: "Dream Scene female before and after",
      },
    ],
  },
  {
    id: "jobseeker",
    label: "Job Seeker",
    male: [
      {
        before: "/examples/corporate-male/before.jpg",
        after: "/examples/corporate-male/after.jpg",
        alt: "Job Seeker male before and after",
      },
    ],
    female: [
      {
        before: "/examples/corporate-female/before.jpg",
        after: "/examples/corporate-female/after.png",
        alt: "Job Seeker female before and after",
      },
    ],
  },
  {
    id: "realestate",
    label: "Real Estate",
    male: [], // No real estate male examples yet
    female: [
      {
        before: "/examples/realestate-female/before.jpg",
        after: "/examples/realestate-female/after.jpg",
        alt: "Real estate female before and after",
      },
    ],
  },
  {
    id: "health",
    label: "Health",
    male: [
      {
        before: "/examples/health-male/before.jpg",
        after: "/examples/health-male/after.jpg",
        alt: "Health male before and after",
      },
    ],
    female: [
      {
        before: "/examples/health-female/before.jpg",
        after: "/examples/health-female/after.png",
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
