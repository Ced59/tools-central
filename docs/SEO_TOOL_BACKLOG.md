# Backlog d'outils à forte valeur produit et SEO

Date de référence : 15 septembre 2026

## Objectif et garde-fous

Ce document constitue un inventaire large d'opportunités, pas une promesse de trafic. Aucun volume de recherche n'est inventé. Avant chaque PR, l'intention et la demande doivent être confirmées avec Search Console, Google Trends et un outil de mots-clés, puis comparées au catalogue existant.

La croissance repose sur des outils qui résolvent un vrai problème dans le navigateur, avec une préférence forte pour le traitement local et la confidentialité. Il ne faut jamais publier automatiquement des pages vides, des variantes de mots-clés quasi identiques ou des traductions non relues. Google recommande du contenu utile conçu pour les personnes et considère les pages satellites ainsi que la production à grande échelle sans valeur comme du spam.

Règles de livraison :

- une PR = un outil ou une fonctionnalité atomique ;
- vérifier qu'aucun outil, slug ou moteur équivalent n'existe déjà ;
- ne passer `available: true` qu'avec moteur réel, tests, UX complète, éditorial spécifique et traduction relue ;
- afficher formats acceptés, limites, confidentialité et cas où le résultat peut être imprécis ;
- relier l'outil à un parcours cohérent, jamais à un bloc artificiel de liens ;
- mesurer impressions, clics, requêtes, conversion d'usage et rétention après indexation ;
- fusionner les intentions synonymes dans une page forte plutôt que créer plusieurs pages minces.

## Modèle de priorité

Noter chaque candidat sur 5, preuves à l'appui :

| Critère | Question |
|---|---|
| Intention | La requête exprime-t-elle une tâche claire et immédiate ? |
| Valeur | Le résultat fait-il réellement gagner du temps ou réduit-il un risque ? |
| Différenciation | Le traitement local, le diagnostic ou l'export apporte-t-il plus qu'un formulaire banal ? |
| Affinité | Peut-on réutiliser les moteurs, modèles et contenus du cluster ? |
| Potentiel éditorial | Existe-t-il des exemples, limites et explications réellement utiles ? |
| Confiance | Le résultat est-il vérifiable sans créer un risque médical, légal ou financier ? |
| Coût inversé | Le temps de développement, QA et maintenance reste-t-il raisonnable ? |

`P0` signifie « prochain trimestre après validation de la demande », `P1` « extension naturelle du cluster », `P2` « à tester plus tard ». Complexité : `S` moins de quelques jours, `M` environ une à deux semaines, `L` moteur/QA importants. Ces repères sont relatifs et doivent être réestimés.

## Clusters à construire d'abord

1. **PDF et documents privés** : forte intention transactionnelle, avantage crédible du traitement local, nombreuses suites d'actions.
2. **Développeur et données** : utilisateurs récurrents, requêtes longues et outils vérifiables.
3. **Texte, rédaction et SEO opérationnel** : besoins fréquents ; exiger une analyse concrète, pas du contenu généré générique.
4. **Mathématiques et éducation** : longue traîne stable, exemples pédagogiques et réutilisation des moteurs.
5. **Image/SVG**, puis **business** : seulement après stabilisation performance, accessibilité et mesure des quatre premiers clusters.

## Shortlist prioritaire

Le statut dans le catalogue doit être vérifié avant planification. Si une intention existe déjà, améliorer la page existante au lieu d'en créer une seconde.

| # | Outil / intention principale | Valeur différenciante attendue | Priorité | Complexité |
|---:|---|---|---|---|
| 1 | Compresser un PDF hors ligne | profils e-mail/web/archive, estimation avant/après, aucun upload | P0 | L |
| 2 | OCR d'un PDF scanné local | langue et plages de pages, PDF recherchable + TXT, avertissement de précision | P0 | L |
| 3 | Caviarder définitivement un PDF | détection des faux rectangles, suppression réelle du contenu et métadonnées | P0 | L |
| 4 | Réparer un PDF illisible | diagnostic xref/objets, tentative non destructive, rapport exportable | P0 | L |
| 5 | Comparer deux PDF | différences texte, pages et rendu, rapport visuel local | P0 | L |
| 6 | PDF vers images | résolution, format, pages, estimation de taille et ZIP | P0 | M |
| 7 | Images vers PDF | ordre par glisser-déposer, marges, format, compression et aperçu | P0 | M |
| 8 | Supprimer les métadonnées d'un document | PDF, DOCX, XLSX, PPTX avec rapport avant/après | P0 | M |
| 9 | Inspecteur de confidentialité PDF | métadonnées, pièces jointes, JavaScript, liens, formulaires et signatures | P0 | M |
| 10 | Convertisseur CSV ↔ JSON | mapping, types, délimiteur, streaming et aperçu des erreurs | P0 | M |
| 11 | Comparer deux JSON | diff structurel, tableaux par clé, patch JSON et partage sans données | P0 | M |
| 12 | Valider JSON Schema | erreurs localisées, exemples corrigés, formats et brouillons supportés | P0 | M |
| 13 | Convertisseur JSON ↔ TypeScript | unions, nullabilité, dates, interfaces/types et export | P0 | M |
| 14 | Analyseur JWT hors ligne | décodage, expiration, claims et vérification locale avec clé fournie | P0 | M |
| 15 | Constructeur d'expression régulière | tests multiples, groupes expliqués, substitutions et limites de moteur | P0 | M |
| 16 | Diff de texte sémantique | mot/ligne/caractère, espaces ignorés et patch téléchargeable | P0 | M |
| 17 | Compteur de tokens multi-modèles | segmentation documentée, coût paramétrable sans prétendre à un prix temps réel | P0 | M |
| 18 | Extracteur de données structurées | JSON-LD, microdata, erreurs et aperçu de graphe | P0 | M |
| 19 | Générateur/validateur robots.txt | simulation par user-agent et détection de blocages critiques | P0 | M |
| 20 | Générateur/validateur sitemap XML | découpage automatique, hreflang, limites et rapport de liens | P0 | M |
| 21 | Prévisualiseur de snippet SERP | largeur pixel, mobile/desktop, title/description et recommandations | P0 | S |
| 22 | Vérificateur hreflang | matrice de réciprocité, canonical, x-default et erreurs exportables | P0 | M |
| 23 | Calculateur de lisibilité multilingue | métriques adaptées par langue, phrases difficiles et explications | P0 | M |
| 24 | Nettoyeur de texte copié depuis PDF | ligatures, césures, retours, colonnes et aperçu diff | P0 | M |
| 25 | Générateur d'exercices de fractions | niveaux, corrigé détaillé, graines reproductibles et impression | P0 | M |
| 26 | Solveur de proportion avec étapes | unités, proportion directe/inverse et explication pédagogique | P0 | S |
| 27 | Calculateur de taille d'échantillon | hypothèses visibles, intervalle, population finie et pédagogie | P0 | M |
| 28 | Convertisseur d'unités scientifiques | analyse dimensionnelle, notation, précision et favoris locaux | P0 | M |
| 29 | Optimiseur SVG | aperçu, diff, accessibilité, options sûres et taille gagnée | P0 | M |
| 30 | Convertisseur et compresseur d'images | AVIF/WebP/PNG/JPEG, qualité comparée, lots et traitement local | P0 | L |

### Outils livrés depuis l’audit

- **Prévisualiseur de snippet Google** — implémenté en Clean Architecture, traitement local, vues ordinateur/mobile, estimation typographique en pixels, recommandations, tests unitaires et E2E. Route : `/categories/dev/seo/serp-snippet-preview`.
- **Générateur et validateur robots.txt** — implémenté en Clean Architecture, traitement local, génération sûre, validation bornée à 500 Kio, simulation URL/user-agent conforme à RFC 9309, export texte, tests unitaires et E2E. Route : `/categories/dev/seo/robots-txt-builder`.
- **Générateur et validateur sitemap XML** — implémenté en Clean Architecture, traitement local, génération de sitemap ou d’index, validation XML bornée, contrôle des URL, dates, doublons, périmètre et limites du protocole, export XML, tests unitaires et E2E. Route : `/categories/dev/seo/sitemap-xml-builder`.
- **Générateur et vérificateur hreflang** — implémenté en Clean Architecture, traitement local, sorties HTML/HTTP/sitemap, validation des codes et URL, contrôle des auto-références, canonicals, ensembles et liens retour à partir de blocs fournis, export local, tests unitaires et E2E. Route : `/categories/dev/seo/hreflang-checker`.
- **Extracteur de données structurées** — implémenté en Clean Architecture, traitement HTML inerte et local, inventaire JSON-LD/Microdata/RDFa, normalisation des entités et relations, limites défensives, diagnostics et export JSON, tests unitaires et E2E. Route : `/categories/dev/seo/structured-data-extractor`.
- **Auditeur de head HTML** — implémenté en Clean Architecture, parseur textuel inerte et local compatible SSR, contrôle de title, description, canonical, robots, viewport, charset, hreflang, Open Graph, Twitter et inventaire JSON-LD, limites défensives, rapport JSON, tests unitaires et E2E mobile. Route : `/categories/dev/seo/html-head-auditor`.
- **Générateur Schema.org SoftwareApplication** — implémenté en Clean Architecture, génération JSON-LD locale, contrôle de l’offre, des URL, des propriétés Google recommandées et d’une note agrégée réelle, échappement sûr pour intégration HTML, export JSON/HTML, tests unitaires et E2E mobile. Route publiée en français : `/categories/dev/seo/software-application-schema-builder` ; les autres locales restent hors index jusqu’à leur relecture.
- **PDF vers images** — implémenté en Clean Architecture, rendu PDF.js entièrement local dans un Web Worker avec `OffscreenCanvas`, rejet explicite des filtres non pris en charge, sélection bornée de pages, formats PNG/JPEG/WebP, DPI et qualité réglables, estimation préventive du budget pixels, aperçu et ZIP dans un worker annulable chargé à la demande, tests unitaires et E2E mobile. Route publiée en français : `/categories/dev/pdf/pdf-to-images` ; les autres locales restent hors index jusqu’à leur relecture.
- **Images vers PDF** — implémenté en Clean Architecture, validation binaire PNG/JPEG/WebP avant décodage, ordre par glisser-déposer ou boutons accessibles, pages A4/Lettre US/adaptées, marges, trois niveaux de compression et génération PDF locale dans un Web Worker annulable, avec budgets de fichiers, octets, dimensions, pixels et sortie. Route publiée en français : `/categories/dev/pdf/images-to-pdf` ; les autres locales restent hors index jusqu’à leur relecture.
- **Supprimer les métadonnées DOCX, XLSX et PPTX** — implémenté en Clean Architecture avec prévalidation de la table ZIP avant décompression, inflater natif ou fallback Pako borné, validation des namespaces OPC, limites d’entrées, de ratio et de mémoire, inventaire avant/après, neutralisation des propriétés principales/applicatives/personnalisées, suppression de la miniature et reconstruction locale dans un Web Worker annulable. Le PDF reste couvert par le nettoyeur dédié existant. Route publiée en français : `/categories/dev/ooxml/ooxml-sanitize-metadata` ; les autres locales restent hors index jusqu’à leur relecture.
- **Inspecteur de confidentialité PDF** — implémenté en Clean Architecture avec analyse PDF.js et lecture inerte, paresseuse, bornée et entièrement itérative des structures PDF dans un Worker isolé, prise en charge des PDF protégés par mot de passe lorsqu’ils restent bornables, préflight brut limité à 1 000 000 de tokens syntaxiques hors flux, 256 niveaux de conteneurs, 100 000 objets indirects déclarés — classiques ou compressés selon `/N` — et un `/Size` xref cohérent avant `pdf-lib`, préflight décompressé limité à 1 MiB par script, 2 MiB pour XMP et 8 MiB par paquet XFA, flux déchiffrables `/ObjStm` et `/XRef` limités à 32 MiB agrégés avant leur expansion par `pdf-lib`, et aucun inflate du ciphertext chiffré. Les `/ObjStm` chiffrés restent intacts jusqu’à la classification PDF.js du mot de passe afin de préserver `password-required` et `incorrect-password`, puis une ouverture réussie est refusée prudemment faute de préflight possible avant déchiffrement ; les autres sorties filtrées déchiffrées par PDF.js partagent un budget documentaire de 32 MiB et 1 000 000 de nœuds, itératif, dédupliqué et résistant aux cycles. Les chaînes `/Next` et tableaux d’actions imbriqués sont limités à 256 avant les API récursives de PDF.js, avec suivi des actions `/Next` issues de l’arbre de noms JavaScript, 10 000 occurrences de champs — références répétées comprises et cycles rejetés — et 10 000 signets au maximum, annotations découvertes via l’arbre de pages même lorsque `/Type` est absent ou malformé et limitées à 10 000 entrées, plafonds de 1 000 000 d’opérations estimées de fusion des ressources `/DR` héritées par occurrence et de 1 000 000 d’entrées de contenu optionnel `/OCGs` ou `/VE` matérialisées par annotation avant PDF.js, et plafonds agrégés de 32 MiB sur le JavaScript documentaire, l’expansion du script par entrée de l’arbre de noms JavaScript, les scripts facturés aux seules occurrences de formulaire qui les portent ou les héritent, les apparences par défaut héritées, les textes alternatifs et index de sélection des widgets, les noms qualifiés, valeurs, options, contenus et métadonnées répétées des signatures par occurrence de champ, le balayage des queues de signature, l’expansion des valeurs `/Info`, les cibles — y compris `/AA` et `/Next`, facturées par annotation —, textes — métadonnées FileSpec et contenus de parents matérialisés par chaque annotation compris —, géométries — y compris parents de popup, bordures, tirets, fins de ligne `/LE` et tableaux de couleur `/C`, `/IC`, `/MK /BC` et `/MK /BG` — et scripts répétés d’annotations, ainsi que les titres, destinations et couleurs `/C` du plan. Les budgets `/JS` et `/XFA` ne concernent que les conteneurs sémantiques reconnus, sans pénaliser une extension applicative homonyme. Toute limite structurelle non chiffrée arrête le Worker avant `getDocument` et aucun échec structurel n’est remplacé par un inventaire vide. L’outil inventorie la version PDF effective du catalogue, les métadonnées Info standards/personnalisées y compris les valeurs `PDFName` et toutes les propriétés XMP scalaires via l’itérateur public de PDF.js, les scripts sans exposition du code, les actions automatiques (dont `Named`, `Launch`, `SubmitForm`, `Sound`, `Movie`, `GoTo3DView` et actions additionnelles de page, champ ou annotation), les pièces jointes réellement embarquées via un dictionnaire `/EF` contenant un flux `/F`, `/UF`, `/Unix`, `/Mac` ou `/DOS` valide, y compris lorsqu’elles sont uniquement atteignables depuis une action, les URL, les formulaires avec comptage des champs homonymes sans exposition des valeurs, les noms et métadonnées privées des signatures, et le chiffrement. L’appartenance à l’arbre AcroForm et le type `/FT` sont propagés aux descendants afin de budgéter les actions additionnelles et de conserver les signatures héritées. L’inventaire structurel complète celui de PDF.js lorsque celui-ci n’expose qu’une partie des signatures ; les JavaScript de champ et les signatures sans nom sont rapprochés par occurrence pour ne pas doubler les résultats normalisés. Un champ `/FT /Sig` structurellement valide reste signalé même lorsque `/SigFlags` est absent ou obsolète. Le Worker renvoie des codes sémantiques stables, traduits seulement dans la présentation, suit `/Next` même après un discriminateur d’action malformé, normalise les URI sans schéma comme PDF.js, déduplique les actions héritées des widgets d’un même champ, rapproche les actions chiffrées d’annotation par identité et celles de plan uniquement avec des types de cible compatibles, puis inventorie chaque FileSpec une seule fois par identité structurelle ; il n’ouvre ni ne décompresse les fichiers associés et omet leur taille lorsqu’un filtre ou le chiffrement rend la taille décodée inconnue. Les compteurs de filtres utilisent les occurrences agrégées, y compris « Tout ». Les unités de taille visibles sont adaptées par `Intl` à la locale active. Les ressources restent locales, les liens ne sont jamais suivis et le rapport JSON explicite qu’il ne vaut ni verdict antivirus, ni analyse visuelle, ni validation cryptographique. Route publiée en français : `/categories/dev/pdf/pdf-privacy-inspector` ; les autres locales restent hors index jusqu’à leur relecture.

- **Durcissement final de l’inspecteur PDF** — les corps de flux sont exclus de la collecte des objets de longueur indirecte après résolution par frontière, provenance externe et entrée autoritative de la chaîne xref active, classique, hybride `/XRefStm` ou `/XRef` décodable, y compris lorsqu’un payload mime un objet avant ou après une seconde frontière `endstream` ou que l’entier est stocké dans un `/ObjStm` borné. Les entrées directes conservent leur offset ; les entrées xref type 2 conservent le numéro d’Object Stream et l’index actifs afin d’ignorer les versions compressées obsolètes. Lorsque la chaîne xref est complète, les Object Streams sans objet actif ou situés à un ancien offset sont écartés avant décompression et avant facturation au budget agrégé ; si cette autorité reste partielle, aucun flux n’est omis. Les filtres textuels PDF standards Flate, LZW, ASCII85, ASCIIHex et RunLength sont acceptés seuls ou en chaîne, avec leurs abréviations et les prédicteurs Flate/LZW usuels, tout en conservant la limite de décompression. Un flux xref courant masque les révisions antérieures même si son encodage reste volontairement non pris en charge, et une déclaration classique active remplace une valeur compressée devenue obsolète ; toute ambiguïté sans autorité est rejetée, les commentaires xref et faux `startxref` sont ignorés lexicalement, et 100 000 déclarations ainsi que 64 valeurs par référence sont admises au maximum. Le dernier `startxref` réel permet de détecter les dictionnaires de chiffrement avant la découverte compressée sans faire confiance à un faux trailer contenu dans un flux non résolu, afin de ne jamais décompresser un ciphertext ; les noms de pièces jointes hérités de `/Unix`, `/Mac` ou `/DOS` sont conservés ; les tableaux RichMedia `/Configurations` et `/Instances` et les arbres de rendition Screen sont plafonnés à 1 000 000 d’entrées matérialisées par annotation ; les noms et descriptions média partagés disposent d’un plafond agrégé de 32 MiB ; les JavaScript de page ne sont inventoriés qu’une fois.
- **Garantie du budget de filtres PDF** — chaque sortie intermédiaire d’une chaîne et chaque reconstruction de prédicteur consomme le plafond agrégé, y compris si la sortie finale est plus petite. Les filtres et dictionnaires `DecodeParms` indirects sont résolus par la xref autoritative ; lors de l’amorçage d’un flux xref, les payloads de flux bornés sont exclus et une déclaration directe unique n’est acceptée que si les entrées décodées confirment son offset. Le prédicteur TIFF accepte les profondeurs standard 1, 2, 4, 8 et 16 bits, et les signatures nommées après déchiffrement restent dédupliquées par occurrence.
- **Parité du préflight avec PDF.js** — les flux JavaScript, XMP et XFA réutilisent le décodeur borné pour Flate, LZW, ASCII85, ASCIIHex, RunLength, leurs chaînes et prédicteurs, au lieu de rejeter les filtres standards non-Flate. Leurs sorties intermédiaires partagent un plafond documentaire de 32 MiB en plus des limites par flux. Pour chaque widget, le budget de fusion compte également les ressources du flux `/AP` sélectionné entre les ressources héritées du champ et celles de l’AcroForm.
- **Tolérance syntaxique PDF** — les entiers non négatifs peuvent porter un signe `+` explicite et les extensions `DecodeParms` peuvent contenir des noms ou tableaux homonymes des paramètres standards sans être interprétées comme des clés directes.

## Inventaire exhaustif des opportunités

Les listes suivantes couvrent le périmètre pertinent pour Tools Central. Elles servent à alimenter la recherche et le tri, pas à lancer une fabrication en série.

### PDF et documents

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Fusionner des PDF | réordonner, prévisualiser et fusionner sans upload | P0 | M |
| Diviser un PDF | pages, plages, signets ou taille cible | P0 | M |
| Extraire des pages PDF | aperçu, sélection discontinue et ZIP | P0 | M |
| Supprimer des pages PDF | manipulation visuelle réversible avant export | P0 | M |
| Réorganiser les pages PDF | vignettes, rotation et lots | P0 | M |
| Faire pivoter un PDF | rotation différente par page avec aperçu | P1 | S |
| Recadrer un PDF | zone commune ou par page, marges imprimables | P1 | M |
| Ajouter des numéros de page | position, format, plage et aperçu | P1 | M |
| Ajouter un filigrane PDF | texte/image, opacité, répétition et couches | P1 | M |
| Protéger un PDF par mot de passe | permissions expliquées, chiffrement et limites | P1 | M |
| Déverrouiller son propre PDF | retirer une protection avec mot de passe connu | P1 | M |
| Aplatir les formulaires PDF | conserver le rendu, rapport des champs supprimés | P0 | M |
| Remplir un formulaire PDF | liste des champs, validation et export local | P1 | L |
| Extraire les champs PDF en JSON | noms, types, valeurs, flags et coordonnées | P0 | M |
| Extraire les annotations PDF | type, auteur, page, zone et JSON/CSV | P0 | M |
| Extraire les pièces jointes PDF | inventaire, hash, taille et ZIP sûr | P0 | M |
| Extraire les images PDF | format d'origine si possible, page et dimensions | P0 | L |
| Extraire le texte PDF | pages, ordre de lecture et TXT/JSON | P0 | M |
| Extraire les tableaux PDF | sélection de zone, CSV et contrôle visuel | P1 | L |
| Extraire les liens PDF | interne/externe, page, texte et statut optionnel | P0 | M |
| Extraire le plan/signets PDF | arbre, destinations et JSON | P1 | M |
| Extraire les polices PDF | nom, sous-ensemble, encodage et intégration | P1 | M |
| Inspecter les signatures PDF | présence, certificat, couverture et avertissements | P0 | L |
| Détecter un PDF scanné | ratio image/texte par page et recommandation OCR | P0 | M |
| Vérifier PDF/A | profil, erreurs et rapport sans fausse certification | P1 | L |
| Vérifier l'accessibilité PDF | balises, ordre, alt, langue et checklist humaine | P1 | L |
| Vérifier les polices intégrées | pages concernées, sous-ensembles et risque d'impression | P1 | M |
| Vérifier la linéarisation PDF | diagnostic Fast Web View et taille | P1 | S |
| Inspecter la table xref | objets, offsets, révisions et anomalies | P1 | M |
| Inspecter les objets PDF | filtre, taille, génération et export JSON | P1 | L |
| Inspecter les opérateurs de contenu | flux par page avec catégories et filtres | P2 | L |
| Supprimer métadonnées PDF | inventaire puis nettoyage contrôlé | P0 | M |
| Sanitiser un PDF | retirer JS, actions, pièces jointes et liens selon profil | P0 | L |
| Détecter le JavaScript PDF | actions, objets et niveau de risque expliqué | P0 | M |
| Comparer les métadonnées de deux PDF | provenance et changements de chaîne documentaire | P1 | M |
| Calculer le poids par page PDF | images, polices, contenus et pistes d'optimisation | P1 | L |
| Générer une table des matières PDF | titres détectés, édition manuelle et signets | P2 | L |
| Convertir PDF en PDF images | aplatir visuellement avec alerte accessibilité/recherche | P2 | L |
| Créer un PDF depuis du texte/Markdown | styles, marges, en-têtes, aperçu et confidentialité | P1 | L |
| Imposer un PDF pour livret | ordre recto-verso, fond perdu et aperçu feuilles | P1 | L |

### Office, OOXML, OpenDocument et archives bureautiques

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Nettoyer les métadonnées DOCX | auteurs, révisions, commentaires et propriétés cachées | P0 | M |
| Nettoyer les métadonnées XLSX | auteur, connexions, noms et propriétés | P0 | M |
| Nettoyer les métadonnées PPTX | auteurs, notes, commentaires et propriétés | P0 | M |
| Inspecteur de confidentialité Office | rapport unifié DOCX/XLSX/PPTX avant partage | P0 | L |
| Inspecter la structure DOCX | parties OOXML, relations et tailles | P1 | M |
| Inspecter la structure XLSX | feuilles, styles, shared strings et relations | P1 | M |
| Inspecter la structure PPTX | diapositives, masters, médias et relations | P1 | M |
| Extraire les images d'un DOCX | ordre, dimensions, hash et ZIP | P1 | M |
| Extraire les images d'un PPTX | diapositive source, dimensions et ZIP | P1 | M |
| Extraire les médias d'un XLSX | feuilles/dessins, dimensions et ZIP | P2 | M |
| Extraire le texte d'un DOCX | titres, paragraphes, tableaux et notes | P1 | M |
| Extraire les notes d'un PPTX | par diapositive en Markdown/CSV | P1 | M |
| Extraire les commentaires Office | auteur, position, date et export | P1 | M |
| Comparer deux DOCX | texte, styles, commentaires et rapport | P1 | L |
| Comparer deux XLSX | cellules, formules, feuilles et formats | P1 | L |
| Comparer deux PPTX | texte, ordre, médias et rendu | P2 | L |
| Détecter les liens externes Excel | connexions, formules, relations et risque | P0 | M |
| Détecter les macros Office | présence, hash et avertissement sans exécution | P0 | M |
| Inspecter les polices d'un document Office | utilisées, intégrées, substitution probable | P1 | M |
| Lister les feuilles masquées Excel | visibilité, veryHidden, protection et export | P1 | S |
| Lister les noms définis Excel | formule, portée et références cassées | P1 | M |
| Auditer les formules Excel | erreurs, références externes, volatiles et incohérences | P1 | L |
| CSV vers XLSX | types contrôlés, encodage, colonnes et aperçu | P1 | M |
| XLSX vers CSV | choix de feuille, délimiteur, encodage et dates | P0 | M |
| DOCX vers Markdown | titres, listes, liens, tableaux et images | P1 | L |
| Markdown vers DOCX | styles simples, sommaire et métadonnées | P2 | L |
| Inspecter un fichier ODT | manifeste, médias, styles et métadonnées | P2 | M |
| Inspecter un fichier ODS | feuilles, formules, styles et métadonnées | P2 | M |
| Réparer un ZIP Office | diagnostic des parties/relations manquantes | P2 | L |
| Anonymiser les commentaires Office | remplacement cohérent des auteurs et initiales | P1 | M |

### Développeur, données et Web

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Formater/minifier JSON | validation, tri optionnel et gros fichiers | P0 | S |
| JSON vers CSV | aplatissement configurable et aperçu des pertes | P0 | M |
| CSV vers JSON | types, en-têtes, délimiteur et erreurs par ligne | P0 | M |
| JSON vers YAML | ancres/alias explicités et contrôle des types | P1 | M |
| YAML vers JSON | multi-documents, erreurs ligne/colonne et sécurité | P1 | M |
| XML vers JSON | attributs, espaces de noms et stratégie de tableaux | P1 | M |
| JSON vers XML | racine, attributs, namespaces et aperçu | P1 | M |
| Formater/minifier XML | validation, indentation et gros documents | P1 | M |
| Formater/minifier SQL | dialecte, casse, paramètres et confidentialité | P1 | M |
| Formater/minifier HTML | aperçu diff et préservation sûre | P1 | M |
| Formater/minifier CSS | source map optionnelle et statistiques | P1 | M |
| Formater JavaScript | parser local, choix de style et erreurs précises | P1 | M |
| Diff JSON structurel | clés ignorées, tableaux associés et patch | P0 | M |
| Diff YAML | comparaison sémantique après résolution contrôlée | P1 | M |
| Diff CSV | clé primaire, cellules changées et export | P0 | M |
| JSONPath tester | résultat, chemins, types et exemples | P0 | S |
| XPath tester | namespaces, nœuds trouvés et explication | P1 | M |
| Tester une regex | corpus multi-lignes, groupes, remplacement et drapeaux | P0 | M |
| Échapper/déséchapper une regex | langage cible et diff | P1 | S |
| Encoder/décoder Base64 | texte/fichier, URL-safe et détection encodage | P0 | S |
| Encoder/décoder URL | composant, query complète et analyse des paramètres | P0 | S |
| Encoder/décoder HTML entities | modes nommés/numériques et aperçu sûr | P1 | S |
| Convertir Unicode | code points, UTF-8/16, graphemes et caractères invisibles | P0 | M |
| Inspecter les caractères invisibles | bidi, zero-width, espaces et risque homoglyphes | P0 | M |
| Générer UUID/ULID | lots, versions, tri et validation locale | P1 | S |
| Générer un hash de fichier | SHA-256/512, comparaison et gros fichiers | P0 | M |
| HMAC local | algorithme, formats d'entrée et vecteurs de test | P1 | M |
| Convertir timestamp Unix | fuseau, précision, ISO et dates relatives | P0 | S |
| Cron explainer | prochaines exécutions, fuseau et variantes Unix | P0 | M |
| Comparer des versions SemVer | plage, préversions et explication | P1 | S |
| Analyser une URL | origine, chemin, query, fragment, punycode et normalisation | P0 | S |
| Builder d'URL avec query params | listes, doublons, encodage et tri | P1 | S |
| Parser User-Agent | navigateur/appareil avec avertissement de fiabilité | P2 | M |
| Générer un cURL | méthode, headers, body, secrets masqués et variantes shell | P1 | M |
| Convertir cURL en fetch | code TypeScript/JS, body et gestion erreurs | P1 | M |
| Convertir cURL en Python | requests/httpx avec secrets masqués | P2 | M |
| Visualiser des headers HTTP collés | sécurité, cache, CORS et valeurs multiples | P0 | M |
| Analyseur CSP | directives, faiblesses et politique proposée sans garantie | P0 | L |
| Constructeur CORS | scénarios expliqués et réponse serveur attendue | P1 | M |
| Inspecteur de certificat collé | dates, SAN, chaîne et empreintes, hors ligne | P1 | M |
| Décoder JWT | header/payload, dates, claims et alertes | P0 | S |
| Vérifier une signature JWT | algorithmes autorisés, clé locale et cas de test | P0 | M |
| Générer des types TypeScript depuis JSON | unions, optionalité et tableaux hétérogènes | P0 | M |
| Générer JSON Schema depuis JSON | inférence documentée et fusion d'échantillons | P1 | M |
| Valider JSON Schema | chemin d'erreur, brouillon et exemples | P0 | M |
| OpenAPI lint local | structure, références, opérations et rapport | P1 | L |
| OpenAPI vers exemples JSON | requêtes/réponses choisies et données fictives | P1 | L |
| Visualiser GraphQL SDL | types, champs, cycles et recherche | P2 | L |
| Convertir tableau Markdown/CSV/HTML | aperçu, alignement et échappement | P0 | M |
| Générer un `.gitignore` | assemblage de modèles, déduplication et aperçu | P1 | S |
| Comparer deux listes | communs, uniquement A/B, doublons et ordre | P0 | S |

### SEO et qualité Web

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Prévisualiser un snippet Google | largeur pixel et comparaison mobile/desktop | P0 | S |
| Tester un title SEO | unicité importée, longueur pixel et intention | P0 | S |
| Tester une meta description | longueur, troncature et variantes manuelles | P0 | S |
| Générer un robots.txt | règles par robot et validation des conflits | P0 | M |
| Tester un robots.txt | simulation URL/user-agent et directives reconnues | P0 | M |
| Générer un sitemap XML | limites, découpage, images et hreflang | P0 | M |
| Valider un sitemap XML | schéma, doublons, canonicals et taille | P0 | M |
| Générer des hreflang | matrice de locales, x-default et sorties HTML/XML | P0 | M |
| Vérifier la réciprocité hreflang | matrice d'erreurs depuis données collées/importées | P0 | M |
| Générer des balises canonical | normalisation et scénarios pagination/filtres | P1 | S |
| Auditer un head HTML collé | title, metas, canonical, robots, alternates et OG | P0 | M |
| Prévisualiser Open Graph | Facebook/LinkedIn générique, image et texte | P1 | M |
| Prévisualiser une Twitter Card | type, image, title et description | P1 | M |
| Générer Schema.org SoftwareApplication | JSON-LD conforme au contenu visible | P0 | M |
| Générer FAQPage JSON-LD | seulement pour FAQ visible et sans promesse d'affichage | P1 | S |
| Valider JSON-LD | syntaxe, graphe, types et propriétés | P0 | M |
| Extraire les données structurées | JSON-LD/microdata/RDFa et graphe | P0 | M |
| Générer un fil d'Ariane JSON-LD | URL, position et aperçu | P1 | S |
| Inspecter une redirection copiée | chaîne, boucles et perte de paramètres | P1 | M |
| Normaliser une liste d'URLs | casse hôte, slash, paramètres et doublons | P0 | S |
| Grouper des mots-clés importés | tokens/intention, révision manuelle et export | P2 | L |
| Détecter cannibalisation dans un export | requêtes/pages, chevauchement et opportunités | P1 | M |
| Analyser un export Search Console | CTR, position, quick wins et segments | P1 | L |
| Générer des UTM | conventions, validation et bibliothèque locale | P0 | S |
| Nettoyer des UTM | retirer tracking d'une liste d'URLs | P1 | S |
| Vérifier une pagination HTML collée | canonical, liens et indexabilité | P2 | M |
| Analyser des logs de crawl importés | bots, statuts, fréquence, gaspillage et export | P1 | L |
| Calculer un budget de crawl indicatif | scénarios et hypothèses explicites | P2 | M |
| Vérifier une liste de liens internes | profondeur à partir d'un export, ancres et orphelins | P1 | L |
| Simuler largeur d'un contenu mobile | viewport, débordements et captures locales | P2 | L |

### Texte, rédaction et langue

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Compter mots, caractères et phrases | espaces, graphèmes, sélection et statistiques | P0 | S |
| Compter le temps de lecture | vitesse configurable et lecture à voix haute | P1 | S |
| Mesurer la lisibilité | métriques adaptées à la langue et phrases à revoir | P0 | M |
| Changer la casse | camel, snake, kebab, title et acronymes | P0 | S |
| Nettoyer espaces et retours | aperçu diff et règles sélectionnables | P0 | S |
| Nettoyer un texte extrait de PDF | césures, ligatures, colonnes et paragraphes | P0 | M |
| Supprimer lignes dupliquées | sensible à la casse, espaces et ordre | P0 | S |
| Trier des lignes | naturel, numérique, locale et stabilité | P0 | S |
| Mélanger des lignes | graine reproductible et confidentialité | P2 | S |
| Comparer deux textes | ligne, mot, caractère et espaces ignorés | P0 | M |
| Extraire e-mails d'un texte | déduplication, domaines et export local | P1 | S |
| Extraire URLs d'un texte | normalisation, domaines et export | P1 | S |
| Extraire hashtags/mentions | plateformes, fréquence et déduplication | P2 | S |
| Extraire nombres et unités | contexte, séparateurs locaux et CSV | P1 | M |
| Extraire dates | formats ambigus signalés et normalisation | P1 | M |
| Générer une table des matières Markdown | niveaux, ancres et compatibilité | P1 | S |
| Markdown vers HTML | mode sûr, aperçu et sanitation | P0 | M |
| HTML vers Markdown | tableaux, liens, images et diff | P0 | M |
| Texte vers slug | translittération, collisions et lots | P0 | S |
| Slug vers titre | mots techniques, acronymes et édition | P2 | S |
| Convertir guillemets typographiques | locale, apostrophes et diff | P1 | S |
| Normaliser ponctuation française | espaces insécables, guillemets et diff | P1 | M |
| Détecter caractères confusables | homoglyphes, scripts mélangés et sécurité | P1 | M |
| Convertir Unicode/ASCII | translittération avec pertes affichées | P1 | M |
| Segmenter un texte en phrases | langue, abréviations et export JSON | P2 | M |
| Générer lorem ipsum structuré | mots/phrases/listes sans pages SEO générées | P2 | S |
| Analyser fréquence des mots | stopwords par langue, n-grams et export | P1 | M |
| Détecter répétitions proches | fenêtre réglable et surlignage | P1 | M |
| Vérifier longueur de résumé | contraintes configurables, sans génération | P2 | S |
| Convertir sous-titres SRT/VTT | timestamps, encodage et validation | P1 | M |
| Décaler des sous-titres | offset, facteur FPS et aperçu | P1 | M |

### Images, SVG et médias

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Compresser une image | comparaison visuelle, qualité/taille et lot | P0 | L |
| Convertir PNG/JPEG/WebP/AVIF | support détecté, transparence et métadonnées | P0 | M |
| Redimensionner des images en lot | modes cover/contain, dimensions et ZIP | P0 | M |
| Recadrer une image | ratios sociaux, coordonnées et aperçu | P0 | M |
| Supprimer métadonnées EXIF | rapport avant/après, GPS mis en évidence | P0 | M |
| Lire les métadonnées EXIF | dates, appareil, GPS avec carte non distante optionnelle | P1 | M |
| Corriger orientation EXIF | rendu réel puis suppression du tag | P1 | M |
| Convertir HEIC localement | qualité, orientation et support explicite | P1 | L |
| Créer un favicon | tailles, manifest, aperçu clair/sombre et ZIP | P0 | M |
| Générer une image Open Graph | zones sûres, export 1200×630 et templates sobres | P1 | M |
| Générer des icônes PWA | manifest, masques, tailles et ZIP | P1 | M |
| Optimiser un SVG | options sûres, diff DOM et taille | P0 | M |
| Minifier/formater SVG | preview, sanitation et préservation accessibilité | P0 | M |
| Convertir SVG en PNG | résolution, fond et échelle | P0 | M |
| Inspecter un SVG | structure, scripts/liens, viewBox et accessibilité | P0 | M |
| Nettoyer un SVG dangereux | scripts, handlers, URLs externes et rapport | P0 | L |
| Générer un SVG sprite | symbol IDs, aperçu et snippet HTML | P1 | M |
| Extraire palette de couleurs | fréquence, clustering et formats CSS | P1 | M |
| Vérifier contraste WCAG | texte normal/grand, APCA informatif et suggestions | P0 | S |
| Simuler daltonisme | plusieurs déficiences et comparaison côte à côte | P1 | M |
| Générer un placeholder blur | BlurHash/LQIP, taille et snippets | P1 | M |
| Convertir image en Data URL | estimation de poids HTML et avertissement | P1 | S |
| Décoder une Data URL | type, taille, aperçu et téléchargement | P1 | S |
| Créer une planche contact | grille, légendes et PDF/image | P2 | M |
| Comparer deux images | slider, différence pixel et métriques | P1 | M |
| Générer un QR code | correction, marge, SVG/PNG et validation du contenu | P0 | S |
| Lire un QR code local | image/caméra consentie, résultat sûr et copie | P1 | M |
| Générer un code-barres | formats, contrôles et SVG accessible | P1 | M |
| Inspecter dimensions vidéo | conteneur, codecs, débit et durée sans upload | P2 | L |
| Extraire une image d'une vidéo | timestamp, format et qualité | P2 | L |

### Mathématiques, statistiques et éducation

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Calculer un pourcentage | part/total, étapes et arrondis | P0 | S |
| Variation en pourcentage | valeur initiale/finale, signe et explication | P0 | S |
| Pourcentage inverse | retrouver le prix avant remise/taxe | P0 | S |
| Pourcentages successifs | coefficient global et erreur de l'addition naïve | P0 | S |
| Points de pourcentage | différence absolue vs variation relative | P1 | S |
| Règle de trois | étapes, unités et contrôle de cohérence | P0 | S |
| Proportion inverse | détection du sens et tableau | P0 | S |
| Simplifier une fraction | PGCD, signe et étapes | P0 | S |
| Comparer des fractions | dénominateur commun, décimal et représentation | P0 | M |
| Calculer avec des fractions | opérations, étapes et forme mixte | P0 | M |
| Convertir fraction/décimal/pourcentage | périodiques et précision expliquée | P0 | M |
| Générer exercices de fractions | niveaux, corrigé, graine et impression | P0 | M |
| Arrondir un nombre | modes, décimales/significatifs et explication | P0 | S |
| Chiffres significatifs | règles scientifiques et incertitude | P1 | M |
| Moyenne/médiane/mode | données collées, nettoyage et explications | P0 | M |
| Étendue d’une série | minimum, maximum et interprétation de max − min | P1 | S |
| Variance/écart-type | population/échantillon et étapes | P0 | M |
| Quartiles/IQR | convention choisie, boxplot et valeurs aberrantes | P0 | M |
| Percentiles | méthodes d'interpolation expliquées | P1 | M |
| Moyenne pondérée | poids normalisés et tableau | P0 | S |
| Corrélation | Pearson/Spearman, nuage et avertissement causalité | P1 | M |
| Régression linéaire | équation, résidus, R² et limites | P1 | M |
| Taille d'échantillon | proportion/moyenne, confiance et hypothèses | P0 | M |
| Marge d'erreur | population finie et pédagogie | P1 | M |
| Intervalle de confiance | méthodes appropriées et conditions | P1 | M |
| Loi normale | z-score, aires et graphique | P1 | M |
| Combinaisons/permutations | répétition, ordre et étapes | P1 | M |
| Probabilité binomiale | exacte/cumulée, espérance et graphique | P1 | M |
| PGCD/PPCM | plusieurs entiers et décomposition | P0 | S |
| Nombres premiers | test, factorisation limitée et étapes | P1 | M |
| Résoudre équation du premier degré | domaine, étapes et vérification | P0 | M |
| Résoudre système 2×2 | substitution/élimination et cas dégénérés | P1 | M |
| Calculatrice de pente | points, unités et équation de droite | P1 | S |
| Distance entre deux points | 2D/3D et étapes | P1 | S |
| Aires et volumes | unités, schéma et formules | P0 | M |
| Théorème de Pythagore | côté manquant, étapes et validité du triangle | P0 | S |
| Convertisseur d'unités | dimensions contrôlées et précision | P0 | M |
| Notation scientifique | conversion, opérations et chiffres significatifs | P1 | M |
| Générateur de graphiques de fonctions | domaine, export SVG et accessibilité | P2 | L |

### Business, finance personnelle et temps

Ces outils peuvent relever du YMYL. Ils doivent afficher hypothèses, date des barèmes et limites, sourcer les données variables et éviter toute recommandation personnalisée.

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Calculer HT/TTC/TVA | taux personnalisable et détail par ligne | P1 | S |
| Calculer une remise | remises successives, économie et prix final | P0 | S |
| Calculer une marge | marge, marque, coût, prix et confusion expliquée | P0 | S |
| Seuil de rentabilité | coûts fixes/variables, scénarios et graphique | P1 | M |
| Prix unitaire | lots, unités différentes et classement | P0 | S |
| Répartir une facture | parts, pourboire, arrondis et reste | P1 | M |
| Intérêts composés | versements, fréquence, inflation et tableau | P1 | M |
| Comparer deux prêts | TAEG saisi, coût total et échéancier indicatif | P2 | L |
| Amortissement de prêt | échéancier exportable et hypothèses | P2 | M |
| Convertir salaire brut/net | uniquement avec barème pays/date sourcé | P2 | L |
| Calculer prix freelance | charges saisies, temps non facturé et scénarios | P1 | M |
| Calculer coût d'une réunion | participants, durées et devise saisie | P1 | S |
| ROI/ROAS | hypothèses, différence des métriques et scénarios | P1 | S |
| LTV/CAC | modèles simples, sensibilité et avertissements | P2 | M |
| Taux de conversion | intervalle de confiance et comparaison | P1 | M |
| Calculer churn/rétention | cohortes importées et définitions | P1 | M |
| Dimensionner stock de sécurité | demande/délai saisis et hypothèses | P2 | M |
| Convertir fuseaux horaires | dates, DST et liens partageables sans données privées | P0 | M |
| Calculer durée entre dates | jours ouvrés configurables et inclusivité | P0 | M |
| Ajouter des jours ouvrés | week-ends et jours fériés fournis/sourcés | P1 | M |
| Générer planning récurrent | RRULE lisible, aperçu des occurrences | P1 | M |
| Convertir heures décimales | heures/minutes, lots et feuille de temps | P1 | S |
| Calculer un prorata | période exacte, conventions et détail | P1 | S |
| Générer une facture simple locale | PDF sans stockage, numérotation manuelle, mentions configurables | P2 | L |
| Vérifier IBAN | structure/checksum uniquement, sans confirmer le compte | P1 | S |
| Vérifier numéro de TVA | format/checksum local, statut distant séparé | P2 | M |

### Confidentialité et sécurité pratique

| Outil | Intention et valeur spécifique | Priorité | Complexité |
|---|---|---|---|
| Générateur de mot de passe | entropie, passphrase, génération locale et exclusions | P0 | S |
| Estimateur de robustesse | motifs, fuites non consultées par défaut et pédagogie | P1 | M |
| Générateur de passphrase | liste locale, entropie et séparateurs | P0 | S |
| Hash de texte/fichier | SHA-256/512 et comparaison constante | P0 | M |
| Vérifier deux hashes | normalisation, algorithme et résultat clair | P1 | S |
| Inspecter métadonnées de fichier | type, dates internes et champs sensibles | P0 | L |
| Nettoyer métadonnées de fichier | formats supportés et rapport avant/après | P0 | L |
| Détecter données personnelles dans un texte | règles locales, faux positifs et aucune conservation | P1 | L |
| Masquer des données dans un texte | patrons, aperçu diff et substitutions cohérentes | P1 | M |
| Inspecter permissions d'une URL | paramètres sensibles, credentials et tracking | P1 | S |
| Décoder une URL suspecte | couches d'encodage, punycode et caractères confusables | P0 | M |
| Inspecter une adresse e-mail | syntaxe et domaine uniquement, sans promettre la délivrabilité | P1 | S |
| Générer une clé aléatoire | octets, formats, CSPRNG et copie sûre | P1 | S |
| Chiffrer/déchiffrer un texte local | Web Crypto, KDF documentée et avertissement de sauvegarde | P2 | L |
| Chiffrer un fichier local | streaming, format versionné et tests interopérables | P2 | L |
| Inspecter CSP | directives, sources larges et recommandations | P0 | L |
| Vérifier Subresource Integrity | hash depuis fichier local et snippet | P1 | M |
| Générer un en-tête Permissions-Policy | fonctionnalités, origines et aperçu | P1 | M |
| Analyser des en-têtes de sécurité collés | CSP, HSTS, COOP/COEP, cookies et limites | P0 | M |
| Générer une politique de mots de passe | checklist contextualisée, pas de conformité garantie | P2 | S |

## Parcours et maillage interne utiles

Le maillage doit suivre le travail de l'utilisateur :

- **Préparer un PDF à envoyer** : inspecter la confidentialité → supprimer les métadonnées → compresser → vérifier visuellement ;
- **Récupérer des données** : PDF/tableau → CSV → nettoyer → valider → convertir en JSON ;
- **Déboguer une API** : formater JSON → valider schema → diff → générer des types → convertir cURL ;
- **Publier une page** : snippet → head HTML → données structurées → hreflang → sitemap/robots ;
- **Préparer une image Web** : enlever EXIF → redimensionner → convertir AVIF/WebP → vérifier poids/contraste ;
- **Apprendre un concept** : cours court → exemple guidé → calculateur → exercices imprimables avec corrigé.

## Format éditorial d'une page outil

Chaque page indexable doit répondre directement à l'intention :

1. H1 précis et promesse vérifiable ;
2. outil utilisable immédiatement ;
3. indication « traitement local » seulement si elle est vraie ;
4. procédure courte avec un exemple réaliste ;
5. formats, limites de taille, précision et compatibilité ;
6. explication du résultat et erreurs fréquentes ;
7. confidentialité et sécurité propres au format ;
8. FAQ issue de questions réelles, pas de variations artificielles ;
9. liens vers deux à quatre étapes logiques du même parcours ;
10. date de revue lorsque le contenu dépend d'une norme ou d'un barème.

## Mesure et décision après publication

Pour chaque outil, enregistrer la date de mise en ligne, le cluster, l'intention cible et les changements majeurs. Après une période suffisante d'indexation, suivre : impressions et clics non brandés, CTR par position, pages réellement indexées, engagement avec l'outil, taux de résultat/export, erreurs, performance terrain et liens acquis.

Améliorer d'abord une page qui reçoit des impressions mais répond mal. Fusionner ou désindexer une page qui duplique une intention et n'apporte pas de valeur. Ne pas multiplier les slugs pour attaquer les synonymes.

## Références officielles

- Google, créer du contenu utile et fiable : <https://developers.google.com/search/docs/fundamentals/creating-helpful-content>
- Google, règles antispam : <https://developers.google.com/search/docs/essentials/spam-policies>
- Google, Core Web Vitals : <https://developers.google.com/search/docs/appearance/core-web-vitals>
- Google, contrôle des snippets : <https://developers.google.com/search/docs/appearance/snippet>
- Google, liens de titre : <https://developers.google.com/search/docs/appearance/title-link>
- Google, données structurées `SoftwareApplication` : <https://developers.google.com/search/docs/appearance/structured-data/software-app>
- Google, sitemaps : <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
- Google, versions localisées : <https://developers.google.com/search/docs/specialty/international/localized-versions>
