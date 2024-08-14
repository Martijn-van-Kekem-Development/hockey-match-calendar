import globals from "globals";
import pluginJs from "@eslint/js";
import stylistic from '@stylistic/eslint-plugin';
import tseslint from "typescript-eslint";

export default [
    {
        ignores: ["docs/**"],
    },
    {
        files: ["**/*.ts"],
    },
    {
        plugins: {
            "@stylistic": stylistic
        },
        languageOptions: {
            globals: globals.es2021
        }
    },
    {
        rules: {
            "prefer-const": ["error", {
                "destructuring": "all"
            }],
            "@stylistic/brace-style": ["error", "1tbs"],
            "@stylistic/comma-spacing": ["error", { before: false, after: true }],
            "block-scoped-var": "error",
            "@stylistic/comma-style": ["error", "last"],
            "@stylistic/arrow-spacing": ["error", { before: true, after: true }],
            "@stylistic/key-spacing": ["error", { beforeColon: false, afterColon: true, mode: "minimum" }],
            "@stylistic/no-mixed-spaces-and-tabs": "error",
            "@stylistic/no-trailing-spaces": "error",
            "@stylistic/space-in-parens": ["error", "never"],
            "@stylistic/space-before-function-paren": ["error", { anonymous: "never", named: "never" }],
            "@stylistic/semi": ["error", "always"],
            "no-unused-vars": ["error", { vars: "all", args: "all" }],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/array-bracket-spacing": ["error", "never"],
            "@stylistic/linebreak-style": ["error", "windows"],
            "@stylistic/rest-spread-spacing": ["error", "never"],
            "@stylistic/dot-location": ["error", "property"],
            "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0, maxBOF: 0 }],
            "@stylistic/operator-linebreak": ["error", "after", { overrides: { ":": "before", "?": "before" } }],
            "@stylistic/object-property-newline": ["error", { allowMultiplePropertiesPerLine: true }],
            "@stylistic/no-whitespace-before-property": "error",
            "@stylistic/max-statements-per-line": ["error", { max: 1 }],
            "no-var": "error"
        },
    },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended
];