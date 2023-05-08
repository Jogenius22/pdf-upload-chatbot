// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

/** @type {import("eslint").Linter.Config} */
const config = {
  overrides: [
    {
      extends: ['plugin:@typescript-eslint/recommended-requiring-type-checking'],
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        project: path.join(__dirname, 'tsconfig.json'),
      },
    },
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
  },
  plugins: ['@typescript-eslint', "import-newlines"],
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/ban-types': [
      'error',
      {
        extendDefaults: true,
        types: {
          '{}': false,
        },
      },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // newline after import - requires import-newlines plugin
    'import-newlines/enforce': ['error', 2, 100],
    'max-len': ['error', 120],
    // newline on React component props
    'react/jsx-closing-bracket-location': [
      'error',
      {
        selfClosing: 'line-aligned',
        nonEmpty: 'line-aligned',
      },
    ],
    '@typescript-eslint/indent': ['warn', 2],
    '@typescript-eslint/semi': ['error', 'always'],
    '@typescript-eslint/no-shadow': 'error',
    // no template curly braces in strings and no unnecessary template literals
    'no-template-curly-in-string': 'error',
    // don't allow needless curly braces around static values
    'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
    // jsx curly spacing
    'react/jsx-curly-spacing': ['error', 'never'],
  },
};

module.exports = config;
