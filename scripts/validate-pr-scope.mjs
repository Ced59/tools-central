import fs from 'node:fs';

const eventPath = process.env.GITHUB_EVENT_PATH;
if (!eventPath || !fs.existsSync(eventPath)) {
  console.log('[pr-scope] Exécution locale : aucun événement pull_request à valider.');
  process.exit(0);
}

const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
const pullRequest = event.pull_request;
if (!pullRequest) {
  console.log('[pr-scope] Hors pull_request : contrôle ignoré.');
  process.exit(0);
}

const title = String(pullRequest.title ?? '').trim();
const body = String(pullRequest.body ?? '').replace(/<!--.*?-->/gs, '').trim();
const errors = [];

if (!/^(feat|fix|refactor|test|docs|chore|perf|ci)(\([a-z0-9-]+\))?!?:\s+\S/i.test(title)) {
  errors.push('Le titre doit suivre Conventional Commits (ex. « feat(pdf): compresser un PDF »).');
}

const objective = body.match(/## Objectif unique\s+([\s\S]*?)(?=\n## |$)/i)?.[1]?.trim() ?? '';
if (objective.length < 20) {
  errors.push('La section « Objectif unique » doit décrire un résultat atomique et vérifiable.');
}

if (!/- \[x\] La PR ne contient qu’une fonctionnalité ou un objectif atomique\./i.test(body)) {
  errors.push('La case attestant « une PR = un objectif atomique » doit être cochée.');
}

if (!/- Inclus\s*:\s*\S+/i.test(body) || !/- Explicitement exclu\s*:\s*\S+/i.test(body)) {
  errors.push('Le périmètre inclus et explicitement exclu doit être renseigné.');
}

if (errors.length > 0) {
  console.error(`[pr-scope] ❌ ${errors.length} erreur(s).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[pr-scope] ✅ Titre, objectif unique et périmètre renseignés.');
