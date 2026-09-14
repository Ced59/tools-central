import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const CATALOG_INDEX = path.resolve('src/app/data/catalog/index.ts');
const APP_ROUTES = path.resolve('src/app/app.routes.ts');

function readSource(file) {
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

function asObject(expression, context) {
  const value = unwrap(expression);
  if (!value || !ts.isObjectLiteralExpression(value)) {
    throw new Error(`Objet TypeScript attendu pour ${context}.`);
  }
  return value;
}

function propertyName(node) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return null;
}

function entries(object) {
  return object.properties.flatMap((property) => {
    if (!ts.isPropertyAssignment(property)) return [];
    const name = propertyName(property.name);
    return name ? [[name, property.initializer]] : [];
  });
}

function getProperty(object, name) {
  return entries(object).find(([key]) => key === name)?.[1];
}

function isAvailable(object) {
  return unwrap(getProperty(object, 'available'))?.kind === ts.SyntaxKind.TrueKeyword;
}

function isPublishedForLocale(object, locale) {
  if (!locale) return true;
  const expression = unwrap(getProperty(object, 'reviewedLocales'));
  if (!expression) return true;
  if (!ts.isArrayLiteralExpression(expression)) {
    throw new Error('reviewedLocales doit être un tableau littéral.');
  }
  return expression.elements.some(element => ts.isStringLiteralLike(element) && element.text === locale);
}

function findVariable(source, variableName) {
  let result;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName) {
      result = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return result;
}

function catalogImports(source) {
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

export function extractAvailableCatalogRoutes(locale = null) {
  const indexSource = readSource(CATALOG_INDEX);
  const imports = catalogImports(indexSource);
  const catalog = asObject(findVariable(indexSource, 'CATALOG'), 'CATALOG');
  const routes = new Set();

  for (const [categoryId, categoryReference] of entries(catalog)) {
    const reference = unwrap(categoryReference);
    if (!ts.isIdentifier(reference)) {
      throw new Error(`Référence de catégorie invalide : ${categoryId}.`);
    }

    const importPath = imports.get(reference.text);
    if (!importPath) throw new Error(`Import introuvable pour ${reference.text}.`);

    const categoryFile = path.resolve(path.dirname(CATALOG_INDEX), `${importPath}.ts`);
    const categorySource = readSource(categoryFile);
    const category = asObject(findVariable(categorySource, reference.text), reference.text);
    if (!isAvailable(category)) continue;

    routes.add(`/categories/${categoryId}`);
    const groups = asObject(getProperty(category, 'groups'), `${categoryId}.groups`);

    for (const [groupId, groupExpression] of entries(groups)) {
      const group = asObject(groupExpression, `${categoryId}.${groupId}`);
      if (!isAvailable(group)) continue;

      routes.add(`/categories/${categoryId}/${groupId}`);
      const subGroups = asObject(getProperty(group, 'subGroups'), `${categoryId}.${groupId}.subGroups`);

      for (const [subGroupId, subGroupExpression] of entries(subGroups)) {
        const subGroup = asObject(subGroupExpression, `${categoryId}.${groupId}.${subGroupId}`);
        const tools = asObject(
          getProperty(subGroup, 'tools'),
          `${categoryId}.${groupId}.${subGroupId}.tools`,
        );

        for (const [toolId, toolExpression] of entries(tools)) {
          const tool = asObject(toolExpression, `${categoryId}.${groupId}.${subGroupId}.${toolId}`);
          if (!isAvailable(tool) || !isPublishedForLocale(tool, locale)) continue;
          routes.add(`/categories/${categoryId}/${groupId}/${toolId}`);
        }
      }
    }
  }

  return [...routes].sort((a, b) => a.localeCompare(b));
}

export function extractStaticAppRoutes() {
  const content = fs.readFileSync(APP_ROUTES, 'utf8');
  return [...content.matchAll(/path\s*:\s*['"]([^'"]+)['"]/g)]
    .map((match) => match[1].trim())
    .filter((route) => route && route !== '**' && route !== '404' && !route.includes(':'))
    .map((route) => `/${route.replace(/^\/+|\/+$/g, '')}`);
}
