export type Pair = { before: string; after: string; alt: string };
export type StyleBlock = {
  id: "corporate" | "realestate" | "tradie" | "health" | "creative";
  label: string;
  male: Pair[];
  female: Pair[];
};

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
export const examplePairs = styles.flatMap((style) => [
  ...style.male.map((p) => ({ before: p.before, after: p.after })),
  ...style.female.map((p) => ({ before: p.before, after: p.after })),
]);
