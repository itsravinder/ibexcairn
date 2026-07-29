import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.mjs',
      '**/*.cjs',
      // Vendored fork lifted from upstream (S02). Held to the build + the
      // no-vscode guard, not to our lint rules. Our own files in engine-core
      // (compat/, services/, index.ts) are still linted.
      'packages/engine-core/src/ir/**',
      'packages/engine-core/src/parsers/**',
      'packages/engine-core/src/types/**',
      'packages/engine-core/src/stages/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.test.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
);
