import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // TypeScript strict
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Sécurité
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-eval": "error",
      "no-implied-eval": "error",

      // Qualité
      "no-duplicate-imports": "error",
      "prefer-const": "error",
    },
  },
];

export default eslintConfig;
