# Guide de développement de Tools Central

Ce fichier est la règle opérationnelle du dépôt. Toute contribution humaine ou automatisée doit le lire avant de modifier le projet. En cas de contradiction avec une habitude existante du code, ce document prévaut pour le nouveau code ; l’ancien code est migré progressivement, fonctionnalité par fonctionnalité.

Documents de référence :

- audit technique : `docs/CODE_AUDIT.md` ;
- backlog produit et SEO : `docs/SEO_TOOL_BACKLOG.md`.

## 1. Règles absolues

1. **Une PR = une fonctionnalité ou un objectif atomique.** Une PR ne mélange jamais fonctionnalité, refonte générale, mise à jour de dépendances et nettoyage sans rapport. Si le titre de la PR contient plusieurs objectifs reliés par « et », il faut probablement la scinder.
2. **Clean Architecture stricte.** Les dépendances pointent toujours vers le métier. Aucune exception silencieuse n’est acceptée.
3. **La CI doit être verte avant merge.** Il est interdit de neutraliser un test, un budget, l’audit de sécurité ou la validation i18n pour obtenir un merge.
4. **L’écosystème Prime est interdit.** Ne pas réintroduire `primeng`, `@primeng/themes`, `primeicons`, leurs composants, directives, polices ni classes CSS. Utiliser les primitives internes de `src/app/ui/` et les icônes locales `tc-icon`.
5. **Une page annoncée comme disponible doit fonctionner réellement.** Pas de faux outil, de résultat simulé, de contenu `TODO` ni de page d’entrée SEO sans valeur propre.
6. **Les fichiers utilisateur restent locaux par défaut.** Aucun upload, tracking de contenu, log de document ou transfert vers un tiers sans décision produit explicite, information visible et revue sécurité.
7. **Une seule source de vérité.** Le catalogue unifié dans `src/app/data/catalog/` pilote navigation, routes publiables, prérendu et sitemaps.

## 2. Portée d’une PR

Une fonctionnalité atomique comprend ce qui est nécessaire à sa livraison complète : code métier, adaptateur, interface, tests, traduction source, contenu éditorial, métadonnées SEO et documentation associée. Cela reste une seule fonctionnalité.

Exemples acceptés :

- « Ajouter le compresseur PDF » avec son moteur, son écran, ses tests et son contenu SEO ;
- « Migrer les tests de Karma vers Vitest » ;
- « Mettre à jour Angular 22.1 vers 22.2 » ;
- « Corriger le sitemap multilingue ».

Exemples à scinder :

- ajouter trois outils sans moteur ou modèle commun indispensable ;
- ajouter un outil PDF et refaire le thème ;
- mettre à jour Angular, renommer des services et modifier le contenu marketing ;
- corriger un bug puis nettoyer des fichiers sans lien avec ce bug.

Chaque PR doit rester relisible. Au-delà d’environ 500 lignes de logique nouvelle, vérifier s’il existe plusieurs responsabilités. Les fichiers générés, traductions et snapshots sont exclus de ce repère, mais doivent être clairement identifiés.

## 3. Architecture cible

Chaque domaine fonctionnel forme une tranche verticale :

```text
src/app/
  core/                         # composition globale, tokens, erreurs, configuration
  shared/
    ui/                         # composants visuels sans règle métier
    testing/                    # fixtures et utilitaires de test
  features/
    <feature>/
      domain/                   # règles métier pures
      application/              # cas d’usage et ports
      infrastructure/           # adaptateurs navigateur/bibliothèques
      presentation/             # composants Angular et view-models
  data/catalog/                 # source de vérité du catalogue
```

Le code historique dans `components/pages/tools`, `services` et `data` est déplacé vers cette structure au fil des PR fonctionnelles. Pas de migration « big bang » indépendante tant qu’elle ne produit pas une limite compilable et testable.

### 3.1 Domaine

- TypeScript pur, déterministe et testable sans Angular ni DOM.
- Contient entités, value objects, validateurs, algorithmes et erreurs métier.
- N’importe jamais `@angular/*`, `window`, `document`, `navigator`, une bibliothèque d’UI, le routeur ou un service réseau.
- N’écrit pas de fichiers et ne déclenche pas de téléchargement.
- Expose des fonctions petites avec entrées et sorties typées ; éviter `any`.

### 3.2 Application

- Orchestre les cas d’usage : analyser, convertir, exporter, réinitialiser.
- Dépend uniquement du domaine et de ports abstraits.
- Définit les contrats des adaptateurs : lecteur de fichier, presse-papiers, téléchargement, télémétrie.
- Ne contient ni HTML, ni CSS, ni logique de routage Angular.

### 3.3 Infrastructure

- Implémente les ports avec `File`, `Blob`, Web Workers, IndexedDB, PDF-Lib, JSZip ou APIs navigateur.
- Isole les bibliothèques tierces derrière des adaptateurs pour limiter leur propagation.
- Convertit les erreurs techniques en erreurs compréhensibles par l’application.
- Toute opération lourde ou potentiellement bloquante doit être déplaçable dans un Web Worker.

### 3.4 Présentation

- Les composants Angular affichent un état et transmettent des intentions au cas d’usage.
- Aucune règle de calcul, parsing binaire ou manipulation métier complexe dans un composant.
- Utiliser composants standalone, formulaires typés, signals/computed et `ChangeDetectionStrategy.OnPush` pour le nouveau code.
- Les subscriptions doivent avoir une fin de vie explicite (`takeUntilDestroyed`, `async`, signal) sauf flux fini.
- Accessibilité obligatoire : label, navigation clavier, focus visible, état d’erreur annoncé et contraste suffisant.

### 3.5 Sens des dépendances

```text
presentation ──► application ──► domain
      │                ▲
      └──► infrastructure (uniquement via injection/composition)
```

Interdictions :

- le domaine n’importe jamais application, infrastructure ou présentation ;
- l’application n’importe jamais un composant Angular ;
- une feature ne lit pas les fichiers internes d’une autre feature ; elle passe par une API publique ;
- un composant partagé ne dépend pas d’un outil particulier ;
- aucun import profond d’une bibliothèque si son API publique suffit.

## 4. Procédure avant de coder

1. Lire `AGENTS.md`, le domaine concerné et les tests existants.
2. Vérifier le catalogue pour éviter un doublon de slug, d’intention ou d’outil.
3. Définir une seule intention utilisateur et les critères d’acceptation.
4. Choisir un nom de branche préfixé par `codex/`, `feat/`, `fix/`, `refactor/` ou `chore/`.
5. Écrire ou mettre à jour les tests du domaine avant l’intégration visuelle.
6. Implémenter du centre vers l’extérieur : domaine, application, infrastructure, présentation.
7. Exécuter les contrôles locaux avant d’ouvrir la PR.

## 5. Ajouter un outil

Un nouvel outil ne doit être déclaré `available: true` qu’après validation de toute cette liste :

- identifiant et slug stables, explicites et uniques ;
- intention distincte d’un outil existant ;
- algorithme métier pur couvert par des tests de cas normaux, limites et erreurs ;
- composant chargé paresseusement avec un état vide, chargement, succès et erreur ;
- traitement local clairement indiqué lorsque c’est le cas ;
- limite de taille et comportement sur gros fichiers documentés ;
- interface mobile, clavier et lecteur d’écran vérifiés ;
- titre SEO et description uniques, non créés par simple substitution de mots ;
- introduction utile, mode d’emploi, exemples réels, limites et FAQ réellement spécifiques ;
- liens vers des outils connexes du même parcours ;
- chaînes visibles passées par `$localize` ;
- entrée ajoutée uniquement dans `src/app/data/catalog/` ;
- génération de routes confirmée avec `node scripts/generate-prerender-routes.mjs` ;
- aucun `TODO`, texte factice ou fonctionnalité trompeuse ;
- tests et build de production verts.

Une entrée `available: false` n’est ni prérendue ni ajoutée au sitemap. Elle ne doit pas être rendue indexable par un autre chemin.

## 6. Exigences SEO

La priorité reste l’utilité du produit. Une page ne doit jamais exister uniquement pour capter une variante de mot-clé.

Chaque outil indexable doit avoir :

- une fonctionnalité complète utilisable sans inscription ;
- un `title` et une meta description propres à son intention ;
- une URL canonique en `https://www.tools-central.com` ;
- des alternates `hreflang` cohérents uniquement pour les traductions réellement relues ;
- un H1 unique et une hiérarchie de titres logique ;
- du contenu original fondé sur le fonctionnement réel de l’outil ;
- des exemples testables, limites techniques, formats supportés et politique de confidentialité ;
- des liens internes contextuels, sans blocs de liens artificiels ;
- des données structurées seulement si le contenu visible respecte les propriétés déclarées ;
- de bons seuils Web Vitals : LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,1 au 75e percentile.

Les éditoriaux source ne doivent contenir aucun `TODO`. Le contrôle CI bloque désormais tout marqueur résiduel dans le français ou dans une cible XLF. La validation automatique prouve la complétude technique, jamais la qualité linguistique : les traductions générées doivent être relues par un locuteur natif, par lots de pages prioritaires, avant d’être considérées comme éditorialement validées.

Ne jamais publier automatiquement des centaines de pages ou traductions non relues. Toute extension de catalogue doit prouver une valeur propre et éviter les pages satellites ou le contenu généré à grande échelle sans valeur ajoutée.

## 7. Tests

Pyramide attendue :

1. tests unitaires du domaine, nombreux et rapides ;
2. tests des cas d’usage avec ports simulés ;
3. tests de composants ciblés sur le comportement, pas seulement `should create` ;
4. tests d’intégration pour catalogue, routes, sitemaps et i18n ;
5. parcours E2E critiques : accueil → outil → résultat → export, changement de langue, thème et pages d’erreur.

Règles :

- Vitest est le runner unitaire ; ne pas réintroduire Karma/Jasmine ;
- ne jamais supprimer une assertion pour faire passer la CI ;
- toute correction de bug ajoute un test de non-régression ;
- tout composant avec input requis fournit une fixture valide ;
- les APIs navigateur absentes de JSDOM sont injectées ou simulées dans `src/test-setup.ts` ;
- aucun test réseau réel dans la suite unitaire ;
- une couverture chiffrée ne remplace pas des assertions métier pertinentes.

## 8. Internationalisation

- Le français est la langue source.
- Toute chaîne visible nouvelle utilise `$localize` ou les attributs `i18n`.
- Les identifiants de traduction sont stables et descriptifs.
- `npm run i18n:check` doit passer sans réparation automatique cachée dans la CI.
- Une traduction non relue ne doit pas être présentée comme garantie de qualité.
- Toute nouvelle locale exige une revue du contenu principal, des URLs, des alternates et du sitemap.
- Les nombres, dates et devises utilisent `Intl`, pas une concaténation manuelle.

## 9. Performance

- Chargement paresseux par outil et import dynamique des bibliothèques lourdes.
- Pas de nouvelle dépendance globale pour une seule feature sans justification écrite dans la PR.
- Les traitements lourds doivent éviter de bloquer le thread principal ; mesurer avant/après.
- Révoquer les Object URLs et libérer les gros buffers dès que possible.
- Ne pas augmenter les budgets Angular pour contourner une régression. Budgets actuels : 900 kB en avertissement et 1,2 MB en erreur pour le bundle initial de production.
- Mesurer le bundle, le temps de prérendu et au moins les parcours mobile principaux lors d’une modification structurante.

## 10. Sécurité et confidentialité

- `npm audit --omit=dev --audit-level=high` doit passer.
- Aucun secret, token, mot de passe ou document réel dans Git, les logs ou les fixtures.
- Valider type, taille et structure des fichiers avant parsing.
- Considérer PDF, XML, ZIP, image, texte et nom de fichier comme non fiables.
- Limiter les archives décompressées : nombre d’entrées, taille totale, ratio et profondeur.
- Échapper les contenus affichés ; ne pas utiliser `innerHTML` sans sanitation explicite et testée.
- Ne jamais exécuter le JavaScript embarqué dans un PDF ou un document.
- Les dépendances GitHub Actions doivent être mises à jour et idéalement épinglées par SHA dans une PR de maintenance dédiée.
- Toute télémétrie doit exclure contenu, valeurs saisies et noms de fichiers.

## 11. CI, merge et déploiement

Le workflow `.github/workflows/deploy.yml` sépare strictement validation et production :

- le job obligatoire `Verify` s’exécute sur toute PR vers `master` et sur tout push vers `master` : périmètre atomique de la PR, installation reproductible, audit, lint, i18n stricte, catalogue, frontières d’architecture, couverture, build/prérendu, SEO généré et E2E ;
- le job `Deploy production` ne peut démarrer que sur un push vers `master`, après succès de `Verify` ; il déploie une release versionnée, bascule atomiquement le lien `current`, vérifie Nginx et deux routes, revient à N-1 en cas d’échec, puis contrôle le domaine public.

Le merge est interdit si l’un des contrôles échoue. La protection GitHub de `master`, vérifiée le 13 septembre 2026, impose :

- PR obligatoire ;
- branche à jour avant merge ;
- statut `Verify` obligatoire ;
- conversations résolues ;
- règles appliquées aussi aux administrateurs ;
- historique linéaire, force-push et suppression de branche protégée interdits ;
- fusion squash uniquement, avec le titre de PR comme titre du commit ;
- suppression automatique de la branche source après merge ;
- environnement GitHub `production` limité aux branches protégées.

Le dépôt n’a actuellement qu’un seul mainteneur : le nombre d’approbations obligatoires est donc temporairement à zéro pour ne pas rendre tout merge impossible. Dès qu’un second mainteneur dispose des droits de revue, passer ce seuil à une approbation sans modifier les autres protections.

La CI confirme que le pipeline peut déployer ; elle ne peut pas prouver les secrets VPS depuis une PR. Toute modification de déploiement doit être vérifiée par un merge contrôlé puis par le healthcheck et l’URL publique.

## 12. Contrôles locaux obligatoires

Utiliser une version Node compatible avec `package.json` ; la CI utilise Node 24.

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

Lors d’un travail ciblé, des tests ciblés peuvent accélérer la boucle, mais la suite complète et le build complet restent obligatoires avant la PR.

## 13. Contenu de la PR

Le titre suit idéalement Conventional Commits : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.

La description contient :

- problème utilisateur ;
- solution et limites ;
- périmètre explicitement exclu ;
- preuves de test ;
- impact i18n, SEO, accessibilité, sécurité et performance ;
- captures avant/après pour une modification visuelle ;
- plan de retour arrière si le déploiement ou les données peuvent être affectés.

## 14. Definition of Done

Une fonctionnalité est terminée seulement si :

- les critères d’acceptation sont démontrés ;
- l’architecture respecte le sens des dépendances ;
- les erreurs et cas limites sont traités ;
- les tests utiles sont présents et verts ;
- i18n, accessibilité et SEO sont complets ;
- aucune nouvelle dette `TODO`, dépendance morte ou duplication n’est introduite ;
- la CI complète passe ;
- la documentation est à jour ;
- la PR ne contient qu’une fonctionnalité.

## 15. État du socle et ordre des prochains chantiers

Le socle livré pendant l’audit comprend Angular 22, Vitest, ESLint, les frontières automatisées, Playwright, le validateur de catalogue, le contrôle SEO de la sortie statique, la couverture minimale, une vraie 404, les icônes locales, plusieurs tranches verticales en Clean Architecture et un premier moteur PDF en Web Worker. Les outils SEO `serp-snippet-preview`, `robots-txt-builder`, `sitemap-xml-builder`, `hreflang-checker`, `structured-data-extractor` et `html-head-auditor` servent de références récentes.

Chaque ligne restante doit être une PR distincte :

1. faire relire par des locuteurs natifs les pages prioritaires de chaque locale et tracer l’état de revue ;
2. remplacer progressivement les 75 tests résiduels `should create` par des tests de comportement ;
3. migrer un outil historique à la fois vers `features/<feature>/domain|application|infrastructure|presentation` ;
4. déplacer les autres parseurs PDF/ZIP lourds vers des Workers avec limites mémoire explicites ;
5. réduire progressivement les 82 composants encore en détection `Eager` et les 127 usages de `any`, avec tests avant chaque durcissement ;
6. ajouter axe-core et une régression visuelle ciblée sur les primitives internes ;
7. collecter les Core Web Vitals terrain et corriger les principaux contributeurs au 75e percentile ;
8. remplacer l’accès VPS par mot de passe par une clé de déploiement dédiée à droits minimaux ;
9. résoudre ou accepter explicitement les avertissements `pt-BR` et CommonJS après mesure ;
10. réaliser les outils P0 de `docs/SEO_TOOL_BACKLOG.md`, strictement un outil par PR et après validation de la demande.
