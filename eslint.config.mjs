import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

const eslintConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'next/core-web-vitals',
    plugins: { '@next/next': nextPlugin },
    rules: nextPlugin.configs['core-web-vitals'].rules,
  },
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    ignores: ['.next/'],
  },
]

export default eslintConfig
