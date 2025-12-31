import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_rot_table_title:À propos : Règle de trois avec tableau`,
  lead: $localize`:@@ed_rot_table_lead:Cet outil utilise un tableau de proportionnalité pour appliquer la règle de trois de manière claire et structurée.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_rot_table_usecases:Pourquoi utiliser un tableau ?`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_rot_table_uc1_title:Visualisation`, text: $localize`:@@ed_rot_table_uc1_text:Voir clairement les correspondances entre valeurs.` },
        { title: $localize`:@@ed_rot_table_uc2_title:Apprentissage`, text: $localize`:@@ed_rot_table_uc2_text:Méthode privilégiée au collège et lycée.` },
        { title: $localize`:@@ed_rot_table_uc3_title:Réduction d’erreurs`, text: $localize`:@@ed_rot_table_uc3_text:Limiter les confusions de sens et d’unités.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_rot_table_output:Résultat`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_rot_table_out1:Le tableau complété.`,
        $localize`:@@ed_rot_table_out2:La valeur recherchée calculée automatiquement.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_rot_table_limits:À surveiller`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_rot_table_lim1:Les colonnes doivent représenter les mêmes grandeurs.` },
        { text: $localize`:@@ed_rot_table_lim2:Les unités doivent être homogènes.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_rot_table_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_rot_table_tip:Lis le tableau verticalement : chaque colonne doit comparer des grandeurs compatibles.`,
    },
  ],
};
