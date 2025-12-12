import fs from "node:fs";
import path from "node:path";

/**
 * Charge angular.json et extrait la config i18n du projet tools-central
 */
const angularJsonPath = path.resolve("angular.json");
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, "utf8"));

const projectName = "tools-central";
const project = angularJson.projects?.[projectName];

if (!project) {
  console.error(`[i18n-init] project "${projectName}" not found in angular.json`);
  process.exit(1);
}

const i18n = project.i18n;

if (!i18n?.locales || !i18n?.sourceLocale) {
  console.error(`[i18n-init] missing i18n.locales or sourceLocale in angular.json`);
  process.exit(1);
}

const sourceLocale = i18n.sourceLocale;
const locales = Object.keys(i18n.locales);

const outDir = path.resolve("src/locale");
const sourceFile = path.join(outDir, `messages.${sourceLocale}.xlf`);

if (!fs.existsSync(sourceFile)) {
  console.error(`[i18n-init] missing source file: ${sourceFile}`);
  process.exit(1);
}

const source = fs.readFileSync(sourceFile, "utf8");

console.log(`[i18n-init] source locale: ${sourceLocale}`);
console.log(`[i18n-init] target locales: ${locales.join(", ")}`);

for (const locale of locales) {
  if (locale === sourceLocale) continue;

  const target = path.join(outDir, `messages.${locale}.xlf`);

  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, source, "utf8");
    console.log(`[i18n-init] created ${target}`);
  } else {
    console.log(`[i18n-init] exists ${target}`);
  }
}
