import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_rot_missing_title:À propos : Trouver une valeur manquante`,
  lead: $localize`:@@ed_rot_missing_lead:Cet outil calcule automatiquement la valeur manquante dans une situation de proportionnalité à partir de trois valeurs connues.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_rot_missing_usecases:Cas typiques`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_rot_missing_uc1_title:Exercices scolaires`, text: $localize`:@@ed_rot_missing_uc1_text:Calculer la quatrième proportionnelle.` },
        { title: $localize`:@@ed_rot_missing_uc2_title:Contrôle rapide`, text: $localize`:@@ed_rot_missing_uc2_text:Vérifier un calcul sans refaire tout le tableau.` },
        { title: $localize`:@@ed_rot_missing_uc3_title:Applications concrètes`, text: $localize`:@@ed_rot_missing_uc3_text:Adapter un prix, une recette ou une durée.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_rot_missing_output:Ce que fournit l’outil`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_rot_missing_out1:La valeur manquante calculée.`,
        $localize`:@@ed_rot_missing_out2:Une solution immédiate sans tableau intermédiaire.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_rot_missing_limits:Points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_rot_missing_lim1:La relation doit être proportionnelle.` },
        { text: $localize`:@@ed_rot_missing_lim2:Ne pas confondre avec un cas inverse.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_rot_missing_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_rot_missing_tip:Avant de calculer, demande-toi si la valeur cherchée doit augmenter ou diminuer.`,
    },
  ],
};

