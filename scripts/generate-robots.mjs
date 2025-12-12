import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");
const SITE = "https://tools-central.com";

fs.mkdirSync(DIST_DIR, { recursive: true });

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;

fs.writeFileSync(path.join(DIST_DIR, "robots.txt"), robots, "utf8");
console.log("✅ wrote dist/tools-central/browser/robots.txt");
