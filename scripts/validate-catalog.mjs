import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const CATALOG_INDEX = path.resolve('src/app/data/catalog/index.ts');
const EDITORIAL_ROOT = path.resolve('src/app/data/editorials');
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function sourceFile(file) {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function unwrap(expression) {
  let current = expression;
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function propertyName(node) {
  return ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)
    ? node.text
    : null;
}

function objectEntries(object) {
  return object.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property)) return [];
    const name = propertyName(property.name);
    return name ? [[name, property.initializer]] : [];
  });
}

function property(object, name) {
  return objectEntries(object).find(([key]) => key === name)?.[1];
}

function asObject(expression, context, errors) {
  const value = unwrap(expression);
  if (!value || !ts.isObjectLiteralExpression(value)) {
    errors.push(`${context}: objet TypeScript attendu.`);
    return null;
  }
  return value;
}

function findVariable(source, name) {
  let initializer;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      initializer = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return initializer;
}

function namedImports(source) {
  const imports = new Map();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      imports.set(element.name.text, statement.moduleSpecifier.text);
    }
  }
  return imports;
}

function booleanValue(object, name) {
  const value = unwrap(property(object, name));
  if (value?.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value?.kind === ts.SyntaxKind.FalseKeyword) return false;
  return null;
}

function dynamicImportPath(object) {
  const loadComponent = property(object, 'loadComponent');
  if (!loadComponent) return null;

  let result = null;
  const visit = (node) => {
    if (
      !result &&
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      result = node.arguments[0].text;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(loadComponent);
  return result;
}

function validateId(id, context, errors) {
  if (!ID_PATTERN.test(id)) errors.push(`${context}: identifiant invalide « ${id} ».`);
}

function validateText(object, context, source, errors) {
  for (const name of ['title', 'description']) {
    const value = property(object, name);
    if (!value) {
      errors.push(`${context}: propriété ${name} absente.`);
      continue;
    }
    if (/\bTODO\b/i.test(value.getText(source))) {
      errors.push(`${context}: ${name} contient TODO.`);
    }
  }
}

function validateEditorial(categoryId, groupId, toolId, errors) {
  const file = path.join(EDITORIAL_ROOT, categoryId, groupId, `${toolId}.editorial.ts`);
  const context = `${categoryId}/${groupId}/${toolId}`;
  if (!fs.existsSync(file)) {
    errors.push(`${context}: éditorial manquant pour un outil disponible.`);
    return;
  }

  const content = fs.readFileSync(file, 'utf8');
  if (!/export\s+const\s+editorialReady\s*=\s*true\s*;/.test(content)) {
    errors.push(`${context}: editorialReady doit être true.`);
  }
  if (/\bTODO\b/i.test(content)) {
    errors.push(`${context}: l'éditorial contient TODO.`);
  }
}

function validateComponent(categoryFile, importPath, context, errors) {
  if (!importPath) {
    errors.push(`${context}: loadComponent absent ou illisible.`);
    return;
  }

  const base = path.resolve(path.dirname(categoryFile), importPath);
  const candidates = [`${base}.ts`, path.join(base, 'index.ts')];
  if (!candidates.some((candidate) => fs.existsSync(candidate))) {
    errors.push(`${context}: composant introuvable (${importPath}).`);
  }
}

function main() {
  const errors = [];
  const index = sourceFile(CATALOG_INDEX);
  const imports = namedImports(index);
  const catalog = asObject(findVariable(index, 'CATALOG'), 'CATALOG', errors);
  if (!catalog) return fail(errors);

  const toolIds = new Map();
  let categoryCount = 0;
  let groupCount = 0;
  let toolCount = 0;
  let availableToolCount = 0;

  for (const [categoryId, categoryReference] of objectEntries(catalog)) {
    categoryCount++;
    validateId(categoryId, 'catalogue', errors);
    const reference = unwrap(categoryReference);
    if (!reference || !ts.isIdentifier(reference)) {
      errors.push(`${categoryId}: référence de catégorie invalide.`);
      continue;
    }

    const importPath = imports.get(reference.text);
    if (!importPath) {
      errors.push(`${categoryId}: import introuvable pour ${reference.text}.`);
      continue;
    }

    const categoryFile = path.resolve(path.dirname(CATALOG_INDEX), `${importPath}.ts`);
    if (!fs.existsSync(categoryFile)) {
      errors.push(`${categoryId}: fichier de catalogue introuvable (${importPath}).`);
      continue;
    }

    const source = sourceFile(categoryFile);
    const category = asObject(findVariable(source, reference.text), categoryId, errors);
    if (!category) continue;
    validateText(category, categoryId, source, errors);

    const categoryAvailable = booleanValue(category, 'available');
    if (categoryAvailable === null) errors.push(`${categoryId}: available doit être un booléen littéral.`);
    const groups = asObject(property(category, 'groups'), `${categoryId}.groups`, errors);
    if (!groups) continue;

    for (const [groupId, groupExpression] of objectEntries(groups)) {
      groupCount++;
      const groupContext = `${categoryId}/${groupId}`;
      validateId(groupId, categoryId, errors);
      const group = asObject(groupExpression, groupContext, errors);
      if (!group) continue;
      validateText(group, groupContext, source, errors);

      const groupAvailable = booleanValue(group, 'available');
      if (groupAvailable === null) errors.push(`${groupContext}: available doit être un booléen littéral.`);
      if (groupAvailable && !categoryAvailable) {
        errors.push(`${groupContext}: groupe disponible sous une catégorie indisponible.`);
      }

      const subGroups = asObject(property(group, 'subGroups'), `${groupContext}.subGroups`, errors);
      if (!subGroups) continue;

      for (const [subGroupId, subGroupExpression] of objectEntries(subGroups)) {
        const subGroupContext = `${groupContext}/${subGroupId}`;
        validateId(subGroupId, groupContext, errors);
        const subGroup = asObject(subGroupExpression, subGroupContext, errors);
        if (!subGroup) continue;
        validateText(subGroup, subGroupContext, source, errors);
        const tools = asObject(property(subGroup, 'tools'), `${subGroupContext}.tools`, errors);
        if (!tools) continue;

        for (const [toolId, toolExpression] of objectEntries(tools)) {
          toolCount++;
          const context = `${groupContext}/${toolId}`;
          validateId(toolId, subGroupContext, errors);
          const previous = toolIds.get(toolId);
          if (previous) errors.push(`${context}: ID outil déjà utilisé par ${previous}.`);
          else toolIds.set(toolId, context);

          const tool = asObject(toolExpression, context, errors);
          if (!tool) continue;
          validateText(tool, context, source, errors);
          const available = booleanValue(tool, 'available');
          if (available === null) {
            errors.push(`${context}: available doit être un booléen littéral.`);
            continue;
          }
          if (!available) continue;

          availableToolCount++;
          if (!categoryAvailable || !groupAvailable) {
            errors.push(`${context}: outil disponible sous un parent indisponible.`);
          }
          validateComponent(categoryFile, dynamicImportPath(tool), context, errors);
          validateEditorial(categoryId, groupId, toolId, errors);
        }
      }
    }
  }

  if (errors.length > 0) return fail(errors);
  console.log(
    `[catalog] ✅ ${categoryCount} catégories, ${groupCount} groupes, ${toolCount} outils, ${availableToolCount} disponibles.`,
  );
}

function fail(errors) {
  console.error(`[catalog] ❌ ${errors.length} erreur(s) :`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

main();
