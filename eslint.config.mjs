import js from "@eslint/js";
import tseslint from "typescript-eslint";

const fakePlugin = {
  rules: {
    "exhaustive-deps": { create: () => ({}) },
    "no-img-element": { create: () => ({}) },
    "media-has-caption": { create: () => ({}) }
  }
};

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": fakePlugin,
      "@next/next": fakePlugin,
      "jsx-a11y": fakePlugin
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-eval": "error",
      "prefer-const": "warn",
      "no-duplicate-imports": "warn",
      "no-useless-assignment": "warn",
      "no-empty": "warn"
    },
  },
  {
    ignores: [".next/**", "node_modules/**"],
  }
);
