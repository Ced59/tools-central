import type { ToolEditorialModel } from '../../../../models/tool-editorial/tool-editorial.model';

export const editorialReady = true;

export const editorial: ToolEditorialModel = {
  title: $localize`:@@ed_dev_data_json_ts_title:Passer d’un exemple JSON à des types TypeScript réellement relisibles`,
  lead: $localize`:@@ed_dev_data_json_ts_lead:Ce générateur analyse votre JSON dans un Worker local puis produit des interfaces ou aliases exportés. Il fusionne les échantillons, signale les hypothèses fragiles et conserve les unions, valeurs nulles et propriétés absentes sans envoyer le contenu au serveur.`,
  updatedAtIso: '2026-09-18',
  sections: [
    {
      id: 'use-cases',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_ts_use_cases:Quand générer des types depuis JSON ?`,
      icon: 'tc-icon tc-icon-bolt',
      items: [
        {
          title: $localize`:@@ed_dev_data_json_ts_uc1_title:Démarrer une intégration d’API`,
          text: $localize`:@@ed_dev_data_json_ts_uc1_text:Collez plusieurs réponses représentatives pour obtenir rapidement les objets imbriqués, tableaux et types primitifs. Le résultat fournit une base à relire avec la documentation de l’API, pas une preuve que toutes les réponses futures auront cette forme.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_ts_uc2_title:Typer une configuration ou une fixture`,
          text: $localize`:@@ed_dev_data_json_ts_uc2_text:Transformez un fichier de configuration, une fixture de test ou un export local en déclarations nommées. Les noms de propriétés non compatibles avec un identifiant TypeScript sont conservés entre guillemets.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_ts_uc3_title:Comparer plusieurs variantes d’un objet`,
          text: $localize`:@@ed_dev_data_json_ts_uc3_text:Placez les variantes dans un tableau. Le mode fusion rend optionnels les champs absents de certains éléments ; le mode union préserve chaque forme structurelle distincte.`,
        },
      ],
    },
    {
      id: 'inference',
      kind: 'text',
      heading: $localize`:@@ed_dev_data_json_ts_inference:Comment fonctionne l’inférence`,
      icon: 'tc-icon tc-icon-code',
      paragraphs: [
        $localize`:@@ed_dev_data_json_ts_inference_1:Chaque valeur JSON devient un type TypeScript : chaîne, nombre, booléen, null, tableau ou objet. Les objets imbriqués reçoivent des noms déterministes dérivés du chemin de propriété. Les collisions de noms sont résolues par un suffixe stable afin que le même document produise le même fichier.`,
        $localize`:@@ed_dev_data_json_ts_inference_2:Dans un tableau fusionné, deux objets partageant une propriété combinent le type de cette propriété. Un champ présent dans un seul échantillon devient optionnel. Des primitives différentes forment une union, par exemple string | number | null.`,
        $localize`:@@ed_dev_data_json_ts_inference_3:Un tableau vide devient Array<unknown>, car aucune valeur ne permet d’inférer son élément. Un objet vide produit une déclaration sans propriété. Ces deux situations sont signalées dans l’interface et doivent être précisées manuellement.`,
      ],
    },
    {
      id: 'merge-or-union',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_ts_modes:Fusion ou union : quelle stratégie choisir ?`,
      icon: 'tc-icon tc-icon-list',
      items: [
        {
          title: $localize`:@@ed_dev_data_json_ts_merge_title:Fusionner des ressources semblables`,
          text: $localize`:@@ed_dev_data_json_ts_merge_text:Choisissez la fusion pour une liste d’utilisateurs, produits ou événements qui partagent un même modèle. Les propriétés manquantes deviennent optionnelles et les types observés sont réunis.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_ts_union_title:Préserver des variantes distinctes`,
          text: $localize`:@@ed_dev_data_json_ts_union_text:Choisissez l’union lorsqu’un tableau contient plusieurs objets métier, par exemple un cercle et un carré ou plusieurs types d’événements. Chaque forme reçoit alors sa propre déclaration.`,
        },
        {
          title: $localize`:@@ed_dev_data_json_ts_discriminant_title:Ajouter ensuite un discriminant précis`,
          text: $localize`:@@ed_dev_data_json_ts_discriminant_text:Le générateur infère string pour une valeur comme « circle » car un seul exemple ne prouve pas que cette chaîne est un littéral fermé. Après vérification du contrat, remplacez-la manuellement par une union de littéraux si elle constitue un discriminant.`,
        },
      ],
    },
    {
      id: 'dates',
      kind: 'text',
      heading: $localize`:@@ed_dev_data_json_ts_dates:Pourquoi l’inférence des dates est optionnelle`,
      icon: 'tc-icon tc-icon-info-circle',
      paragraphs: [
        $localize`:@@ed_dev_data_json_ts_dates_1:JSON ne possède pas de type date : une date ISO arrive toujours sous forme de chaîne. L’option reconnaît uniquement une date civile valide ou un date-time ISO avec fuseau explicite, puis génère Date pour faciliter un modèle déjà hydraté.`,
        $localize`:@@ed_dev_data_json_ts_dates_2:Si votre code utilise directement la réponse de fetch ou JSON.parse, conservez string. TypeScript n’exécute aucune conversion à l’exécution ; déclarer Date sans transformer la valeur donnerait une assurance incorrecte et ferait échouer les méthodes comme getTime.`,
      ],
    },
    {
      id: 'limits',
      kind: 'list',
      heading: $localize`:@@ed_dev_data_json_ts_limits:Confidentialité, précision et limites`,
      icon: 'tc-icon tc-icon-shield',
      items: [
        {
          text: $localize`:@@ed_dev_data_json_ts_limit_1:Le fichier reste dans le navigateur et est décodé en UTF-8 strict. Le lien de partage ne contient ni source ni résultat. Le rapport exporté contient les options, avertissements et statistiques, sans recopier les valeurs du JSON.`,
        },
        {
          text: $localize`:@@ed_dev_data_json_ts_limit_2:La source est limitée à 2 millions de caractères, le fichier à 4 Mo, le document à 100 000 valeurs et 64 niveaux. Le Worker est interrompu après 5 secondes ; les sorties trop grandes ou structures excessives sont refusées.`,
        },
        {
          text: $localize`:@@ed_dev_data_json_ts_limit_3:Les clés dupliquées, chaînes Unicode mal formées et nombres qui perdraient leur représentation JavaScript sont rejetés. Le générateur ne déduit ni contraintes numériques, ni formats métier, ni validation d’autorisation.`,
        },
      ],
    },
    {
      id: 'faq',
      kind: 'faq',
      heading: $localize`:@@ed_dev_data_json_ts_faq:Questions fréquentes`,
      icon: 'tc-icon tc-icon-question-circle',
      items: [
        {
          q: $localize`:@@ed_dev_data_json_ts_q1:Pourquoi une propriété est-elle optionnelle ?`,
          a: $localize`:@@ed_dev_data_json_ts_a1:En mode fusion, elle était absente d’au moins un objet du tableau. Cela décrit les échantillons fournis. Si le contrat garantit cette propriété, retirez le point d’interrogation après avoir vérifié la documentation ou le JSON Schema.`,
        },
        {
          q: $localize`:@@ed_dev_data_json_ts_q2:Pourquoi le générateur n’utilise-t-il pas les valeurs comme littéraux ?`,
          a: $localize`:@@ed_dev_data_json_ts_a2:Une valeur observée ne prouve pas qu’elle est la seule autorisée. Générer automatiquement « admin » au lieu de string rendrait souvent le type trop étroit. Ajoutez des littéraux uniquement lorsque le contrat les définit explicitement.`,
        },
        {
          q: $localize`:@@ed_dev_data_json_ts_q3:Ce fichier remplace-t-il un schéma de validation ?`,
          a: $localize`:@@ed_dev_data_json_ts_a3:Non. Les types TypeScript disparaissent à l’exécution et ne valident pas une réponse réseau. Utilisez JSON Schema, une bibliothèque de validation ou un parseur métier à la frontière de votre application.`,
        },
      ],
    },
    {
      id: 'tip',
      kind: 'callout',
      heading: $localize`:@@ed_dev_data_json_ts_tip_title:Conserver les exemples comme tests`,
      icon: 'tc-icon tc-icon-lightbulb',
      variant: 'info',
      text: $localize`:@@ed_dev_data_json_ts_tip:Après avoir relu le type généré, gardez plusieurs réponses anonymisées comme fixtures et validez-les automatiquement. Une nouvelle forme d’objet ou une propriété devenue nullable sera alors détectée avant de casser l’interface.`,
    },
  ],
};
