import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import boundaries from 'eslint-plugin-boundaries';
import rxjsX from 'eslint-plugin-rxjs-x';

const featureLayers = ['application', 'domain', 'infrastructure', 'presentation'];

export default tseslint.config(
  {
    ignores: [
      '.angular/**',
      'coverage/**',
      'dist/**',
      'node_modules/**',
      'src/app/i18n/locales.generated.ts',
      'src/app/data/editorials/editorials.registry.ts',
    ],
  },
  {
    files: ['src/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-inject': 'off',
      '@angular-eslint/prefer-on-push-component-change-detection': 'off',
      '@angular-eslint/no-output-native': 'off',
      '@angular-eslint/no-output-on-prefix': 'off',
      '@angular-eslint/no-output-rename': 'off',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-debugger': 'error',
      'no-control-regex': 'off',
      'prefer-const': 'error',
    },
  },
  {
    files: ['src/**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'off',
      '@angular-eslint/template/elements-content': 'off',
      '@angular-eslint/template/label-has-associated-control': 'off',
    },
  },
  {
    files: ['src/app/features/**/*.html'],
    rules: {
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
    },
  },
  {
    files: ['src/app/features/**/*.ts'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...angular.configs.tsRecommended,
      rxjsX.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { boundaries },
    settings: {
      'boundaries/root-path': import.meta.dirname,
      'boundaries/elements': featureLayers.map((type) => ({
        type,
        pattern: `src/app/features/*/${type}/**`,
        partialMatch: false,
      })),
    },
    rules: {
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              disallow: { to: { element: { types: { anyOf: ['application', 'infrastructure', 'presentation'] } } } },
              message: 'Le domaine ne dépend d’aucune couche externe.',
            },
            {
              from: { element: { type: 'application' } },
              disallow: { to: { element: { types: { anyOf: ['infrastructure', 'presentation'] } } } },
              message: 'La couche application ne dépend ni de l’infrastructure ni de la présentation.',
            },
            {
              from: { element: { type: 'infrastructure' } },
              disallow: { to: { element: { type: 'presentation' } } },
              message: 'L’infrastructure ne dépend pas de la présentation.',
            },
          ],
        },
      ],
      'rxjs-x/no-nested-subscribe': 'error',
      'rxjs-x/no-ignored-subscription': 'error',
    },
  },
  {
    files: ['src/app/features/*/presentation/**/*.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    files: ['src/app/features/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@angular/*'],
              message: 'Le code métier doit rester indépendant d’Angular.',
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', 'window', 'document', 'navigator'],
    },
  },
);
