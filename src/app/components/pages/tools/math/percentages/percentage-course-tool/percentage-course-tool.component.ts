import { Component, computed, signal } from '@angular/core';
import {NgFor, NgForOf, NgIf} from '@angular/common';
import { RouterLink } from '@angular/router';

// PrimeNG (basique, stable)
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

import { MathFormulaComponent } from '../../../../../shared/math-formula/math-formula.component';

type QuizKind = 'mcq' | 'number';

type Quiz = {
  id: string;
  kind: QuizKind;
  prompt: string;
  // MCQ
  choices?: { label: string; value: string }[];
  correctChoice?: string;
  // Number
  correctNumber?: number;
  unit?: string; // "%" / "pp" / ""
  precision?: number; // tolerance formatting
  // Correction
  explanation: string;
};

type LessonSection = {
  title: string;
  bullets: string[];
  formulaLatex?: string;
  examples?: { label: string; latex: string }[];
};

type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  sections: LessonSection[];
  quizzes: Quiz[];
};

@Component({
  selector: 'app-percentage-course-tool',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    DividerModule,
    TagModule,
    MathFormulaComponent,
    NgIf,
    RouterLink,
    NgForOf,
  ],
  templateUrl: './percentage-course-tool.component.html',
  styleUrl: './percentage-course-tool.component.scss',
})
export class PercentageCourseToolComponent {
  // --- Course data (cours “très complet” mais compact côté code)
  lessons: Lesson[] = this.buildLessons();

  // --- UI state
  query = signal('');
  activeId = signal<string>(this.lessons[0]?.id ?? 'intro');

  // quiz state: answers + reveal
  quizAnswers = signal<Record<string, string>>({});
  quizReveals = signal<Record<string, boolean>>({});

  // optional seed to shuffle quiz order (simple)
  seed = signal<number>(this.randomSeed());
  shuffleQuizzes = signal<boolean>(false);

  filteredLessons = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.lessons;

    return this.lessons.filter(l => {
      const hay =
        (l.title + ' ' + l.subtitle + ' ' + l.tags.join(' ') + ' ' + l.sections.map(s => s.title).join(' '))
          .toLowerCase();
      return hay.includes(q);
    });
  });

  activeLesson = computed(() => {
    const id = this.activeId();
    return this.lessons.find(l => l.id === id) ?? this.lessons[0];
  });

  activeIndex = computed(() => this.lessons.findIndex(l => l.id === this.activeId()));
  progress = computed(() => {
    const idx = this.activeIndex();
    if (idx < 0 || this.lessons.length <= 1) return 0;
    return Math.round((idx / (this.lessons.length - 1)) * 100);
  });

  // --- Navigation
  openLesson(id: string) {
    this.activeId.set(id);
    // scroll top (SPA friendly)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prev() {
    const i = this.activeIndex();
    if (i > 0) this.openLesson(this.lessons[i - 1].id);
  }

  next() {
    const i = this.activeIndex();
    if (i >= 0 && i < this.lessons.length - 1) this.openLesson(this.lessons[i + 1].id);
  }

  nowSeed(): number {
    return (Date.now() % 2_147_483_647) || 123456;
  }

  // --- Quiz
  getLessonQuizzes(lesson: Lesson): Quiz[] {
    if (!this.shuffleQuizzes()) return lesson.quizzes;

    const rng = this.mulberry32(this.seed() ^ this.hash(lesson.id));
    const arr = [...lesson.quizzes];
    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  openSelectId = signal<string | null>(null);

  toggleSelect(id: string) {
    this.openSelectId.set(this.openSelectId() === id ? null : id);
  }

  closeSelect() {
    this.openSelectId.set(null);
  }


  setAnswer(qId: string, value: string) {
    this.quizAnswers.set({ ...this.quizAnswers(), [qId]: value });
    this.closeSelect();
  }

  reveal(qId: string) {
    this.quizReveals.set({ ...this.quizReveals(), [qId]: true });
  }

  selectLabel(q: Quiz): string {
    if (q.kind !== 'mcq') return '';

    const ans = this.quizAnswers()[q.id] ?? '';
    if (!ans) return 'Choisir…'; // tu peux i18n plus tard

    const choices = q.choices ?? [];
    const found = choices.find(c => c.value === ans);
    return found?.label ?? ans;
  }

  hasChoices(q: Quiz): boolean {
    return q.kind === 'mcq' && Array.isArray(q.choices) && q.choices.length > 0;
  }

  resetQuizForLesson(lesson: Lesson) {
    const a = { ...this.quizAnswers() };
    const r = { ...this.quizReveals() };
    for (const q of lesson.quizzes) {
      delete a[q.id];
      delete r[q.id];
    }
    this.quizAnswers.set(a);
    this.quizReveals.set(r);
  }

  checkQuiz(q: Quiz): { ok: boolean; userText: string; correctText: string } {
    const ans = (this.quizAnswers()[q.id] ?? '').trim();

    if (q.kind === 'mcq') {
      const ok = ans === (q.correctChoice ?? '');
      const userText = ans ? (q.choices?.find(c => c.value === ans)?.label ?? ans) : '—';
      const correctText = q.choices?.find(c => c.value === q.correctChoice)?.label ?? '—';
      return { ok, userText, correctText };
    }

    // number
    const user = this.toNumber(ans);
    const prec = q.precision ?? 2;

    const correct = q.correctNumber ?? 0;
    const tol = this.tolerance(prec);
    const ok = user != null && Math.abs(user - correct) <= tol;

    return {
      ok,
      userText: user == null ? '—' : this.fmt(user, prec) + (q.unit ? ` ${q.unit}` : ''),
      correctText: this.fmt(correct, prec) + (q.unit ? ` ${q.unit}` : ''),
    };
  }

  // --- Helpers
  private fmt(n: number, p: number): string {
    return Number(n.toFixed(p)).toFixed(p);
  }

  private tolerance(precision: number): number {
    // ex precision=2 -> tol ~ 0.005
    return 0.5 * Math.pow(10, -precision);
  }

  private toNumber(v: string): number | null {
    if (!v) return null;
    const normalized = v.replace(',', '.').replace('%', '').trim();
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }

  private randomSeed(): number {
    const t = Date.now() % 2_147_483_647;
    const r = Math.floor(Math.random() * 2_147_483_647);
    const s = (t ^ r) || 123456;
    return Math.min(2_147_483_647, Math.max(1, s));
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

  private hash(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // ==========================
  // C O U R S   C O N T E N T
  // ==========================
  private buildLessons(): Lesson[] {
    const L = (x: string) => x; // (place holder — ton i18n passera via extraction de texte)

    return [
      {
        id: 'intro',
        title: L('1) Comprendre un pourcentage'),
        subtitle: L('Définition, lecture, conversions rapides.'),
        tags: ['bases', '%', 'conversion'],
        sections: [
          {
            title: L('Définition'),
            bullets: [
              L('Un pourcentage est une fraction sur 100 : p% = p/100.'),
              L('“20% de” signifie “20 sur 100 de”, donc un coefficient 0,20.'),
              L('Un même pourcentage peut être exprimé en décimal ou en fraction.'),
            ],
            formulaLatex: String.raw`\begin{aligned}
p\% &= \frac{p}{100} \\
\text{coefficient} &= \frac{p}{100}
\end{aligned}`,
            examples: [
              { label: L('Exemple'), latex: String.raw`25\% = \frac{25}{100} = 0{,}25 = \frac{1}{4}` },
              { label: L('Exemple'), latex: String.raw`7{,}5\% = \frac{7{,}5}{100} = 0{,}075` },
            ],
          },
          {
            title: L('Piège courant'),
            bullets: [
              L('Confondre “20%” et “0,20” : 20% = 0,20 (pas 20).'),
              L('Dire “+20%” signifie multiplier par 1,20.'),
            ],
            formulaLatex: String.raw`\text{Après } +p\%:\quad \text{nouveau}=\text{ancien}\times\left(1+\frac{p}{100}\right)`,
          },
        ],
        quizzes: [
          {
            id: 'q_intro_1',
            kind: 'mcq',
            prompt: L('Quel est le coefficient multiplicateur correspondant à +15% ?'),
            choices: [
              { label: '0,15', value: 'a' },
              { label: '1,15', value: 'b' },
              { label: '15', value: 'c' },
            ],
            correctChoice: 'b',
            explanation: L('Une hausse de +15% => coefficient 1 + 15/100 = 1,15.'),
          },
          {
            id: 'q_intro_2',
            kind: 'number',
            prompt: L('Convertir 2,5% en nombre décimal.'),
            correctNumber: 0.025,
            precision: 3,
            unit: '',
            explanation: L('2,5% = 2,5/100 = 0,025.'),
          },
        ],
      },

      {
        id: 'percent-of',
        title: L('2) Calculer p% d’une valeur'),
        subtitle: L('La compétence “réflexe” : p% de y.'),
        tags: ['p% de', 'coefficient'],
        sections: [
          {
            title: L('Méthode'),
            bullets: [
              L('Transformer p% en coefficient p/100, puis multiplier.'),
              L('Pour les calculs mentaux : 10% = ÷10, 5% = ÷20, 20% = ÷5, 25% = ÷4, etc.'),
            ],
            formulaLatex: String.raw`x = \frac{p}{100}\times y`,
            examples: [
              { label: L('Exemple'), latex: String.raw`12\%\ \text{de}\ 250 = 0{,}12\times 250 = 30` },
              { label: L('Exemple'), latex: String.raw`25\%\ \text{de}\ 80 = \frac{1}{4}\times 80 = 20` },
            ],
          },
        ],
        quizzes: [
          {
            id: 'q_po_1',
            kind: 'number',
            prompt: L('Calculer 18% de 250.'),
            correctNumber: 45,
            precision: 0,
            explanation: L('0,18 × 250 = 45.'),
          },
          {
            id: 'q_po_2',
            kind: 'mcq',
            prompt: L('25% d’un nombre, c’est équivalent à…'),
            choices: [
              { label: 'le diviser par 2', value: 'a' },
              { label: 'le diviser par 4', value: 'b' },
              { label: 'le multiplier par 4', value: 'c' },
            ],
            correctChoice: 'b',
            explanation: L('25% = 1/4.'),
          },
        ],
      },

      {
        id: 'what-percent',
        title: L('3) “X est quel % de Y”'),
        subtitle: L('Transformer un ratio en pourcentage.'),
        tags: ['ratio', 'x/y', '×100'],
        sections: [
          {
            title: L('Formule'),
            bullets: [
              L('On divise X par Y pour obtenir une proportion, puis on multiplie par 100.'),
              L('Attention : Y ne doit pas être 0.'),
            ],
            formulaLatex: String.raw`p = \frac{x}{y}\times 100`,
            examples: [
              { label: L('Exemple'), latex: String.raw`30\ \text{sur}\ 200 \Rightarrow \frac{30}{200}\times 100 = 15\%` },
            ],
          },
        ],
        quizzes: [
          {
            id: 'q_wp_1',
            kind: 'number',
            prompt: L('48 représente quel % de 120 ?'),
            correctNumber: 40,
            precision: 0,
            unit: '%',
            explanation: L('48/120 = 0,4 -> 40%.'),
          },
        ],
      },

      {
        id: 'variation',
        title: L('4) Variation en %'),
        subtitle: L('Mesurer l’évolution entre une valeur initiale et une valeur finale.'),
        tags: ['variation', 'évolution', 'Δ'],
        sections: [
          {
            title: L('Formule standard'),
            bullets: [
              L('On compare l’écart (final - initial) à la valeur initiale.'),
              L('Variation positive = hausse, négative = baisse.'),
            ],
            formulaLatex: String.raw`p = \frac{\text{final}-\text{initial}}{\text{initial}}\times 100`,
            examples: [
              { label: L('Exemple'), latex: String.raw`80 \to 100 :\ \frac{100-80}{80}\times 100 = 25\%` },
            ],
          },
          {
            title: L('Pièges'),
            bullets: [
              L('Le dénominateur est TOUJOURS l’initial (pour une “variation classique”).'),
              L('La variation de A vers B n’est pas l’opposé exact de la variation de B vers A.'),
            ],
          },
        ],
        quizzes: [
          {
            id: 'q_var_1',
            kind: 'number',
            prompt: L('Une valeur passe de 50 à 62,5. Variation en % ?'),
            correctNumber: 25,
            precision: 0,
            unit: '%',
            explanation: L('(62,5-50)/50*100 = 25%.'),
          },
          {
            id: 'q_var_2',
            kind: 'mcq',
            prompt: L('Si on passe de 100 à 80, la variation est :'),
            choices: [
              { label: '+20%', value: 'a' },
              { label: '-20%', value: 'b' },
              { label: '-25%', value: 'c' },
            ],
            correctChoice: 'b',
            explanation: L('(80-100)/100*100 = -20%.'),
          },
        ],
      },

      {
        id: 'reverse',
        title: L('5) Retrouver la valeur initiale'),
        subtitle: L('Le “pourcentage inverse” : revenir avant une variation.'),
        tags: ['inverse', 'coefficient', 'retour arrière'],
        sections: [
          {
            title: L('Principe'),
            bullets: [
              L('Après +p%, on a final = initial × (1 + p/100).'),
              L('Donc initial = final ÷ (1 + p/100).'),
              L('Attention au cas -100% : coefficient 0 (impossible).'),
            ],
            formulaLatex: String.raw`\text{initial} = \frac{\text{final}}{1+\frac{p}{100}}`,
            examples: [
              { label: L('Exemple'), latex: String.raw`Final=120\ \text{après}\ +20\% \Rightarrow \text{initial}=\frac{120}{1,2}=100` },
            ],
          },
        ],
        quizzes: [
          {
            id: 'q_rev_1',
            kind: 'number',
            prompt: L('Après une hausse de +25%, un prix vaut 250€. Prix initial ?'),
            correctNumber: 200,
            precision: 0,
            unit: '€',
            explanation: L('Initial = 250 / 1,25 = 200.'),
          },
        ],
      },

      {
        id: 'successive',
        title: L('6) Pourcentages successifs'),
        subtitle: L('Composer plusieurs variations : coefficients multiplicateurs.'),
        tags: ['composition', 'successifs', 'coef'],
        sections: [
          {
            title: L('Règle'),
            bullets: [
              L('On n’additionne pas les % successifs : on multiplie les coefficients.'),
              L('Coefficient total = (1+p1/100)×(1+p2/100)×…'),
              L('% équivalent = (coef_total - 1)×100.'),
            ],
            formulaLatex: String.raw`
\begin{aligned}
\text{coef} &= \prod_i\left(1+\frac{p_i}{100}\right) \\
p_{eq} &= (\text{coef}-1)\times 100
\end{aligned}`,
            examples: [
              { label: L('Exemple'), latex: String.raw`+20\%\ \text{puis}\ -20\%:\ 1,2\times 0,8 = 0,96 \Rightarrow -4\%` },
            ],
          },
        ],
        quizzes: [
          {
            id: 'q_succ_1',
            kind: 'number',
            prompt: L('Une valeur subit +10% puis +10%. % équivalent ?'),
            correctNumber: 21,
            precision: 0,
            unit: '%',
            explanation: L('1,1×1,1=1,21 => +21%.'),
          },
        ],
      },

      {
        id: 'points',
        title: L('7) Points de % (pp) vs variation en %'),
        subtitle: L('Très utile en stats, finances, taux.'),
        tags: ['pp', 'points', 'taux'],
        sections: [
          {
            title: L('Différence'),
            bullets: [
              L('Points de % : différence brute entre deux taux.'),
              L('Variation relative : (nouveau - ancien) / ancien × 100.'),
            ],
            formulaLatex: String.raw`
\Delta(\text{pp}) = b-a
\qquad
\Delta(\%) = \frac{b-a}{a}\times 100`,
            examples: [
              { label: L('Exemple'), latex: String.raw`De 10\% à 12\% : +2\ \text{pp}, mais +20\% en relatif.` },
            ],
          },
        ],
        quizzes: [
          {
            id: 'q_pp_1',
            kind: 'mcq',
            prompt: L('Un taux passe de 5% à 6%. Variation :'),
            choices: [
              { label: '+1 pp et +20% relatif', value: 'a' },
              { label: '+1% et +1 pp', value: 'b' },
              { label: '+20 pp', value: 'c' },
            ],
            correctChoice: 'a',
            explanation: L('pp = 6-5 = 1 ; relatif = 1/5=20%.'),
          },
        ],
      },

      {
        id: 'shares-weighted',
        title: L('8) Parts, totals et pondérations'),
        subtitle: L('Répartitions (A/(A+B+C)) et moyenne pondérée de taux.'),
        tags: ['part', 'total', 'pondéré'],
        sections: [
          {
            title: L('Part sur total'),
            bullets: [
              L('Part(%) = part/total × 100.'),
              L('Total = somme des parts.'),
            ],
            formulaLatex: String.raw`p_A = \frac{A}{A+B+C}\times 100`,
          },
          {
            title: L('Moyenne pondérée'),
            bullets: [
              L('Quand les groupes n’ont pas le même poids (effectifs, quantités…).'),
              L('On calcule : (Σ p_i×w_i)/(Σ w_i).'),
            ],
            formulaLatex: String.raw`\bar{p}=\frac{\sum(p_i w_i)}{\sum w_i}`,
          },
        ],
        quizzes: [
          {
            id: 'q_share_1',
            kind: 'number',
            prompt: L('A=30, B=50, C=20. Part de A en % ?'),
            correctNumber: 30,
            precision: 0,
            unit: '%',
            explanation: L('Total 100 => A=30%.'),
          },
          {
            id: 'q_w_1',
            kind: 'number',
            prompt: L('Taux 80% (poids 10) et 50% (poids 30). Moyenne pondérée ?'),
            correctNumber: 57.5,
            precision: 1,
            unit: '%',
            explanation: L('(80×10 + 50×30)/(10+30) = (800+1500)/40 = 57,5%.'),
          },
        ],
      },

      {
        id: 'limits-traps',
        title: L('9) Limites & pièges avancés'),
        subtitle: L('−100%, +∞, bases différentes, erreurs classiques.'),
        tags: ['limites', 'pièges', 'erreurs'],
        sections: [
          {
            title: L('Limites'),
            bullets: [
              L('Baisse de 100% => valeur finale = 0 (coefficient 0).'),
              L('Hausse illimitée : +p% peut dépasser 100% (ex: +150%).'),
              L('Variation relative vers le haut peut tendre vers +∞ si l’initial tend vers 0.'),
            ],
            formulaLatex: String.raw`\text{coef} = 1+\frac{p}{100}\quad (\text{interdit si } \text{coef}=0\ \text{pour inverser})`,
          },
          {
            title: L('Pièges'),
            bullets: [
              L('“+x% puis -x%” ne revient pas au point de départ.'),
              L('Confondre “points de %” et “% relatif”.'),
              L('Se tromper de base (initial vs final).'),
            ],
          },
        ],
        quizzes: [
          {
            id: 'q_trap_1',
            kind: 'mcq',
            prompt: L('Après +50% puis -50%, le résultat est :'),
            choices: [
              { label: 'identique à l’origine', value: 'a' },
              { label: 'plus petit qu’à l’origine', value: 'b' },
              { label: 'plus grand qu’à l’origine', value: 'c' },
            ],
            correctChoice: 'b',
            explanation: L('1,5×0,5=0,75 => -25% au total.'),
          },
        ],
      },
    ];
  }
}
