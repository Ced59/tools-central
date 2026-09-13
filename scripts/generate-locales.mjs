import fs from "node:fs";

const angularJsonPath = new URL("../angular.json", import.meta.url);
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, "utf-8"));

const project = angularJson.projects["tools-central"];
const sourceLocale = project.i18n?.sourceLocale ?? "fr";
const locales = Object.keys(project.i18n?.locales ?? {});

// On inclut la sourceLocale (fr) en tête
const all = [sourceLocale, ...locales].filter((v, i, a) => a.indexOf(v) === i);

// Nom natif de chaque langue.
const meta = {
  "fr": { name: "Français" },
  "en": { name: "English" },
  "es": { name: "Español" },
  "de": { name: "Deutsch" },
  "it": { name: "Italiano" },
  "nl": { name: "Nederlands" },

  "sv": { name: "Svenska" },
  "da": { name: "Dansk" },
  "no": { name: "Norsk" },
  "fi": { name: "Suomi" },

  "pl": { name: "Polski" },
  "cs": { name: "Čeština" },
  "sk": { name: "Slovenčina" },
  "ro": { name: "Română" },
  "hu": { name: "Magyar" },
  "tr": { name: "Türkçe" },

  "id": { name: "Bahasa Indonesia" },
  "vi": { name: "Tiếng Việt" },
  "sw": { name: "Kiswahili" },
  "af": { name: "Afrikaans" },
  "fil": { name: "Filipino" },

  "pt-BR": { name: "Português (Brasil)" },
  "pt-PT": { name: "Português (Portugal)" },

  "ru": { name: "Русский" },
  "uk": { name: "Українська" },
  "bg": { name: "Български" },
  "el": { name: "Ελληνικά" },

  "ja": { name: "日本語" },
  "ko": { name: "한국어" },
  "zh-Hans": { name: "中文（简体）" }
};


const content = `/* AUTO-GENERATED — do not edit by hand */
export type AppLocale = ${all.map(l => JSON.stringify(l)).join(" | ")};

export interface LocaleOption {
  locale: AppLocale;
  nameNative: string;
}

export const LOCALES: readonly LocaleOption[] = ${JSON.stringify(
  all.map(l => ({
    locale: l,
    nameNative: meta[l]?.name ?? l
  })),
  null,
  2
)} as const;
`;


fs.mkdirSync(new URL("../src/app/i18n", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../src/app/i18n/locales.generated.ts", import.meta.url), content, "utf-8");

console.log(`[i18n] generated locales: ${all.join(", ")}`);
