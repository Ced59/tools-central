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

// Cache persistant (survit aux re-run de i18n:aggregate)
const CACHE_DIR = path.resolve("dist/i18n/cache");

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0;

// Au lieu d'1 requête par string => 1 requête par batch
const BATCH_SIZE = 25;

// Concurrence par locale : avec le batching, inutile de monter haut.
// Mets 1 pour le plus stable (surtout si tu as beaucoup de locales).
const MAX_CONCURRENT_BATCHES = 1;

// Retry/backoff
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 600; // base backoff
const MAX_DELAY_MS = 30_000;

// Sécurité prompt: évite les réponses énormes
const MAX_INPUT_CHARS_PER_ITEM = 1200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function jitter(ms) {
  // +/- 20%
  const j = ms * 0.2;
  return ms + (Math.random() * 2 - 1) * j;
}

// -------------------------
// Helpers items
// -------------------------
function needsTranslation(item) {
  return (
    !item.translatedTarget ||
    (typeof item.translatedTarget === "string" && item.translatedTarget.trim() === "")
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
  if (item.source && typeof item.source === "object") {
    item.translatedTarget = { ...item.source, "#text": translatedText };
  }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function cachePathForLocale(locale) {
  return path.join(CACHE_DIR, `${locale}.json`);
}

function loadCache(locale) {
  ensureDir(CACHE_DIR);
  const p = cachePathForLocale(locale);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) ?? {};
  } catch {
    return {};
  }
}

function saveCache(locale, cacheObj) {
  ensureDir(CACHE_DIR);
  fs.writeFileSync(cachePathForLocale(locale), JSON.stringify(cacheObj, null, 2), "utf8");
}

// -------------------------
// OpenAI call (batch)
// -------------------------
async function translateBatch(batch, sourceLang, targetLang) {
  // batch: [{ id, text }]
  // On demande un JSON strict et on valide.
  const prompt = [
    `Translate from ${sourceLang} to ${targetLang}.`,
    "",
    "Rules:",
    "- keep exact meaning",
    "- neutral UX / SEO tone",
    "- short sentences when possible",
    "- keep punctuation and numbers",
    "- do NOT add explanations",
    "- Output MUST be valid JSON only",
    "",
    "Return format:",
    `{ "translations": [ { "id": "…", "text": "…" } ] }`,
    "",
    "Items:"
  ].join("\n");

  const body = {
    model: MODEL,
    temperature: TEMPERATURE,
    messages: [
      { role: "system", content: "You are a professional software localization translator." },
      {
        role: "user",
        content:
          prompt +
          "\n" +
          JSON.stringify(
            {
              items: batch.map((x) => ({ id: x.id, text: x.text })),
            },
            null,
            2
          ),
      },
    ],
  };

  let attempt = 0;

  while (true) {
    attempt++;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      const content = (json?.choices?.[0]?.message?.content ?? "").trim();

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // Réponse non-JSON => on retente (ça arrive)
        if (attempt >= MAX_RETRIES) {
          throw new Error(`Non-JSON response after ${attempt} attempts: ${content.slice(0, 500)}`);
        }
        const delay = clamp(jitter(BASE_DELAY_MS * 2 ** (attempt - 1)), BASE_DELAY_MS, MAX_DELAY_MS);
        await sleep(delay);
        continue;
      }

      const arr = parsed?.translations;
      if (!Array.isArray(arr)) {
        if (attempt >= MAX_RETRIES) {
          throw new Error(`Invalid JSON schema: missing translations[]`);
        }
        const delay = clamp(jitter(BASE_DELAY_MS * 2 ** (attempt - 1)), BASE_DELAY_MS, MAX_DELAY_MS);
        await sleep(delay);
        continue;
      }

      // Map id -> text
      const map = {};
      for (const t of arr) {
        if (t && typeof t.id === "string" && typeof t.text === "string") {
          map[t.id] = t.text;
        }
      }

      return map;
    }

    // Not ok: retry with backoff
    const status = res.status;
    const errText = await res.text();

    // Respect Retry-After if present
    const ra = res.headers.get("retry-after");
    const retryAfterMs = ra ? clamp(Number(ra) * 1000, 0, MAX_DELAY_MS) : null;

    const isRetryable =
      status === 429 || status === 500 || status === 502 || status === 503 || status === 504;

    if (!isRetryable || attempt >= MAX_RETRIES) {
      throw new Error(`OpenAI error ${status}: ${errText}`);
    }

    const backoff = clamp(
      jitter(BASE_DELAY_MS * 2 ** (attempt - 1)),
      BASE_DELAY_MS,
      MAX_DELAY_MS
    );
    const delay = retryAfterMs != null ? Math.max(retryAfterMs, backoff) : backoff;

    console.warn(`⚠️ OpenAI ${status} (attempt ${attempt}/${MAX_RETRIES}) -> wait ${Math.round(delay)}ms`);
    await sleep(delay);
  }
}

// -------------------------
// Simple pool for batches (per locale)
// -------------------------
async function runPool(tasks, limit) {
  const executing = [];
  for (const task of tasks) {
    const p = task().finally(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= limit) await Promise.race(executing);
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

const files = fs.readdirSync(TODO_DIR).filter((f) => f.endsWith(".todo.json"));

for (const file of files) {
  const filePath = path.join(TODO_DIR, file);
  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const { locale, sourceLocale, items } = payload;
  if (!locale || !Array.isArray(items)) continue;

  console.log(`\n🌍 Translating ${locale} (${items.length} items)`);

  // 1) Load persistent cache
  const cache = loadCache(locale);

  // 2) Pre-fill from cache to avoid re-requests even if todo was re-generated
  let cacheHits = 0;
  for (const it of items) {
    if (!needsTranslation(it)) continue;
    const id = it.id;
    if (id && cache[id]) {
      applyTranslation(it, cache[id]);
      cacheHits++;
    }
  }
  if (cacheHits > 0) {
    console.log(`🧠 ${locale}: restored ${cacheHits} translations from cache`);
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  }

  // Build list of remaining items to translate
  const remaining = items
    .filter(needsTranslation)
    .map((it) => {
      const src = extractPlainText(it.source).trim();
      return { it, id: it.id, src };
    })
    .filter((x) => x.src && x.id);

  const totalToTranslate = remaining.length;
  if (totalToTranslate === 0) {
    console.log(`✅ ${locale}: nothing to translate`);
    continue;
  }

  // Chunk into batches
  const batches = [];
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const slice = remaining.slice(i, i + BATCH_SIZE).map((x) => ({
      id: x.id,
      text: x.src.slice(0, MAX_INPUT_CHARS_PER_ITEM),
      ref: x.it,
    }));
    batches.push(slice);
  }

  let doneCount = 0;
  const totalBatches = batches.length;

  const tasks = batches.map((batch, batchIndex) => async () => {
    const start = doneCount + 1;
    const end = doneCount + batch.length;

    console.log(
      `📝 ${locale} - Traduction ${start}/${totalToTranslate} → ${end}/${totalToTranslate} (batch ${
        batchIndex + 1
      }/${totalBatches})`
    );

    const map = await translateBatch(
      batch.map((b) => ({ id: b.id, text: b.text })),
      sourceLocale,
      locale
    );

    // Apply + cache
    for (const b of batch) {
      const tr = map[b.id];
      if (typeof tr === "string" && tr.trim()) {
        applyTranslation(b.ref, tr.trim());
        cache[b.id] = tr.trim();
      }
    }

    doneCount += batch.length;

    // Checkpoint after every batch (crash-safe)
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
    saveCache(locale, cache);
  });

  await runPool(tasks, MAX_CONCURRENT_BATCHES);

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
  saveCache(locale, cache);

  console.log(`✅ ${locale} done (${totalToTranslate} translated)`);
}

console.log("\n🎉 i18n auto-translation finished");
