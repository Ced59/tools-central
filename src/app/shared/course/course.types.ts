export type CourseQuizKind = 'mcq' | 'number';

export type CourseQuizChoice = {
  label: string;
  value: string;
};

export type CourseQuiz = {
  id: string;
  kind: CourseQuizKind;

  prompt: string;

  // MCQ
  choices?: CourseQuizChoice[];
  correctChoice?: string;

  // Number
  correctNumber?: number;
  unit?: string;        // texte déjà localisé (ex: "%", "pp", "units")
  precision?: number;   // tolérance via arrondi

  // Shown on correction reveal
  explanation: string;
};

export type CourseLessonSection = {
  title: string;
  bullets: string[];
  formulaLatex?: string;
  examples?: { label: string; latex: string }[];
};

export type CourseLesson = {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  sections: CourseLessonSection[];
  quizzes: CourseQuiz[];
};

export type CourseData = {
  id: string;

  heroTitle: string;
  heroSubtitle: string;

  backLink: string;

  lessons: CourseLesson[];
};
