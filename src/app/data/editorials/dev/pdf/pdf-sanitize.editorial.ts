import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_sanitize_title:À propos : PDF Sanitize`,
  lead: $localize`:@@ed_dev_pdf_pdf_sanitize_lead:Nettoyer (sanitiser) un PDF pour réduire les risques et fuites d’informations : suppression/neutralisation d’éléments sensibles (métadonnées, scripts, actions, fichiers intégrés…) selon les options.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_sanitize_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_sanitize_uc1_title:Partager un PDF en sécurité`, text: $localize`:@@ed_dev_pdf_pdf_sanitize_uc1_text:Retirer ce qui peut fuiter (métadonnées, liens de tracking, actions) avant envoi public ou externe.` },
        { title: $localize`:@@ed_dev_pdf_pdf_sanitize_uc2_title:Hygiène sécurité`, text: $localize`:@@ed_dev_pdf_pdf_sanitize_uc2_text:Neutraliser des fonctionnalités potentiellement dangereuses (JavaScript, actions automatiques, embedded files).` },
        { title: $localize`:@@ed_dev_pdf_pdf_sanitize_uc3_title:Préparer une diffusion`, text: $localize`:@@ed_dev_pdf_pdf_sanitize_uc3_text:Produire une version “propre” pour publication web, support client, ou dépôt légal.` },
        { title: $localize`:@@ed_dev_pdf_pdf_sanitize_uc4_title:Conformité interne`, text: $localize`:@@ed_dev_pdf_pdf_sanitize_uc4_text:Appliquer une politique de nettoyage standardisée dans une pipeline (CI/CD) avant archivage.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_sanitize_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_sanitize_out1:Un PDF nettoyé (selon options) conservant le contenu visuel principal.`,
        $localize`:@@ed_dev_pdf_pdf_sanitize_out2:Un rapport listant les éléments détectés et supprimés/neutralisés (métadonnées, actions, pièces jointes, annotations, etc.).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_sanitize_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_sanitize_lim1:Sanitiser peut retirer des fonctionnalités utiles (formulaires interactifs, signets, annotations) selon la configuration.` },
        { text: $localize`:@@ed_dev_pdf_pdf_sanitize_lim2:Ce n’est pas un antivirus : un PDF peut rester dangereux via des failles de lecteur. Utilisez aussi une chaîne de sécurité adaptée.` },
        { text: $localize`:@@ed_dev_pdf_pdf_sanitize_lim3:Le nettoyage de données “dans l’image” (ex : scan) n’est pas possible sans traitement additionnel (OCR/redaction).` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_sanitize_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_sanitize_q1:Le résultat est-il identique visuellement ?`, a: $localize`:@@ed_dev_pdf_pdf_sanitize_a1:Souvent oui, mais certains éléments interactifs peuvent disparaître. Vérifiez la version nettoyée avant diffusion.` },
        { q: $localize`:@@ed_dev_pdf_pdf_sanitize_q2:Est-ce que ça supprime les métadonnées ?`, a: $localize`:@@ed_dev_pdf_pdf_sanitize_a2:Oui, en général c’est un objectif clé. Pour vérifier, utilisez “Métadonnées PDF → JSON” avant/après.` },
        { q: $localize`:@@ed_dev_pdf_pdf_sanitize_q3:Ça enlève les liens ?`, a: $localize`:@@ed_dev_pdf_pdf_sanitize_a3:Selon l’option : les liens sont souvent des annotations. Le rapport indique ce qui a été conservé ou supprimé.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_sanitize_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_sanitize_tip:Pour une diffusion publique, appliquez la règle “inspecter → nettoyer → re-inspecter” : métadonnées/liaisons/attachments avant et après sanitization.`,
    },
  ],
};
