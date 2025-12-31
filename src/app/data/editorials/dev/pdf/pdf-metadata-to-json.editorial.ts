import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_title:À propos : PDF Metadata → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_lead:Extraire les métadonnées d’un PDF (Info dictionary + XMP) en JSON : titre, auteur, dates, logiciel producteur, mots-clés… pour audit, conformité et automatisation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc1_title:Audit conformité / RGPD`, text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc1_text:Détecter des informations sensibles dans les métadonnées (auteur, logiciel interne, chemins, entreprise).` },
        { title: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc2_title:Debug de génération`, text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc2_text:Identifier quel outil a produit le PDF (Producer/Creator) et quand il a été généré.` },
        { title: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc3_title:Indexation & catalogage`, text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc3_text:Récupérer titre, sujet, mots-clés et autres champs pour alimenter une GED ou un moteur interne.` },
        { title: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc4_title:Comparaison de versions`, text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_uc4_text:Comparer deux PDF et repérer des changements de dates, d’auteur ou de XMP.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_metadata_to_json_out1:Un JSON complet des métadonnées standard (Title, Author, Subject, Keywords, Creator, Producer, CreationDate, ModDate…).`,
        $localize`:@@ed_dev_pdf_pdf_metadata_to_json_out2:L’export des blocs XMP quand ils existent (souvent plus riches et structurés que l’Info dictionary).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_lim1:Les métadonnées peuvent être vides, incohérentes ou volontairement falsifiées : ce n’est pas une preuve d’origine.` },
        { text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_lim2:Les formats de date peuvent varier (timezone, format PDF) : interprétez-les avec attention.` },
        { text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_lim3:Sur des PDF chiffrés, l’accès aux métadonnées peut être restreint.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_q1:Quelle différence entre Creator et Producer ?`, a: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_a1:Creator est souvent l’application qui a créé le contenu ; Producer l’outil qui a généré/transformé le PDF.` },
        { q: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_q2:Pourquoi je n’ai pas de XMP ?`, a: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_a2:Tous les PDF n’en contiennent pas. Beaucoup se limitent aux champs Info classiques.` },
        { q: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_q3:L’outil modifie-t-il les métadonnées ?`, a: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_a3:Non, il lit et exporte. Pour retirer des métadonnées, utilisez un outil de nettoyage/sanitization.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_metadata_to_json_tip:Si vous publiez un PDF en ligne, vérifiez systématiquement les métadonnées avant diffusion : c’est un endroit fréquent de fuites d’informations (auteur, société, outils internes).`,
    },
  ],
};
