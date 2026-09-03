import tseslint from 'typescript-eslint';

/** No barrel files anywhere — import the module directly. */
const noBarrels = {
  group: ['**/index', '**/index.ts'],
  message: 'No barrel files — import from the module directly.',
};

/**
 * Layering, enforced by the linter rather than by convention. Each rule below is a
 * dependency edge that must not exist; a violation is a build failure, not a review note.
 */
const restrict = (...patterns) => ({
  'no-restricted-imports': ['error', { patterns: [noBarrels, ...patterns] }],
});

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'coverage/**'] },
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      ...restrict(),
    },
  },
  {
    // The browser sees the wire contract and nothing else. This is the boundary that
    // makes `contracts` a published shape rather than a convenient import.
    files: ['apps/web/**/*.{ts,tsx}'],
    rules: restrict({
      group: ['@yaya/domain*', '@yaya/application*', '@yaya/infrastructure*'],
      message:
        'The web app may import @yaya/contracts only. Server internals are not a wire contract.',
    }),
  },
  {
    // The domain is the centre of the graph: it depends on nothing of ours.
    files: ['packages/domain/**/*.ts'],
    rules: restrict({
      group: ['@yaya/*'],
      message: 'The domain depends on no other workspace package.',
    }),
  },
  {
    // Use cases talk to ports, never to an adapter.
    files: ['packages/application/**/*.ts'],
    rules: restrict({
      group: ['@yaya/infrastructure*'],
      message:
        'Application code depends on the repository port in @yaya/domain, not on an adapter.',
    }),
  },
  {
    files: ['**/*.config.{ts,js}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
