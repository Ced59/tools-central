// scripts/i18n-translate.mjs
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY missing (local only)");
  process.exit(1);
}

const TODO_DIR = path.resolve("dist/i18n/todo");
const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0;
const MAX_CONCURRENT = 3;

// -------------------------
// OpenAI call
// -------------------------
async function translateText(text, sourceLang, targetLang) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: TEMPERATURE,
      messages: [
        {
          role: "system",
          content: "You are a professional software localization translator."
        },
        {
          role: "user",
          content: `
Translate from ${sourceLang} to ${targetLang}.

Rules:
- keep exact meaning
- neutral UX / SEO tone
- short sentences
- no explanations
- return ONLY the translated text

Text:
${text}
          `.trim()
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${err}`);
  }

  const json = await res.json();
  return json.choices[0].message.content.trim();
}

// -------------------------
// Helpers
// -------------------------
function needsTranslation(item) {
  return (
    !item.translatedTarget ||
    (typeof item.translatedTarget === "string" &&
      item.translatedTarget.trim() === "")
  );
}

function extractPlainText(source) {
  if (typeof source === "string") return source;
  if (source && typeof source === "object") return source["#text"] ?? "";
  return "";
}

function applyTranslation(item, translatedText) {
  if (typeof item.source === "string") {
    item.translatedTarget = translatedText;
    return;
  }

  // rich XLF object
  if (item.source && typeof item.source === "object") {
    item.translatedTarget = {
      ...item.source,
      "#text": translatedText
    };
  }
}

// -------------------------
// Simple concurrency pool
// -------------------------
async function runPool(tasks, limit) {
  const executing = [];

  for (const task of tasks) {
    const p = task().finally(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);

    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

// -------------------------
// Main
// -------------------------
if (!fs.existsSync(TODO_DIR)) {
  console.error(`❌ Missing ${TODO_DIR} (run i18n:aggregate first)`);
  process.exit(1);
}

const files = fs
  .readdirSync(TODO_DIR)
  .filter(f => f.endsWith(".todo.json"));

for (const file of files) {
  const filePath = path.join(TODO_DIR, file);
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { locale, sourceLocale, items } = payload;
  if (!locale || !Array.isArray(items)) continue;

  console.log(`🌍 Translating ${locale} (${items.length} items)`);

  const tasks = items
    .filter(needsTranslation)
    .map(item => async () => {
      const src = extractPlainText(item.source).trim();
      if (!src) return;

      const translated = await translateText(src, sourceLocale, locale);
      applyTranslation(item, translated);
    });

  await runPool(tasks, MAX_CONCURRENT);

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  console.log(`✅ ${locale} done`);
}

console.log("🎉 i18n auto-translation finished");
