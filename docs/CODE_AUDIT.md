# Audit technique de Tools Central

Date de référence : 15 septembre 2026
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
| Bundle initial de production | 656,90 kB lors du premier build corrigé | 658,82 kB brut, 166,20 kB transféré estimé ; PDF.js et les moteurs documentaires restent dans des chunks lazy |
| Vulnérabilités npm | 58, dont 5 critiques | 0 |
| Tests unitaires | suite non compilable | 139 fichiers, 458 tests verts sous Vitest |
| Couverture | aucun seuil | 50,10 % statements, 37,77 % branches, 49,77 % fonctions, 53,61 % lignes |
| E2E | aucun | 15 parcours Playwright verts, dont un scénario PDF de confidentialité réel |
| Routes statiques | 2 | 2 465 pages prérendues ; 2 406 URL sont indexables et 145 variantes d’outils non relues sont omises des locales secondaires |
| Catalogue | incohérences possibles | 4 catégories, 18 groupes, 176 outils, 70 disponibles en français et 65 dans les locales secondaires |
| Locales | 30 configurées | 30 compilées et contrôlées |
| Traductions secondaires | marqueurs incomplets non bloqués | 184 382 segments, 0 `TODO`, 0 warning technique |
| Dette éditoriale source | 96 `TODO` | 0 `TODO` |
| Inventaire SEO | absent | 297 opportunités + shortlist prioritaire de 30 |

Dernière mesure Playwright locale en configuration CI sur l’accueil mobile : LCP 2 160 ms, CLS 0,0043, `DOMContentLoaded` 250,9 ms et interaction thème 89,3 ms. Ce sont des garde-fous de laboratoire, variables selon la machine, pas des Core Web Vitals terrain.

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
- Livraison de `pdf-privacy-inspector` dans une tranche verticale complète, avec PDF.js isolé dans un Worker, lecture inerte et bornée des dictionnaires d’actions et de leur contexte, prise en charge des chaînes `/Next` sans doublon par destination, codes de rapport indépendants de la langue, limites de taille/pages/éléments, mot de passe local, inspection des métadonnées, scripts, actions, pièces jointes, liens, formulaires, signatures et chiffrement, sans exécuter ni exposer les contenus sensibles, avec rapport JSON et 35 tests ciblés.
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
- 6 358 unités sont présentes dans chacune des 30 locales ; les 29 cibles secondaires totalisent 184 382 segments techniquement complets.

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
- Les Workers PDF.js restent paresseux : celui de l’inspecteur pèse 440,75 kB brut et ne charge son moteur de parsing qu’à l’usage ; mémoire et temps doivent rester surveillés sur de gros documents.
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
