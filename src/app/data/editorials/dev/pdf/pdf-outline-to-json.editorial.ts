import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_outline_to_json_title:À propos : PDF Outline → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_outline_to_json_lead:Exporter le sommaire (outline / bookmarks) d’un PDF en JSON : hiérarchie, titres, destinations et pages pour audit, migration et génération de navigation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_outline_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_outline_to_json_uc1_title:Vérifier un sommaire`, text: $localize`:@@ed_dev_pdf_pdf_outline_to_json_uc1_text:Contrôler que les signets existent, sont dans le bon ordre et pointent vers les bonnes pages.` },
        { title: $localize`:@@ed_dev_pdf_pdf_outline_to_json_uc2_title:Migration / transformation`, text: $localize`:@@ed_dev_pdf_pdf_outline_to_json_uc2_text:Convertir un sommaire PDF en navigation pour un viewer web, une app mobile ou une GED.` },
        { title: $localize`:@@ed_dev_pdf_pdf_outline_to_json_uc3_title:Génération automatique de table des matières`, text: $localize`:@@ed_dev_pdf_pdf_outline_to_json_uc3_text:Réutiliser la structure des bookmarks pour produire une ToC HTML ou un index.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_outline_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_outline_to_json_out1:Un JSON arborescent des signets : titre, niveau, enfant/suivant/précédent, style (bold/italic) si présent.`,
        $localize`:@@ed_dev_pdf_pdf_outline_to_json_out2:Les destinations associées (page cible, coordonnées/zoom) quand elles sont résolubles.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_outline_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_outline_to_json_lim1:Beaucoup de PDF n’ont pas de bookmarks : dans ce cas l’export sera vide, c’est normal.` },
        { text: $localize`:@@ed_dev_pdf_pdf_outline_to_json_lim2:Certaines destinations sont “nommées” ou indirectes : elles peuvent nécessiter une résolution partielle selon le PDF.` },
        { text: $localize`:@@ed_dev_pdf_pdf_outline_to_json_lim3:Sur des PDF chiffrés, l’accès peut être limité.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_outline_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_outline_to_json_q1:Sommaire et “table des matières” c’est pareil ?`, a: $localize`:@@ed_dev_pdf_pdf_outline_to_json_a1:Le sommaire PDF (outline) est la navigation latérale. La table des matières peut aussi être une page du document.` },
        { q: $localize`:@@ed_dev_pdf_pdf_outline_to_json_q2:Est-ce que l’outil retrouve la page exacte ?`, a: $localize`:@@ed_dev_pdf_pdf_outline_to_json_a2:Souvent oui. Selon le PDF, les destinations peuvent être indirectes et plus difficiles à résoudre.` },
        { q: $localize`:@@ed_dev_pdf_pdf_outline_to_json_q3:Puis-je reconstruire un sommaire ailleurs ?`, a: $localize`:@@ed_dev_pdf_pdf_outline_to_json_a3:Oui : le JSON sert de base pour recréer une navigation dans un autre format.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_outline_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_outline_to_json_tip:Pour une migration propre, exportez aussi “Pages PDF → JSON” : vous pourrez valider que chaque destination de bookmark pointe vers une page existante et correctement dimensionnée.`,
    },
  ],
};
