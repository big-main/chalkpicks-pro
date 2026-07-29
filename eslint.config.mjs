import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  // Base recommended rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // React Hooks + Accessibility
  {
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      // React Hooks enforcement
      ...reactHooks.configs.recommended.rules,
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",

      // Downgrade low-priority rules to warn
      "no-empty": "warn",
      "no-useless-assignment": "warn",
      "no-constant-condition": "warn",
      "no-useless-escape": "warn",
      "preserve-caught-error": "off",

      // Clean code — no stray console.log in production
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",

      // TypeScript strictness
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-undef": "off",

      // Code quality
      "prefer-const": "error",
      eqeqeq: ["error", "always"],

      // Accessibility (SEO ranking signal)
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/heading-has-content": "error",
    },
  },

  // Ignore patterns
  {
    ignores: [
      "dist/",
      "node_modules/",
      ".manus-logs/",
      "coverage/",
      "drizzle/meta/",
      "scripts/",
      "plugins/",
      "cloud-computer/",
      "*.config.js",
      "*.config.cjs",
      "*.config.mjs",
      "*.mjs",
      "postcss.config.js",
      "tailwind.config.ts",
      "seed-promo-codes.mjs",
      "seed-admin.ts",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
  }
);
