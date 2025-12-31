import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_pages_to_json_title:À propos : PDF Pages → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_pages_to_json_lead:Exporter les informations de pages d’un PDF en JSON : formats, rotation, MediaBox/CropBox, ressources, nombre de pages… pour audit, impression et automatisation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_pages_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc1_title:Contrôle de formats`, text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc1_text:Vérifier que toutes les pages sont en A4/Letter, détecter des pages en paysage ou avec rotation.` },
        { title: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc2_title:Préparer un split/merge`, text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc2_text:Obtenir une vue claire des pages avant découpe ou fusion (nombre, dimensions, ordre).` },
        { title: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc3_title:Debug d’affichage`, text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc3_text:Comprendre des problèmes de cadrage (CropBox) ou de marges inattendues selon les viewers.` },
        { title: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc4_title:Automatisation`, text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_uc4_text:Alimenter une pipeline qui route les PDF selon le nombre de pages, le format ou l’orientation.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_pages_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_pages_to_json_out1:Un JSON listant chaque page : index, dimensions en points, rotation, boîtes (Media/Crop/Bleed/Trim si présentes).`,
        $localize`:@@ed_dev_pdf_pdf_pages_to_json_out2:Des indicateurs utiles : ressources associées, présence de contenu, et autres attributs selon le moteur d’analyse.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_pages_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_lim1:Les dimensions sont en points PDF (1/72 inch) : convertissez en mm/inch si besoin pour l’impression.` },
        { text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_lim2:CropBox ≠ MediaBox : certains viewers utilisent l’une ou l’autre pour l’affichage ; attention aux interprétations.` },
        { text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_lim3:Les PDF endommagés ou chiffrés peuvent limiter l’analyse.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_pages_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_pages_to_json_q1:Pourquoi la page a une rotation 90° ?`, a: $localize`:@@ed_dev_pdf_pdf_pages_to_json_a1:Le contenu peut être stocké “droit” mais affiché via un flag de rotation. C’est courant pour les scans.` },
        { q: $localize`:@@ed_dev_pdf_pdf_pages_to_json_q2:Comment passer de points à millimètres ?`, a: $localize`:@@ed_dev_pdf_pdf_pages_to_json_a2:1 point = 25,4 / 72 mm ≈ 0,3528 mm. Vous pouvez convertir facilement côté script.` },
        { q: $localize`:@@ed_dev_pdf_pdf_pages_to_json_q3:Est-ce que ça détecte les pages blanches ?`, a: $localize`:@@ed_dev_pdf_pdf_pages_to_json_a3:Pas toujours : une page peut avoir du contenu invisible. Utilisez plutôt un outil de détection dédié si besoin.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_pages_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_pages_to_json_tip:Pour des problèmes de marges/cadrage, comparez MediaBox et CropBox : c’est souvent la source d’un rendu “coupé” dans certains lecteurs.`,
    },
  ],
};
