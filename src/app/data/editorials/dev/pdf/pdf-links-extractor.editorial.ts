import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_links_extractor_title:À propos : PDF Links Extractor`,
  lead: $localize`:@@ed_dev_pdf_pdf_links_extractor_lead:Extraire tous les liens d’un PDF (URL, mailto, destinations internes) en JSON pour audit, migration, sécurité et contrôle qualité de documents publiés.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_links_extractor_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc1_title:Audit de liens sortants`, text: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc1_text:Lister toutes les URL présentes dans un PDF (site public, brochure, documentation) et détecter les liens obsolètes.` },
        { title: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc2_title:Migration / refonte`, text: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc2_text:Mettre à jour des domaines/chemins lors d’une migration, en partant d’un inventaire fiable des liens.` },
        { title: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc3_title:Sécurité`, text: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc3_text:Repérer des liens suspects (phishing, trackers) avant diffusion ou publication.` },
        { title: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc4_title:Contrôle qualité`, text: $localize`:@@ed_dev_pdf_pdf_links_extractor_uc4_text:Vérifier que chaque bouton/lien pointe vers la bonne page (lien interne, ancre, action).` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_links_extractor_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_links_extractor_out1:Un export JSON des liens par page : type d’action (URI/GoTo/GoToR), cible, rectangle de clic, texte/annotation associée si disponible.`,
        $localize`:@@ed_dev_pdf_pdf_links_extractor_out2:Une base exploitable pour automatiser des tests (crawler, validation HTTP, règles de conformité).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_links_extractor_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_links_extractor_lim1:Un lien peut être “dessiné” comme du texte sans annotation : dans ce cas, il n’est pas détectable comme lien cliquable.` },
        { text: $localize`:@@ed_dev_pdf_pdf_links_extractor_lim2:Selon le PDF, le texte visible et la cible peuvent différer (ex : bouton, annotation sans texte).` },
        { text: $localize`:@@ed_dev_pdf_pdf_links_extractor_lim3:Sur des PDF chiffrés, l’extraction peut être restreinte.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_links_extractor_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_links_extractor_q1:Est-ce que l’outil vérifie si les liens répondent ?`, a: $localize`:@@ed_dev_pdf_pdf_links_extractor_a1:Non : il extrait les cibles. La vérification HTTP se fait ensuite via un script/crawler.` },
        { q: $localize`:@@ed_dev_pdf_pdf_links_extractor_q2:Les liens internes (sommaire) sont-ils inclus ?`, a: $localize`:@@ed_dev_pdf_pdf_links_extractor_a2:Oui, les actions de type GoTo/Named destination sont généralement exportées.` },
        { q: $localize`:@@ed_dev_pdf_pdf_links_extractor_q3:Pourquoi certains “liens” ne sont pas listés ?`, a: $localize`:@@ed_dev_pdf_pdf_links_extractor_a3:S’ils ne sont pas implémentés comme annotations (pas de zone cliquable), ils ne peuvent pas être détectés.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_links_extractor_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_links_extractor_tip:Pour des PDF destinés au public, exportez les liens puis passez la liste dans un validateur HTTP : c’est le moyen le plus fiable de détecter des URL cassées avant publication.`,
    },
  ],
};
