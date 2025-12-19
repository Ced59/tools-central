import { Component, computed, signal } from '@angular/core';
import {NgFor, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import {map, startWith} from "rxjs";
import {toSignal} from "@angular/core/rxjs-interop";

type ReadabilityLevelKey =
  | 'very_easy'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'very_hard';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

type Example = {
  label: string;
  text: string;
};

type Analysis = {
  charCount: number;
  charCountNoSpaces: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;

  avgWordLength: number;
  avgSentenceLength: number;

  longSentenceRatio: number; // 0..1 (phrases > 25 mots)
  veryLongSentenceRatio: number; // 0..1 (> 35)
  punctuationDensity: number; // ponctuation / mots

  score: number; // 0..100
  levelKey: ReadabilityLevelKey;

  issues: string[]; // i18n keys
  tips: string[];   // i18n keys
};

@Component({
  selector: 'app-readability-tool',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    RouterLink,
    TextareaModule,
    ButtonModule,
    TagModule,
    NgSwitchCase,
    NgSwitch,
  ],
  templateUrl: './readability-tool.component.html',
  styleUrl: './readability-tool.component.scss',
})
export class ReadabilityToolComponent {
  private fb = new FormBuilder();

  form = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(1)]],
  });

  // ✅ Signal réactif basé sur le formControl
  text = toSignal(
    this.form.controls.text.valueChanges.pipe(
      startWith(this.form.controls.text.value ?? ''),
      map(v => (v ?? '').toString())
    ),
    { initialValue: '' }
  );

  // ✅ résultat (null si vide) — maintenant ça marche
  analysis = computed<Analysis | null>(() => {
    const t = (this.text() ?? '').trim();
    if (!t) return null;
    return analyzeText(t);
  });

  // UI helpers inchangés
  scoreLabel = computed(() => {
    const a = this.analysis();
    return a ? `${a.score}/100` : '';
  });

  examples: Example[] = [
    {
      label: $localize`:@@readability_example_clear_label:Texte clair`,
      text: $localize`:@@readability_example_clear_text:Ce guide explique comment remplir le formulaire. Commencez par votre identité, puis ajoutez vos informations de contact. Si vous avez un doute, consultez l’aide en bas de page.`,
    },
    {
      label: $localize`:@@readability_example_dense_label:Texte dense`,
      text: $localize`:@@readability_example_dense_text:Dans le cadre de l’optimisation des processus, il est recommandé, afin de garantir une cohérence opérationnelle, de procéder à une normalisation exhaustive des paramètres, ce qui implique une revue systématique des éléments concernés.`,
    },
    {
      label: $localize`:@@readability_example_long_label:Phrases trop longues`,
      text: $localize`:@@readability_example_long_text:Quand on écrit un texte sans faire de pauses et qu’on enchaîne les idées sans séparer clairement les phrases, le lecteur se fatigue, perd le fil, et finit par relire plusieurs fois parce qu’il n’arrive pas à identifier ce qui est important.`,
    },
  ];

  levelLabel = computed(() => {
    const a = this.analysis();
    if (!a) return '';
    switch (a.levelKey) {
      case 'very_easy':
        return $localize`:@@readability_level_very_easy:Très facile`;
      case 'easy':
        return $localize`:@@readability_level_easy:Facile`;
      case 'medium':
        return $localize`:@@readability_level_medium:Moyen`;
      case 'hard':
        return $localize`:@@readability_level_hard:Difficile`;
      case 'very_hard':
        return $localize`:@@readability_level_very_hard:Très difficile`;
    }
  });

  levelSeverity = computed<Severity>(() => {
    const a = this.analysis();
    if (!a) return 'secondary';
    if (a.score >= 85) return 'success';
    if (a.score >= 70) return 'info';
    if (a.score >= 50) return 'warn';
    return 'danger';
  });

  barWidth = computed(() => {
    const a = this.analysis();
    return `${a ? a.score : 0}%`;
  });

  applyExample(ex: Example) {
    this.form.controls.text.setValue(ex.text, { emitEvent: true });
    this.form.markAsDirty();
    this.form.markAsTouched();
  }

  clear() {
    this.form.controls.text.setValue('', { emitEvent: true });
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  copySummary() {
    const a = this.analysis();
    if (!a) return;

    const lines = [
      `${$localize`:@@readability_copy_title:Analyse de lisibilité`} — ${a.score}/100 (${this.levelLabel()})`,
      `${$localize`:@@readability_copy_words:Mots`}: ${a.wordCount}`,
      `${$localize`:@@readability_copy_sentences:Phrases`}: ${a.sentenceCount}`,
      `${$localize`:@@readability_copy_avg_sentence:Longueur moyenne des phrases`}: ${format1(a.avgSentenceLength)}`,
      `${$localize`:@@readability_copy_avg_word:Longueur moyenne des mots`}: ${format1(a.avgWordLength)}`,
    ];

    navigator.clipboard?.writeText(lines.join('\n'));
  }
}

/** ---------- Pure TS: analyse + score ---------- */

function analyzeText(text: string): Analysis {
  const normalized = normalizeText(text);

  const paragraphs = splitParagraphs(normalized);
  const sentences = splitSentences(normalized);
  const words = splitWords(normalized);

  const charCount = normalized.length;
  const charCountNoSpaces = normalized.replace(/\s+/g, '').length;

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const paragraphCount = Math.max(1, paragraphs.length);

  const avgWordLength = wordCount ? avg(words.map(w => w.length)) : 0;
  const avgSentenceLength = sentenceCount ? wordCount / sentenceCount : wordCount;

  const longThreshold = 25;
  const veryLongThreshold = 35;

  const sentenceWordCounts = sentences.map(s => splitWords(s).length).filter(n => n > 0);
  const longCount = sentenceWordCounts.filter(n => n > longThreshold).length;
  const veryLongCount = sentenceWordCounts.filter(n => n > veryLongThreshold).length;

  const longSentenceRatio = sentenceWordCounts.length ? longCount / sentenceWordCounts.length : 0;
  const veryLongSentenceRatio = sentenceWordCounts.length ? veryLongCount / sentenceWordCounts.length : 0;

  const punctCount = (normalized.match(/[.,;:!?…、。！？；：]/gu) ?? []).length;
  const punctuationDensity = wordCount ? punctCount / wordCount : 0;

  const score = computeUniversalScore({
    avgSentenceLength,
    avgWordLength,
    longSentenceRatio,
    veryLongSentenceRatio,
    paragraphCount,
    wordCount,
    punctuationDensity,
  });

  const levelKey = scoreToLevel(score);

  const { issues, tips } = buildFeedback({
    avgSentenceLength,
    avgWordLength,
    longSentenceRatio,
    veryLongSentenceRatio,
    paragraphCount,
    wordCount,
    punctuationDensity,
  });

  return {
    charCount,
    charCountNoSpaces,
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordLength: round1(avgWordLength),
    avgSentenceLength: round1(avgSentenceLength),
    longSentenceRatio,
    veryLongSentenceRatio,
    punctuationDensity: round2(punctuationDensity),
    score,
    levelKey,
    issues,
    tips,
  };
}

function normalizeText(t: string): string {
  return t
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function splitParagraphs(t: string): string[] {
  return t.split(/\n\s*\n/g).map(s => s.trim()).filter(Boolean);
}

/**
 * Découpage phrases multi-écritures :
 * - Supporte ponctuation latine + CJK (。！？)
 * - Fallback: si aucune ponctuation fin de phrase, on renvoie [texte]
 */
function splitSentences(t: string): string[] {
  const parts = t
    .split(/(?<=[.!?。！？…])\s+/u)
    .map(s => s.trim())
    .filter(Boolean);

  return parts.length ? parts : [t.trim()];
}

/**
 * Découpage mots unicode.
 * - Si le texte ressemble à du CJK sans espaces, on compte des "tokens" par caractères (hors ponctuation/espaces)
 * - Sinon, on extrait des séquences de lettres/nombres.
 */
function splitWords(t: string): string[] {
  const hasSpaces = /\s/.test(t);

  const looksCjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(t);
  if (looksCjk && !hasSpaces) {
    // tokens par caractères "utiles"
    const chars = Array.from(t).filter(ch => /[\p{L}\p{N}]/u.test(ch));
    return chars;
  }

  // latin/cyrillic/greek/etc.
  return (t.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ?? []);
}

function computeUniversalScore(input: {
  avgSentenceLength: number;
  avgWordLength: number;
  longSentenceRatio: number;
  veryLongSentenceRatio: number;
  paragraphCount: number;
  wordCount: number;
  punctuationDensity: number;
}): number {
  const {
    avgSentenceLength,
    avgWordLength,
    longSentenceRatio,
    veryLongSentenceRatio,
    paragraphCount,
    wordCount,
    punctuationDensity,
  } = input;

  // Base 100, pénalités simples, robustes cross-lang
  let s = 100;

  // phrases longues
  s -= clamp(avgSentenceLength - 14, 0, 40) * 1.6;
  s -= longSentenceRatio * 28;
  s -= veryLongSentenceRatio * 22;

  // mots longs
  s -= clamp(avgWordLength - 4.6, 0, 3.5) * 10;

  // "mur" de texte : trop peu de paragraphes par rapport au volume
  if (wordCount >= 120) {
    const expectedParagraphs = Math.max(2, Math.round(wordCount / 90));
    const missing = clamp(expectedParagraphs - paragraphCount, 0, 6);
    s -= missing * 6;
  }

  // ponctuation trop faible (monotone) ou trop forte (haché)
  if (wordCount >= 40) {
    if (punctuationDensity < 0.02) s -= 6;
    if (punctuationDensity > 0.18) s -= 6;
  }

  return clampInt(Math.round(s), 0, 100);
}

function scoreToLevel(score: number): ReadabilityLevelKey {
  if (score >= 85) return 'very_easy';
  if (score >= 70) return 'easy';
  if (score >= 50) return 'medium';
  if (score >= 30) return 'hard';
  return 'very_hard';
}

function buildFeedback(input: {
  avgSentenceLength: number;
  avgWordLength: number;
  longSentenceRatio: number;
  veryLongSentenceRatio: number;
  paragraphCount: number;
  wordCount: number;
  punctuationDensity: number;
}): { issues: string[]; tips: string[] } {
  const issues: string[] = [];
  const tips: string[] = [];

  const {
    avgSentenceLength,
    avgWordLength,
    longSentenceRatio,
    veryLongSentenceRatio,
    paragraphCount,
    wordCount,
    punctuationDensity,
  } = input;

  if (avgSentenceLength > 22 || longSentenceRatio > 0.25) {
    issues.push('readability_issue_long_sentences');
    tips.push('readability_tip_shorten_sentences');
  }

  if (veryLongSentenceRatio > 0.12) {
    issues.push('readability_issue_very_long_sentences');
    tips.push('readability_tip_split_sentences');
  }

  if (avgWordLength > 6.2) {
    issues.push('readability_issue_long_words');
    tips.push('readability_tip_simpler_words');
  }

  if (wordCount >= 120 && paragraphCount <= 1) {
    issues.push('readability_issue_no_paragraphs');
    tips.push('readability_tip_add_paragraphs');
  }

  if (wordCount >= 60 && punctuationDensity < 0.02) {
    issues.push('readability_issue_low_punctuation');
    tips.push('readability_tip_add_punctuation');
  }

  if (wordCount >= 60 && punctuationDensity > 0.18) {
    issues.push('readability_issue_high_punctuation');
    tips.push('readability_tip_reduce_punctuation');
  }

  if (issues.length === 0) {
    issues.push('readability_issue_none');
    tips.push('readability_tip_keep_it_up');
  }

  // dédoublonnage
  return {
    issues: Array.from(new Set(issues)),
    tips: Array.from(new Set(tips)),
  };
}

function avg(values: number[]): number {
  if (!values.length) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

function format1(v: number): string {
  return String(round1(v));
}
