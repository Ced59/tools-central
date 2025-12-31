import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_title:À propos : PDF Signatures → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_lead:Lister et exporter les signatures d’un PDF en JSON (champs, certificats, dates, raisons, byte ranges) pour audit, conformité et intégration de workflows de signature.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc1_title:Audit de documents signés`, text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc1_text:Inventorier les signatures présentes, leur position (champs) et les informations de certificat.` },
        { title: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc2_title:Contrôle conformité`, text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc2_text:Vérifier qu’un PDF contient bien les champs/signatures attendus avant archivage ou envoi.` },
        { title: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc3_title:Debug d’une signature invalide`, text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc3_text:Comprendre pourquoi une signature apparaît cassée (modification, fusion, flatten, ajout de pages…).` },
        { title: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc4_title:Intégration workflow`, text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_uc4_text:Exporter un JSON pour alimenter un système de suivi (signature reçue, date, signataire, raison).` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_signatures_to_json_out1:Un JSON des signatures : champs, sous-type, signer name (si présent), raison, lieu, date, byte range et infos de certificat.`,
        $localize`:@@ed_dev_pdf_pdf_signatures_to_json_out2:Des éléments utiles pour corréler avec vos actions : présence de timestamp, nombre de signatures, champs vides à signer.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_lim1:La validation cryptographique complète dépend d’une chaîne de confiance (AC) et d’un environnement de vérification : le JSON seul ne suffit pas toujours.` },
        { text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_lim2:Certaines informations (nom, raison) peuvent être absentes ou non standard selon le logiciel de signature.` },
        { text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_lim3:Modifier le PDF après signature (fusion, sanitization, flatten…) peut invalider la signature.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_q1:L’outil dit-il si la signature est valide ?`, a: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_a1:Il fournit surtout les données et indicateurs. La validité stricte peut nécessiter une vérification cryptographique et une chaîne de confiance.` },
        { q: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_q2:Pourquoi ma signature devient invalide après fusion ?`, a: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_a2:Une signature couvre un byte range précis : toute modification du fichier change les octets et casse la signature.` },
        { q: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_q3:Peut-il y avoir plusieurs signatures ?`, a: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_a3:Oui. Un PDF peut contenir plusieurs champs et signatures incrémentales.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_signatures_to_json_tip:Dans un workflow, faites toutes les transformations (merge/split/flatten/sanitize) avant la signature finale. Après signature, évitez toute modification du fichier.`,
    },
  ],
};
