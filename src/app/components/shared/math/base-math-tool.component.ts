import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

export interface FormulaStep {
  id: string;
  latex: string;
  vars: Record<string, number>;
}

/**
 * Classe abstraite pour les outils de calcul mathématique.
 * Fournit la logique commune de gestion des formules step-by-step,
 * du tracking des champs modifiés, et des méthodes utilitaires.
 */
export abstract class BaseMathToolComponent<TForm extends Record<string, unknown> = Record<string, unknown>> {
  protected fb = new FormBuilder();

  /**
   * Dernier champ modifié (pour auto-switch des steps de formule)
   */
  protected lastChanged: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * Step sélectionné manuellement par l'utilisateur
   */
  protected manualStepId: WritableSignal<string | null> = signal<string | null>(null);

  /**
   * FormGroup du composant - doit être implémenté par chaque outil
   */
  abstract form: FormGroup;

  /**
   * Steps de formule KaTeX - doit être implémenté par chaque outil
   */
  abstract formulaSteps: Signal<FormulaStep[]>;

  /**
   * Retourne l'ID du step automatique basé sur le dernier champ modifié
   */
  protected abstract getAutoStepId(): string | null;

  /**
   * ID du step actif (manuel ou automatique)
   */
  readonly activeFormulaStepId = computed(() => {
    const manual = this.manualStepId();
    if (manual) {
      return manual;
    }
    return this.getAutoStepId();
  });

  /**
   * Callback pour le changement manuel de step
   */
  onFormulaStepChanged(id: string): void {
    this.manualStepId.set(id);
  }

  /**
   * Formate un nombre avec la précision donnée
   */
  fmt(n: number | null, precision: number = 2): string {
    if (n == null) {
      return '—';
    }
    return n.toFixed(precision);
  }

  /**
   * Formate un nombre en pourcentage
   */
  fmtPct(n: number | null, precision: number = 2): string {
    if (n == null) {
      return '—';
    }
    return `${n.toFixed(precision)}%`;
  }

  /**
   * Configure le tracking des changements de formulaire.
   * À appeler dans le constructeur du composant.
   * 
   * @param signals Map des signals à mettre à jour (nom du champ -> signal)
   * @param onFieldChange Callback appelé quand un champ change avec le nom du champ
   */
  protected setupFormTracking(
    signals: Map<string, WritableSignal<number | null>>,
    onFieldChange?: (fieldName: string) => void
  ): void {
    this.form.valueChanges.subscribe((values: Record<string, unknown>) => {
      let changedField: string | null = null;

      for (const [fieldName, sig] of signals) {
        const prevValue = sig();
        const nextValue = (values[fieldName] as number) ?? null;

        if (nextValue !== prevValue) {
          if (!changedField) {
            changedField = fieldName;
          }
          sig.set(nextValue);
        }
      }

      if (changedField) {
        this.lastChanged.set(changedField);
        this.manualStepId.set(null);

        if (onFieldChange) {
          onFieldChange(changedField);
        }
      }
    });
  }

  /**
   * Réinitialise les états de tracking
   */
  protected resetTracking(): void {
    this.lastChanged.set(null);
    this.manualStepId.set(null);
  }
}
