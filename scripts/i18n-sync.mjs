// scripts/i18n-sync.mjs
//
// Synchronise les fichiers XLF de traduction avec le fichier source français.
//
// Ce script :
// 1. Crée les fichiers XLF manquants pour les nouvelles langues
// 2. Ajoute les nouvelles unités de traduction (state="new")
// 3. Détecte les sources modifiées et marque comme "needs-review"
// 4. Échappe les accolades KaTeX pour éviter le parsing ICU
//
// Usage: node scripts/i18n-sync.mjs

import fs from "node:fs";
import path from "node:path";
import {
    CONFIG,
    getTargetLocales,
    getSourceXlfPath,
    getTargetXlfPath,
    readFile,
    writeFile,
    parseXlfUnits,
    isKatexId,
    escapeKatexBraces,
    sanitizeXmlControlChars,
    validateXml,
} from "./i18n-utils.mjs";

// =============================================================================
// Main
// =============================================================================
function main() {
    console.log("[i18n-sync] Starting synchronization...\n");

    const sourceXlfPath = getSourceXlfPath();
    if (!fs.existsSync(sourceXlfPath)) {
        console.error(`[i18n-sync] Source file not found: ${sourceXlfPath}`);
        process.exit(1);
    }

    // Lire et parser le fichier source
    let sourceContent = readFile(sourceXlfPath);
    const sourceUnits = parseXlfUnits(sourceContent);

    console.log(`[i18n-sync] Source: ${sourceUnits.size} units in messages.${CONFIG.sourceLocale}.xlf`);

    // Traiter les KaTeX dans le fichier source
    let sourceModified = false;
    for (const [id, unit] of sourceUnits) {
        if (isKatexId(id)) {
            const escapedSource = escapeKatexBraces(unit.source);
            if (escapedSource !== unit.source) {
                sourceContent = updateSourceAndTarget(sourceContent, id, escapedSource, escapedSource);
                sourceModified = true;
            }
        }
    }

    if (sourceModified) {
        // Valider avant d'écrire
        const validation = validateXml(sourceContent);
        if (!validation.valid) {
            console.error(`[i18n-sync] ❌ Source XML invalid after KaTeX processing:`);
            validation.errors.forEach((e) => console.error(`  - ${e}`));
            process.exit(1);
        }

        writeFile(sourceXlfPath, sourceContent);
        console.log(`[i18n-sync] ✅ Source: KaTeX formulas escaped`);

        // Reparser après modification
        sourceContent = readFile(sourceXlfPath);
    }

    // Reparser le source (peut avoir changé)
    const sourceUnitsFresh = parseXlfUnits(sourceContent);

    // Traiter chaque locale cible
    const targetLocales = getTargetLocales();

    for (const locale of targetLocales) {
        processLocale(locale, sourceContent, sourceUnitsFresh);
    }

    console.log("\n[i18n-sync] ✅ Synchronization complete!");
}

// =============================================================================
// Traitement d'une locale
// =============================================================================
function processLocale(locale, sourceContent, sourceUnits) {
    const targetPath = getTargetXlfPath(locale);

    // Si le fichier n'existe pas, le créer depuis le source
    if (!fs.existsSync(targetPath)) {
        createNewLocaleFile(locale, sourceContent, sourceUnits);
        return;
    }

    // Sinon, merger
    mergeLocaleFile(locale, targetPath, sourceUnits);
}

// =============================================================================
// Création d'un nouveau fichier de locale
// =============================================================================
function createNewLocaleFile(locale, sourceContent, sourceUnits) {
    const targetPath = getTargetXlfPath(locale);

    // Copier le source et modifier les targets
    let content = sourceContent;

    // Modifier les attributs xliff
    content = content.replace(/trgLang="[^"]*"/, `trgLang="${locale}"`);
    if (!content.includes('trgLang=')) {
        content = content.replace(/<xliff([^>]*)>/, `<xliff$1 trgLang="${locale}">`);
    }

    // Pour chaque unité, initialiser le target
    for (const [id, unit] of sourceUnits) {
        if (isKatexId(id)) {
            // KaTeX: target = source (échappé)
            const escaped = escapeKatexBraces(unit.source);
            content = updateSourceAndTarget(content, id, escaped, escaped, "translated");
        } else {
            // Normal: target = "TODO" avec state="new"
            content = setUnitTarget(content, id, "TODO", "new");
        }
    }

    // Valider
    const validation = validateXml(content);
    if (!validation.valid) {
        console.error(`[i18n-sync] ❌ ${locale}: Generated XML is invalid:`);
        validation.errors.forEach((e) => console.error(`  - ${e}`));
        return;
    }

    writeFile(targetPath, content);
    console.log(`[i18n-sync] ✨ ${locale}: Created with ${sourceUnits.size} units`);
}

// =============================================================================
// Merge d'un fichier existant
// =============================================================================
function mergeLocaleFile(locale, targetPath, sourceUnits) {
    let content = readFile(targetPath);
    const targetUnits = parseXlfUnits(content);

    let stats = {
        added: 0,
        sourceUpdated: 0,
        katexFixed: 0,
        removed: 0,
    };

    // Mettre à jour trgLang
    if (!content.includes(`trgLang="${locale}"`)) {
        content = content.replace(/trgLang="[^"]*"/, `trgLang="${locale}"`);
    }

    // L'extraction Angular est la source de vérité. Conserver des unités qui
    // n'existent plus fausse le taux de couverture et gonfle les bundles.
    for (const [id, unit] of targetUnits) {
        if (!sourceUnits.has(id)) {
            content = content.replace(unit.raw, "");
            stats.removed++;
        }
    }

    for (const [id, srcUnit] of sourceUnits) {
        const tgtUnit = targetUnits.get(id);

        if (!tgtUnit) {
            // Nouvelle unité à ajouter
            if (isKatexId(id)) {
                const escaped = escapeKatexBraces(srcUnit.source);
                content = addUnit(content, id, escaped, escaped, "translated");
            } else {
                content = addUnit(content, id, srcUnit.source, "TODO", "new");
            }
            stats.added++;
            continue;
        }

        // Unité existante
        if (isKatexId(id)) {
            // KaTeX: s'assurer que source et target sont échappés
            const escapedSource = escapeKatexBraces(srcUnit.source);
            const currentTarget = tgtUnit.target ?? "";
            const escapedTarget = escapeKatexBraces(currentTarget || srcUnit.source);

            if (tgtUnit.source !== escapedSource || currentTarget !== escapedTarget) {
                content = updateSourceAndTarget(content, id, escapedSource, escapedTarget, "translated");
                stats.katexFixed++;
            }
        } else {
            // Unité normale: vérifier si le source a changé
            const normalizedSrcSource = normalizeWhitespace(srcUnit.source);
            const normalizedTgtSource = normalizeWhitespace(tgtUnit.source);

            if (normalizedSrcSource !== normalizedTgtSource) {
                // Source a changé → mettre à jour et marquer needs-review
                content = updateSource(content, id, srcUnit.source);

                // Marquer comme needs-review si pas déjà "new"
                if (tgtUnit.state !== "new") {
                    content = setUnitState(content, id, "needs-review");
                }
                stats.sourceUpdated++;
            }
        }
    }

    // Valider avant d'écrire
    const validation = validateXml(content);
    if (!validation.valid) {
        console.error(`[i18n-sync] ❌ ${locale}: XML invalid after merge:`);
        validation.errors.forEach((e) => console.error(`  - ${e}`));
        return;
    }

    writeFile(targetPath, content);

    const parts = [];
    if (stats.added > 0) {
        parts.push(`+${stats.added} new`);
    }
    if (stats.sourceUpdated > 0) {
        parts.push(`~${stats.sourceUpdated} updated`);
    }
    if (stats.katexFixed > 0) {
        parts.push(`📐${stats.katexFixed} KaTeX`);
    }
    if (stats.removed > 0) {
        parts.push(`-${stats.removed} obsolete`);
    }

    console.log(`[i18n-sync] ${locale}: ${parts.length > 0 ? parts.join(", ") : "up to date"}`);
}

// =============================================================================
// Helpers pour modification XLF (regex-based, pas de XMLBuilder)
// =============================================================================

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function setUnitTarget(content, unitId, newTarget, newState) {
    const escapedId = escapeRegex(unitId);

    // Extraire l'unité complète d'abord
    const unitPattern = new RegExp(
        `<unit\\s+id="${escapedId}"[^>]*>[\\s\\S]*?<\\/unit>`
    );
    const unitMatch = content.match(unitPattern);
    
    if (!unitMatch) {
        return content; // Unité non trouvée
    }
    
    const unitContent = unitMatch[0];
    const hasTarget = /<target[^>]*>[\s\S]*?<\/target>/.test(unitContent);

    if (hasTarget) {
        // Target existe dans cette unité, le remplacer
        const newUnitContent = unitContent.replace(
            /(<segment>[\s\S]*?)(<target)[^>]*(>[\s\S]*?<\/target>)([\s\S]*?<\/segment>)/,
            `$1<target state="${newState}">${newTarget}</target>$4`
        );
        return content.replace(unitContent, newUnitContent);
    }

    // Target n'existe pas, l'ajouter après </source>
    const newUnitContent = unitContent.replace(
        /(<source>[\s\S]*?<\/source>)([\s\S]*?)(<\/segment>)/,
        `$1\n        <target state="${newState}">${newTarget}</target>$2$3`
    );
    return content.replace(unitContent, newUnitContent);
}

function setUnitState(content, unitId, newState) {
    const escapedId = escapeRegex(unitId);

    // Extraire l'unité
    const unitPattern = new RegExp(`<unit\\s+id="${escapedId}"[^>]*>[\\s\\S]*?<\\/unit>`);
    const unitMatch = content.match(unitPattern);
    
    if (!unitMatch) {
        return content;
    }
    
    const newUnitContent = unitMatch[0].replace(
        /(<target\s+)state="[^"]*"/,
        `$1state="${newState}"`
    );
    
    return content.replace(unitMatch[0], newUnitContent);
}

function updateSource(content, unitId, newSource) {
    const escapedId = escapeRegex(unitId);

    // Extraire l'unité
    const unitPattern = new RegExp(`<unit\\s+id="${escapedId}"[^>]*>[\\s\\S]*?<\\/unit>`);
    const unitMatch = content.match(unitPattern);
    
    if (!unitMatch) {
        return content;
    }
    
    const newUnitContent = unitMatch[0].replace(
        /<source>[\s\S]*?<\/source>/,
        `<source>${newSource}</source>`
    );
    
    return content.replace(unitMatch[0], newUnitContent);
}

function updateSourceAndTarget(content, unitId, newSource, newTarget, state = "translated") {
    let result = updateSource(content, unitId, newSource);
    result = setUnitTarget(result, unitId, newTarget, state);
    return result;
}

function addUnit(content, unitId, source, target, state) {
    const sanitizedSource = sanitizeXmlControlChars(source);
    const sanitizedTarget = sanitizeXmlControlChars(target);

    const newUnit = `    <unit id="${unitId}">
      <segment>
        <source>${sanitizedSource}</source>
        <target state="${state}">${sanitizedTarget}</target>
      </segment>
    </unit>`;

    // Insérer avant </file>
    return content.replace(/(\s*)(<\/file>)/, `\n${newUnit}$1$2`);
}

function normalizeWhitespace(str) {
    return (str || "").replace(/\s+/g, " ").trim();
}

// =============================================================================
// Run
// =============================================================================
main();
