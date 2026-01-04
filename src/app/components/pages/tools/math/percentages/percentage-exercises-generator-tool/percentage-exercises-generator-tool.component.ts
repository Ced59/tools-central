import { Component, computed, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TagModule } from 'primeng/tag';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';
import {TcDropdownComponent} from "../../../../../shared/tc-dropdown/tc-dropdown.component";

type Level = 'easy' | 'medium' | 'hard';
type Theme =
 | 'essential'
 | 'variation'
 | 'reverse'
 | 'cumul'
 | 'shares'
 | 'weighted'
 | 'points'
 | 'traps'
 | 'error-check'
 | 'fill-step';

type Step = { id: string; latex: string; vars?: Record<string, any> };

type Exercise = {
 id: string;
 kind: Theme;
 title: string;
 statement: string;
 answerShort: string;
 answerValue?: number | null;

 // Correction
 steps: Step[];
 tip?: string;

 // UI
 difficultyTag: 'Facile' | 'Moyen' | 'Difficile';
};

type ThemeOption = { label: string; value: Theme };
type LevelOption = { label: string; value: Level };

@Component({
 selector: 'app-percentage-exercises-generator-tool',
 standalone: true,
 imports: [
 NgIf,
 NgFor,
 RouterLink,
 ReactiveFormsModule,
 CardModule,
 InputNumberModule,
 ButtonModule,
 DividerModule,
 TcDropdownComponent,
 MultiSelectModule,
 ToggleButtonModule,
 TagModule,
 MathFormulaComponent,
 ],
 templateUrl: './percentage-exercises-generator-tool.component.html',
 styleUrl: './percentage-exercises-generator-tool.component.scss',
})
export class PercentageExercisesGeneratorToolComponent {
 private fb = new FormBuilder();

 // --- UI options
 readonly levelOptions: LevelOption[] = [
 { label: $localize`:@@ex_level_easy:Facile`, value: 'easy' },
 { label: $localize`:@@ex_level_medium:Moyen`, value: 'medium' },
 { label: $localize`:@@ex_level_hard:Difficile`, value: 'hard' },
 ];

 readonly themeOptions: ThemeOption[] = [
 { label: $localize`:@@ex_theme_essential:Essentiels`, value: 'essential' },
 { label: $localize`:@@ex_theme_variation:Variations (%)`, value: 'variation' },
 { label: $localize`:@@ex_theme_reverse:Inverse / retour à l'initial`, value: 'reverse' },
 { label: $localize`:@@ex_theme_cumul:Pourcentages successifs`, value: 'cumul' },
 { label: $localize`:@@ex_theme_shares:Part / total`, value: 'shares' },
 { label: $localize`:@@ex_theme_weighted:Pondéré`, value: 'weighted' },
 { label: $localize`:@@ex_theme_points:Points de %`, value: 'points' },
 { label: $localize`:@@ex_theme_traps:Pièges`, value: 'traps' },
 { label: $localize`:@@ex_theme_error_check:Détecter l'erreur`, value: 'error-check' },
 { label: $localize`:@@ex_theme_fill_step:Étape manquante`, value: 'fill-step' },
 ];

 // --- Form
 form = this.fb.group({
 level: ['medium' as Level, [Validators.required]],
 themes: [['essential', 'variation', 'cumul'] as Theme[], [Validators.required]],
 count: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
 precision: [2, [Validators.required, Validators.min(0), Validators.max(6)]],
 showCorrections: [true, [Validators.required]],
 seed: [this.randomSeed(), [Validators.required, Validators.min(1), Validators.max(2_147_483_647)]],
 });

 // --- Signals
 private levelSig = signal<Level>(this.form.value.level ?? 'medium');
 private themesSig = signal<Theme[]>(this.form.value.themes ?? ['essential']);
 private countSig = signal<number>(this.form.value.count ?? 10);
 private precisionSig = signal<number>(this.form.value.precision ?? 2);
 private showCorrectionsSig = signal<boolean>(this.form.value.showCorrections ?? true);
 private seedSig = signal<number>(this.form.value.seed ?? 123456);

 exercises = signal<Exercise[]>([]);
 // per-exo reveal (override global showCorrections)
 revealMap = signal<Record<string, boolean>>({});

 constructor() {
 this.form.valueChanges.subscribe(() => {
 this.levelSig.set(this.form.controls.level.value ?? 'medium');
 this.themesSig.set(this.form.controls.themes.value ?? ['essential']);
 this.countSig.set(this.form.controls.count.value ?? 10);
 this.precisionSig.set(this.form.controls.precision.value ?? 2);
 this.showCorrectionsSig.set(this.form.controls.showCorrections.value ?? true);
 this.seedSig.set(this.form.controls.seed.value ?? 123456);
 });

 // generate initial
 this.generate();
 }

 // --- Derived UI
 readonly difficultyLabel = computed(() => {
 const l = this.levelSig();
 return l === 'easy' ? 'Facile' : l === 'medium' ? 'Moyen' : 'Difficile';
 });

 readonly selectedThemesLabel = computed(() => {
 const ts = this.themesSig();
 return ts.length ? ts.join(', ') : '—';
 });

 // --- Actions
 generate() {
 const level = this.levelSig();
 const themes = this.themesSig();
 const precision = this.precisionSig();

 const n = this.clampInt(this.countSig(), 1, 50);
 const seed = this.clampInt(this.seedSig(), 1, 2_147_483_647);

 const rng = this.mulberry32(seed);
 const pool = themes.length ? themes : (['essential'] as Theme[]);

 const res: Exercise[] = [];
 const maxAttempts = n * 25; // anti-boucle
 let attempts = 0;

 // distribution : essayer d'équilibrer un peu
 const targetCounts = this.planDistribution(pool, n, rng);

 while (res.length < n && attempts < maxAttempts) {
 attempts++;

 const kind = this.pickByTargets(targetCounts, rng);
 const ex = this.buildExercise(kind, level, precision, rng);

 if (!ex) continue;

 // anti-duplicat “simple”
 const signature = ex.statement + '|' + ex.answerShort;
 const exists = res.some(x => (x.statement + '|' + x.answerShort) === signature);
 if (exists) continue;

 res.push(ex);
 targetCounts[kind] = Math.max(0, (targetCounts[kind] ?? 0) - 1);
 }

 this.exercises.set(res);
 this.revealMap.set({});
 }

 randomizeSeedAndGenerate() {
 const s = this.randomSeed();
 this.form.controls.seed.setValue(s);
 this.generate();
 }

 toggleReveal(exId: string) {
 const cur = this.revealMap();
 this.revealMap.set({ ...cur, [exId]: !cur[exId] });
 }

 isRevealed(exId: string): boolean {
 if (this.showCorrectionsSig()) return true;
 return !!this.revealMap()[exId];
 }

 reset() {
 this.form.reset({
 level: 'medium',
 themes: ['essential', 'variation', 'cumul'],
 count: 10,
 precision: 2,
 showCorrections: true,
 seed: this.randomSeed(),
 });
 this.generate();
 }

 // --- Core generator
 private buildExercise(kind: Theme, level: Level, precision: number, rng: () => number): Exercise | null {
 // Router to different builders
 switch (kind) {
 case 'essential':
 return this.exEssential(level, precision, rng);
 case 'variation':
 return this.exVariation(level, precision, rng);
 case 'reverse':
 return this.exReverse(level, precision, rng);
 case 'cumul':
 return this.exCumul(level, precision, rng);
 case 'shares':
 return this.exShares(level, precision, rng);
 case 'weighted':
 return this.exWeighted(level, precision, rng);
 case 'points':
 return this.exPoints(level, precision, rng);
 case 'traps':
 return this.exTraps(level, precision, rng);
 case 'error-check':
 return this.exErrorCheck(level, precision, rng);
 case 'fill-step':
 return this.exFillStep(level, precision, rng);
 default:
 return null;
 }
 }

 // ================
 // Exercise families
 // ================

 /** Essentiels : X% de Y / X est quel % de Y */
 private exEssential(level: Level, precision: number, rng: () => number): Exercise | null {
 const mode = rng() < 0.5 ? 'x_of_y' : 'x_is_what_percent';

 if (mode === 'x_of_y') {
 const y = this.pickNiceNumber(level, rng);
 const p = this.pickPercent(level, rng, { allowNegative: false, allowOver100: level !== 'easy' });
 const x = (p / 100) * y;

 if (!Number.isFinite(x)) return null;

 const id = this.uid('ex');
 const title = $localize`:@@ex_essential_title:Calculer un pourcentage`;
 const statement = $localize`:@@ex_essential_stmt_x_of_y:Calculer ${this.fmt(p, precision)}% de ${this.fmt(y, 0)}.`;

 const answerShort = `${this.fmt(x, precision)}`;
 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
x &= \dfrac{p}{100}\times y \\
&= \dfrac{ {{p}} }{100}\times {{y}} \\
&= {{x}}
\end{aligned}`,
 vars: { p, y, x },
 },
 ];

 return {
 id,
 kind: 'essential',
 title,
 statement,
 answerShort,
 answerValue: x,
 steps,
 tip: $localize`:@@ex_tip_percent_of:Astuce : “p% de y” = (p/100)×y.`,
 difficultyTag: this.diffTag(level),
 };
 }

 // x est quel % de y
 const y = this.pickNiceNumber(level, rng, { nonZero: true });
 const ratio = level === 'easy' ? this.pickFrom([0.1, 0.2, 0.25, 0.5, 0.75, 1.2], rng) : this.range(0.05, 1.8, rng);
 const x = this.roundTo(y * ratio, level === 'easy' ? 0 : 2);
 if (y === 0) return null;

 const p = (x / y) * 100;

 const id = this.uid('ex');
 const title = $localize`:@@ex_essential_title2:X est quel % de Y`;
 const statement = $localize`:@@ex_essential_stmt_x_is_what_percent:${this.fmt(x, precision)} représente quel pourcentage de ${this.fmt(y, precision)} ?`;

 const answerShort = `${this.fmt(p, precision)}%`;
 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
p &= \dfrac{x}{y}\times 100 \\
&= \dfrac{ {{x}} }{ {{y}} }\times 100 \\
&= {{p}}
\end{aligned}`,
 vars: { x, y, p },
 },
 ];

 return {
 id,
 kind: 'essential',
 title,
 statement,
 answerShort,
 answerValue: p,
 steps,
 tip: $localize`:@@ex_tip_what_percent:Astuce : “x est quel % de y” = (x/y)×100.`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Variation (%) entre initial et final */
 private exVariation(level: Level, precision: number, rng: () => number): Exercise | null {
 const initial = this.pickNiceNumber(level, rng, { nonZero: true });
 const p = this.pickPercent(level, rng, { allowNegative: true, allowOver100: level === 'hard' });
 // final = initial*(1+p/100)
 const final = this.roundTo(initial * (1 + p / 100), level === 'easy' ? 0 : 2);

 if (initial === 0) return null;

 const calcP = ((final - initial) / initial) * 100;

 const id = this.uid('ex');
 const title = $localize`:@@ex_variation_title:Variation en pourcentage`;
 const statement = $localize`:@@ex_variation_stmt:Une valeur passe de ${this.fmt(initial, precision)} à ${this.fmt(final, precision)}. Quelle est la variation en % ?`;

 const answerShort = `${this.fmtSigned(calcP, precision)}%`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
p &= \dfrac{\text{final}-\text{initial}}{\text{initial}}\times 100 \\
&= \dfrac{ {{f}}-{{i}} }{ {{i}} }\times 100 \\
&= {{p}}
\end{aligned}`,
 vars: { i: initial, f: final, p: calcP },
 },
 ];

 return {
 id,
 kind: 'variation',
 title,
 statement,
 answerShort,
 answerValue: calcP,
 steps,
 tip: $localize`:@@ex_tip_variation:Astuce : variation % = (Δ / initial)×100.`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Inverse : retrouver l’initial après une hausse/baisse */
 private exReverse(level: Level, precision: number, rng: () => number): Exercise | null {
 const final = this.pickNiceNumber(level, rng, { nonZero: true });
 // éviter -100%
 const p = this.pickPercent(level, rng, { allowNegative: true, allowOver100: level === 'hard', avoidMinus100: true });

 const coef = 1 + p / 100;
 if (coef === 0) return null;

 const initial = final / coef;

 const id = this.uid('ex');
 const title = $localize`:@@ex_reverse_title:Retrouver la valeur initiale`;
 const statement = $localize`:@@ex_reverse_stmt:Après une variation de ${this.fmtSigned(p, precision)}%, une valeur devient ${this.fmt(final, precision)}. Quelle était la valeur initiale ?`;

 const answerShort = `${this.fmt(initial, precision)}`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\text{final} &= \text{initial}\times(1+\dfrac{p}{100}) \\
\text{initial} &= \dfrac{\text{final}}{1+\dfrac{p}{100}} \\
&= \dfrac{ {{f}} }{ 1+\dfrac{ {{p}} }{100} } \\
&= {{i}}
\end{aligned}`,
 vars: { f: final, p, i: initial },
 },
 ];

 return {
 id,
 kind: 'reverse',
 title,
 statement,
 answerShort,
 answerValue: initial,
 steps,
 tip: $localize`:@@ex_tip_reverse:Astuce : pour “revenir en arrière”, on divise par le coefficient.`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Cumul : +a% puis -b% / coefficient total / % équivalent */
 private exCumul(level: Level, precision: number, rng: () => number): Exercise | null {
 const stepsCount = level === 'easy' ? 2 : level === 'medium' ? this.pickInt(2, 3, rng) : this.pickInt(2, 4, rng);
 const ps: number[] = [];
 for (let i = 0; i < stepsCount; i++) {
 ps.push(this.pickPercent(level, rng, { allowNegative: true, allowOver100: level === 'hard', avoidMinus100: true }));
 }

 // coef
 let coef = 1;
 for (const p of ps) coef *= 1 + p / 100;

 const peq = (coef - 1) * 100;

 const base = this.pickNiceNumber(level, rng, { nonZero: true });
 const final = base * coef;

 const id = this.uid('ex');
 const title = $localize`:@@ex_cumul_title:Pourcentages successifs`;
 const pList = ps.map(v => `${this.fmtSigned(v, precision)}%`).join(' puis ');
 const statement = $localize`:@@ex_cumul_stmt:Une valeur ${this.fmt(base, precision)} subit ${pList}. Quelle est la valeur finale et le % équivalent ?`;

 const answerShort = `${this.fmt(final, precision)} ; ${this.fmtSigned(peq, precision)}%`;

 const expanded =
 ps.length <= 4
 ? ps.map(p => `(1+${this.numToLatex(p)} /100)`).join('\\times ')
 : String.raw`\prod_{i=1}^{${ps.length}}\left(1+\dfrac{p_i}{100}\right)`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\text{coef} &= ${expanded} \\
&= {{coef}}
\end{aligned}`,
 vars: { coef },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
\text{final} &= \text{base}\times \text{coef} \\
&= {{b}}\times {{coef}} \\
&= {{f}}
\end{aligned}`,
 vars: { b: base, coef, f: final },
 },
 {
 id: 's3',
 latex: String.raw`\begin{aligned}
p_{eq} &= (\text{coef}-1)\times 100 \\
&= ({{coef}}-1)\times 100 \\
&= {{peq}}
\end{aligned}`,
 vars: { coef, peq },
 },
 ];

 return {
 id,
 kind: 'cumul',
 title,
 statement,
 answerShort,
 answerValue: peq,
 steps,
 tip: $localize`:@@ex_tip_cumul:Astuce : on compose des % en multipliant les coefficients.`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Shares : A / (A+B+C) */
 private exShares(level: Level, precision: number, rng: () => number): Exercise | null {
 const a = this.pickInt(level === 'easy' ? 5 : 10, level === 'easy' ? 50 : 200, rng);
 const b = this.pickInt(level === 'easy' ? 5 : 10, level === 'easy' ? 60 : 250, rng);
 const c = this.pickInt(level === 'easy' ? 5 : 10, level === 'easy' ? 70 : 300, rng);

 const total = a + b + c;
 if (total === 0) return null;

 const pa = (a / total) * 100;

 const id = this.uid('ex');
 const title = $localize`:@@ex_shares_title:Part sur total`;
 const statement = $localize`:@@ex_shares_stmt:On a A=${a}, B=${b}, C=${c}. Quelle est la part de A dans le total en % ?`;

 const answerShort = `${this.fmt(pa, precision)}%`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\text{total} &= A+B+C = {{a}}+{{b}}+{{c}} = {{t}} \\
p_A &= \dfrac{A}{\text{total}}\times 100 = \dfrac{ {{a}} }{ {{t}} }\times 100 = {{p}}
\end{aligned}`,
 vars: { a, b, c, t: total, p: pa },
 },
 ];

 return {
 id,
 kind: 'shares',
 title,
 statement,
 answerShort,
 answerValue: pa,
 steps,
 tip: $localize`:@@ex_tip_shares:Astuce : “part” = (part/total)×100.`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Weighted : moyenne pondérée de taux */
 private exWeighted(level: Level, precision: number, rng: () => number): Exercise | null {
 // ex: taux de réussite par classe + effectifs
 const k = level === 'easy' ? 2 : this.pickInt(2, 3, rng);

 const rates: number[] = [];
 const weights: number[] = [];
 for (let i = 0; i < k; i++) {
 rates.push(this.roundTo(this.range(40, 98, rng), 1)); // %
 weights.push(this.pickInt(10, level === 'hard' ? 200 : 80, rng));
 }

 const sumW = weights.reduce((a, v) => a + v, 0);
 if (sumW === 0) return null;

 const weighted = rates.reduce((acc, r, i) => acc + r * weights[i], 0) / sumW;

 const id = this.uid('ex');
 const title = $localize`:@@ex_weighted_title:Pourcentage pondéré`;
 const pairs = rates.map((r, i) => `${this.fmt(r, 1)}% (poids ${weights[i]})`).join(' ; ');
 const statement = $localize`:@@ex_weighted_stmt:Calculer le taux moyen pondéré pour : ${pairs}.`;

 const answerShort = `${this.fmt(weighted, precision)}%`;

 const num = rates.reduce((acc, r, i) => acc + r * weights[i], 0);

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\bar{p} &= \dfrac{\sum (p_i\times w_i)}{\sum w_i} \\
&= \dfrac{ {{num}} }{ {{den}} } \\
&= {{p}}
\end{aligned}`,
 vars: { num, den: sumW, p: weighted },
 },
 ];

 return {
 id,
 kind: 'weighted',
 title,
 statement,
 answerShort,
 answerValue: weighted,
 steps,
 tip: $localize`:@@ex_tip_weighted:Astuce : on pondère par les poids (effectifs, quantités…).`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Points de % vs % (pp) */
 private exPoints(level: Level, precision: number, rng: () => number): Exercise | null {
 const a = this.roundTo(this.range(2, 40, rng), 1);
 const b = this.roundTo(this.range(a + 1, a + this.range(1, 25, rng), rng), 1);

 const diffPoints = b - a; // pp
 const diffRelative = ((b - a) / a) * 100; // %

 const id = this.uid('ex');
 const title = $localize`:@@ex_points_title:Points de % vs %`;
 const statement = $localize`:@@ex_points_stmt:Un taux passe de ${this.fmt(a, 1)}% à ${this.fmt(b, 1)}%. Donner la variation en points de % et la variation relative en %.`;

 const answerShort = `${this.fmt(diffPoints, precision)} pp ; ${this.fmtSigned(diffRelative, precision)}%`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\Delta(\text{points}) &= {{b}}-{{a}} = {{pp}} \\
\Delta(\%) &= \dfrac{{{b}}-{{{a}}}{{}}{{}}}{ {{a}} }\times 100 = {{pr}}
\end{aligned}`,
 vars: { a, b, pp: diffPoints, pr: diffRelative },
 },
 ];

 return {
 id,
 kind: 'points',
 title,
 statement,
 answerShort,
 answerValue: diffRelative,
 steps,
 tip: $localize`:@@ex_tip_points:Astuce : “pp” = différence brute, “%” = relatif à la base.`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Pièges : +20% puis -20% n’annule pas, etc. */
 private exTraps(level: Level, precision: number, rng: () => number): Exercise | null {
 const base = this.pickNiceNumber(level, rng, { nonZero: true });
 const p = this.pickInt(5, level === 'hard' ? 60 : 40, rng);

 const afterUp = base * (1 + p / 100);
 const afterDown = afterUp * (1 - p / 100);

 const totalVar = ((afterDown - base) / base) * 100;

 const id = this.uid('ex');
 const title = $localize`:@@ex_traps_title:Piège classique`;
 const statement = $localize`:@@ex_traps_stmt:On applique +${p}% puis -${p}% à ${this.fmt(base, precision)}. Quel est le résultat final et la variation totale ?`;

 const answerShort = `${this.fmt(afterDown, precision)} ; ${this.fmtSigned(totalVar, precision)}%`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\text{coef} &= (1+\dfrac{ {{p}} }{100})(1-\dfrac{ {{p}} }{100}) \\
&= 1-\left(\dfrac{ {{p}} }{100}\right)^2 \\
&= {{coef}}
\end{aligned}`,
 vars: { p, coef: (1 + p / 100) * (1 - p / 100) },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
\text{final} &= {{b}}\times {{coef}} = {{f}} \\
p_{tot} &= \dfrac{{{f}}-{{{b}}}}{{{b}}}\times 100 = {{pt}}
\end{aligned}`,
 vars: { b: base, coef: (1 + p / 100) * (1 - p / 100), f: afterDown, pt: totalVar },
 },
 ];

 return {
 id,
 kind: 'traps',
 title,
 statement,
 answerShort,
 answerValue: totalVar,
 steps,
 tip: $localize`:@@ex_tip_traps:Astuce : une hausse puis une baisse identiques ne s’annulent pas (composition).`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Détecter l'erreur : on donne une "solution" fausse et l'utilisateur corrige */
 private exErrorCheck(level: Level, precision: number, rng: () => number): Exercise | null {
 const base = this.pickNiceNumber(level, rng, { nonZero: true });
 const p1 = this.pickInt(5, 40, rng);
 const p2 = this.pickInt(5, 40, rng);

 const wrong = p1 + p2; // somme naïve
 const coef = (1 + p1 / 100) * (1 + p2 / 100);
 const correct = (coef - 1) * 100;
 const final = base * coef;

 const id = this.uid('ex');
 const title = $localize`:@@ex_errorcheck_title:Détecter l’erreur`;
 const statement = $localize`:@@ex_errorcheck_stmt:Quelqu’un affirme : “+${p1}% puis +${p2}% = +${wrong}%”. Expliquez l’erreur et donnez le % équivalent et la valeur finale à partir de ${this.fmt(base, precision)}.`;

 const answerShort = `${this.fmtSigned(correct, precision)}% ; ${this.fmt(final, precision)}`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
\text{Erreur} &: \ \text{on ne somme pas les % successifs, on multiplie les coefficients.}\\
\text{coef} &= (1+\dfrac{ {{p1}} }{100})(1+\dfrac{ {{p2}} }{100}) = {{coef}}
\end{aligned}`,
 vars: { p1, p2, coef },
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
p_{eq} &= (\text{coef}-1)\times 100 = {{peq}} \\
\text{final} &= {{b}}\times {{coef}} = {{f}}
\end{aligned}`,
 vars: { peq: correct, b: base, coef, f: final },
 },
 ];

 return {
 id,
 kind: 'error-check',
 title,
 statement,
 answerShort,
 answerValue: correct,
 steps,
 tip: $localize`:@@ex_tip_errorcheck:Astuce : somme naïve ≠ composition (coef).`,
 difficultyTag: this.diffTag(level),
 };
 }

 /** Étape manquante : on masque une étape au milieu */
 private exFillStep(level: Level, precision: number, rng: () => number): Exercise | null {
 // on prend une variation simple et on “troue” la formule
 const initial = this.pickNiceNumber(level, rng, { nonZero: true });
 const p = this.pickPercent(level, rng, { allowNegative: true, allowOver100: level === 'hard' });
 const final = initial * (1 + p / 100);
 const calcP = ((final - initial) / initial) * 100;

 const id = this.uid('ex');
 const title = $localize`:@@ex_fillstep_title:Étape manquante`;
 const statement = $localize`:@@ex_fillstep_stmt:Complétez l’étape manquante pour calculer la variation en % entre ${this.fmt(initial, precision)} et ${this.fmt(final, precision)}.`;

 const answerShort = `${this.fmtSigned(calcP, precision)}%`;

 const steps: Step[] = [
 {
 id: 's1',
 latex: String.raw`\begin{aligned}
p &= \dfrac{\text{final}-\text{initial}}{\text{initial}}\times 100
\end{aligned}`,
 },
 {
 id: 's2',
 latex: String.raw`\begin{aligned}
\text{Étape manquante : }\quad p = \boxed{\,?\,}
\end{aligned}`,
 },
 {
 id: 's3',
 latex: String.raw`\begin{aligned}
p &= \dfrac{ {{f}}-{{i}} }{ {{i}} }\times 100 = {{p}}
\end{aligned}`,
 vars: { i: initial, f: final, p: calcP },
 },
 ];

 return {
 id,
 kind: 'fill-step',
 title,
 statement,
 answerShort,
 answerValue: calcP,
 steps,
 tip: $localize`:@@ex_tip_fillstep:Astuce : pense “Δ / initial”.`,
 difficultyTag: this.diffTag(level),
 };
 }

 // -------------------------
 // Distribution & RNG helpers
 // -------------------------

 private planDistribution(pool: Theme[], n: number, rng: () => number): Record<Theme, number> {
 // base : répartir équitablement
 const res: Record<Theme, number> = {} as any;
 for (const t of pool) res[t] = 0;

 // minimum 1 sur certains thèmes si possibles
 const mustHave: Theme[] = [];
 if (pool.includes('essential')) mustHave.push('essential');
 if (pool.includes('variation')) mustHave.push('variation');

 // assign must-have
 let remaining = n;
 for (const t of mustHave) {
 if (remaining <= 0) break;
 res[t] = (res[t] ?? 0) + 1;
 remaining--;
 }

 // distribute rest randomly with slight bias
 for (let i = 0; i < remaining; i++) {
 const t = pool[Math.floor(rng() * pool.length)];
 res[t] = (res[t] ?? 0) + 1;
 }

 return res;
 }

 private pickByTargets(targets: Record<Theme, number>, rng: () => number): Theme {
 const entries = Object.entries(targets) as [Theme, number][];
 const available = entries.filter(([, c]) => c > 0);
 if (!available.length) {
 // fallback: random key
 const keys = entries.map(e => e[0]);
 return keys[Math.floor(rng() * keys.length)];
 }
 const total = available.reduce((a, [, c]) => a + c, 0);
 let r = rng() * total;
 for (const [k, c] of available) {
 r -= c;
 if (r <= 0) return k;
 }
 return available[available.length - 1][0];
 }

 private mulberry32(seed: number) {
 let a = seed >>> 0;
 return () => {
 a |= 0;
 a = (a + 0x6D2B79F5) | 0;
 let t = Math.imul(a ^ (a >>> 15), 1 | a);
 t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
 return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 };
 }

 private randomSeed(): number {
 // assez “random” sans crypto
 const t = Date.now() % 2_147_483_647;
 const r = Math.floor(Math.random() * 2_147_483_647);
 return this.clampInt((t ^ r) || 123456, 1, 2_147_483_647);
 }

 // -------------------------
 // Number picking helpers
 // -------------------------

 private pickNiceNumber(level: Level, rng: () => number, opts?: { nonZero?: boolean }): number {
 const nonZero = !!opts?.nonZero;

 const easySet = [20, 25, 40, 50, 60, 80, 100, 120, 200, 250, 400, 500, 1000, 2000];
 const mediumSet = [18, 36, 72, 96, 125, 150, 180, 240, 360, 480, 750, 1200, 1500, 3200];
 const hardSet = [37, 58, 99, 135, 175, 260, 420, 875, 1333, 2460, 5100, 7800];

 const arr = level === 'easy' ? easySet : level === 'medium' ? mediumSet : hardSet;
 let v = arr[Math.floor(rng() * arr.length)];
 if (nonZero && v === 0) v = 100;
 return v;
 }

 private pickPercent(
 level: Level,
 rng: () => number,
 opts: { allowNegative: boolean; allowOver100: boolean; avoidMinus100?: boolean }
 ): number {
 const allowNegative = opts.allowNegative;
 const allowOver100 = opts.allowOver100;
 const avoidMinus100 = !!opts.avoidMinus100;

 // easy: mostly clean percents
 if (level === 'easy') {
 const base = [5, 10, 12.5, 15, 20, 25, 30, 40, 50];
 let p = base[Math.floor(rng() * base.length)];
 if (allowNegative && rng() < 0.35) p = -p;
 if (avoidMinus100 && p === -100) p = -50;
 return p;
 }

 // medium/hard: allow decimals
 const dec = rng() < 0.4 ? 0.5 : 1;
 const min = allowNegative ? -60 : 1;
 const max = allowOver100 ? 180 : 80;
 let p = this.roundTo(this.range(min, max, rng), dec);
 if (avoidMinus100 && p === -100) p = -50;
 return p;
 }

 // -------------------------
 // Formatting helpers
 // -------------------------

 fmt(n: number | null, precision: number): string {
 if (n == null || !Number.isFinite(n)) return '—';
 return Number(n.toFixed(precision)).toFixed(precision);
 }

 fmtSigned(n: number | null, precision: number): string {
 if (n == null || !Number.isFinite(n)) return '—';
 const v = Number(n.toFixed(precision));
 const sign = v > 0 ? '+' : '';
 return `${sign}${v.toFixed(precision)}`;
 }

 private numToLatex(n: number): string {
 if (!Number.isFinite(n)) return '0';
 return String(Number(n.toFixed(6)));
 }

 private diffTag(level: Level): 'Facile' | 'Moyen' | 'Difficile' {
 return level === 'easy' ? 'Facile' : level === 'medium' ? 'Moyen' : 'Difficile';
 }

 private uid(prefix: string): string {
 return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
 }

 private range(min: number, max: number, rng: () => number): number {
 return min + (max - min) * rng();
 }

 private pickInt(min: number, max: number, rng: () => number): number {
 return Math.floor(this.range(min, max + 1, rng));
 }

 private pickFrom<T>(arr: T[], rng: () => number): T {
 return arr[Math.floor(rng() * arr.length)];
 }

 private roundTo(n: number, decimals: number): number {
 const f = Math.pow(10, decimals);
 return Math.round(n * f) / f;
 }

 private clampInt(n: number, min: number, max: number): number {
 const v = Math.trunc(Number.isFinite(n) ? n : min);
 return Math.min(max, Math.max(min, v));
 }
}
