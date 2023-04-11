module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        jest: true,
    },
    extends: [
        'react-app',
        'react-app/jest',
    ],
    parserOptions: {
        useJSXTextNode: true,
        jsx: true,
        sourceType: 'module',
    },
    plugins: [
        'react',
    ],
    settings: {
        react: {
            version: 'detect',
        },
    },
    rules: {
        'no-useless-escape': 0,
    },
}
