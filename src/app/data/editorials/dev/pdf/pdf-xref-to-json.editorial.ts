import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_xref_title:Inspection de la table XRef d’un PDF`,
  lead: $localize`:@@ed_dev_pdf_xref_lead:Cet outil extrait et expose la table XRef (cross-reference) d’un PDF, élément central permettant de localiser tous les objets du document.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_xref_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_pdf_xref_uc1_title:Debug de PDF corrompu`,
          text: $localize`:@@ed_dev_pdf_xref_uc1_text:Identifier des incohérences ou objets manquants dans la table XRef.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_xref_uc2_title:Analyse forensic`,
          text: $localize`:@@ed_dev_pdf_xref_uc2_text:Comprendre la structure exacte et l’évolution d’un document PDF.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_xref_uc3_title:Développement de parser PDF`,
          text: $localize`:@@ed_dev_pdf_xref_uc3_text:Valider le comportement d’un parseur ou d’un générateur PDF.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_xref_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_xref_out1:Une exportation JSON de la table XRef.`,
        $localize`:@@ed_dev_pdf_xref_out2:Les offsets, statuts et générations de chaque objet.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_xref_limits:Limites`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_pdf_xref_lim1:Les PDF hybrides (xref streams) nécessitent une interprétation avancée.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_xref_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_xref_tip:Combinez l’analyse XRef avec l’inspection des objets pour comprendre l’arborescence complète du PDF.`,
    },
  ],
};
