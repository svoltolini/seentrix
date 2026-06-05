import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Allow intentionally-unused identifiers when prefixed with `_`
  // (e.g. required-by-contract props or destructured-but-ignored values).
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Two effects intentionally reset/refresh state in response to an
  // external change (sheet close / step change, and a server-action
  // result). They run conditionally — not on every render — so the
  // cascading-render concern behind `set-state-in-effect` does not apply.
  // The React-Compiler rule's inline `eslint-disable` directives are not
  // honored reliably in this flat-config setup, so we scope the exception
  // to these two files. See the in-file comments above each effect.
  {
    files: [
      // Bracket chars in the route paths are glob metacharacters, so match
      // by filename suffix instead of the literal `[locale]`/`[productId]`.
      "**/conformity-content.tsx",
      "**/product-overview.tsx",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      // product-overview intentionally omits the stable local helper
      // `resetImageState` from its effect deps (see in-file comment).
      "react-hooks/exhaustive-deps": "off",
    },
  },
  // react-hook-form's `watch()` returns a function the React Compiler
  // cannot memoize. The usage here (reading a single field for a derived
  // value) is correct and standard, so silence the compiler's warning for
  // these auth forms rather than restructuring the library's API.
  {
    files: [
      "**/change-password-form.tsx",
      "**/reset-password-form.tsx",
      "**/signup-form.tsx",
    ],
    rules: {
      "react-hooks/incompatible-library": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
