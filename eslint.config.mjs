// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2021,
        ScriptableMock: 'readonly',
        createScriptableHostMocks: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'import/no-unresolved': 'off',
      'no-unused-vars': 'off',
      'no-constant-condition': 'off',
      'no-useless-escape': 'off',
      'no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        varsIgnorePattern: '^(h|MODULE|Fragment)$',
        caughtErrors: 'none'
      }],
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/env/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off',
      'no-prototype-builtins': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'manual/**', 'src/build/static/assets/highlight.min.js'],
  }
);
