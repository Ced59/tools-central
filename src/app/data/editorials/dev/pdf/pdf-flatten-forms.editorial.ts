import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_flatten_forms_title:À propos : PDF Flatten Forms`,
  lead: $localize`:@@ed_dev_pdf_pdf_flatten_forms_lead:Aplatir (flatten) les champs de formulaire d’un PDF : convertir les champs interactifs en contenu statique pour garantir un rendu identique à l’impression et empêcher les modifications.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_flatten_forms_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc1_title:Archivage et conformité`, text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc1_text:Conserver un PDF “figé” dont les champs ne peuvent plus être modifiés après validation.` },
        { title: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc2_title:Envoi à un tiers`, text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc2_text:Partager un formulaire rempli sans laisser l’accès aux champs ou aux scripts de formulaire.` },
        { title: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc3_title:Préparation à l’impression`, text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc3_text:Éviter les surprises de rendu liées aux champs (cases à cocher, champs texte) selon le viewer.` },
        { title: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc4_title:Avant signature`, text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_uc4_text:Stabiliser l’apparence d’un formulaire avant une étape de signature (selon votre processus).` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_flatten_forms_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_flatten_forms_out1:Un PDF aplati : les valeurs des champs sont rendues comme du contenu statique sur la page.`,
        $localize`:@@ed_dev_pdf_pdf_flatten_forms_out2:Un récapitulatif (JSON/rapport) des champs traités : noms, types, valeurs, pages et état (flatten ok/partiel).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_flatten_forms_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_lim1:Une fois aplati, vous ne pourrez plus modifier les champs (sauf en repartant du PDF source).` },
        { text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_lim2:Selon le PDF, certaines apparences de champ peuvent être incomplètes si l’appearance stream est absent ou non standard.` },
        { text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_lim3:Aplatir peut invalider une signature existante : faites-le avant la signature, pas après (sauf cas maîtrisé).` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_flatten_forms_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_flatten_forms_q1:Est-ce que mes valeurs restent visibles ?`, a: $localize`:@@ed_dev_pdf_pdf_flatten_forms_a1:Oui : l’objectif du flatten est précisément de rendre la valeur visible en contenu statique.` },
        { q: $localize`:@@ed_dev_pdf_pdf_flatten_forms_q2:Les champs sont-ils supprimés ?`, a: $localize`:@@ed_dev_pdf_pdf_flatten_forms_a2:Ils ne sont plus interactifs. Selon l’implémentation, ils peuvent être retirés ou rendus inactifs après rendu.` },
        { q: $localize`:@@ed_dev_pdf_pdf_flatten_forms_q3:Puis-je aplatir seulement certaines pages ?`, a: $localize`:@@ed_dev_pdf_pdf_flatten_forms_a3:Si l’outil propose des options de plage, oui. Sinon, il aplatit l’ensemble des champs du document.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_flatten_forms_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_flatten_forms_tip:Avant d’aplatir, exportez “Champs de formulaire PDF → JSON” : vous aurez une sauvegarde structurée des champs/valeurs au cas où vous deviez reconstituer un formulaire.`,
    },
  ],
};
