/**
 * Types partagés pour les outils de calcul mathématique
 */

/**
 * Étape de formule KaTeX pour l'affichage step-by-step
 */
export interface FormulaStep {
  /** Identifiant unique de l'étape */
  id: string;
  /** Template LaTeX avec placeholders {{var}} */
  latex: string;
  /** Variables à interpoler dans le template */
  vars: Record<string, number>;
}

/**
 * Exemple cliquable pour pré-remplir le formulaire
 */
export interface MathExample<T extends Record<string, number> = Record<string, number>> {
  /** Label affiché (peut contenir du texte traduit) */
  label: string;
  /** Valeurs à injecter dans le formulaire */
  values: T;
}

/**
 * Configuration UI du MathToolShellComponent
 */
export interface MathToolShellUi {
  /** Titre principal (h1) */
  title: string;
  /** Sous-titre du hero */
  subtitle: string;
  /** Titre de la section calculateur */
  calcTitle: string;
  /** Titre de la section résultats */
  resultsTitle: string;
  /** Titre de la section exemples (optionnel) */
  examplesTitle?: string;
  /** Sous-titre de la section exemples */
  examplesSub?: string;
  /** Titre de la section définition (optionnel) */
  definitionTitle?: string;
  /** Sous-titre de la section définition */
  definitionSub?: string;
  /** Label du bouton reset */
  resetLabel: string;
  /** Label du lien retour */
  backLabel: string;
}

/**
 * Résultat de calcul avec label pour affichage
 */
export interface MathResult {
  /** Clé d'identification */
  key: string;
  /** Label traduit */
  label: string;
  /** Valeur calculée */
  value: number | null;
  /** Si true, applique le style "highlight" */
  highlight?: boolean;
  /** Suffixe optionnel (ex: '%', '€') */
  suffix?: string;
}

/**
 * Configuration d'un champ de formulaire math
 */
export interface MathFieldConfig {
  /** ID du champ (pour le label for) */
  id: string;
  /** Label traduit */
  label: string;
  /** Placeholder */
  placeholder?: string;
  /** Texte d'aide */
  hint?: string;
  /** Suffixe affiché dans l'input */
  suffix?: string;
  /** Nombre min de décimales */
  minFractionDigits?: number;
  /** Nombre max de décimales */
  maxFractionDigits?: number;
  /** Valeur minimale */
  min?: number;
  /** Valeur maximale */
  max?: number;
}
