import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_text_structure_title:Analyser la structure du texte dans un PDF`,
  lead: $localize`:@@ed_dev_pdf_text_structure_lead:Cet outil extrait et structure le texte d’un PDF (glyphes, lignes, blocs) afin de comprendre comment le contenu textuel est réellement organisé en interne.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_text_structure_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_pdf_text_structure_uc1_title:Extraction fiable de texte`,
          text: $localize`:@@ed_dev_pdf_text_structure_uc1_text:Comprendre pourquoi un texte copié depuis un PDF est désordonné ou incomplet.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_text_structure_uc2_title:OCR et post-traitement`,
          text: $localize`:@@ed_dev_pdf_text_structure_uc2_text:Comparer la structure textuelle native avec des résultats OCR.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_text_structure_uc3_title:Indexation et recherche`,
          text: $localize`:@@ed_dev_pdf_text_structure_uc3_text:Optimiser l’indexation plein texte ou la reconstruction logique de paragraphes.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_text_structure_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_text_structure_out1:Une représentation JSON des glyphes, lignes et blocs de texte.`,
        $localize`:@@ed_dev_pdf_text_structure_out2:Des informations de position et d’ordre permettant de reconstruire la logique du texte.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_text_structure_limits:Limites`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_pdf_text_structure_lim1:La structure visuelle ne correspond pas toujours à la structure sémantique.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_text_structure_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_text_structure_tip:Inspectez les coordonnées et l’ordre des glyphes pour détecter colonnes et tableaux implicites.`,
    },
  ],
};
