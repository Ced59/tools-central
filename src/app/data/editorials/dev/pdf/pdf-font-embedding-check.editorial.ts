import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_title:À propos : PDF Font Embedding Check`,
  lead: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_lead:Contrôler l’intégration des polices d’un PDF (embedded, subset, manquantes) afin d’anticiper les problèmes de rendu à l’impression, en PDF/A ou sur d’autres machines.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc1_title:Impression pro`, text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc1_text:Vérifier que les polices sont embarquées avant envoi à un imprimeur ou à un prestataire.` },
        { title: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc2_title:Compatibilité multi-lecteurs`, text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc2_text:Éviter les substitutions de polices entre Adobe Reader, navigateurs et viewers mobiles.` },
        { title: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc3_title:Préparation PDF/A`, text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc3_text:Identifier les polices non embarquées (souvent bloquantes pour certaines normes d’archivage).` },
        { title: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc4_title:Debug rendu`, text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_uc4_text:Comprendre pourquoi des caractères changent, disparaissent ou se décalent selon le poste.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_font_embedding_check_out1:Un rapport indiquant, pour chaque police, si elle est embarquée, sous-ensemble (subset) ou référencée sans embedding.`,
        $localize`:@@ed_dev_pdf_pdf_font_embedding_check_out2:Des détails utiles : nom de base, type (Type0/TrueType/Type1…), encodage, présence d’un ToUnicode (si détectable).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_lim1:Une police “embarquée” ne garantit pas à 100% un rendu identique : l’encodage et le mapping Unicode comptent aussi.` },
        { text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_lim2:Certains PDF utilisent des polices propriétaires ou des sous-ensembles aux noms “cryptiques” (ex : ABCDEF+Font).` },
        { text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_lim3:Sur des PDF chiffrés ou corrompus, la détection peut être incomplète.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_q1:C’est quoi une police “subset” ?`, a: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_a1:C’est une police embarquée partiellement : seuls les glyphes utilisés dans le document sont inclus.` },
        { q: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_q2:Pourquoi mon PDF a une police non embarquée ?`, a: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_a2:Cela dépend de l’outil de génération/export. Beaucoup laissent la police externe par défaut.` },
        { q: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_q3:À quoi sert ToUnicode ?`, a: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_a3:C’est une table qui aide à retrouver le texte Unicode lors de la copie/recherche/extraction.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_font_embedding_check_tip:Si votre objectif est l’extraction de texte fiable, vérifiez aussi la présence de ToUnicode : une police embarquée sans mapping peut rendre l’extraction difficile.`,
    },
  ],
};
