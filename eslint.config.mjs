// @ts-check
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Archivos ignorados
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "*.config.{js,mjs,ts,mts}",
    ],
  },

  // Base JS
  js.configs.recommended,

  // TypeScript + React — producción y tests
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // TypeScript
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",

      // React
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",  // Next.js no requiere importar React
      "react/prop-types": "off",          // TypeScript cubre esto

      // Hooks
      ...hooksPlugin.configs.recommended.rules,

      // General — permitir console.warn/error (usados en schema validator)
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];
