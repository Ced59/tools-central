import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_merge_title:À propos : PDF Merge`,
  lead: $localize`:@@ed_dev_pdf_pdf_merge_lead:Fusionner plusieurs fichiers PDF en un seul document, avec un résultat propre et prédictible (ordre des pages, gestion des métadonnées) pour usage pro, administratif ou CI.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_merge_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_merge_uc1_title:Assembler un dossier`, text: $localize`:@@ed_dev_pdf_pdf_merge_uc1_text:Regrouper contrats, annexes, justificatifs ou rapports en un PDF unique prêt à être envoyé.` },
        { title: $localize`:@@ed_dev_pdf_pdf_merge_uc2_title:Automatiser une génération`, text: $localize`:@@ed_dev_pdf_pdf_merge_uc2_text:Fusionner des sorties de jobs (factures, bons, rapports) dans une pipeline serveur.` },
        { title: $localize`:@@ed_dev_pdf_pdf_merge_uc3_title:Préparer une impression`, text: $localize`:@@ed_dev_pdf_pdf_merge_uc3_text:Créer un document final avec l’ordre exact des pages, sans manip manuelle.` },
        { title: $localize`:@@ed_dev_pdf_pdf_merge_uc4_title:Unifier des sources hétérogènes`, text: $localize`:@@ed_dev_pdf_pdf_merge_uc4_text:Fusionner des PDF issus de scanners, exports bureautiques ou outils métier.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_merge_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_merge_out1:Un PDF fusionné téléchargeable, dans l’ordre fourni.`,
        $localize`:@@ed_dev_pdf_pdf_merge_out2:Un récapitulatif (mapping) des pages sources → pages finales pour faciliter la traçabilité et le debug.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_merge_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_merge_lim1:Fusionner des PDF très volumineux peut consommer beaucoup de mémoire/CPU selon l’environnement.` },
        { text: $localize`:@@ed_dev_pdf_pdf_merge_lim2:Les formulaires, signets (bookmarks) et métadonnées peuvent être fusionnés ou simplifiés selon les capacités de l’outil.` },
        { text: $localize`:@@ed_dev_pdf_pdf_merge_lim3:Les signatures existantes peuvent devenir invalides après fusion (le document signé doit rester inchangé).` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_merge_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_merge_q1:Est-ce que la fusion garde les bookmarks ?`, a: $localize`:@@ed_dev_pdf_pdf_merge_a1:Souvent oui, mais cela dépend des PDF sources et du moteur. Vérifiez le sommaire après fusion.` },
        { q: $localize`:@@ed_dev_pdf_pdf_merge_q2:Puis-je fusionner des PDF protégés ?`, a: $localize`:@@ed_dev_pdf_pdf_merge_a2:Si le PDF est chiffré, il faut généralement le déverrouiller (mot de passe) avant fusion.` },
        { q: $localize`:@@ed_dev_pdf_pdf_merge_q3:La qualité des pages change-t-elle ?`, a: $localize`:@@ed_dev_pdf_pdf_merge_a3:Non : la fusion assemble les pages, elle ne recomprime pas le contenu par défaut.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_merge_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_merge_tip:Avant une fusion “officielle”, pensez à nettoyer/sanitiser chaque PDF source : vous évitez d’embarquer des métadonnées ou des éléments indésirables dans le document final.`,
    },
  ],
};
