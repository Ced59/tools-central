// scripts/i18n-status.mjs
//
// Affiche l'état des traductions pour chaque locale.
//
// Usage: node scripts/i18n-status.mjs

import fs from "node:fs";
import {
    CONFIG,
    listXlfFiles,
    getSourceXlfPath,
    readFile,
    parseXlfUnits,
    isKatexId,
} from "./i18n-utils.mjs";

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
        let newCount = 0;

        for (const [id, unit] of units) {
            if (unit.state === "translated" && unit.target && unit.target !== "TODO") {
                done++;
            } else if (unit.state === "needs-review") {
                needsReview++;
            } else if (unit.state === "new" || unit.target === "TODO" || !unit.target) {
                todo++;
                newCount++;
            } else if (unit.target && unit.target !== "TODO") {
                done++;
            } else {
                todo++;
            }
        }

        const progress = totalUnits > 0 ? Math.round((done / totalUnits) * 100) : 0;
        const progressBar = createProgressBar(progress);

        stats.push({ locale, total: units.size, done, todo, needsReview, progress });

        console.log(
            locale.padEnd(10) +
            String(units.size).padStart(8) +
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
    const avgProgress = stats.length > 0 ? Math.round(stats.reduce((sum, s) => sum + s.progress, 0) / stats.length) : 0;

    console.log(`\nSummary: ${stats.length} locales, avg ${avgProgress}% complete`);
    console.log(`  ✅ Translated: ${totalDone}`);
    console.log(`  📝 TODO: ${totalTodo}`);
    console.log(`  🔍 Needs review: ${totalReview}`);

    // Locales les moins avancées
    const incomplete = stats.filter((s) => s.progress < 100).sort((a, b) => a.progress - b.progress);
    if (incomplete.length > 0 && incomplete.length <= 5) {
        console.log("\nIncomplete locales:");
        incomplete.forEach((s) => {
            console.log(`  ${s.locale}: ${s.progress}% (${s.todo} TODO, ${s.needsReview} review)`);
        });
    }
}

function createProgressBar(percent) {
    const width = 10;
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return "█".repeat(filled) + "░".repeat(empty);
}

main();
