import { IndustryPage } from "@/components/IndustryPage";

const JobSeekerHeadshots = () => (
  <IndustryPage
    title="Job Seeker Headshots"
    metaDescription="Professional headshots for job seekers. Make your application stand out."
    headline="Headshots That Land Interviews"
    subheadline="Your photo can make or break that first impression. Look interview-ready."
    benefits={["Stand out on applications", "Project confidence", "Affordable career investment"]}
    beforeImage="https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop"
    afterImage="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop"
    testimonial={{ quote: "Started getting callbacks within days of updating my photo.", author: "Alex W.", role: "Recent Graduate" }}
  />
);

export default JobSeekerHeadshots;
