import base from './base.mjs';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default [...base, ...compat.extends('next/core-web-vitals', 'next/typescript')];
