import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function NotFound() {
  return (
    <>
      <SEO title="Page Not Found" description="The page you're looking for doesn't exist." />
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h1 className="text-8xl md:text-9xl font-display font-bold text-gradient-gold mb-4">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">
          Page not found
        </h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-gold"
        >
          <Home className="h-5 w-5" />
          Back to Home
        </Link>
      </main>
    </>
  );
}
