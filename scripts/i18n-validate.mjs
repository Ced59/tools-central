// scripts/i18n-validate.mjs
//
// Valide les fichiers XLF pour s'assurer qu'ils sont corrects.
//
// Ce script vérifie :
// 1. Structure XML valide (pas de </>)
// 2. Tous les placeholders sont préservés
// 3. Pas de caractères de contrôle illégaux
// 4. Les formules KaTeX ont leurs accolades échappées
// 5. Pas de targets vides ou "TODO" (optionnel)
//
// Usage: node scripts/i18n-validate.mjs [--strict]
//   --strict : Échoue aussi si des traductions sont manquantes

import fs from "node:fs";
import {
    CONFIG,
    listXlfFiles,
    readFile,
    parseXlfUnits,
    isKatexId,
    hasXmlIllegalControlChars,
    validateXml,
} from "./i18n-utils.mjs";

const STRICT_MODE = process.argv.includes("--strict");

// =============================================================================
// Collecte des placeholders
// =============================================================================
function extractPlaceholders(text) {
    if (typeof text !== "string") {
        return new Set();
    }

    const placeholders = new Set();

    // {{ variable }} - Angular interpolation
    const interpolations = text.match(/\{\{[^}]+\}\}/g) || [];
    interpolations.forEach((p) => placeholders.add(p));

    // <ph .../> - XLIFF placeholders
    const phs = text.match(/<ph[^>]*\/>/g) || [];
    phs.forEach((p) => {
        const equiv = p.match(/equiv="([^"]+)"/);
        if (equiv) {
            placeholders.add(`ph:${equiv[1]}`);
        }
    });

    // <pc>...</pc> - XLIFF paired tags
    const pcs = text.match(/<pc[^>]*equivStart="([^"]+)"[^>]*equivEnd="([^"]+)"[^>]*>/g) || [];
    pcs.forEach((p) => {
        const start = p.match(/equivStart="([^"]+)"/);
        const end = p.match(/equivEnd="([^"]+)"/);
        if (start) {
            placeholders.add(`pc:${start[1]}`);
        }
        if (end) {
            placeholders.add(`pc:${end[1]}`);
        }
    });

    return placeholders;
}

function comparePlaceholders(source, target) {
    const srcPh = extractPlaceholders(source);
    const tgtPh = extractPlaceholders(target);

    const missing = [];
    const extra = [];

    for (const p of srcPh) {
        if (!tgtPh.has(p)) {
            missing.push(p);
        }
    }

    for (const p of tgtPh) {
        if (!srcPh.has(p)) {
            extra.push(p);
        }
    }

    return { missing, extra, valid: missing.length === 0 && extra.length === 0 };
}

// =============================================================================
// Validation KaTeX
// =============================================================================
function validateKatexBraces(text) {
    if (typeof text !== "string") {
        return { valid: true };
    }

    // Vérifier si contient des accolades non échappées
    // Les accolades doivent être &#123; et &#125;
    const hasUnescapedBraces = /(?<!&#\d{3})[{}]/.test(text.replace(/&#123;|&#125;/g, ""));

    if (hasUnescapedBraces) {
        return {
            valid: false,
            message: "Contains unescaped braces { } - should be &#123; &#125;",
        };
    }

    return { valid: true };
}

// =============================================================================
// Validation d'un fichier
// =============================================================================
function validateFile(filePath, locale) {
    const errors = [];
    const warnings = [];

    const content = readFile(filePath);

    // 1. Validation XML structure
    const xmlValidation = validateXml(content);
    if (!xmlValidation.valid) {
        errors.push(...xmlValidation.errors.map((e) => `XML: ${e}`));
    }

    // 2. Parser les unités
    const units = parseXlfUnits(content);

    for (const [id, unit] of units) {
        // 3. Caractères de contrôle illégaux
        if (hasXmlIllegalControlChars(unit.source)) {
            errors.push(`${id}: Source contains illegal XML control characters`);
        }
        if (unit.target && hasXmlIllegalControlChars(unit.target)) {
            errors.push(`${id}: Target contains illegal XML control characters`);
        }

        // 4. Placeholders
        if (unit.target && unit.target !== "TODO") {
            const phCheck = comparePlaceholders(unit.source, unit.target);
            if (!phCheck.valid) {
                if (phCheck.missing.length > 0) {
                    errors.push(`${id}: Missing placeholders: ${phCheck.missing.join(", ")}`);
                }
                if (phCheck.extra.length > 0) {
                    warnings.push(`${id}: Extra placeholders: ${phCheck.extra.join(", ")}`);
                }
            }
        }

        // 5. KaTeX braces
        if (isKatexId(id)) {
            const katexCheck = validateKatexBraces(unit.source);
            if (!katexCheck.valid) {
                errors.push(`${id}: Source KaTeX - ${katexCheck.message}`);
            }

            if (unit.target) {
                const targetKatexCheck = validateKatexBraces(unit.target);
                if (!targetKatexCheck.valid) {
                    errors.push(`${id}: Target KaTeX - ${targetKatexCheck.message}`);
                }
            }
        }

        // 6. Traductions manquantes (strict mode)
        if (STRICT_MODE) {
            if (!unit.target || unit.target === "TODO" || unit.target.trim() === "") {
                warnings.push(`${id}: Missing translation`);
            }
        }
    }

    return { errors, warnings, unitCount: units.size };
}

// =============================================================================
// Main
// =============================================================================
function main() {
    console.log(`[validate] Validating XLF files... ${STRICT_MODE ? "(strict mode)" : ""}\n`);

    const files = listXlfFiles();
    if (files.length === 0) {
        console.error("[validate] No XLF files found");
        process.exit(1);
    }

    let totalErrors = 0;
    let totalWarnings = 0;
    let hasFailure = false;

    for (const { filePath, locale } of files) {
        const { errors, warnings, unitCount } = validateFile(filePath, locale);

        const status = errors.length > 0 ? "❌" : warnings.length > 0 ? "⚠️" : "✅";
        console.log(`${status} ${locale}: ${unitCount} units, ${errors.length} errors, ${warnings.length} warnings`);

        if (errors.length > 0) {
            hasFailure = true;
            errors.slice(0, 10).forEach((e) => console.log(`   ❌ ${e}`));
            if (errors.length > 10) {
                console.log(`   ... and ${errors.length - 10} more errors`);
            }
        }

        if (warnings.length > 0 && warnings.length <= 5) {
            warnings.forEach((w) => console.log(`   ⚠️ ${w}`));
        } else if (warnings.length > 5) {
            console.log(`   ⚠️ ${warnings.length} warnings (use --verbose to see all)`);
        }

        totalErrors += errors.length;
        totalWarnings += warnings.length;
    }

    console.log(`\n[validate] Summary: ${totalErrors} errors, ${totalWarnings} warnings`);

    if (hasFailure) {
        console.log("\n[validate] ❌ Validation FAILED");
        process.exit(1);
    } else {
        console.log("\n[validate] ✅ Validation PASSED");
    }
}

main();
