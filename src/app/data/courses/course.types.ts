export type CourseQuizKind = 'mcq' | 'number';

export type CourseQuizChoice = {
  label: string;   // déjà localisé via $localize au moment de construire la data
  value: string;   // id stable (ex: 'a', 'b', 'c')
};

export type CourseQuiz = {
  id: string;
  kind: CourseQuizKind;

  prompt: string; // localisé

  // MCQ
  choices?: CourseQuizChoice[];
  correctChoice?: string;

  // Number
  correctNumber?: number;
  unit?: string;       // idéalement symbole universel (% , € , °C...) — sinon laisser vide
  precision?: number;  // tolérance d'affichage/validation

  explanation: string; // localisé
};

export type CourseLessonSectionExample = {
  label: string; // localisé (ex: "Exemple")
  latex: string;
};

export type CourseLessonSection = {
  title: string;      // localisé
  bullets: string[];  // localisés
  formulaLatex?: string;
  examples?: CourseLessonSectionExample[];
};

export type CourseLesson = {
  id: string;
  title: string;     // localisé
  subtitle: string;  // localisé
  tags: string[];    // localisés (ou non si tu assumes tags "tech" universels)
  sections: CourseLessonSection[];
  quizzes: CourseQuiz[];
};

export type CourseData = {
  heroTitle: string;     // localisé
  heroSubtitle: string;  // localisé
  backLink: any[] | string; // routerLink (souvent string), on autorise array si tu veux

  lessons: CourseLesson[];
};
