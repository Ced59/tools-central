import { Component, Input, computed, signal } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';

import { MathFormulaComponent } from '../../math-formula/math-formula.component';
import {CourseData, CourseLesson, CourseQuiz} from "../../../../data/courses/course.types";

@Component({
  selector: 'app-course-page',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    RouterLink,

    CardModule,
    ButtonModule,
    DividerModule,
    TagModule,

    MathFormulaComponent,
  ],
  templateUrl: './course-page.component.html',
  styleUrl: './course-page.component.scss',
})
export class CoursePageComponent {
  // ✅ Input "classique", et on le copie dans un signal interne
  private _course = signal<CourseData | null>(null);

  @Input({ required: true })
  set course(value: CourseData) {
    this._course.set(value);
    // init active dès que le cours arrive
    const first = value?.lessons?.[0]?.id ?? 'intro';
    this.activeId.set(first);
  }
  get course(): CourseData {
    const c = this._course();
    if (!c) {
      // Ne devrait pas arriver vu required:true, mais safe runtime.
      throw new Error('CoursePageComponent: course input is required.');
    }
    return c;
  }

  // --- UI state
  query = signal('');
  activeId = signal<string>('intro');

  // quiz state
  quizAnswers = signal<Record<string, string>>({});
  quizReveals = signal<Record<string, boolean>>({});

  seed = signal<number>(this.randomSeed());
  shuffleQuizzes = signal<boolean>(false);

  // custom select state
  openSelectId = signal<string | null>(null);

  activeLessonId = computed(() => this.activeLesson()?.id ?? '');

  // --------------------------
  // Derived state
  // --------------------------
  filteredLessons = computed(() => {
    const c = this._course();
    const lessons = c?.lessons ?? [];

    const q = this.query().trim().toLowerCase();
    if (!q) return lessons;

    return lessons.filter(l => {
      const hay =
        (l.title +
          ' ' +
          l.subtitle +
          ' ' +
          l.tags.join(' ') +
          ' ' +
          l.sections.map(s => s.title).join(' '))
          .toLowerCase();
      return hay.includes(q);
    });
  });

  activeLesson = computed(() => {
    const c = this._course();
    const lessons = c?.lessons ?? [];
    if (lessons.length === 0) return null;

    const id = this.activeId();
    return lessons.find(l => l.id === id) ?? lessons[0];
  });

  activeIndex = computed(() => {
    const c = this._course();
    const lessons = c?.lessons ?? [];
    return lessons.findIndex(l => l.id === this.activeId());
  });

  progress = computed(() => {
    const c = this._course();
    const lessons = c?.lessons ?? [];
    const idx = this.activeIndex();

    if (idx < 0 || lessons.length <= 1) return 0;
    return Math.round((idx / (lessons.length - 1)) * 100);
  });

  // --------------------------
  // Navigation
  // --------------------------
  openLesson(id: string) {
    this.activeId.set(id);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  prev() {
    const c = this._course();
    const lessons = c?.lessons ?? [];
    const i = this.activeIndex();
    if (i > 0) this.openLesson(lessons[i - 1].id);
  }

  next() {
    const c = this._course();
    const lessons = c?.lessons ?? [];
    const i = this.activeIndex();
    if (i >= 0 && i < lessons.length - 1) this.openLesson(lessons[i + 1].id);
  }

  nowSeed(): number {
    return (Date.now() % 2_147_483_647) || 123456;
  }

  // --------------------------
  // Quiz + select
  // --------------------------
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

  resetQuizForLesson(lesson: CourseLesson) {
    const a = { ...this.quizAnswers() };
    const r = { ...this.quizReveals() };
    for (const q of lesson.quizzes) {
      delete a[q.id];
      delete r[q.id];
    }
    this.quizAnswers.set(a);
    this.quizReveals.set(r);
  }

  getLessonQuizzes(lesson: CourseLesson): CourseQuiz[] {
    if (!this.shuffleQuizzes()) return lesson.quizzes;

    const rng = this.mulberry32(this.seed() ^ this.hash(lesson.id));
    const arr = [...lesson.quizzes];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  selectLabel(q: CourseQuiz): string {
    if (q.kind !== 'mcq') return '';
    const ans = this.quizAnswers()[q.id] ?? '';
    if (!ans) return $localize`:@@course_choose:Choisir…`;
    return q.choices?.find(c => c.value === ans)?.label ?? ans;
  }

  checkQuiz(q: CourseQuiz): { ok: boolean; userText: string; correctText: string } {
    const ans = (this.quizAnswers()[q.id] ?? '').trim();

    if (q.kind === 'mcq') {
      const ok = ans === (q.correctChoice ?? '');
      const userText = ans ? (q.choices?.find(c => c.value === ans)?.label ?? ans) : '—';
      const correctText = q.choices?.find(c => c.value === q.correctChoice)?.label ?? '—';
      return { ok, userText, correctText };
    }

    const user = this.toNumber(ans);
    const prec = q.precision ?? 2;

    const correct = q.correctNumber ?? 0;
    const tol = 0.5 * Math.pow(10, -prec);
    const ok = user != null && Math.abs(user - correct) <= tol;

    return {
      ok,
      userText: user == null ? '—' : this.fmt(user, prec) + (q.unit ? ` ${q.unit}` : ''),
      correctText: this.fmt(correct, prec) + (q.unit ? ` ${q.unit}` : ''),
    };
  }

  // --------------------------
  // Helpers
  // --------------------------
  private fmt(n: number, p: number): string {
    return Number(n.toFixed(p)).toFixed(p);
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
}
