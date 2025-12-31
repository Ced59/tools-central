import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_rot_simple_title:À propos : Règle de trois simple`,
  lead: $localize`:@@ed_rot_simple_lead:Cet outil permet de calculer rapidement une valeur manquante à l’aide de la règle de trois simple, dans un cas de proportionnalité directe.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_rot_simple_usecases:Quand utiliser cet outil ?`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_rot_simple_uc1_title:Calcul immédiat`, text: $localize`:@@ed_rot_simple_uc1_text:Résoudre un calcul de proportionnalité en quelques secondes.` },
        { title: $localize`:@@ed_rot_simple_uc2_title:Devoirs et révisions`, text: $localize`:@@ed_rot_simple_uc2_text:Vérifier un exercice de maths sans refaire tout le raisonnement.` },
        { title: $localize`:@@ed_rot_simple_uc3_title:Vie quotidienne`, text: $localize`:@@ed_rot_simple_uc3_text:Adapter une quantité, un prix ou une durée proportionnelle.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_rot_simple_output:Résultat obtenu`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_rot_simple_out1:La valeur manquante calculée automatiquement.`,
        $localize`:@@ed_rot_simple_out2:Un calcul fiable basé sur le produit en croix.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_rot_simple_limits:À vérifier avant d’utiliser`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_rot_simple_lim1:Les grandeurs doivent être proportionnelles.` },
        { text: $localize`:@@ed_rot_simple_lim2:Les unités doivent être cohérentes.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_rot_simple_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_rot_simple_tip:Si une grandeur double, l’autre doit aussi doubler : sinon ce n’est pas une proportionnalité directe.`,
    },
  ],
};
