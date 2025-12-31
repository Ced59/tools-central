import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_title:À propos : PDF Form Fields → JSON`,
  lead: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_lead:Extraire la structure des champs de formulaire (AcroForm) d’un PDF en JSON : noms, types, valeurs, flags, widgets et pages pour automatisation, QA et intégration.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc1_title:Cartographie de formulaire`, text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc1_text:Obtenir la liste des champs (nom interne, type, options) avant de développer un remplissage automatique.` },
        { title: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc2_title:Pré-remplissage / intégration`, text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc2_text:Créer un mapping JSON entre vos données métier et les champs PDF à remplir.` },
        { title: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc3_title:Contrôle qualité`, text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc3_text:Vérifier qu’un PDF fourni par un tiers contient bien tous les champs attendus et aux bons emplacements.` },
        { title: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc4_title:Debug de champs “invisibles”`, text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_uc4_text:Identifier des champs présents mais masqués, en lecture seule ou avec des flags particuliers.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_out1:Un JSON des champs : nom (T), type (Tx/Btn/Ch…), valeur (V), état, options, flags (required/readonly), etc.`,
        $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_out2:Les informations de widgets : page, rectangle, apparence et hiérarchie (parents/enfants) si disponible.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_lim1:Les formulaires XFA (dynamiques) peuvent ne pas être pris en charge selon le moteur : l’outil vise surtout AcroForm.` },
        { text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_lim2:Des valeurs peuvent être stockées sans apparence : certains viewers “reconstruisent” l’affichage à l’ouverture.` },
        { text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_lim3:Sur des documents chiffrés, l’accès aux champs peut être restreint sans mot de passe.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_q1:Est-ce que l’outil remplit le formulaire ?`, a: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_a1:Non, il extrait la structure et les valeurs existantes. Pour figer, utilisez “Aplatir formulaires”.` },
        { q: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_q2:Pourquoi un champ a une valeur mais n’apparaît pas ?`, a: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_a2:Le widget peut être hors page, masqué, ou l’apparence peut manquer. L’export aide à diagnostiquer.` },
        { q: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_q3:Les cases à cocher sont-elles gérées ?`, a: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_a3:Oui : elles apparaissent généralement comme des champs bouton (Btn) avec un état on/off.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_form_fields_to_json_tip:Avant une automatisation de remplissage, exportez une fois le JSON et construisez un mapping stable : vous éviterez les erreurs dues aux noms de champs changeants.`,
    },
  ],
};
