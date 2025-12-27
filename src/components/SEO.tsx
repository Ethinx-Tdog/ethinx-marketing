import { Helmet } from "react-helmet-async";
import { BRAND } from "@/lib/brand";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

export function SEO({
  title,
  description,
  canonical,
  ogImage = BRAND.LOGO,
}: SEOProps) {
  const fullTitle = title.includes("ETHINX") ? title : `${title} | ETHINX`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}

export default SEO;
