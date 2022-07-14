module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'plugin:react/recommended',
        'airbnb',
        "plugin:@typescript-eslint/recommended"
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        useJSXTextNode: true,
        project: "./tsconfig.json",
        tsconfigRootDir: ".",
        tsx: true,
        jsx: true,
        sourceType: 'module',
    },
    plugins: [
        'react',
        '@typescript-eslint',
        'react-hooks',
    ],
    settings: {
        react: {
            "version": "detect"
        },
        "import/resolver": {
            typescript: {},
        }
    },
    rules: {
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/no-shadow": "error",
        "import/extensions": "off",
        "import/prefer-default-export": "off",
        "indent": [2, 4],
        "no-shadow": "off",
        "react-hooks/exhaustive-deps": "warn",
        "react-hooks/rules-of-hooks": "error",
        "react/function-component-definition": [2, { "namedComponents": "arrow-function" }],
        "react/jsx-filename-extension": [1, { "extensions": [".tsx", ".jsx"] }],
        "react/jsx-indent-props": [2, 4],
        "react/jsx-indent": [2, 4],
        "react/jsx-props-no-spreading": [2, {html: "ignore"}],
        "react/react-in-jsx-scope": "off",
        "react/require-default-props": "off",
        "semi": ["error", "never"],
    },
};
