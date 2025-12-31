import { ToolEditorialModel } from "../../../../models/tool-editorial/tool-editorial.model";

/**
 * Generated editorial skeleton.
 * Set editorialReady=true when content is complete.
 */
export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_pdf_pdf_encryption_check_title:À propos : PDF Encryption Check`,
  lead: $localize`:@@ed_dev_pdf_pdf_encryption_check_lead:Vérifier si un PDF est chiffré, identifier le type de protection (mot de passe) et lire les permissions (impression, copie, modification) pour anticiper les blocages de traitement.`,
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_encryption_check_usecases:Cas d’utilisation`,
      icon: 'pi pi-bolt',
      items: [
        { title: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc1_title:Débloquer une pipeline d’extraction`, text: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc1_text:Comprendre pourquoi une extraction de texte, de liens ou de champs de formulaire échoue sur certains PDF.` },
        { title: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc2_title:Contrôle conformité`, text: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc2_text:Valider qu’un document envoyé au client n’est pas protégé (ou au contraire qu’il l’est) selon votre politique.` },
        { title: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc3_title:Diagnostic support`, text: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc3_text:Fournir un rapport clair (chiffrement, révision, permissions) à une équipe dev/IT.` },
        { title: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc4_title:Préparation PDF/A / impression`, text: $localize`:@@ed_dev_pdf_pdf_encryption_check_uc4_text:Vérifier les restrictions avant d’archiver, d’imprimer ou d’envoyer à un prestataire.` },
      ],
    },
    {
      id: 'what-you-get',
      kind: 'text',
      heading: $localize`:@@ed_dev_pdf_pdf_encryption_check_output:Ce que vous obtenez`,
      icon: 'pi pi-database',
      paragraphs: [
        $localize`:@@ed_dev_pdf_pdf_encryption_check_out1:Un diagnostic JSON : chiffré ou non, méthode/algorithme (si détectable), révision, longueur de clé, présence de mot de passe utilisateur/propriétaire.`,
        $localize`:@@ed_dev_pdf_pdf_encryption_check_out2:Un tableau de permissions (imprimer, copier, annoter, remplir des formulaires, extraire pour accessibilité, etc.).`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_pdf_pdf_encryption_check_limits:Limites et points d’attention`,
      icon: 'pi pi-exclamation-triangle',
      items: [
        { text: $localize`:@@ed_dev_pdf_pdf_encryption_check_lim1:Les permissions PDF ne sont pas une sécurité forte : certains logiciels peuvent les ignorer selon le contexte.` },
        { text: $localize`:@@ed_dev_pdf_pdf_encryption_check_lim2:Un PDF peut être “protégé” sans être entièrement chiffré (restrictions/flags) : interprétez le rapport avec prudence.` },
        { text: $localize`:@@ed_dev_pdf_pdf_encryption_check_lim3:Sans mot de passe, l’outil ne peut pas accéder au contenu protégé sur les PDF réellement chiffrés.` },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_pdf_pdf_encryption_check_faq:Questions fréquentes`,
      icon: 'pi pi-question-circle',
      items: [
        { q: $localize`:@@ed_dev_pdf_pdf_encryption_check_q1:L’outil enlève-t-il le mot de passe ?`, a: $localize`:@@ed_dev_pdf_pdf_encryption_check_a1:Non. Il diagnostique le chiffrement et les permissions ; il ne contourne pas la protection.` },
        { q: $localize`:@@ed_dev_pdf_pdf_encryption_check_q2:Pourquoi l’impression est “interdite” mais j’arrive à imprimer ?`, a: $localize`:@@ed_dev_pdf_pdf_encryption_check_a2:Certaines applications n’appliquent pas strictement les permissions. Le rapport reflète ce que déclare le PDF.` },
        { q: $localize`:@@ed_dev_pdf_pdf_encryption_check_q3:Quelle différence entre mot de passe utilisateur et propriétaire ?`, a: $localize`:@@ed_dev_pdf_pdf_encryption_check_a3:Le mot de passe utilisateur ouvre le document ; le propriétaire contrôle souvent les permissions.` },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_pdf_pdf_encryption_check_tip_title:Astuce`,
      icon: 'pi pi-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_pdf_pdf_encryption_check_tip:Avant de lancer des outils d’extraction (liens, images, champs), vérifiez d’abord le chiffrement : vous gagnerez du temps de debug en identifiant immédiatement une protection.`,
    },
  ],
};
