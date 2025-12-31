import {ToolEditorialModel} from "../../../../../../models/tool-editorial/tool-editorial.model";

export const editorial: ToolEditorialModel = {
  title: $localize`:@@pdf_form_fields_editorial_title:Champs de formulaire PDF (AcroForm) : export JSON`,
  lead: $localize`:@@pdf_form_fields_editorial_lead:Cet outil liste les champs d’un formulaire PDF (textes, cases à cocher, listes…) pour faciliter l’audit, le mapping et l’automatisation.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@pdf_form_fields_editorial_usecases:À quoi ça sert ?`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@pdf_form_fields_uc1:Audit de formulaire`, text: $localize`:@@pdf_form_fields_uc1_txt:Vérifier que tous les champs attendus existent, sont nommés correctement et ont le bon type.` },
        { title: $localize`:@@pdf_form_fields_uc2:Automatisation`, text: $localize`:@@pdf_form_fields_uc2_txt:Générer un mapping pour remplir le PDF depuis une application (CRM, ERP, back-office…).` },
        { title: $localize`:@@pdf_form_fields_uc3:Débogage`, text: $localize`:@@pdf_form_fields_uc3_txt:Comprendre pourquoi un champ ne se remplit pas (nom interne, exportValue, ordre, etc.).` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@pdf_form_fields_editorial_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@pdf_form_fields_out1:Un JSON structuré contenant les champs, leurs noms internes, types, options (listes), valeurs par défaut et attributs utiles pour la génération ou le remplissage.`,
        $localize`:@@pdf_form_fields_out2:Idéal pour documenter un PDF “template” et le rendre exploitable dans un workflow automatisé.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@pdf_form_fields_editorial_limits:Points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@pdf_form_fields_lim1:Les formulaires XFA (certains PDF “dynamiques”) ne se comportent pas comme AcroForm : les champs peuvent ne pas être détectés.` },
        { text: $localize`:@@pdf_form_fields_lim2:Certains champs ont des noms “techniques” : le JSON aide justement à les repérer et à les normaliser.` },
        { text: $localize`:@@pdf_form_fields_lim3:Les valeurs affichées peuvent différer des valeurs export (checkbox/radio).` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@pdf_form_fields_editorial_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@pdf_form_fields_q1:Quelle différence entre “label” et nom interne ?`, a: $localize`:@@pdf_form_fields_a1:Le nom interne sert au remplissage programmatique. Le label est souvent du contenu visuel et peut ne pas être unique.` },
        { q: $localize`:@@pdf_form_fields_q2:Pourquoi un champ n’apparaît pas ?`, a: $localize`:@@pdf_form_fields_a2:Soit le PDF n’utilise pas AcroForm, soit le champ est “flatten” (converti en contenu), soit il est dans un calque particulier.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@pdf_form_fields_editorial_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@pdf_form_fields_tip:Avant d’intégrer un PDF dans un workflow, exportez d’abord les champs en JSON : vous évitez 80% des surprises (noms, radios, valeurs export).`,
    },
  ],
};
