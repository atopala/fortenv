import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import { configs } from "typescript-eslint";

const sourceFiles = ["**/*.{ts,tsx,mts,js,jsx,mjs}"];

export default defineConfig(
   {
      ignores: [
         "**/dist/**",
         "**/.next/**",
         "**/out/**",
         "**/node_modules/**",
         "**/coverage/**",
         "**/.idea/**",
         "**/__snapshots__/**",
         // These files are parser inputs, including deliberately invalid/unused syntax.
         // Keep their test suites linted, but never auto-fix the inputs themselves.
         "packages/fortenv/src/core/__tests__/{01-locate-config,02-read-config,03-strip-types,04-validate-config,05-rewrite-imports,06-mock-imports,07-execute-config,08-extract-secrets}/**/*.{ts,mts,js,mjs}",
         "packages/fortenv/src/core/__tests__/13-pipeline/phase-1-discover/**/*.{ts,mts,js,mjs}",
         "!packages/fortenv/src/core/__tests__/**/*.test.ts",
      ],
   },
   {
      files: sourceFiles,
      extends: [
         js.configs.recommended,
         // Preserve config()'s outer file scope for every recommended entry, including JS/MJS.
         ...configs.recommended.map((recommended) => ({ ...recommended, files: sourceFiles })),
      ],
      languageOptions: { globals: globals.node },
      plugins: {
         "unused-imports": unusedImports,
         "simple-import-sort": simpleImportSort,
      },
      rules: {
         "@typescript-eslint/no-unused-vars": "off",
         "unused-imports/no-unused-imports": "error",
         "unused-imports/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" },
         ],
         "simple-import-sort/imports": "error",
         "simple-import-sort/exports": "error",
      },
   },
   {
      files: ["tests/02-cjs-consumer/**/*.js", "tests/fixtures/cjs-dependency/**/*.js"],
      languageOptions: { sourceType: "commonjs" },
      rules: {
         // These integration fixtures must exercise Node's actual CommonJS loader.
         "@typescript-eslint/no-require-imports": "off",
      },
   },
   {
      files: ["apps/website/**/*.{ts,tsx,js,jsx}"],
      languageOptions: { globals: { ...globals.node, ...globals.browser } },
   },
   {
      files: ["packages/fortenv/src/config.ts", "packages/fortenv/src/core/**/*.ts"],
      rules: {
         // ACLs and discovery track arbitrary function identities without invoking them.
         // Error.captureStackTrace also takes a function identity, not a call signature.
         "@typescript-eslint/no-unsafe-function-type": "off",
      },
   },
);
