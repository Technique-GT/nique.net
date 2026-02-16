import { useEffect } from "react";

type SeoProps = {
  title: string;
  description?: string;
  canonicalPath?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  structuredData?: Record<string, unknown>;
};

const SITE_URL = ((import.meta.env.VITE_SITE_URL as string | undefined) || "https://nique.net").replace(/\/+$/, "");

const DEFAULT_DESCRIPTION = "Technique is Georgia Tech's independent student newspaper covering campus news, life, sports, entertainment, and opinion.";

const toAbsoluteUrl = (value?: string) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return `${SITE_URL}/${value}`;
};

const upsertMeta = (attribute: "name" | "property", key: string, content: string) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
};

const upsertLink = (rel: string, href: string) => {
  let element = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.appendChild(element);
  }
  element.href = href;
};

function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = window.location.pathname,
  image,
  type = "website",
  noindex = false,
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const canonical = toAbsoluteUrl(canonicalPath) || SITE_URL;
    const imageUrl = toAbsoluteUrl(image);
    const fullTitle = `${title} | Technique`;

    document.title = fullTitle;

    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:site_name", "Technique");
    if (imageUrl) upsertMeta("property", "og:image", imageUrl);

    upsertMeta("name", "twitter:card", imageUrl ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", description);
    if (imageUrl) upsertMeta("name", "twitter:image", imageUrl);

    upsertLink("canonical", canonical);

    const existingJsonLd = document.head.querySelector("#nique-seo-jsonld");
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    if (structuredData) {
      const script = document.createElement("script");
      script.id = "nique-seo-jsonld";
      script.type = "application/ld+json";
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

    return () => {
      const jsonLdScript = document.head.querySelector("#nique-seo-jsonld");
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    };
  }, [title, description, canonicalPath, image, type, noindex, structuredData]);

  return null;
}

export default Seo;
