import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const sourceFileGlobs = ["**/*.{js,jsx,ts,tsx}"];

const transitionRules = {
  // Legacy codebase compatibility while migrating to strict typing
  "@typescript-eslint/no-explicit-any": "warn",
  // Next.js 16 + React compiler migration in progress
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/preserve-manual-memoization": "warn",
  "react-hooks/refs": "warn",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project-specific non-source artifacts:
    ".cursor/**",
    ".claude/**",
    ".playwright-mcp/**",
    "docs/**",
    "plans/**",
    "scripts/**",
    "tests/**",
    "test-results/**",
  ]),
  { files: sourceFileGlobs, rules: transitionRules },
]);

export default eslintConfig;
