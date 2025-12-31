import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_text_case_text_case_title:À propos : Mettre en majuscule / minuscule`,
  lead: $localize`:@@ed_text_case_text_case_lead:Cet outil permet de convertir rapidement la casse d’un texte (MAJUSCULES, minuscules, casse de titre, casse de phrase, etc.) pour uniformiser un contenu, corriger une mise en forme ou gagner du temps.`,

  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_text_case_text_case_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        {
          title: $localize`:@@ed_text_case_text_case_uc1_title:Corriger un texte “CRIS”`,
          text: $localize`:@@ed_text_case_text_case_uc1_text:Transformer un texte écrit en MAJUSCULES en minuscules ou en casse de phrase pour le rendre lisible.`,
        },
        {
          title: $localize`:@@ed_text_case_text_case_uc2_title:Uniformiser des titres`,
          text: $localize`:@@ed_text_case_text_case_uc2_text:Mettre des titres en casse de titre (Title Case) ou en casse de phrase selon les conventions.`,
        },
        {
          title: $localize`:@@ed_text_case_text_case_uc3_title:Nettoyer du texte copié-collé`,
          text: $localize`:@@ed_text_case_text_case_uc3_text:Reformater un contenu venant d’un PDF, d’un export ou d’un outil qui casse la mise en forme.`,
        },
        {
          title: $localize`:@@ed_text_case_text_case_uc4_title:Préparer des données`,
          text: $localize`:@@ed_text_case_text_case_uc4_text:Mettre une liste (noms, emails, tags) dans une casse cohérente avant import dans un tableur ou un CRM.`,
        },
        {
          title: $localize`:@@ed_text_case_text_case_uc5_title:Développement et slugging`,
          text: $localize`:@@ed_text_case_text_case_uc5_text:Uniformiser des identifiants, constantes, libellés ou fragments de texte selon une casse voulue.`,
        },
        {
          title: $localize`:@@ed_text_case_text_case_uc6_title:Éviter les erreurs de présentation`,
          text: $localize`:@@ed_text_case_text_case_uc6_text:Appliquer une casse consistante dans des documents, des CV ou des présentations.`,
        },
      ],
    },

    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_text_case_text_case_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_text_case_text_case_out1:Le texte converti dans la casse choisie (majuscule, minuscule, titre, phrase, etc.), prêt à être copié-collé.`,
        $localize`:@@ed_text_case_text_case_out2:Une transformation rapide qui conserve le contenu : seuls les caractères (casse) changent, pas les mots.`,
        $localize`:@@ed_text_case_text_case_out3:Un outil pratique pour standardiser des textes sans passer par un éditeur ou une série de remplacements manuels.`,
      ],
    },

    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_text_case_text_case_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        {
          text: $localize`:@@ed_text_case_text_case_lim1:La “casse de titre” peut dépendre de règles linguistiques (mots à laisser en minuscule, exceptions), qui varient selon les conventions.`,
        },
        {
          text: $localize`:@@ed_text_case_text_case_lim2:Les acronymes (ex. “API”, “HTML”) peuvent nécessiter une correction manuelle après conversion.`,
        },
        {
          text: $localize`:@@ed_text_case_text_case_lim3:Ce convertisseur modifie la casse, pas la ponctuation ni l’orthographe.`,
        },
      ],
    },

    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_text_case_text_case_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        {
          q: $localize`:@@ed_text_case_text_case_q1:Quelle est la différence entre “casse de phrase” et “casse de titre” ?`,
          a: $localize`:@@ed_text_case_text_case_a1:La casse de phrase met en majuscule seulement la première lettre d’une phrase. La casse de titre met en majuscule les mots importants d’un titre.`,
        },
        {
          q: $localize`:@@ed_text_case_text_case_q2:Est-ce que l’outil change les accents ou les caractères spéciaux ?`,
          a: $localize`:@@ed_text_case_text_case_a2:Non : il conserve les caractères (accents inclus) et ne modifie que la casse.`,
        },
        {
          q: $localize`:@@ed_text_case_text_case_q3:Est-ce que je peux convertir une liste avec des retours à la ligne ?`,
          a: $localize`:@@ed_text_case_text_case_a3:Oui, l’outil fonctionne sur du texte multi-lignes (listes, paragraphes, colonnes copiées).`,
        },
        {
          q: $localize`:@@ed_text_case_text_case_q4:Pourquoi certains mots (ex. acronymes) ne ressortent pas comme je veux ?`,
          a: $localize`:@@ed_text_case_text_case_a4:Les acronymes et exceptions linguistiques ne sont pas toujours détectés automatiquement : un ajustement manuel peut être nécessaire.`,
        },
      ],
    },

    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_text_case_text_case_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_text_case_text_case_tip:Pour un rendu propre, convertissez d’abord en minuscules, puis appliquez la casse souhaitée (phrase ou titre) : cela évite les irrégularités issues d’un texte déjà mal formaté.`,
    },
  ],
};
