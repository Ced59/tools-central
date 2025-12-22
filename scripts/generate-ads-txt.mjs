import fs from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist/tools-central/browser");

// 🔐 AdSense publisher ID
const ADSENSE_PUBLISHER_ID = "pub-7680533428401775";

// Ligne officielle Google (ne change jamais)
const ADS_TXT = `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0
`;

fs.mkdirSync(DIST_DIR, { recursive: true });
fs.writeFileSync(path.join(DIST_DIR, "ads.txt"), ADS_TXT, "utf8");

console.log("✅ wrote dist/tools-central/browser/ads.txt");
