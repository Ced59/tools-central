import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_title:À propos : PDF Page Content Ops → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_lead:Exporter les opérateurs du contenu de page (content streams) d’un PDF en JSON : tokens, opérations graphiques et texte (TJ/Tj, Do, cm, q/Q…) pour debug avancé.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_uc1_title:Debug rendu texte`, text: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_uc1_text:Comprendre pourquoi du texte n’apparaît pas, est inversé, ou se retrouve au mauvais endroit (matrices, clipping, ordre).` },
        { title: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_uc2_title:Repérer les images affichées`, text: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_uc2_text:Identifier quelles ressources (XObject) sont dessinées sur une page et dans quel ordre (opérateur Do).` },
        { title: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_uc3_title:Analyse technique / reverse`, text: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_uc3_text:Étudier un PDF généré par un outil tiers pour comprendre sa structure de contenu (ops et paramètres).` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_out1:Un JSON par page listant les opérateurs et leurs opérandes (ordre d’exécution conservé).`,
        $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_out2:Des informations exploitables pour écrire des règles de détection (ex : pages sans texte, présence de transformations, etc.).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_lim1:Output très technique : il reflète le langage de description PDF, pas une représentation “humaine” du contenu.` },
        { text: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_lim2:Les streams peuvent être compressés/filtrés : l’extraction dépend de la capacité du moteur à les décoder.` },
        { text: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_lim3:Sur des gros PDF, l’export peut être volumineux : ciblez une page/plage si possible.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_q1:Est-ce que ça remplace l’extraction de texte ?`, a: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_a1:Non. C’est un outil de debug : il montre les opérations bas niveau, pas le texte reconstitué.` },
        { q: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_q2:Je vois beaucoup de “q” et “Q”, c’est normal ?`, a: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_a2:Oui : ce sont des sauvegardes/restaurations d’état graphique (pile) très fréquentes.` },
        { q: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_q3:À quoi sert “cm” ?`, a: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_a3:C’est une transformation (matrice) appliquée au repère : souvent la cause de positions/rotations inattendues.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_page_content_ops_to_json_tip:Astuce debug : cherchez les séquences autour de “Tj/TJ” (texte) et “Do” (XObject) pour comprendre l’ordre réel d’affichage sur la page.`,
    },
  ],
};
