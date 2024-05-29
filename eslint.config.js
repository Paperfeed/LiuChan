// @ts-check

import tseslint from 'typescript-eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys'
import sortKeysFix from 'eslint-plugin-sort-keys-fix'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'
import eslint from '@eslint/js'
import react from 'eslint-plugin-react'

export default tseslint.config({
  files: ['**/*.ts', '**/*.tsx'],
  plugins: {
    'simple-import-sort': simpleImportSort,
    'sort-keys-fix': sortKeysFix,
    'typescript-sort-keys': typescriptSortKeys,
    'sort-destructure-keys': sortDestructureKeys,
    react,
  },
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    // 'plugin:@typescript-eslint/recommended',
    // 'plugin:import/typescript',
    // 'plugin:react/recommended',
    // 'plugin:react/jsx-runtime',
    // 'plugin:react-hooks/recommended',
    // 'prettier',
  ],
  rules: {
    'no-console': 'warn',
    // Typescript es-lint handles this
    'no-unused-vars': 'off',
    'no-case-declarations': 'off',

    /**
     * React
     */
    'react/prop-types': 'off',
    'react/jsx-curly-brace-presence': [
      'warn',
      {
        props: 'never',
      },
    ],

    /**
     * Typescript
     */
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',

    /**
     * Sorting
     */
    'simple-import-sort/imports': 'warn',
    'simple-import-sort/exports': 'warn',
    'sort-keys-fix/sort-keys-fix': 'warn',
    'typescript-sort-keys/interface': 'warn',
    'typescript-sort-keys/string-enum': 'warn',
    'react/jsx-sort-props': [
      'warn',
      {
        ignoreCase: true,
        reservedFirst: true,
        shorthandLast: true,
      },
    ],
    'sort-destructure-keys/sort-destructure-keys': [
      'warn',
      { caseSensitive: false },
    ],

    /**
     * Misc rules
     */
    eqeqeq: ['error', 'always'],
  },
})
