import { IndustryPage } from "@/components/IndustryPage";

const JobSeekerHeadshots = () => {
  return (
    <IndustryPage
      title="Job Seeker Headshots - Make Your Application Stand Out"
      metaDescription="Professional headshots for job seekers. Make a great first impression on applications and increase your chances of landing interviews."
      headline="Headshots That Land Interviews"
      subheadline="In a competitive job market, your photo can make or break that first impression. Get professional headshots that show you're ready for the role."
      benefits={[
        "Make your resume and LinkedIn stand out",
        "Project confidence and professionalism",
        "Industry-appropriate styling options",
        "Affordable way to invest in your career",
      ]}
      beforeImage="https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop"
      afterImage="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop"
      testimonial={{
        quote: "After months of job searching, I updated my photo and started getting callbacks within days. It made such a difference.",
        author: "Alex Williams",
        role: "Recent Graduate",
      }}
    />
  );
};

export default JobSeekerHeadshots;
