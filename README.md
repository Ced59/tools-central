# Tools Central

Application Angular multilingue regroupant des outils gratuits exécutés localement dans le navigateur.

## Prérequis

- Node.js `^22.22.3`, `^24.15.0` ou `>=26.0.0` ;
- npm (la CI utilise Node 24) ;
- aucune dépendance PrimeNG : l'interface repose sur les primitives internes de `src/app/ui/`.

## Démarrage

```bash
npm ci
npm start
```

L'application est ensuite disponible sur `http://localhost:4200/`.

## Contrôles locaux

```bash
npm audit --omit=dev --audit-level=high
npm run lint
npm run i18n:check:strict
npm run catalog:validate
npm run architecture:validate
npm run test:coverage
npm run build:all && npm run seo:validate
npm run test:e2e
```

`build:all` génère les routes prérendues, compile les 30 locales en sortie statique puis produit les sitemaps, `robots.txt` et `ads.txt` dans `dist/tools-central/browser/`. Playwright teste cette sortie, pas un serveur de développement différent de la production.

## Contribution

Lire [AGENTS.md](AGENTS.md) avant toute modification. Les règles structurantes sont :

- une PR = une fonctionnalité ou un objectif atomique ;
- Clean Architecture stricte ;
- tests, i18n et build complet verts avant merge ;
- déploiement uniquement après merge sur `master`.

La CI valide chaque PR vers `master` avec le statut obligatoire `Verify`. Après merge, un job distinct déploie une release versionnée sur le VPS, attend le healthcheck Nginx, contrôle le domaine public et revient à la release précédente en cas d’échec.

## Documentation

- [Audit technique](docs/CODE_AUDIT.md)
- [Backlog d'outils et stratégie SEO](docs/SEO_TOOL_BACKLOG.md)
- [Règles de développement](AGENTS.md)

Le projet utilise Angular 22 et Vitest. La configuration de build produit un site statique servi par Nginx ; le prérendu Angular reste utilisé pour fournir du HTML indexable.
