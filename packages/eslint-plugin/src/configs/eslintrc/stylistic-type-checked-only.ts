// THIS CODE WAS AUTOMATICALLY GENERATED
// DO NOT EDIT THIS CODE BY HAND
// SEE https://typescript-eslint.io/users/configs
//
// For developers working in the typescript-eslint monorepo:
// You can regenerate it using `yarn generate-configs`

import type { ClassicConfig } from '@typescript-eslint/utils/ts-eslint';

export = {
  extends: ['./configs/eslintrc/base', './configs/eslintrc/eslint-recommended'],
  rules: {
    'dot-notation': 'off',
    '@typescript-eslint/dot-notation': 'error',
    '@typescript-eslint/non-nullable-type-assertion-style': 'error',
    '@typescript-eslint/prefer-find': 'error',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-regexp-exec': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  },
} satisfies ClassicConfig.Config;
