import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial content.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_stream_decoder_title:Décoder les streams PDF (Flate, LZW, ASCII85…)`,
  lead: $localize`:@@ed_dev_pdf_stream_decoder_lead:Cet outil permet de décoder les streams internes d’un fichier PDF (contenu compressé), afin d’inspecter précisément les données réelles utilisées pour l’affichage, le texte, les images ou les ressources.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_stream_decoder_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_pdf_stream_decoder_uc1_title:Analyse bas niveau d’un PDF`,
          text: $localize`:@@ed_dev_pdf_stream_decoder_uc1_text:Décoder les streams permet d’examiner le contenu réel d’un PDF au-delà de la compression (opérateurs, chaînes de texte, images brutes).`,
        },
        {
          title: $localize`:@@ed_dev_pdf_stream_decoder_uc2_title:Debug de génération PDF`,
          text: $localize`:@@ed_dev_pdf_stream_decoder_uc2_text:Identifier des erreurs de génération, des opérateurs inattendus ou des incohérences dans les streams produits par une librairie.`,
        },
        {
          title: $localize`:@@ed_dev_pdf_stream_decoder_uc3_title:Rétro-ingénierie et forensic`,
          text: $localize`:@@ed_dev_pdf_stream_decoder_uc3_text:Inspecter précisément des documents suspects, corrompus ou volontairement obscurcis.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_stream_decoder_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_stream_decoder_out1:Le contenu décodé des streams PDF (FlateDecode, LZWDecode, ASCIIHex, ASCII85, etc.).`,
        $localize`:@@ed_dev_pdf_stream_decoder_out2:Une représentation lisible facilitant l’analyse des opérateurs graphiques, du texte et des structures internes.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_stream_decoder_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_dev_pdf_stream_decoder_lim1:Le décodage expose des données techniques, peu adaptées à un usage non développeur.`,
        },
        {
          text: $localize`:@@ed_dev_pdf_stream_decoder_lim2:Certains streams chiffrés ou non standards peuvent rester partiellement inaccessibles.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_stream_decoder_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_pdf_stream_decoder_q1:Qu’est-ce qu’un stream PDF ?`,
          a: $localize`:@@ed_dev_pdf_stream_decoder_a1:Un stream est un bloc de données binaires (souvent compressées) contenant du texte, des images ou des instructions graphiques.`,
        },
        {
          q: $localize`:@@ed_dev_pdf_stream_decoder_q2:Cet outil modifie-t-il le PDF ?`,
          a: $localize`:@@ed_dev_pdf_stream_decoder_a2:Non. L’analyse est strictement en lecture seule.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_stream_decoder_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_stream_decoder_tip:Combinez cet outil avec l’inspection des opérateurs de page pour comprendre exactement comment un contenu est rendu.`,
    },
  ],
};
