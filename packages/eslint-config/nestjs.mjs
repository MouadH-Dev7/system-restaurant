import base from './base.mjs';

export default [
  ...base,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
];
