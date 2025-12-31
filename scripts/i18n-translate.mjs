// scripts/i18n-translate.mjs
//
// Traduit les textes manquants via l'API OpenAI.
//
// Ce script :
// 1. Lit les fichiers XLF et identifie les unités à traduire (state="new" ou "needs-review")
// 2. Traduit via OpenAI par batches (safe + split automatique)
// 3. Écrit les résultats directement dans les fichiers XLF
// 4. Utilise un cache pour éviter de retraduire
// 5. Permet la localisation des formules KaTeX (ex: \text{Résultat} → \text{Result})
//
// Usage: node scripts/i18n-translate.mjs
//
// Variables d'environnement:
//   OPENAI_API_KEY - Clé API OpenAI (obligatoire)

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  CONFIG,
  getTargetLocales,
  getTargetXlfPath,
  readFile,
  writeFile,
  parseXlfUnits,
  ensureDir,
  isKatexId,
  escapeKatexBraces,
  unescapeKatexBraces,
  sanitizeXmlControlChars,
  hasXmlIllegalControlChars,
  validateXml,
} from "./i18n-utils.mjs";

// =============================================================================
// Configuration
// =============================================================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY missing");
  process.exit(1);
}

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0;
const BATCH_SIZE = 40;

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

// Concurrence: nombre de locales traitées en parallèle
const MAX_CONCURRENT_LOCALES = 3;

// Split automatique des batches en cas d'échec
const MAX_SPLIT_DEPTH = 6; // 40 -> 20 -> 10 -> 5 -> 3 -> 2 -> 1

const CACHE_DIR = path.resolve("dist/i18n/cache");

// =============================================================================
// Prompts
// =============================================================================
const SYSTEM_PROMPT = `You are a professional software localization translator.

Rules:
- Translate naturally for the target locale
- Preserve ALL placeholders exactly: {{ }}, { }, <ph>, <pc>, HTML tags
- For LaTeX/KaTeX formulas: translate ONLY the text inside \\text{} commands, keep all math symbols unchanged
- Return ONLY the structured output required by the response schema
- Keep the EXACT same mapping by id
- If unsure, return empty string for that item

Example LaTeX translation (fr→en):
Input: "\\text{Résultat}=\\dfrac{\\text{Valeur}}{100}"
Output: "\\text{Result}=\\dfrac{\\text{Value}}{100}"`;

// =============================================================================
// Cache
// =============================================================================
function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function getCachePath(locale) {
  ensureDir(CACHE_DIR);
  return path.join(CACHE_DIR, `${locale}.cache.json`);
}

function loadCache(locale) {
  const p = getCachePath(locale);
  if (!fs.existsSync(p)) return {};
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(locale, cache) {
  writeFile(getCachePath(locale), JSON.stringify(cache, null, 2));
}

function getCacheKey(id, source) {
  return `${id}:${hashString(source)}`;
}

// =============================================================================
// Utils
// =============================================================================
async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Remplace / insère le <target> dans l'unité.
 * ⚠️ suppose un XLF "unit/segment/source/target" (comme ton script actuel).
 */
function setTarget(content, unitId, newTarget, newState) {
  const escapedId = escapeRegex(unitId);
  const sanitizedTarget = sanitizeXmlControlChars(String(newTarget ?? ""));

  // Extraire l'unité complète
  const unitPattern = new RegExp(`<unit\\s+id="${escapedId}"[^>]*>[\\s\\S]*?<\\/unit>`);
  const unitMatch = content.match(unitPattern);

  if (!unitMatch) return content;

  const unitContent = unitMatch[0];
  const hasTarget = /<target[^>]*>[\s\S]*?<\/target>/.test(unitContent);

  if (hasTarget) {
    // Remplacer le target existant (dans le segment)
    const newUnitContent = unitContent.replace(
      /(<segment>[\s\S]*?)(<target)[^>]*(>[\s\S]*?<\/target>)([\s\S]*?<\/segment>)/,
      `$1<target state="${newState}">${sanitizedTarget}</target>$4`
    );
    return content.replace(unitContent, newUnitContent);
  }

  // Target n'existe pas, l'ajouter après </source>
  const newUnitContent = unitContent.replace(
    /(<source>[\s\S]*?<\/source>)([\s\S]*?)(<\/segment>)/,
    `$1\n        <target state="${newState}">${sanitizedTarget}</target>$2$3`
  );

  return content.replace(unitContent, newUnitContent);
}

async function runWithConcurrency(items, limit, worker) {
  const queue = [...items];
  const concurrency = Math.max(1, Number(limit || 1));

  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      try {
        await worker(item);
      } catch (e) {
        // On évite de casser tout le run sur une locale
        console.error(`❌ Worker failed for item "${String(item)}": ${e?.message || e}`);
      }
    }
  });

  await Promise.all(workers);
}

// =============================================================================
// OpenAI API (Structured Outputs strict)
// =============================================================================
async function callOpenAI(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: TEMPERATURE,
        messages,
        // ✅ Structured Outputs strict (réponse forcée au schéma)
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translations_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                translations: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: "string" },
                      text: { type: "string" },
                    },
                    required: ["id", "text"],
                  },
                },
              },
              required: ["translations"],
            },
          },
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI HTTP ${response.status}: ${text}`);
    }

    const json = await response.json();
    return json.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParseObject(s) {
  // En strict schema, on devrait déjà recevoir du JSON "pur".
  // On garde un filet de sécurité sans heurter le parsing.
  const t = String(s || "").trim();

  // Si jamais le modèle encadre (rare), on tente de nettoyer gentiment.
  const cleaned = t.replace(/```json\s*/g, "").replace(/```/g, "").trim();

  return JSON.parse(cleaned);
}

/**
 * Traduction "strict" : input JSON, output JSON strict, mapping par id.
 * Retourne toujours un tableau de même taille que items.
 */
async function translateBatchStrict(locale, items) {
  const input = {
    locale,
    instructions: {
      preserve_placeholders: true,
      latex_rule: "Translate ONLY inside \\text{...} for LaTeX/KaTeX; keep math symbols unchanged",
      if_unsure_empty: true,
    },
    items: items.map((it) => ({ id: it.id, source: it.source })),
  };

  const userPrompt =
    `Translate the following JSON payload.\n` +
    `Return ONLY the structured output required by the response schema.\n` +
    `${JSON.stringify(input)}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const content = await callOpenAI([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ]);

      const parsed = safeJsonParseObject(content);
      const arr = parsed?.translations;

      if (!Array.isArray(arr)) {
        throw new Error("Missing translations array");
      }

      // Map par id (robuste même si ordre change)
      const byId = new Map(
        arr.map((x) => [
          String(x.id),
          sanitizeXmlControlChars(String(x.text ?? "")),
        ])
      );

      // ✅ Taille exacte attendue
      return items.map((it) => byId.get(it.id) ?? "");
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error;
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), 30_000);
      console.warn(`⚠️ Retry ${attempt}/${MAX_RETRIES} after ${delay}ms: ${error.message}`);
      await sleep(delay);
    }
  }

  return items.map(() => "");
}

/**
 * Safe wrapper : si échec (timeout/5xx/parse/etc.), split en 2 récursivement.
 * Aucune boucle infinie : depth max.
 */
async function translateBatchSafe(locale, batch, depth = 0) {
  try {
    return await translateBatchStrict(locale, batch);
  } catch (e) {
    if (batch.length <= 1 || depth >= MAX_SPLIT_DEPTH) {
      console.error(`⚠️ Giving up on batch size=${batch.length} depth=${depth}: ${e.message}`);
      return batch.map(() => "");
    }

    const mid = Math.ceil(batch.length / 2);
    const left = batch.slice(0, mid);
    const right = batch.slice(mid);

    const a = await translateBatchSafe(locale, left, depth + 1);
    const b = await translateBatchSafe(locale, right, depth + 1);
    return [...a, ...b];
  }
}

// =============================================================================
// Traitement d'une locale
// =============================================================================
async function processLocale(locale) {
  const xlfPath = getTargetXlfPath(locale);
  if (!fs.existsSync(xlfPath)) {
    console.log(`[translate] ${locale}: File not found, skipping`);
    return;
  }

  let content = readFile(xlfPath);

  // File sanity: si déjà invalide, on stop (évite de tout casser)
  const beforeValidation = validateXml(content);
  if (!beforeValidation.valid) {
    console.error(`[translate] ${locale}: ❌ XML invalid before translation:`);
    beforeValidation.errors.forEach((e) => console.error(`  - ${e}`));
    return;
  }

  const units = parseXlfUnits(content);

  const toTranslate = [];
  const cache = loadCache(locale);
  let cacheHits = 0;

  for (const [id, unit] of units) {
    // Conditions pour traduire:
    // - state="new" ou state="needs-review"
    // - target="TODO" ou target vide
    const needsTranslation =
      unit.state === "new" ||
      unit.state === "needs-review" ||
      unit.target === "TODO" ||
      unit.target === null ||
      unit.target === "";

    if (!needsTranslation) continue;

    // Source (KaTeX: on déséchappe pour donner une vraie source au modèle)
    let sourceText = unit.source;
    if (isKatexId(id)) {
      sourceText = unescapeKatexBraces(sourceText);
    }

    // Hard guard : si caractères de contrôle illégaux, on sanitize la source
    // (ça évite de provoquer du XML illégal côté output)
    if (hasXmlIllegalControlChars(sourceText)) {
      sourceText = sanitizeXmlControlChars(sourceText);
    }

    const cacheKey = getCacheKey(id, sourceText);

    // On évite d'utiliser le cache si "needs-review" (tu sembles vouloir retraduire)
    if (cache[cacheKey] && unit.state !== "needs-review") {
      let finalTarget = cache[cacheKey];

      // Ré-échapper pour KaTeX
      if (isKatexId(id)) {
        finalTarget = escapeKatexBraces(finalTarget);
      }

      content = setTarget(content, id, finalTarget, "translated");
      cacheHits++;
      continue;
    }

    toTranslate.push({
      id,
      source: sourceText,
      isKatex: isKatexId(id),
    });
  }

  console.log(`[translate] ${locale}: ${toTranslate.length} to translate, ${cacheHits} from cache`);

  // Si rien à traduire mais on a appliqué du cache => sauvegarde
  if (toTranslate.length === 0) {
    if (cacheHits > 0) {
      const validation = validateXml(content);
      if (validation.valid) {
        writeFile(xlfPath, content);
      } else {
        console.error(`[translate] ${locale}: ❌ XML invalid after cache apply:`);
        validation.errors.forEach((e) => console.error(`  - ${e}`));
      }
    }
    return;
  }

  let translated = 0;

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toTranslate.length / BATCH_SIZE);

    console.log(`[translate] ${locale}: Batch ${batchNum}/${totalBatches} (${batch.length} items)`);

    try {
      const translations = await translateBatchSafe(locale, batch);

      // Safety: taille garantie, mais on re-check quand même
      if (!Array.isArray(translations) || translations.length !== batch.length) {
        console.warn(
          `⚠️ Unexpected translation array length: got ${translations?.length}, expected ${batch.length}`
        );
      }

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        let translation = translations[j] || "";
        translation = sanitizeXmlControlChars(String(translation));

        if (!translation) continue;

        // Cache : stocker la version "non échappée" KaTeX (celle donnée au modèle)
        const cacheKey = getCacheKey(item.id, item.source);
        cache[cacheKey] = translation;

        // Échapper pour KaTeX dans le XLF
        if (item.isKatex) {
          translation = escapeKatexBraces(translation);
        }

        content = setTarget(content, item.id, translation, "translated");
        translated++;
      }
    } catch (error) {
      console.error(`[translate] ${locale}: Batch ${batchNum} failed: ${error.message}`);
    }

    // Petite pause entre les batches
    if (i + BATCH_SIZE < toTranslate.length) {
      await sleep(400);
    }
  }

  // Valider et sauvegarder
  const afterValidation = validateXml(content);
  if (!afterValidation.valid) {
    console.error(`[translate] ${locale}: ❌ XML invalid after translation:`);
    afterValidation.errors.forEach((e) => console.error(`  - ${e}`));
    return;
  }

  writeFile(xlfPath, content);
  saveCache(locale, cache);

  console.log(`[translate] ${locale}: ✅ ${translated} translated`);
}

// =============================================================================
// Main
// =============================================================================
async function main() {
  console.log("[translate] Starting translation...\n");

  const locales = getTargetLocales();

  // ✅ FIX: ne surtout pas relancer runWithConcurrency dans une boucle sur locales
  await runWithConcurrency(locales, MAX_CONCURRENT_LOCALES, processLocale);

  console.log("\n[translate] ✅ Translation complete!");
}

main().catch((e) => {
  console.error("❌ Translation failed:", e);
  process.exit(1);
});
