import { IndustryPage } from "@/components/IndustryPage";

const JobSeekerHeadshots = () => (
  <IndustryPage
    title="Job Seeker Headshots"
    metaDescription="Professional headshots for job seekers. Make your application stand out."
    headline="Headshots That Land Interviews"
    subheadline="Your photo can make or break that first impression. Look interview-ready."
    benefits={["Stand out on applications", "Project confidence", "Affordable career investment"]}
    testimonial={{ quote: "Started getting callbacks within days of updating my photo.", author: "Alex W.", role: "Recent Graduate" }}
  />
);

export default JobSeekerHeadshots;
