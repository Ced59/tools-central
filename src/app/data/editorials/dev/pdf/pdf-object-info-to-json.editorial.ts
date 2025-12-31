import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_title:À propos : PDF Object Info → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_lead:Inspecter la structure interne d’un PDF et exporter des informations sur les objets (xref, streams, types, tailles) en JSON pour debug bas niveau, forensic et optimisation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_uc1_title:Debug d’un PDF cassé`, text: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_uc1_text:Comprendre pourquoi un parser échoue : objets manquants, offsets incohérents, streams anormaux.` },
        { title: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_uc2_title:Analyse forensic`, text: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_uc2_text:Repérer des objets suspects (JavaScript, fichiers intégrés, streams très volumineux) dans un audit sécurité.` },
        { title: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_uc3_title:Optimisation ciblée`, text: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_uc3_text:Identifier les objets/streams les plus lourds (images, polices) avant de lancer une optimisation.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_object_info_to_json_out1:Un export JSON listant les objets : numéro/génération, type (dict/stream/array…), taille/longueur, références et flags utiles.`,
        $localize`:@@ed_dev_pdf_pdf_object_info_to_json_out2:Des indices pratiques : présence de streams compressés, objets orphelins, structure xref (selon le moteur).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_lim1:C’est un outil “dev/forensic” : l’output est technique et peut être massif sur de gros PDF.` },
        { text: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_lim2:Les streams peuvent être compressés : le JSON décrit la structure, pas forcément le contenu décompressé.` },
        { text: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_lim3:Un PDF chiffré limite l’inspection détaillée sans clé.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_q1:Est-ce que ça remplace un viewer PDF bas niveau ?`, a: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_a1:Non, mais c’est très utile pour automatiser un diagnostic et partager un rapport JSON.` },
        { q: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_q2:Pourquoi l’export est énorme ?`, a: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_a2:Un PDF contient souvent des milliers d’objets. Filtrez par taille/type après export.` },
        { q: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_q3:Puis-je y trouver du JavaScript ?`, a: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_a3:Souvent oui via certains dictionnaires/actions. Pour un nettoyage, utilisez l’outil de sanitization.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_object_info_to_json_tip:Commencez par lister les objets les plus lourds : c’est souvent le moyen le plus rapide d’expliquer un PDF de 50+ Mo (images HD, polices, scans).`,
    },
  ],
};
