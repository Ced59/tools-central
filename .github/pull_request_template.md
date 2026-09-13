## Objectif unique

<!-- Une PR = une fonctionnalité. Décrire le problème utilisateur et le résultat attendu. -->

## Périmètre

- Inclus :
- Explicitement exclu :

## Validation

- [ ] La PR ne contient qu’une fonctionnalité ou un objectif atomique.
- [ ] L’architecture respecte `AGENTS.md` : presentation → application → domain, infrastructure branchée via des ports.
- [ ] Les tests métier et de non-régression sont présents.
- [ ] `npm run lint` passe.
- [ ] `npm test` passe.
- [ ] `npm run i18n:check:strict` passe.
- [ ] `npm run catalog:validate` passe.
- [ ] `npm run build:all && npm run seo:validate` passe.
- [ ] `npm run test:e2e` passe.
- [ ] `npm audit --omit=dev --audit-level=high` passe.
- [ ] Accessibilité, mobile, erreurs et cas limites ont été vérifiés.
- [ ] Les impacts SEO et performance ont été vérifiés.
- [ ] Aucun secret, contenu factice ou nouvelle dépendance morte n’est ajouté.

## Preuves

<!-- Résultats de commandes, captures, métriques avant/après. -->

## Déploiement et retour arrière

<!-- Impact attendu après merge sur master et méthode de rollback si nécessaire. -->
