import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_title:À propos : PDF Fonts → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_lead:Exporter l’inventaire des polices d’un PDF au format JSON (types, encodages, sous-ensembles, ressources par page) pour audit technique, débogage et automatisation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_uc1_title:Audit rapide des ressources`, text: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_uc1_text:Lister toutes les polices utilisées, leurs types et leurs encodages pour comprendre un PDF complexe.` },
        { title: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_uc2_title:Extraction & indexation`, text: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_uc2_text:Détecter les cas où l’extraction de texte est fragile (absence de ToUnicode, encodage non standard).` },
        { title: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_uc3_title:Préparation impression / PDF/A`, text: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_uc3_text:Identifier les polices en subset, non embarquées ou potentiellement problématiques.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_fonts_to_json_out1:Un JSON structuré listant les polices (BaseFont, Subtype, Encoding, flags d’embed/subset, ToUnicode si présent).`,
        $localize`:@@ed_dev_pdf_pdf_fonts_to_json_out2:Des informations de contexte : page(s) d’utilisation, ressources associées, identifiants d’objets (si disponibles).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_lim1:Le même nom de police peut apparaître plusieurs fois via des sous-ensembles différents.` },
        { text: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_lim2:Certaines informations peuvent être absentes selon le générateur de PDF (métadonnées de police minimales).` },
        { text: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_lim3:Sur des PDF très volumineux, l’export peut être lourd : filtrez ensuite côté code selon vos besoins.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_q1:Cet export inclut-il les fichiers de police ?`, a: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_a1:Non : il décrit les polices et leurs propriétés. Pour embarquer une police, il faut regénérer le PDF.` },
        { q: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_q2:Pourquoi les noms ressemblent à “ABCDEF+Roboto” ?`, a: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_a2:C’est typique des polices en subset : un préfixe aléatoire est ajouté pour éviter les collisions.` },
        { q: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_q3:À quoi sert l’export en JSON ?`, a: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_a3:À automatiser des audits (CI), comparer deux PDF, ou enrichir un diagnostic technique.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_fonts_to_json_tip:Pour investiguer un problème de rendu, couplez cet outil avec “Pages PDF → JSON” afin de corréler polices et pages concernées.`,
    },
  ],
};
