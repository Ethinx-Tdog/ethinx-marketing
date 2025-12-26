import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

const NotFound = () => {
  return (
    <>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist."
      />
      <section className="py-32 text-center">
        <div className="container">
          <h1 className="font-display text-6xl md:text-8xl font-bold text-gradient-gold mb-6">
            404
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Page not found
          </p>
          <Button variant="gold" size="lg" asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default NotFound;
