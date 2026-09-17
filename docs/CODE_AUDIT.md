# Audit technique de Tools Central

Date de référence : 17 septembre 2026
Périmètre : application Angular, architecture, dépendances, sécurité, tests, i18n, SEO technique, performance, catalogue et chaîne de déploiement.

## Conclusion

Le socle bloquant a été corrigé. Le projet compile sous Angular 22, n’embarque plus aucun élément de l’écosystème Prime, ne présente plus de vulnérabilité npm connue, prérend réellement toutes ses pages publiques, et dispose d’une CI qui sépare validation et production. La branche `master` est protégée par une PR et le statut obligatoire `Verify` ; le déploiement ne peut commencer qu’après le merge et après une seconde validation complète. Cette chaîne a été exécutée avec succès jusqu’au VPS et contrôlée sur les URL publiques après le merge du nettoyeur de métadonnées OOXML.

Le dépôt reste un produit en migration, pas une Clean Architecture achevée. Treize features servent désormais de références (`percentage-of-number`, le moteur de nettoyage PDF, `serp-snippet-preview`, `robots-txt-builder`, `sitemap-xml-builder`, `hreflang-checker`, `structured-data-extractor`, `html-head-auditor`, `software-application-schema-builder`, `pdf-to-images`, `images-to-pdf`, `ooxml-metadata-cleaner` et `pdf-privacy-inspector`), mais l’essentiel du code historique reste organisé par composants. Les prochaines PR doivent donc réduire la dette par tranche fonctionnelle, sans refonte globale. La priorité produit/SEO n’est pas de publier les 106 outils encore indisponibles : elle est d’améliorer les 70 outils réels, faire relire les traductions et livrer les nouvelles intentions une par une.

## Mesures vérifiées après corrections

| Indicateur | Avant | État vérifié |
|---|---:|---:|
| Angular | 21.0.x | 22.1.6 (`CLI/build/SSR` 22.1.8) |
| TypeScript | génération précédente | 6.0.3, version exigée par Angular 22.1 |
| Écosystème Prime | PrimeNG, thème et icônes | 0 dépendance et 0 usage source |
| Bundle initial de production | 656,90 kB lors du premier build corrigé | 658,81 kB brut, 166,16 kB transféré estimé ; PDF.js et les moteurs documentaires restent dans des chunks lazy (Worker d’inspection PDF : 1,07 MB brut, 301,13 kB transféré) |
| Vulnérabilités npm | 58, dont 5 critiques | 0 |
| Tests unitaires | suite non compilable | 140 fichiers, 568 tests verts sous Vitest, plus 3 tests Node du Worker PDF.js généré |
| Couverture | aucun seuil | 56,14 % statements, 46,62 % branches, 52,94 % fonctions, 60,12 % lignes |
| E2E | aucun | 15 parcours Playwright verts, dont un scénario PDF de confidentialité réel |
| Routes statiques | 2 | 2 465 pages prérendues ; 2 406 URL sont indexables et 145 variantes d’outils non relues sont omises des locales secondaires |
| Catalogue | incohérences possibles | 4 catégories, 18 groupes, 176 outils, 70 disponibles en français et 65 dans les locales secondaires |
| Locales | 30 configurées | 30 compilées et contrôlées |
| Traductions secondaires | marqueurs incomplets non bloqués | 184 585 segments, 0 `TODO`, 0 warning technique |
| Dette éditoriale source | 96 `TODO` | 0 `TODO` |
| Inventaire SEO | absent | 297 opportunités + shortlist prioritaire de 30 |

Dernière mesure Playwright locale en configuration CI sur l’accueil mobile : LCP 2 200 ms, CLS 0,0043, `DOMContentLoaded` 437,1 ms et interaction thème 67,0 ms. Ce sont des garde-fous de laboratoire, variables selon la machine, pas des Core Web Vitals terrain.

## Travaux réalisés

### Dépendances et compilation

- Migration Angular 21 → 22 avec Node 24 en CI et moteurs Node explicites.
- Passage à TypeScript strict et Angular templates stricts.
- Suppression de `primeng`, `@primeng/themes`, `primeicons`, de leur police et de toutes les classes `pi`; remplacement par les primitives internes et `tc-icon`.
- Suppression d’Express SSR et des configurations/fichiers morts : la cible réelle est une sortie statique Nginx.
- Suppression des dépendances inutiles identifiées et mise à jour des versions compatibles, dont KaTeX et JSDOM.
- Audit npm complet et production à zéro vulnérabilité. TypeScript 7 et Vitest 5 sont volontairement refusés tant que les pairs d’Angular 22.1 exigent TypeScript `<6.1` et Vitest 4.
- Budgets de production réalistes : 900 kB en avertissement et 1,2 MB en erreur pour le bundle initial.

### Architecture et qualité du code

- Ajout d’ESLint 10, angular-eslint, règles TypeScript, RxJS et accessibilité des templates.
- Ajout d’un validateur de frontières : `domain`, `application`, `infrastructure`, `presentation`, imports inter-features publics et interdiction Prime.
- Migration pilote de `percentage-of-number` vers une tranche verticale avec domaine pur, cas d’usage, présentation `OnPush` et tests métier.
- Extraction du nettoyage PDF dans domaine/application/infrastructure avec Web Worker et transfert d’`ArrayBuffer`.
- Livraison de `serp-snippet-preview` dans une tranche verticale domaine/application/présentation, avec mesure typographique Unicode, validation d’URL, limites de travail, accessibilité et 19 tests ciblés.
- Livraison de `robots-txt-builder` dans une tranche verticale complète, avec génération, diagnostic borné, simulation RFC 9309, export local, accessibilité et 26 tests ciblés.
- Livraison de `sitemap-xml-builder` dans une tranche verticale complète, avec générateur `urlset`/index, parseur XML défensif, validation du protocole, Web Worker pour les gros fichiers, export local, accessibilité et 23 tests ciblés.
- Livraison de `hreflang-checker` dans une tranche verticale complète, avec sorties HTML/HTTP/sitemap, validation locale des codes et URL, contrôle des canonicals et de la réciprocité à partir des pages fournies, export, accessibilité et 25 tests ciblés.
- Livraison de `structured-data-extractor` dans une tranche verticale complète, avec extraction HTML inerte de JSON-LD, Microdata et RDFa, graphe normalisé, résolution locale des URL relatives, limites de complexité, export JSON, accessibilité et 22 tests ciblés.
- Livraison de `html-head-auditor` dans une tranche verticale complète, avec parseur textuel inerte compatible SSR, contrôles title/description/canonical/robots/viewport/charset/hreflang/Open Graph/Twitter, limites défensives, décodage HTML5, export JSON, accessibilité et 37 tests ciblés.
- Livraison de `software-application-schema-builder` dans une tranche verticale complète, avec génération JSON-LD locale, contrôles Schema.org et Google, notes réelles facultatives, décimaux exacts, sortie HTML sûre, diagnostics reliés aux champs, export, accessibilité et 28 tests ciblés.
- Livraison de `pdf-privacy-inspector` dans une tranche verticale complète, avec PDF.js isolé dans un Worker, parcours structurel et parcours d’actions inertes, itératifs, paresseux et bornés, tolérance locale des discriminateurs PDF malformés, suivi de `/Next` même après un discriminateur invalide et depuis les entrées de l’arbre de noms JavaScript, prise en charge des grands tableaux, plans limités à 10 000 signets et annotations découvertes par l’arbre de pages — même lorsqu’une feuille omet ou malforme `/Type` — limitées à 10 000 entrées avant leur normalisation, chaînes `/Next` et tableaux d’actions imbriqués limités à 256 avant les API récursives de PDF.js, références partagées, conteneurs `/AA` ambigus, actions `Named`, JavaScript d’annotation, actions multimédias localisées et fichiers associés `/AF` ou atteints depuis une action uniquement lorsqu’un flux `/EF` standard ou propre à une plateforme contient un fichier embarqué valide, sans boucle, faux positif, doublon structurel ni décompression inutile ; la taille d’une pièce jointe filtrée ou chiffrée est omise plutôt que confondue avec sa taille stockée. Les limites couvrent taille/pages/éléments/cibles, y compris les cibles chaînées des actions `/AA` facturées par annotation, 10 000 occurrences de champs — références répétées dans `/Fields` ou `/Kids` comprises, avec rejet des cycles —, mot de passe local, préflight brut limité à 1 000 000 de tokens syntaxiques hors flux, 256 niveaux de conteneurs, 100 000 objets indirects déclarés — classiques ou compressés selon `/N` — et un `/Size` xref cohérent avant `pdf-lib`, préflight décompressé limité à 1 MiB par script, 2 MiB pour XMP et 8 MiB par paquet XFA, et flux déchiffrables `/ObjStm` et `/XRef` limités à 32 MiB agrégés avant leur expansion par `pdf-lib`, ainsi qu’un plafond de 1 000 000 d’opérations estimées de fusion des ressources `/DR` héritées par occurrence, un plafond de 1 000 000 d’entrées de contenu optionnel `/OCGs` ou `/VE` matérialisées par annotation avant PDF.js et des plafonds agrégés de 32 MiB sur le JavaScript documentaire, l’expansion du script par entrée de l’arbre de noms JavaScript, les scripts facturés aux seules occurrences de formulaire qui les portent ou les héritent, les apparences par défaut héritées, les textes alternatifs et index de sélection des widgets, les noms qualifiés, valeurs, options, contenus et métadonnées répétées des signatures par occurrence de champ, le balayage des queues de signature, l’expansion des valeurs `/Info`, les cibles, textes — métadonnées FileSpec et contenus de parents matérialisés par chaque annotation compris —, géométries — y compris parents de popup, bordures, tirets, fins de ligne `/LE` et tableaux de couleur `/C`, `/IC`, `/MK /BC` et `/MK /BG` — et scripts répétés d’annotations, ainsi que les titres, destinations et couleurs `/C` du plan avant PDF.js. Les clés `/JS` et `/XFA` ne sont contrôlées que dans leurs conteneurs sémantiques afin de ne pas rejeter les extensions applicatives homonymes. Le parcours structurel n’inflate jamais le ciphertext : les Object Streams chiffrés restent intacts pendant que PDF.js classe le mot de passe, puis l’inspection s’arrête prudemment après une ouverture réussie puisqu’ils ne peuvent pas être préflightés avant déchiffrement ; les erreurs `password-required` et `incorrect-password` restent ainsi accessibles. Les autres sorties filtrées déchiffrées et normalisées par PDF.js partagent un budget documentaire itératif de 32 MiB et 1 000 000 de nœuds, avec déduplication par identité et protection contre les cycles. Toute limite structurelle non chiffrée arrête également le Worker avant `getDocument`, et aucun échec du parseur structurel n’est converti en inventaire vide. L’outil détecte la version PDF effective du catalogue et inspecte métadonnées standards/personnalisées y compris les valeurs `PDFName`, propriétés XMP scalaires itérables, scripts, actions, pièces jointes, liens, champs homonymes, formulaires, noms et métadonnées privées de signatures et chiffrement, sans exécuter ni exposer les contenus actifs. L’appartenance à l’arbre AcroForm et le type `/FT` sont propagés aux descendants : les actions additionnelles et signatures restent ainsi inventoriées et budgétées lorsque leur type est hérité. L’inventaire structurel complète celui de PDF.js lorsqu’il n’expose qu’une partie des signatures ; les JavaScript de champ et les signatures sans nom sont rapprochés par occurrence pour ne pas doubler les résultats normalisés. Un champ `/FT /Sig` structurellement valide reste inventorié même si `/SigFlags` est absent ou obsolète. Les unités de taille sont adaptées à la locale, les codes de rapport restent indépendants de la langue, et le rapport JSON est couvert par 142 tests ciblés.
- Durcissement complémentaire de `pdf-privacy-inspector` : résolution des longueurs indirectes classiques ou compressées par frontière, provenance externe et entrée autoritative de la chaîne xref active, classique, hybride `/XRefStm` ou `/XRef` décodable. Les entrées directes conservent leur offset ; les entrées compressées conservent le numéro d’Object Stream et l’index actifs. Lorsque la chaîne xref est entièrement décodée, les Object Streams sans objet compressé actif ou situés à un ancien offset sont écartés avant toute inflation et avant le budget final ; une autorité partielle conserve au contraire tous les flux. Les filtres textuels PDF standards Flate, LZW, ASCII85, ASCIIHex et RunLength, leurs abréviations, leurs chaînes et les prédicteurs Flate/LZW usuels sont décodés sous le même plafond agrégé. Un flux xref courant masque les révisions antérieures même lorsque son encodage n’est pas pris en charge, les valeurs classiques actives remplacent les anciennes valeurs compressées, les ambiguïtés sans autorité sont rejetées et les commentaires xref ou faux `startxref` sont ignorés lexicalement. Les déclarations mimées dans les payloads sont exclues, avec un plafond de 100 000 déclarations et 64 valeurs par référence ; le dernier `startxref` réel permet la détection du chiffrement avant toute inflation d’Object Stream et impose un arrêt prudent sur un flux encore non résolu. S’ajoutent la conservation des noms FileSpec propres à Unix, Mac et DOS, les budgets agrégés des configurations, instances et textes RichMedia partagés, le parcours itératif borné des arbres de rendition Screen et le rapprochement des JavaScript de page entre inventaires. Le total actualisé est de 142 tests ciblés.
- Le budget de décompression de l’inspecteur est débité à chaque étage d’une chaîne de filtres et après prédiction, même si un étage ultérieur réduit le résultat. Les filtres et `DecodeParms` indirects passent par leur offset xref autoritatif ; l’amorçage d’un flux xref exclut les corps de flux bornés, utilise une déclaration directe unique puis exige que le flux décodé confirme exactement cet offset. Le prédicteur TIFF couvre aussi les échantillons empaquetés sur 1, 2 ou 4 bits, et les signatures nommées après déchiffrement sont rapprochées de leur occurrence structurelle sans nom.
- Le même décodeur borné protège désormais les flux sémantiques JavaScript, XMP et XFA, y compris LZW, ASCII85, ASCIIHex, RunLength, les chaînes de filtres et leurs prédicteurs. Les sorties intermédiaires de tous ces flux partagent en plus un plafond documentaire de 32 MiB, sans remplacer leurs plafonds individuels. Le budget de fusion des ressources d’un widget inclut les ressources du flux d’apparence `/AP` réellement sélectionné, entre les ressources héritées du champ et celles de l’AcroForm, comme dans PDF.js.
- Après classification du mot de passe, un Worker PDF.js dédié à l’inspecteur refuse désormais toute croissance d’un `DecodeStream` ou sortie progressive de `DecompressionStream` au-delà de 32 MiB avant allocation agrégée. Chaque croissance et chaque chunk progressif débitent en plus un budget partagé par tous les flux du document dans ce Worker éphémère, avant leur conservation en mémoire. Les API susceptibles de matérialiser XMP, XFA ou JavaScript sont appelées séquentiellement puis débitées du budget documentaire applicatif ; le Worker PDF.js standard des autres outils reste inchangé. La préparation vérifie trois ancres uniques du bundle épinglé et fait échouer le build si une future mise à jour PDF.js invalide le garde-fou ; trois tests Node couvrent le plafond inter-flux, le débit avant rétention et l’échec fermé si les ancres changent. Le préflight et le lecteur borné des flux texte XMP, XFA et JavaScript acceptent aussi `/Filter null` comme l’absence de filtre, conformément à la sémantique PDF.
- Le parseur brut accepte le signe positif explicite des entiers PDF non négatifs et saute atomiquement la valeur complète des clés d’extension — nom, référence, tableau ou dictionnaire — afin de ne jamais relire un nom homonyme comme une clé critique de flux. Il ignore notamment les noms de paramètres présents dans les extensions `DecodeParms`, sans relâcher la validation des paramètres directs.
- Validation des fichiers PDF avant parsing : fichier non vide, MIME attendu et limite de 100 MB par défaut.
- Fin de vie explicite ajoutée aux subscriptions du shell et des services SEO.
- Suppression du doublon statistique « amplitude/range » pour éviter code dupliqué et cannibalisation SEO.

### Tests

- Migration Karma/Jasmine → runner Angular Vitest.
- Correction des fixtures, providers, API navigateur JSDOM et spies incompatibles.
- Seuils de couverture bloquants relevés à 41 % statements, 26 % branches, 40 % fonctions et 44 % lignes pour empêcher une baisse silencieuse.
- Tests métier du calcul de pourcentage, du cas d’usage et du moteur PDF.
- Remplacement des tests superficiels des composants PDF modifiés par des scénarios valides et rejetés.
- Playwright couvre accueil/langue/thème, calcul réel/réinitialisation, vraie 404/noindex, outils documentaires réels et budgets performance/mobile ; l’inspecteur est testé avec un PDF contenant JavaScript, pièce jointe, formulaire et URL.

### Internationalisation

- Synchronisation XLF corrigée : unités obsolètes, doublons d’ID, taux supérieur à 100 % et verrous Windows.
- Mode strict qui échoue sur segment absent, à revoir, obsolète ou contenant `TODO`.
- Traduction automatisée durcie : réponse structurée de cardinalité exacte, rejet des lots tronqués, taille maximale suffisante, filtrage par locale/préfixe et cache contournable pour une reprise ciblée.
- 6 365 unités sont présentes dans chacune des 30 locales ; les 29 cibles secondaires totalisent 184 585 segments techniquement complets.

La mention « 100 % » signifie uniquement « aucun segment technique manquant ». Les traductions automatiques ne sont pas certifiées par un locuteur natif et doivent conserver un statut éditorial distinct.

### SEO technique

- Catalogue unifié utilisé comme source de vérité pour navigation, routes, prérendu et sitemaps.
- Exclusion automatique des outils `available: false`.
- Publication par locale pilotée par `reviewedLocales` : variantes non relues masquées du catalogue, absentes des sitemaps et `hreflang`, puis rendues en `noindex,follow` en accès direct.
- 86 URL indexables en français, 80 dans chaque locale secondaire et 30 sitemaps, avec canonical, `hreflang` et `x-default` cohérents.
- Suppression du faux `lastmod` égal à la date de chaque build.
- Ajout d’une vraie page 404 localisée en `noindex,follow` avec statut HTTP 404 dans le serveur de test et Nginx, au lieu d’un retour `200` silencieux vers l’accueil.
- Validation du HTML produit : fichier de chaque route, langue, titre, description, canonical, 31 alternates, robots, liens internes et cohérence des sitemaps.
- Réécriture des cinq éditoriaux incomplets et suppression de tous les marqueurs source.
- Retrait de 254 drapeaux inutilisés et de leur duplication dans chaque sortie locale.
- `docs/SEO_TOOL_BACKLOG.md` contient une méthode de qualification, 30 priorités et 297 opportunités classées par cluster, valeur et complexité.
- Onze outils issus du backlog sont désormais livrés. Les six outils SEO initiaux sont publiables dans les 30 langues ; le générateur SoftwareApplication, PDF vers images, Images vers PDF, le nettoyeur de métadonnées OOXML et l’inspecteur de confidentialité PDF sont publiés en français, leurs variantes secondaires restant hors index jusqu’à une relecture linguistique explicite.

### CI, GitHub et déploiement

- Job `Verify` obligatoire sur PR et push : périmètre atomique, `npm ci`, audit, lint, i18n stricte, catalogue, architecture, couverture, build complet, SEO rendu et E2E.
- Job `Deploy production` séparé, uniquement sur push `master` et après succès de `Verify`.
- Actions tierces épinglées par SHA et Dependabot configuré pour npm et GitHub Actions.
- Artifact statique transféré entre jobs ; aucune reconstruction différente dans le job de production.
- Releases VPS versionnées, bascule atomique du lien `current`, healthcheck Nginx, contrôles de deux routes, rollback N-1 et smoke HTTP public.
- Protection de `master` appliquée et relue via l’API GitHub : PR requise, `Verify` requis et strict, administrateurs inclus, conversations résolues, historique linéaire, force-push/suppression interdits.
- Fusion squash uniquement, titre de PR repris dans l’historique, et suppression automatique de la branche source après merge.
- Environnement GitHub `production` créé avec une politique de déploiement limitée aux branches protégées.
- Déploiement post-merge prouvé jusqu’au commit `7828caa` : jobs `Verify` et `Deploy production` verts, artifact téléchargé, release VPS activée, conteneur sain et smoke HTTP public réussi. Dernière exécution vérifiée : <https://github.com/Ced59/tools-central/actions/runs/34917900091>.

Le dépôt n’a qu’un seul mainteneur. Les approbations obligatoires restent donc temporairement à zéro ; elles devront passer à une dès qu’un second reviewer peut approuver. Cette exception évite de rendre le dépôt impossible à fusionner et ne permet pas de contourner `Verify`.

## Risques et chantiers restants

### P0 — avant une croissance SEO importante

| Constat | Risque | Prochaine PR atomique |
|---|---|---|
| 29 locales traduites automatiquement sans preuve de revue native | contresens, confiance et qualité SEO variables | relire un cluster prioritaire par langue, tracer qui/quand/quoi et corriger avant extension |
| SSH utilise encore `VPS_PASSWORD` | secret plus exposé et droits potentiellement larges | clé dédiée au déploiement, compte limité, rotation du mot de passe |
| 106 outils sont indisponibles | tentation de créer des pages minces en masse | ne publier qu’un moteur réel avec tests, contenu propre et demande validée |

### P1 — migration progressive

| Dette mesurée | Effet | Traitement attendu |
|---|---|---|
| 75 tests résiduels nommés `should create` | protection comportementale faible | remplacer au fil des features par cas normal, limite, erreur et interaction |
| 82 composants en `ChangeDetectionStrategy.Eager` | travail de rendu évitable | passer à `OnPush` seulement avec tests de comportement |
| 127 occurrences textuelles de `any` | contrats faibles ou faux positifs à examiner | typer feature par feature, sans conversion mécanique aveugle |
| Architecture historique majoritaire hors `features/` | règles métier encore mêlées à l’UI | migrer un outil par PR en suivant les deux pilotes |
| Couverture globale encore basse | zones historiques non protégées | augmenter les seuils par paliers ; exiger une forte couverture du nouveau domaine |
| Parseurs PDF/ZIP encore exécutés dans certains composants | UI bloquée, pression mémoire | ports, limites, Workers et tests de fichiers hostiles |
| Aucune vérification axe-core/régression visuelle | défauts accessibilité/UI non détectés | petite suite automatisée, puis revue clavier et lecteur d’écran |
| Pas de données Web Vitals terrain | le test local ne reflète pas le 75e percentile réel | mesurer RUM/Search Console avant de resserrer les budgets |

### P2 — dette acceptée et à surveiller

- Angular replie `pt-BR` vers les données de locale `pt` et émet deux avertissements de build.
- JSZip, QRCode et `pako` via PDF-Lib restent CommonJS ; ils sont chargés dans des chunks fonctionnels mais provoquent des avertissements d’optimisation.
- Les Workers PDF.js restent paresseux : celui de l’inspecteur pèse 1,03 MB brut (292,20 kB transféré estimé) et ne charge son moteur de parsing qu’à l’usage ; mémoire et temps doivent rester surveillés sur de gros documents.
- L’image Open Graph générique mérite un visuel social dédié et testé.
- Les limites de taille/complexité ne sont pas encore uniformes pour chaque famille de fichiers.
- La télémétrie et la conformité vie privée nécessitent une revue dédiée avant toute extension de mesure.

## Marche à suivre

`AGENTS.md` est la règle opérationnelle. Chaque PR doit garder une seule intention et suivre :

```text
domain <- application <- presentation
              ^
              └── infrastructure branchée par ports/composition
```

Ordre recommandé : revue linguistique prioritaire, rotation SSH, puis migration d’un outil historique ou livraison d’une intention SEO validée à la fois. Les nouvelles opportunités doivent rester pilotées par la demande et être livrées une par une.

Contrôles locaux complets :

```bash
npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run i18n:check:strict
npm run catalog:validate
npm run architecture:validate
npm run test:coverage
npm run build:all && npm run seo:validate
npm run test:e2e
```

## Limites de l’audit

Le code, le build local, le HTML prérendu, la configuration GitHub et un déploiement complet sur le VPS ont été vérifiés. Le conteneur et les routes publiques française et anglaise ont répondu correctement après activation de la release. Le chemin de rollback N-1 existe, mais aucun incident artificiel n’a été provoqué en production pour l’exercer. Les métriques Search Console/Analytics et les Core Web Vitals terrain restent indisponibles ; aucun volume de recherche ni gain de trafic n’est donc promis.

## Références officielles

- Angular, compatibilité des versions : <https://angular.dev/reference/versions>
- Angular, calendrier de publication : <https://angular.dev/reference/releases>
- Angular, génération statique : <https://angular.dev/guide/prerendering>
- GitHub, protection des branches : <https://docs.github.com/en/rest/branches/branch-protection>
- Google, contenu utile : <https://developers.google.com/search/docs/fundamentals/creating-helpful-content>
- Google, règles antispam : <https://developers.google.com/search/docs/essentials/spam-policies>
- Google, Core Web Vitals : <https://developers.google.com/search/docs/appearance/core-web-vitals>
- Google, sites multilingues : <https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites>
- Google, liens de titre : <https://developers.google.com/search/docs/appearance/title-link>
- Google, regroupement canonical : <https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls>
- Google, directives robots : <https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag>
- Open Graph protocol : <https://ogp.me/>
- Protocole Sitemap officiel : <https://www.sitemaps.org/protocol.html>
- Google, créer et soumettre un sitemap : <https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap>
