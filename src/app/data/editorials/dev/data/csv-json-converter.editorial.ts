import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_data_csv_json_title:Convertir CSV et JSON sans perdre le contrôle des colonnes`,
  lead: $localize`:@@ed_dev_data_csv_json_lead:Ce convertisseur transforme localement un tableau CSV en objets JSON, ou un tableau d’objets JSON en CSV. Il détecte les séparateurs, respecte les champs multilignes, permet de sélectionner et renommer les colonnes, montre les anomalies avant export et n’envoie aucune valeur vers un serveur.`,
  updatedAtIso: '2026-09-18',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_csv_json_use_cases:Cas d’utilisation`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_data_csv_json_uc1_title:Préparer un export CSV pour une API`,
          text: $localize`:@@ed_dev_data_csv_json_uc1_text:Transformez des lignes provenant d’un tableur en tableau JSON, conservez les identifiants à zéro initial et activez seulement l’inférence des nombres, booléens et valeurs nulles lorsque le schéma le permet.`,
        },
        {
          title: $localize`:@@ed_dev_data_csv_json_uc2_title:Rendre un JSON lisible dans un tableur`,
          text: $localize`:@@ed_dev_data_csv_json_uc2_text:Aplatissez les objets imbriqués avec des chemins pointés, choisissez le séparateur attendu par votre environnement et ajoutez un BOM UTF-8 si le logiciel cible l’exige.`,
        },
        {
          title: $localize`:@@ed_dev_data_csv_json_uc3_title:Renommer et filtrer sans script jetable`,
          text: $localize`:@@ed_dev_data_csv_json_uc3_text:Déclarez un mapping « source => sortie » pour sélectionner les colonnes utiles, les réordonner et produire des noms stables sans modifier le fichier d’origine.`,
        },
      ],
    },
    {
      id: 'method',
      kind: 'text',
      heading: $localize`:@@ed_dev_data_csv_json_method:Méthode recommandée`,
      icon: 'tc-icon tc-icon-list',
      paragraphs: [
        $localize`:@@ed_dev_data_csv_json_method_1:Commencez sans mapping et vérifiez le séparateur détecté, les en-têtes et l’aperçu. Les fichiers CSV européens utilisent souvent le point-virgule lorsque la virgule sert de séparateur décimal, tandis que les TSV utilisent une tabulation.`,
        $localize`:@@ed_dev_data_csv_json_method_2:Examinez chaque diagnostic de largeur, d’en-tête vide ou dupliqué. L’outil complète les cellules absentes et crée des noms stables pour éviter l’écrasement, mais cette tolérance ne remplace pas la correction de la source.`,
        $localize`:@@ed_dev_data_csv_json_method_3:Ajoutez ensuite le mapping dans l’ordre attendu par le consommateur. Pour JSON vers CSV, utilisez les chemins pointés affichés dans l’aperçu, par exemple « profil.nom => nom ».`,
      ],
    },
    {
      id: 'typing',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_csv_json_typing:Types et fidélité`,
      icon: 'tc-icon tc-icon-check-circle',
      items: [
        {
          title: $localize`:@@ed_dev_data_csv_json_typing_strings_title:Chaînes par défaut`,
          text: $localize`:@@ed_dev_data_csv_json_typing_strings_text:Désactivez l’inférence lorsque les valeurs sont des codes, références ou numéros de téléphone. Une valeur comme 00123 reste toujours une chaîne afin de préserver ses zéros.`,
        },
        {
          title: $localize`:@@ed_dev_data_csv_json_typing_safe_title:Inférence limitée`,
          text: $localize`:@@ed_dev_data_csv_json_typing_safe_text:Le mode typé reconnaît true, false, null et les nombres finis représentables sans perte d’entier. Les dates restent des chaînes : leur fuseau et leur calendrier ne sont jamais devinés.`,
        },
        {
          title: $localize`:@@ed_dev_data_csv_json_typing_nested_title:Objets imbriqués`,
          text: $localize`:@@ed_dev_data_csv_json_typing_nested_text:En JSON vers CSV, les objets deviennent des chemins pointés et les tableaux sont sérialisés dans une cellule JSON. La conversion inverse crée des clés plates, même si leur nom contient un point.`,
        },
      ],
    },
    {
      id: 'security',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_csv_json_security:Sécurité, limites et confidentialité`,
      icon: 'tc-icon tc-icon-shield',
      items: [
        {
          text: $localize`:@@ed_dev_data_csv_json_security_1:Le traitement s’effectue dans un Web Worker éphémère. Les fichiers restent dans le navigateur et aucune requête réseau n’est nécessaire pour convertir, copier ou télécharger la sortie.`,
        },
        {
          text: $localize`:@@ed_dev_data_csv_json_security_2:La source est limitée à 4 millions de caractères ou 4 Mo pour un fichier, avec au plus 100 000 lignes, 250 colonnes, 100 000 caractères par cellule et 16 millions de caractères en sortie.`,
        },
        {
          text: $localize`:@@ed_dev_data_csv_json_security_3:Lors d’un export CSV, la protection optionnelle préfixe les textes commençant par =, +, - ou @. Elle réduit le risque d’exécution de formule à l’ouverture dans un tableur sans prétendre assainir un fichier pour tous les logiciels.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_data_csv_json_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_data_csv_json_q1:Les retours de ligne dans une cellule CSV sont-ils conservés ?`,
          a: $localize`:@@ed_dev_data_csv_json_a1:Oui, lorsqu’ils se trouvent dans un champ entouré de guillemets doubles. Un guillemet littéral se note avec deux guillemets, conformément au format CSV courant.`,
        },
        {
          q: $localize`:@@ed_dev_data_csv_json_q2:Pourquoi mon JSON doit-il commencer par un tableau ?`,
          a: $localize`:@@ed_dev_data_csv_json_a2:Une feuille CSV représente une suite de lignes partageant des colonnes. Un objet JSON isolé ou un mélange de scalaires n’offre pas cette structure tabulaire ; la racine doit donc être un tableau d’objets.`,
        },
        {
          q: $localize`:@@ed_dev_data_csv_json_q3:La conversion est-elle parfaitement réversible ?`,
          a: $localize`:@@ed_dev_data_csv_json_a3:Non. CSV ne transporte ni schéma de types, ni structure imbriquée standard. Conservez le fichier source et vérifiez les types, valeurs nulles, tableaux et chemins aplatis avant d’utiliser la sortie.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_data_csv_json_tip_title:Tester un petit échantillon d’abord`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_data_csv_json_tip:Validez quelques lignes représentatives, dont les cellules vides, guillemets, séparateurs, retours de ligne et identifiants sensibles, puis appliquez les mêmes options au fichier complet.`,
    },
  ],
};
