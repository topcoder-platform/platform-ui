module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
    },
    extends: [
        'plugin:react/recommended',
        'airbnb',
        'plugin:@typescript-eslint/recommended',
        'prettier'
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
        "@typescript-eslint/ban-types": [
            "error",
            {
                "extendDefaults": true,
                "types": {
                    "{}": false
                }
            }
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/strict-boolean-expressions': [
            'error',
            {
                allowNullableBoolean: true,
                allowNullableObject: true,
                allowNullableNumber: true,
                allowNullableString: true
            }
        ],
        'import/extensions': 'off',
        'import/prefer-default-export': 'off',
        'indent': [
            2,
            4,
            {
                SwitchCase: 1,
            },
        ],
        'jsx-a11y/tabindex-no-positive': [
            'warn'
        ],
        'no-extra-boolean-cast': "off",
        'no-plusplus': [
            'error',
            {
                allowForLoopAfterthoughts: true
            }
        ],
        'no-restricted-syntax': [
            'error',
            'ForIfStatement',
            'LabeledStatement',
            'WithStatement'
        ],
        'no-shadow': 'off',
        'no-use-before-define': [
            'error',
            {
                functions: false,
            }
        ],
        "padding-line-between-statements": [
            'error',
            { blankLine: 'always', prev: 'directive', next: '*' },
            { blankLine: 'any', prev: 'directive', next: 'directive' },
            { blankLine: 'always', prev: 'cjs-import', next: '*' },
            { blankLine: 'any', prev: 'cjs-import', next: 'cjs-import' },
            { blankLine: 'always', prev: 'cjs-export', next: '*' },
            { blankLine: 'always', prev: 'multiline-block-like', next: '*' },
            { blankLine: 'always', prev: 'class', next: '*' }
        ],
        'prefer-destructuring': 'off',
        'react-hooks/exhaustive-deps': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react/destructuring-assignment': [
            2,
            'never'
        ],
        'react/function-component-definition': [
            2,
            {
                namedComponents: 'arrow-function'
            }
        ],
        'react/jsx-filename-extension': [
            1,
            {
                extensions: [
                    '.tsx',
                    '.jsx',
                ]
            },
        ],
        'react/jsx-indent-props': [
            2,
            4,
        ],
        'react/jsx-indent': [
            2,
            4,
        ],
        'react/jsx-no-useless-fragment': [
            0
        ],
        'react/jsx-props-no-spreading': [
            0
        ],
        'react/react-in-jsx-scope': 'off',
        'react/require-default-props': 'off',
        'semi': [
            'error',
            'never',
        ],
    },
};
