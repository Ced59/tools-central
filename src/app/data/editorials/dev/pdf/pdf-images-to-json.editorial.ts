import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_images_to_json_title:À propos : PDF Images → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_images_to_json_lead:Lister les images d’un PDF et exporter leurs caractéristiques en JSON (dimensions, filtres de compression, color space, profondeur) pour audit, optimisation et débogage.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_images_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_images_to_json_uc1_title:Identifier les images lourdes`, text: $localize`:@@ed_dev_pdf_pdf_images_to_json_uc1_text:Repérer les XObject images très grandes ou mal compressées qui gonflent le poids du PDF.` },
        { title: $localize`:@@ed_dev_pdf_pdf_images_to_json_uc2_title:Préparer une optimisation`, text: $localize`:@@ed_dev_pdf_pdf_images_to_json_uc2_text:Comprendre les formats internes (DCT/JPEG, JPX/JPEG2000, Flate, CCITT…) avant recompression.` },
        { title: $localize`:@@ed_dev_pdf_pdf_images_to_json_uc3_title:QA / conformité`, text: $localize`:@@ed_dev_pdf_pdf_images_to_json_uc3_text:Vérifier la présence d’images sur des pages censées contenir des graphiques, logos ou scans.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_images_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_images_to_json_out1:Un export JSON des images détectées (par page) : largeur/hauteur, bpc, color space, filtres, identifiants d’objets.`,
        $localize`:@@ed_dev_pdf_pdf_images_to_json_out2:Des indicateurs utiles pour décider d’une stratégie d’optimisation (recompression, downscale, suppression de doublons).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_images_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_images_to_json_lim1:Une même image peut être réutilisée sur plusieurs pages : le JSON peut référencer la même ressource plusieurs fois.` },
        { text: $localize`:@@ed_dev_pdf_pdf_images_to_json_lim2:L’outil décrit les images PDF internes, pas forcément la “taille affichée” réelle à l’écran (qui dépend des transformations).` },
        { text: $localize`:@@ed_dev_pdf_pdf_images_to_json_lim3:Certaines images peuvent être “inline” dans le contenu et moins faciles à inventorier selon le PDF.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_images_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_images_to_json_q1:Est-ce que je peux récupérer les fichiers image ?`, a: $localize`:@@ed_dev_pdf_pdf_images_to_json_a1:Cet outil fournit surtout un inventaire. Si vous avez besoin d’extraction binaire, utilisez un extracteur d’images dédié.` },
        { q: $localize`:@@ed_dev_pdf_pdf_images_to_json_q2:Pourquoi la dimension est énorme alors que l’image est petite ?`, a: $localize`:@@ed_dev_pdf_pdf_images_to_json_a2:Parce que l’image peut être dessinée avec un facteur d’échelle sur la page : la ressource reste grande.` },
        { q: $localize`:@@ed_dev_pdf_pdf_images_to_json_q3:Quel filtre correspond à un JPEG ?`, a: $localize`:@@ed_dev_pdf_pdf_images_to_json_a3:Le plus courant est DCTDecode (JPEG). JPXDecode correspond souvent à JPEG2000.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_images_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_images_to_json_tip:Pour optimiser un PDF, commencez par “Images PDF → JSON”, puis ciblez uniquement les pages/ressources problématiques au lieu de recomprimer à l’aveugle.`,
    },
  ],
};
