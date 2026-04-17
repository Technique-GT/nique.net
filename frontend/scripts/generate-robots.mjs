import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowIndexing = (process.env.VITE_ALLOW_INDEXING || "").toLowerCase() === "true";
const robotsPath = path.resolve(__dirname, "../public/robots.txt");

const robotsContent = allowIndexing
  ? "User-agent: *\nAllow: /\n\nSitemap: https://nique.net/sitemap.xml\n"
  : "User-agent: *\nDisallow: /\n";

fs.writeFileSync(robotsPath, robotsContent, "utf8");
console.log(
  `[generate-robots] ${allowIndexing ? "indexable" : "blocked"} policy written to ${robotsPath}`,
);
