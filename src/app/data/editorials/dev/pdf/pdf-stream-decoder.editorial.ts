import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = false;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_stream_decoder_title:À propos : Décoder un stream PDF`,
  lead: $localize`:@@ed_dev_pdf_pdf_stream_decoder_lead:TODO: Décrire l’objectif exact de cet outil (intention unique, pas une paraphrase d’un autre).`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_stream_decoder_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_stream_decoder_uc1_title:TODO`, text: $localize`:@@ed_dev_pdf_pdf_stream_decoder_uc1_text:TODO: Exemple concret 1` },
        { title: $localize`:@@ed_dev_pdf_pdf_stream_decoder_uc2_title:TODO`, text: $localize`:@@ed_dev_pdf_pdf_stream_decoder_uc2_text:TODO: Exemple concret 2` },
        { title: $localize`:@@ed_dev_pdf_pdf_stream_decoder_uc3_title:TODO`, text: $localize`:@@ed_dev_pdf_pdf_stream_decoder_uc3_text:TODO: Exemple concret 3` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_stream_decoder_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_stream_decoder_out1:TODO: Décrire précisément la sortie.`,
        $localize`:@@ed_dev_pdf_pdf_stream_decoder_out2:TODO: À quoi sert cette sortie.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_stream_decoder_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_stream_decoder_lim1:TODO.` },
        { text: $localize`:@@ed_dev_pdf_pdf_stream_decoder_lim2:TODO.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_stream_decoder_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_stream_decoder_q1:TODO`, a: $localize`:@@ed_dev_pdf_pdf_stream_decoder_a1:TODO` },
        { q: $localize`:@@ed_dev_pdf_pdf_stream_decoder_q2:TODO`, a: $localize`:@@ed_dev_pdf_pdf_stream_decoder_a2:TODO` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_stream_decoder_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_stream_decoder_tip:TODO: Une astuce unique liée à l’intention de l’outil.`,
    },
  ],
};
