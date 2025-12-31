import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_unicode_title:Inspection ToUnicode et encodage texte PDF`,
  lead: $localize`:@@ed_dev_pdf_unicode_lead:Cet outil analyse les tables ToUnicode des polices PDF afin de comprendre comment les glyphes sont mappés vers les caractères Unicode.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_unicode_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_pdf_unicode_uc1_title:Texte illisible ou incorrect`,
          text: $localize`:@@ed_dev_pdf_unicode_uc1_text:Diagnostiquer des problèmes de caractères manquants ou erronés lors de l’extraction.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_unicode_uc2_title:Debug de polices personnalisées`,
          text: $localize`:@@ed_dev_pdf_unicode_uc2_text:Vérifier le mapping Unicode de polices intégrées ou générées.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_unicode_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_unicode_out1:Les tables ToUnicode extraites et interprétées.`,
        $localize`:@@ed_dev_pdf_unicode_out2:Une vision claire des correspondances glyphes → caractères Unicode.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_unicode_limits:Limites`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_pdf_unicode_lim1:Les PDF sans table ToUnicode restent difficiles à interpréter.`,
        },
      ],
    },
  ],
};
