// scripts/i18n-translate.mjs
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

// =====================================================================================
// Config
// =====================================================================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY missing (local only)");
  process.exit(1);
}

const TODO_DIR = path.resolve("dist/i18n/todo");

// Cache persistant (survit aux re-run de i18n:aggregate)
const CACHE_DIR = path.resolve("dist/i18n/cache");

// OpenAI
const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0;

// Au lieu d'1 requête par string => 1 requête par batch
const BATCH_SIZE = 25;

// Concurrence par locale
const MAX_CONCURRENT_BATCHES = 1;

// Retry/backoff
const MAX_RETRIES = 8;
const BASE_DELAY_MS = 600;
const MAX_DELAY_MS = 30_000;

// Timeout explicite
const REQUEST_TIMEOUT_MS = 60_000;

// Si un batch renvoie un tableau de taille différente, on retente "strict" N fois
const MAX_MISMATCH_RETRIES = 2;

// Dernier recours : si toujours mismatch, on traduit item par item ce batch
const FALLBACK_ITEM_BY_ITEM = true;

// Prompt
const SYSTEM_PROMPT = `
You are a professional software localization translator.

Rules:
- Translate naturally for the target locale.
- Preserve placeholders, variables, HTML tags, and ICU-like syntax exactly.
- Do not add extra explanations, punctuation, or quotes.
- Return ONLY valid JSON according to the required format.
`.trim();

// =====================================================================================
// Helpers
// =====================================================================================
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function listTodoFiles() {
  if (!fs.existsSync(TODO_DIR)) return [];
  return fs
    .readdirSync(TODO_DIR)
    .filter((f) => f.endsWith(".todo.json"))
    .map((f) => path.join(TODO_DIR, f));
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

// --- Extract plain text from aggregate format (best effort) ---
function extractPlainText(sourceNode) {
  if (!sourceNode) return "";

  if (typeof sourceNode === "string") return sourceNode;

  if (typeof sourceNode === "object" && typeof sourceNode["#text"] === "string") {
    return sourceNode["#text"];
  }

  if (typeof sourceNode === "object") {
    let out = "";
    for (const [k, v] of Object.entries(sourceNode)) {
      if (k === "#text" && typeof v === "string") out += v;
      else if (Array.isArray(v)) for (const it of v) out += extractPlainText(it);
      else if (typeof v === "object" && v) out += extractPlainText(v);
    }
    return out;
  }

  return "";
}

// --- FNV-1a 32-bit for cache invalidation ---
function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function getSourceHash(item) {
  const src = extractPlainText(item?.source).trim();
  return hashString(src);
}

function needsTranslation(item) {
  // needs-review => retraduction forcée
  if (item?.status === "needs-review") return true;
  return !isNonEmptyString(item?.translatedTarget);
}

function applyTranslation(item, text) {
  item.translatedTarget = text;
}

function getLocaleFromTodoFile(todoFilePath) {
  const base = path.basename(todoFilePath);
  const m = base.match(/^(.+)\.todo\.json$/);
  return m ? m[1] : base;
}

// =====================================================================================
// Cache: id -> { text, srcHash } (migration douce: accepte aussi id -> "text")
// =====================================================================================
function cachePathForLocale(locale) {
  ensureDir(CACHE_DIR);
  return path.join(CACHE_DIR, `${locale}.cache.json`);
}

function loadCache(locale) {
  const p = cachePathForLocale(locale);
  if (!fs.existsSync(p)) return {};
  try {
    return readJson(p);
  } catch {
    return {};
  }
}

function saveCache(locale, cacheObj) {
  const p = cachePathForLocale(locale);
  writeJson(p, cacheObj);
}

function readCacheEntry(cacheObj, id) {
  const entry = cacheObj?.[id];
  if (!entry) return null;

  if (typeof entry === "string") return { text: entry, srcHash: null, legacy: true };

  if (typeof entry === "object" && entry && typeof entry.text === "string") {
    return { text: entry.text, srcHash: entry.srcHash ?? null, legacy: false };
  }

  return null;
}

function writeCacheEntry(cacheObj, id, text, srcHash) {
  cacheObj[id] = { text, srcHash };
}

// =====================================================================================
// JSON robustness
// =====================================================================================
function stripJsonFences(s) {
  return String(s ?? "")
    .replace(/^\s*```json\s*/i, "")
    .replace(/^\s*```\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

// =====================================================================================
// OpenAI low-level call
// =====================================================================================
async function openAiChatCompletions(body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenAI HTTP ${res.status}: ${txt}`);
  }

  return res.json();
}

function parseItemsArrayFromContent(content) {
  const raw = stripJsonFences(content);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const excerpt = raw.slice(0, 200).replace(/\s+/g, " ");
    throw new Error(`OpenAI: invalid JSON returned (excerpt: "${excerpt}...")`);
  }

  const arr = parsed?.items;
  if (!Array.isArray(arr)) throw new Error("OpenAI: expected {items:[...]}");

  return arr.map((x) => String(x ?? ""));
}

// =====================================================================================
// Translation calls
// =====================================================================================
function buildBatchPrompt({ locale, items, strict }) {
  const rules = strict
    ? `
Return EXACTLY ${items.length} translations.
The JSON must be: {"items":[...]} with length = ${items.length}.
Do NOT omit any item. Do NOT merge items. Do NOT add extra fields.
If unsure, still output an empty string for that position.
`.trim()
    : `
Return a JSON object: {"items":[ "t1", "t2", ... ]} in the SAME ORDER.
`.trim();

  return `
Target locale: ${locale}

${rules}

Items (translate each line separately, keep order):
${items.map((it, idx) => `${idx + 1}) ${it.sourceText}`).join("\n")}
`.trim();
}

async function translateBatchOpenAI({ locale, items, strict = false }) {
  const prompt = buildBatchPrompt({ locale, items, strict });

  const body = {
    model: MODEL,
    temperature: TEMPERATURE,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  };

  const json = await openAiChatCompletions(body);
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI: empty content");

  return parseItemsArrayFromContent(content);
}

// fallback 1-by-1
async function translateOneOpenAI({ locale, sourceText }) {
  const prompt = `
Target locale: ${locale}

Translate this text.
Return JSON: {"items":["..."]} (one-element array).

Text:
${sourceText}
`.trim();

  const body = {
    model: MODEL,
    temperature: TEMPERATURE,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  };

  const json = await openAiChatCompletions(body);
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI: empty content");

  const arr = parseItemsArrayFromContent(content);
  return String(arr?.[0] ?? "");
}

// =====================================================================================
// Runner utils
// =====================================================================================
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function withRetries(fn, { maxRetries }) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      const msg = String(e?.message ?? e);

      if (attempt > maxRetries) throw e;

      const delay = clamp(BASE_DELAY_MS * Math.pow(2, attempt - 1), BASE_DELAY_MS, MAX_DELAY_MS);
      console.warn(`⚠️ retry ${attempt}/${maxRetries} after ${delay}ms: ${msg}`);
      await sleep(delay);
    }
  }
}

async function translateBatchWithMismatchHandling({ locale, payloadItems }) {
  const expected = payloadItems.length;

  // 1) normal try (with usual retries)
  let results = await withRetries(
    () => translateBatchOpenAI({ locale, items: payloadItems, strict: false }),
    { maxRetries: MAX_RETRIES }
  );

  if (results.length === expected) return results;

  // 2) strict retries (no need to redo MAX_RETRIES network-wise; we do a small number)
  for (let i = 1; i <= MAX_MISMATCH_RETRIES; i++) {
    console.warn(
      `⚠️ ${locale}: batch size mismatch (${results.length} vs ${expected}) -> strict retry ${i}/${MAX_MISMATCH_RETRIES}`
    );

    results = await withRetries(
      () => translateBatchOpenAI({ locale, items: payloadItems, strict: true }),
      { maxRetries: MAX_RETRIES }
    );

    if (results.length === expected) return results;
  }

  // 3) fallback item-by-item for this batch only
  if (!FALLBACK_ITEM_BY_ITEM) {
    throw new Error(`OpenAI: batch size mismatch (${results.length} vs ${expected})`);
  }

  console.warn(`🛟 ${locale}: fallback item-by-item for this batch (${expected} items)`);

  const out = [];
  for (let i = 0; i < payloadItems.length; i++) {
    const one = payloadItems[i];
    const text = await withRetries(
      () => translateOneOpenAI({ locale, sourceText: one.sourceText }),
      { maxRetries: MAX_RETRIES }
    );
    out.push(text);
  }

  return out;
}

// =====================================================================================
// Main per-locale translation
// =====================================================================================
async function translateLocale(todoFilePath) {
  const locale = getLocaleFromTodoFile(todoFilePath);
  const todo = readJson(todoFilePath);

  const items = Array.isArray(todo.items) ? todo.items : [];
  const total = items.length;

  console.log(`\n🌍 Translating ${locale} (${total} items)`);

  const cache = loadCache(locale);

  // Prefill cache (only if not needs-review, and hash matches if present)
  let cacheHits = 0;
  let cacheSkipsHashMismatch = 0;

  for (const it of items) {
    if (!needsTranslation(it)) continue;
    if (it.status === "needs-review") continue;

    const id = it.id;
    if (!id) continue;

    const entry = readCacheEntry(cache, id);
    if (!entry) continue;

    const currentHash = getSourceHash(it);

    if (entry.srcHash && entry.srcHash !== currentHash) {
      cacheSkipsHashMismatch++;
      continue;
    }

    applyTranslation(it, entry.text);
    cacheHits++;

    if (entry.legacy) {
      writeCacheEntry(cache, id, entry.text, currentHash);
    }
  }

  console.log(
    `🧠 ${locale}: restored ${cacheHits} translations from cache` +
    (cacheSkipsHashMismatch ? ` (skipped ${cacheSkipsHashMismatch} hash mismatch)` : "")
  );

  const toTranslate = items.filter(needsTranslation);

  if (toTranslate.length === 0) {
    saveCache(locale, cache);
    console.log(`✅ ${locale} done (0 translated)`);
    return;
  }

  const batches = chunk(toTranslate, BATCH_SIZE);

  let translatedApplied = 0;
  let translatedEmpty = 0;

  async function runBatch(batchIndex) {
    const batch = batches[batchIndex];

    const payloadItems = batch.map((it) => ({
      id: it.id,
      sourceText: extractPlainText(it.source),
    }));

    const start = batchIndex * BATCH_SIZE + 1;
    const end = start + batch.length - 1;

    console.log(
      `📝 ${locale} - Traduction ${start}/${toTranslate.length} → ${end}/${toTranslate.length} (batch ${batchIndex + 1}/${batches.length})`
    );

    const results = await translateBatchWithMismatchHandling({ locale, payloadItems });

    let appliedThisBatch = 0;
    let emptyThisBatch = 0;

    // APPLY BY INDEX
    for (let i = 0; i < batch.length; i++) {
      const it = batch[i];
      const t = String(results[i] ?? "").trim();

      if (!t) {
        emptyThisBatch++;
        translatedEmpty++;
        continue;
      }

      applyTranslation(it, t);
      appliedThisBatch++;
      translatedApplied++;

      const srcHash = getSourceHash(it);
      writeCacheEntry(cache, it.id, t, srcHash);
    }

    console.log(
      `   ↳ received: ${results.length}, applied: ${appliedThisBatch}, empty: ${emptyThisBatch}`
    );
  }

  // Concurrency pool
  let nextBatch = 0;
  const workers = Array.from({ length: MAX_CONCURRENT_BATCHES }, async () => {
    while (nextBatch < batches.length) {
      const idx = nextBatch++;
      await runBatch(idx);
    }
  });

  await Promise.all(workers);

  todo.items = items;
  writeJson(todoFilePath, todo);
  saveCache(locale, cache);

  console.log(`✅ ${locale} done (${translatedApplied} translated, ${translatedEmpty} empty)`);
}


// =====================================================================================
// Entrypoint
// =====================================================================================
async function main() {
  const files = listTodoFiles();
  if (files.length === 0) {
    console.log("No todo files found.");
    return;
  }

  for (const f of files) {
    await translateLocale(f);
  }
}

main().catch((e) => {
  console.error("❌ i18n-translate failed:", e);
  process.exit(1);
});
