import { Star } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  industry: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "Incredible quality! My LinkedIn profile has never looked more professional. Got 3x more recruiter messages within a week.",
    author: "Sarah M.",
    role: "Marketing Director",
    industry: "LinkedIn",
    rating: 5,
  },
  {
    quote: "As a real estate agent, first impressions are everything. These headshots helped me close 2 more deals last month.",
    author: "James T.",
    role: "Real Estate Agent",
    industry: "Real Estate",
    rating: 5,
  },
  {
    quote: "Finally, dating profile photos I'm proud of. Matched with my now-girlfriend within the first week!",
    author: "Mike R.",
    role: "Software Engineer",
    industry: "Dating",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {testimonials.map((testimonial, idx) => (
        <div
          key={idx}
          className="flex flex-col p-6 lg:p-8 rounded-2xl bg-card border border-border hover-lift"
        >
          {/* Rating */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-primary text-primary" />
            ))}
          </div>

          {/* Quote */}
          <blockquote className="flex-1 text-foreground mb-6">
            "{testimonial.quote}"
          </blockquote>

          {/* Author */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {testimonial.author.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-foreground">{testimonial.author}</p>
              <p className="text-sm text-muted-foreground">{testimonial.role}</p>
            </div>
          </div>

          {/* Industry tag */}
          <div className="mt-4 pt-4 border-t border-border">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
              {testimonial.industry}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
