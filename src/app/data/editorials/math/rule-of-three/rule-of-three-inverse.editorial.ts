import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_rot_inverse_title:À propos : Règle de trois inverse`,
  lead: $localize`:@@ed_rot_inverse_lead:Cet outil permet de résoudre facilement un calcul de proportionnalité inverse, lorsque le produit de deux grandeurs reste constant.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_rot_inverse_usecases:Situations concernées`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_rot_inverse_uc1_title:Temps et effectifs`, text: $localize`:@@ed_rot_inverse_uc1_text:Plus il y a de personnes, moins le temps est long.` },
        { title: $localize`:@@ed_rot_inverse_uc2_title:Vitesses`, text: $localize`:@@ed_rot_inverse_uc2_text:Même distance parcourue à des vitesses différentes.` },
        { title: $localize`:@@ed_rot_inverse_uc3_title:Production`, text: $localize`:@@ed_rot_inverse_uc3_text:Répartition d’une charge fixe.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_rot_inverse_output:Résultat`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_rot_inverse_out1:La valeur inconnue calculée automatiquement.`,
        $localize`:@@ed_rot_inverse_out2:Un calcul respectant le principe du produit constant.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_rot_inverse_limits:Erreurs fréquentes`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_rot_inverse_lim1:Ne pas utiliser cet outil pour une proportionnalité directe.` },
        { text: $localize`:@@ed_rot_inverse_lim2:Vérifier que le produit reste constant.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_rot_inverse_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_rot_inverse_tip:Si une grandeur double et que l’autre est divisée par deux, tu es bien dans un cas inverse.`,
    },
  ],
};
