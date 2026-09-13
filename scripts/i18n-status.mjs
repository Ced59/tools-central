// scripts/i18n-status.mjs
//
// Affiche l'état des traductions pour chaque locale.
//
// Usage: node scripts/i18n-status.mjs [--strict]

import fs from "node:fs";
import {
    CONFIG,
    listXlfFiles,
    getSourceXlfPath,
    readFile,
    parseXlfUnits,
    isKatexId,
} from "./i18n-utils.mjs";

const STRICT_MODE = process.argv.includes("--strict");

// =============================================================================
// Main
// =============================================================================
function main() {
    console.log("[status] Translation status report\n");

    // Charger le source pour avoir le compte total
    const sourceXlfPath = getSourceXlfPath();
    if (!fs.existsSync(sourceXlfPath)) {
        console.error(`[status] Source file not found: ${sourceXlfPath}`);
        process.exit(1);
    }

    const sourceContent = readFile(sourceXlfPath);
    const sourceUnits = parseXlfUnits(sourceContent);
    const totalUnits = sourceUnits.size;

    // Compter les KaTeX dans le source
    let katexCount = 0;
    for (const [id] of sourceUnits) {
        if (isKatexId(id)) {
            katexCount++;
        }
    }

    console.log(`Source (${CONFIG.sourceLocale}): ${totalUnits} units (${katexCount} KaTeX)\n`);
    console.log("─".repeat(70));
    console.log(
        "Locale".padEnd(10) +
        "Total".padStart(8) +
        "Done".padStart(8) +
        "TODO".padStart(8) +
        "Review".padStart(8) +
        "Progress".padStart(12)
    );
    console.log("─".repeat(70));

    const files = listXlfFiles();
    const stats = [];

    for (const { filePath, locale } of files) {
        if (locale === CONFIG.sourceLocale) {
            continue;
        }

        const content = readFile(filePath);
        const units = parseXlfUnits(content);

        let done = 0;
        let todo = 0;
        let needsReview = 0;
        for (const [id] of sourceUnits) {
            const unit = units.get(id);
            if (!unit) {
                todo++;
                continue;
            }
            if (unit.state === "translated" && unit.target && !/\bTODO\b/.test(unit.target)) {
                done++;
            } else if (unit.state === "needs-review") {
                needsReview++;
            } else if (unit.state === "new" || /\bTODO\b/.test(unit.target ?? "") || !unit.target) {
                todo++;
            } else if (unit.target && !/\bTODO\b/.test(unit.target)) {
                done++;
            } else {
                todo++;
            }
        }

        const obsolete = [...units.keys()].filter((id) => !sourceUnits.has(id)).length;

        const progress = totalUnits > 0 ? Math.min(100, Math.round((done / totalUnits) * 100)) : 0;
        const progressBar = createProgressBar(progress);

        stats.push({ locale, total: totalUnits, done, todo, needsReview, obsolete, progress });

        console.log(
            locale.padEnd(10) +
            String(totalUnits).padStart(8) +
            String(done).padStart(8) +
            String(todo).padStart(8) +
            String(needsReview).padStart(8) +
            `${progressBar} ${progress}%`.padStart(12)
        );
    }

    console.log("─".repeat(70));

    // Résumé
    const totalDone = stats.reduce((sum, s) => sum + s.done, 0);
    const totalTodo = stats.reduce((sum, s) => sum + s.todo, 0);
    const totalReview = stats.reduce((sum, s) => sum + s.needsReview, 0);
    const totalObsolete = stats.reduce((sum, s) => sum + s.obsolete, 0);
    const avgProgress = stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.progress, 0) / stats.length) : 0;

    console.log(`\nSummary: ${stats.length} locales, avg ${avgProgress}% complete`);
    console.log(`  ✅ Translated: ${totalDone}`);
    console.log(`  📝 TODO: ${totalTodo}`);
    console.log(`  🔍 Needs review: ${totalReview}`);
    console.log(`  🗑️ Obsolete: ${totalObsolete}`);

    // Locales les moins avancées
    const incomplete = stats.filter((s) => s.progress < 100).sort((a, b) => a.progress - b.progress);
    if (incomplete.length > 0 && incomplete.length <= 5) {
        console.log("\nIncomplete locales:");
        incomplete.forEach((s) => {
            console.log(`  ${s.locale}: ${s.progress}% (${s.todo} TODO, ${s.needsReview} review)`);
        });
    }

    if (STRICT_MODE && (totalTodo > 0 || totalReview > 0 || totalObsolete > 0)) {
        console.error("\n[status] ❌ Pending, review or obsolete translations remain.");
        process.exit(1);
    }
}

function createProgressBar(percent) {
    const width = 10;
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return "█".repeat(filled) + "░".repeat(empty);
}

main();
