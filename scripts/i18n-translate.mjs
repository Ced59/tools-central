// scripts/i18n-translate.mjs
//
// Traduit les textes manquants via l'API OpenAI.
//
// Ce script :
// 1. Lit les fichiers XLF et identifie les unités à traduire (state="new" ou "needs-review")
// 2. Traduit via OpenAI par batches
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
const BATCH_SIZE = 20;
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000;

const CACHE_DIR = path.resolve("dist/i18n/cache");

// =============================================================================
// Prompts
// =============================================================================
const SYSTEM_PROMPT = `You are a professional software localization translator.

Rules:
- Translate naturally for the target locale
- Preserve ALL placeholders exactly: {{ }}, { }, <ph>, <pc>, HTML tags
- For LaTeX/KaTeX formulas: translate ONLY the text inside \\text{} commands, keep all math symbols unchanged
- Return ONLY valid JSON: {"translations": ["t1", "t2", ...]}
- Keep the EXACT same order as input
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
    if (!fs.existsSync(p)) {
        return {};
    }
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
// OpenAI API
// =============================================================================
async function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function callOpenAI(messages) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: MODEL,
                temperature: TEMPERATURE,
                messages,
                response_format: { type: "json_object" },
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

async function translateBatch(locale, items) {
    const prompt = `Target locale: ${locale}

Translate these ${items.length} items. Return JSON: {"translations": ["t1", "t2", ...]}

Items:
${items.map((item, i) => `${i + 1}) ${item.source}`).join("\n")}`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const content = await callOpenAI([
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt },
            ]);

            // Parser la réponse
            const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
            const translations = parsed.translations || parsed.items || [];

            if (!Array.isArray(translations)) {
                throw new Error("Response is not an array");
            }

            // Vérifier la taille
            if (translations.length !== items.length) {
                console.warn(`⚠️ Batch size mismatch: got ${translations.length}, expected ${items.length}`);
                // Pad ou truncate
                while (translations.length < items.length) {
                    translations.push("");
                }
            }

            return translations.slice(0, items.length).map((t) => sanitizeXmlControlChars(String(t || "")));
        } catch (error) {
            if (attempt === MAX_RETRIES) {
                throw error;
            }
            const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
            console.warn(`⚠️ Retry ${attempt}/${MAX_RETRIES} after ${delay}ms: ${error.message}`);
            await sleep(delay);
        }
    }

    return items.map(() => "");
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
    const units = parseXlfUnits(content);

    // Identifier les unités à traduire
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

        if (!needsTranslation) {
            continue;
        }

        // Préparer le texte source (décoder les entités pour KaTeX)
        let sourceText = unit.source;
        if (isKatexId(id)) {
            sourceText = unescapeKatexBraces(sourceText);
        }

        // Vérifier le cache
        const cacheKey = getCacheKey(id, sourceText);
        if (cache[cacheKey] && unit.state !== "needs-review") {
            // Utiliser le cache
            const cached = cache[cacheKey];
            let finalTarget = cached;

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

    if (toTranslate.length === 0) {
        // Quand même sauvegarder les changements du cache
        if (cacheHits > 0) {
            const validation = validateXml(content);
            if (validation.valid) {
                writeFile(xlfPath, content);
            }
        }
        return;
    }

    // Traduire par batches
    let translated = 0;

    for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
        const batch = toTranslate.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(toTranslate.length / BATCH_SIZE);

        console.log(`[translate] ${locale}: Batch ${batchNum}/${totalBatches} (${batch.length} items)`);

        try {
            const translations = await translateBatch(locale, batch);

            for (let j = 0; j < batch.length; j++) {
                const item = batch[j];
                let translation = translations[j] || "";

                if (!translation) {
                    continue;
                }

                // Mettre en cache (avec le texte non-échappé)
                const cacheKey = getCacheKey(item.id, item.source);
                cache[cacheKey] = translation;

                // Échapper pour KaTeX avant d'écrire dans le XLF
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
            await sleep(500);
        }
    }

    // Valider et sauvegarder
    const validation = validateXml(content);
    if (!validation.valid) {
        console.error(`[translate] ${locale}: ❌ XML invalid after translation:`);
        validation.errors.forEach((e) => console.error(`  - ${e}`));
        return;
    }

    writeFile(xlfPath, content);
    saveCache(locale, cache);

    console.log(`[translate] ${locale}: ✅ ${translated} translated`);
}

// =============================================================================
// Helpers
// =============================================================================
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setTarget(content, unitId, newTarget, newState) {
    const escapedId = escapeRegex(unitId);
    const sanitizedTarget = sanitizeXmlControlChars(newTarget);

    // Extraire l'unité complète
    const unitPattern = new RegExp(`<unit\\s+id="${escapedId}"[^>]*>[\\s\\S]*?<\\/unit>`);
    const unitMatch = content.match(unitPattern);
    
    if (!unitMatch) {
        return content; // Unité non trouvée
    }
    
    const unitContent = unitMatch[0];
    const hasTarget = /<target[^>]*>[\s\S]*?<\/target>/.test(unitContent);

    if (hasTarget) {
        // Target existe, le remplacer
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

// =============================================================================
// Main
// =============================================================================
async function main() {
    console.log("[translate] Starting translation...\n");

    const locales = getTargetLocales();

    for (const locale of locales) {
        await processLocale(locale);
    }

    console.log("\n[translate] ✅ Translation complete!");
}

main().catch((e) => {
    console.error("❌ Translation failed:", e);
    process.exit(1);
});
