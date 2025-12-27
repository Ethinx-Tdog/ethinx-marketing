export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating: 5;
}

export const testimonials: Testimonial[] = [
  {
    name: "Sarah M.",
    role: "Marketing Director",
    quote: "Incredible quality! My LinkedIn profile has never looked more professional. Got 3x more recruiter messages within a week.",
    rating: 5,
  },
  {
    name: "James T.",
    role: "Real Estate Agent",
    quote: "As a real estate agent, first impressions are everything. These headshots helped me close 2 more deals last month.",
    rating: 5,
  },
  {
    name: "Mike R.",
    role: "Software Engineer",
    quote: "Finally, professional photos I'm proud of. The quality is studio-level but I didn't have to leave my house.",
    rating: 5,
  },
  {
    name: "Emma L.",
    role: "Healthcare Professional",
    quote: "T-DOG certified means it actually looks like me. Other AI tools made me look like a stranger. ETHINX nailed it.",
    rating: 5,
  },
];
