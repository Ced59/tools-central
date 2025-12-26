// scripts/i18n-repair-katex.mjs
//
// Script de réparation complet pour les formules KaTeX dans les fichiers XLF.
// 
// Ce script :
// 1. Identifie toutes les unités KaTeX/LaTeX (par leur ID)
// 2. Pour chaque fichier de traduction (non-français) :
//    - Copie le source français comme target (les formules ne sont pas traduites)
//    - Échappe les accolades { } avec &#123; &#125; pour éviter le parsing ICU
//    - Normalise les backslash (un seul backslash, pas doublé)
// 3. Pour le fichier français :
//    - Échappe aussi les accolades (nécessaire pour que le build Angular fonctionne)
//
// Usage: node scripts/i18n-repair-katex.mjs [--dry-run]

import fs from "node:fs";
import path from "node:path";

const LOCALE_DIR = path.resolve("src/locale");
const DRY_RUN = process.argv.includes("--dry-run");

// =============================================================================
// Détection des IDs KaTeX/LaTeX
// =============================================================================
function isKatexId(id) {
    const s = String(id ?? "");
    return (
        /_katex$/i.test(s) ||
        /_latex$/i.test(s) ||
        /_formula_katex$/i.test(s) ||
        /_formula_latex$/i.test(s)
    );
}

// =============================================================================
// Normalisation du contenu KaTeX
// =============================================================================

/**
 * Normalise une formule KaTeX :
 * - Décode les entités HTML existantes (&amp;#123; -> {, &#123; -> {)
 * - Normalise les backslash (\\\ -> \, \\\\ -> \\)
 * - Ré-échappe les accolades pour Angular ICU
 */
function normalizeKatexFormula(text) {
    if (typeof text !== "string") {
        return text;
    }

    let result = text;

    // 1. Décoder les entités HTML doublement échappées
    result = result.replace(/&amp;#123;/g, "{");
    result = result.replace(/&amp;#125;/g, "}");

    // 2. Décoder les entités HTML simples
    result = result.replace(/&#123;/g, "{");
    result = result.replace(/&#125;/g, "}");

    // 3. Normaliser les backslash multiples vers des backslash simples
    // On veut \dfrac, pas \\dfrac ou \\\\dfrac
    // D'abord, réduire tous les backslash multiples
    while (result.includes("\\\\")) {
        result = result.replace(/\\\\/g, "\\");
    }

    // 4. Ré-échapper les accolades pour Angular ICU
    result = result.replace(/\{/g, "&#123;");
    result = result.replace(/\}/g, "&#125;");

    return result;
}

// =============================================================================
// Extraction des unités du fichier source français
// =============================================================================
function extractKatexUnitsFromFrench(frPath) {
    const content = fs.readFileSync(frPath, "utf8");
    const katexUnits = new Map();

    // Regex pour extraire les unités
    const unitRegex = /<unit\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/unit>/g;
    let match;

    while ((match = unitRegex.exec(content)) !== null) {
        const id = match[1];
        if (!isKatexId(id)) {
            continue;
        }

        // Extraire le contenu <source>...</source>
        const sourceMatch = match[2].match(/<source>([\s\S]*?)<\/source>/);
        if (sourceMatch) {
            katexUnits.set(id, sourceMatch[1]);
        }
    }

    return katexUnits;
}

// =============================================================================
// Traitement d'un fichier XLF
// =============================================================================
function processXlfFile(filePath, katexSources, isFrench) {
    let content = fs.readFileSync(filePath, "utf8");
    let changeCount = 0;

    // Regex pour trouver les unités avec leurs IDs
    const unitRegex = /<unit\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/unit>/g;

    content = content.replace(unitRegex, (match, id, unitContent) => {
        if (!isKatexId(id)) {
            return match;
        }

        const sourceFormula = katexSources.get(id);
        if (!sourceFormula) {
            return match;
        }

        const normalizedFormula = normalizeKatexFormula(sourceFormula);
        let newUnitContent = unitContent;

        if (isFrench) {
            // Pour le français, on normalise juste le source et le target
            // Source
            newUnitContent = newUnitContent.replace(
                /<source>([\s\S]*?)<\/source>/,
                `<source>${normalizedFormula}</source>`
            );
            // Target (si présent)
            newUnitContent = newUnitContent.replace(
                /<target([^>]*)>([\s\S]*?)<\/target>/,
                `<target$1>${normalizedFormula}</target>`
            );
        } else {
            // Pour les autres langues, on copie le source français normalisé comme target
            // Source
            newUnitContent = newUnitContent.replace(
                /<source>([\s\S]*?)<\/source>/,
                `<source>${normalizedFormula}</source>`
            );
            // Target - on remplace ou crée
            if (/<target[^>]*>[\s\S]*?<\/target>/.test(newUnitContent)) {
                newUnitContent = newUnitContent.replace(
                    /<target[^>]*>([\s\S]*?)<\/target>/,
                    `<target state="translated">${normalizedFormula}</target>`
                );
            } else {
                // Ajouter le target après le source
                newUnitContent = newUnitContent.replace(
                    /(<source>[\s\S]*?<\/source>)/,
                    `$1\n        <target state="translated">${normalizedFormula}</target>`
                );
            }
        }

        if (newUnitContent !== unitContent) {
            changeCount++;
        }

        return match.replace(unitContent, newUnitContent);
    });

    return { content, changeCount };
}

// =============================================================================
// Main
// =============================================================================
function main() {
    if (!fs.existsSync(LOCALE_DIR)) {
        console.error(`[i18n-repair-katex] Répertoire introuvable: ${LOCALE_DIR}`);
        process.exit(1);
    }

    const frPath = path.join(LOCALE_DIR, "messages.fr.xlf");
    if (!fs.existsSync(frPath)) {
        console.error(`[i18n-repair-katex] Fichier source français introuvable: ${frPath}`);
        process.exit(1);
    }

    console.log(`[i18n-repair-katex] Mode: ${DRY_RUN ? "DRY-RUN (simulation)" : "RÉEL"}`);

    // Extraire les formules KaTeX du fichier français
    console.log("[i18n-repair-katex] Extraction des formules KaTeX du fichier français...");
    const katexSources = extractKatexUnitsFromFrench(frPath);
    console.log(`[i18n-repair-katex] ${katexSources.size} formule(s) KaTeX trouvée(s)\n`);

    const files = fs
        .readdirSync(LOCALE_DIR)
        .filter((f) => f.startsWith("messages.") && f.endsWith(".xlf"));

    let totalChanges = 0;
    let filesModified = 0;

    for (const fileName of files) {
        const filePath = path.join(LOCALE_DIR, fileName);
        const locale = fileName.slice("messages.".length, -".xlf".length);
        const isFrench = locale === "fr";

        const { content, changeCount } = processXlfFile(filePath, katexSources, isFrench);

        if (changeCount > 0) {
            filesModified++;
            totalChanges += changeCount;

            if (!DRY_RUN) {
                fs.writeFileSync(filePath, content, "utf8");
                console.log(`✅ ${locale}: ${changeCount} formule(s) réparée(s)`);
            } else {
                console.log(`🔍 ${locale}: ${changeCount} formule(s) à réparer`);
            }
        } else {
            console.log(`✓ ${locale}: OK (rien à modifier)`);
        }
    }

    console.log(`\n[i18n-repair-katex] Terminé.`);
    console.log(`   Fichiers modifiés: ${filesModified}`);
    console.log(`   Total réparations: ${totalChanges}`);

    if (DRY_RUN && totalChanges > 0) {
        console.log(`\n💡 Pour appliquer les réparations, relancez sans --dry-run`);
    }
}

main();
