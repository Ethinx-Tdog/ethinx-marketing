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
          className="flex flex-col p-6 lg:p-8 rounded-2xl bg-secondary/50 border border-border/50 hover-lift"
        >
          <div className="flex gap-1 mb-4">
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-gold text-gold" />
            ))}
          </div>

          <blockquote className="flex-1 text-foreground mb-6 leading-relaxed">
            "{testimonial.quote}"
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-full bg-gold/20 flex items-center justify-center">
              <span className="text-base font-semibold text-gold">
                {testimonial.author.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{testimonial.author}</p>
              <p className="text-xs text-muted-foreground">{testimonial.role}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/30">
            <span className="text-xs font-medium text-gold bg-gold/10 px-2.5 py-1 rounded-full">
              {testimonial.industry}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Testimonials;
