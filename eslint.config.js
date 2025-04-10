// eslint.config.js
import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
// If you use eslint-plugin-jest, you might need to import it differently depending on its flat config support
// import jestPlugin from 'eslint-plugin-jest'; // Check jest plugin docs for flat config

export default [
  // 1. Global ignores
  {
    ignores: [
      '.eslintrc.js', // Keep ignoring the old file if it exists
      'jest.config.js',
      'dist/**/*', // Use glob pattern for directories
      'node_modules/**/*',
      // Add other patterns like build outputs, logs, etc.
    ],
  },

  // 2. Base JS Configuration (applies broadly)
  pluginJs.configs.recommended,

  // 3. TypeScript Configuration (specific to .ts files)
  {
    files: ['src/**/*.ts'], // Apply these rules ONLY to .ts files in src
    plugins: {
      '@typescript-eslint': tseslint,
      // jest: jestPlugin, // Add jest plugin here if needed
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2018, // Or 'latest'
        // project: './tsconfig.json', // Consider adding for type-aware linting
      },
      globals: {
        ...globals.node, // Add Node.js globals
        // ...globals.jest, // Add Jest globals if needed (often handled by jest plugin)
      },
    },
    rules: {
      // Include recommended rules from the plugin
      ...tseslint.configs.recommended.rules,
      // Add/override your specific rules
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off', // Disable base rule
      '@typescript-eslint/no-unused-vars': [
        // Enable TS version
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_', // Good practice to add this too
        },
      ],
      // Add other rules here...
      // Example Jest rule (if using the plugin)
      // 'jest/no-disabled-tests': 'warn',
    },
  },

  // 4. Jest Configuration (specific to test files if needed)
  // If your test files have a specific pattern like *.test.ts or *.spec.ts
  {
    files: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    // You might apply jest plugin rules specifically here
    // plugins: {
    //    jest: jestPlugin,
    // },
    // rules: {
    //    ...jestPlugin.configs.recommended.rules,
    // }
  },

  // 5. Configuration for JS files (like config files themselves) if necessary
  {
    files: ['eslint.config.js' /* other JS config files */],
    languageOptions: {
      sourceType: 'module', // This config file is an ES Module
      globals: {
        ...globals.node, // Node globals for config files
      },
    },
  },
];
