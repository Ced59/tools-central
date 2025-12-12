import fs from "node:fs";

const angularJsonPath = new URL("../angular.json", import.meta.url);
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, "utf-8"));

const project = angularJson.projects["tools-central"];
const sourceLocale = project.i18n?.sourceLocale ?? "fr";
const locales = Object.keys(project.i18n?.locales ?? {});

// On inclut la sourceLocale (fr) en tête
const all = [sourceLocale, ...locales].filter((v, i, a) => a.indexOf(v) === i);

// Nom natif + drapeau (flag-icons utilise des codes pays)
const meta = {
  "fr": { name: "Français", flag: "fr" },
  "en": { name: "English", flag: "gb" },
  "es": { name: "Español", flag: "es" },
  "de": { name: "Deutsch", flag: "de" },
  "it": { name: "Italiano", flag: "it" },
  "nl": { name: "Nederlands", flag: "nl" },

  "sv": { name: "Svenska", flag: "se" },
  "da": { name: "Dansk", flag: "dk" },
  "no": { name: "Norsk", flag: "no" },
  "fi": { name: "Suomi", flag: "fi" },

  "pl": { name: "Polski", flag: "pl" },
  "cs": { name: "Čeština", flag: "cz" },
  "sk": { name: "Slovenčina", flag: "sk" },
  "ro": { name: "Română", flag: "ro" },
  "hu": { name: "Magyar", flag: "hu" },
  "tr": { name: "Türkçe", flag: "tr" },

  "id": { name: "Bahasa Indonesia", flag: "id" },
  "vi": { name: "Tiếng Việt", flag: "vn" },
  "sw": { name: "Kiswahili", flag: "ke" },
  "af": { name: "Afrikaans", flag: "za" },
  "fil": { name: "Filipino", flag: "ph" },

  "pt-BR": { name: "Português (Brasil)", flag: "br" },
  "pt-PT": { name: "Português (Portugal)", flag: "pt" },

  "ru": { name: "Русский", flag: "ru" },
  "uk": { name: "Українська", flag: "ua" },
  "bg": { name: "Български", flag: "bg" },
  "el": { name: "Ελληνικά", flag: "gr" },

  "ja": { name: "日本語", flag: "jp" },
  "ko": { name: "한국어", flag: "kr" },
  "zh-Hans": { name: "中文（简体）", flag: "cn" }
};


const content = `/* AUTO-GENERATED — do not edit by hand */
export type AppLocale = ${all.map(l => JSON.stringify(l)).join(" | ")};

export interface LocaleOption {
  locale: AppLocale;
  nameNative: string;
  flag: string;
}

export const LOCALES: readonly LocaleOption[] = ${JSON.stringify(
  all.map(l => ({
    locale: l,
    nameNative: meta[l]?.name ?? l,
    flag: meta[l]?.flag ?? "un"
  })),
  null,
  2
)} as const;
`;


fs.mkdirSync(new URL("../src/app/i18n", import.meta.url), { recursive: true });
fs.writeFileSync(new URL("../src/app/i18n/locales.generated.ts", import.meta.url), content, "utf-8");

console.log(`[i18n] generated locales: ${all.join(", ")}`);
