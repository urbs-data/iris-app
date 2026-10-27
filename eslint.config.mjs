import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

export default [
  { ignores: ['.next/**', 'drizzle/**', '.agents/**', 'public/**'] },
  ...nextCoreWebVitals,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'no-console': 'warn',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
];
