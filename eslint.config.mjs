import next from "eslint-config-next";

/** Flat ESLint config — Next.js 16 ships native flat configs (core-web-vitals + typescript). */
const eslintConfig = [
  { ignores: ["legacy/**", ".next/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
];

export default eslintConfig;
