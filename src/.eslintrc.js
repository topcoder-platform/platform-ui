module.exports = {
  root: true,
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      env: {
        browser: true,
        es2021: true,
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
    },
    {
      // linting rules for ts files
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:react/recommended',
        'airbnb',
        'plugin:@typescript-eslint/recommended',
        'plugin:ordered-imports/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        useJSXTextNode: true,
        project: './tsconfig.json',
        tsconfigRootDir: '.',
        tsx: true,
        jsx: true,
        sourceType: 'module',
      },
      plugins: [
        '@typescript-eslint',
        'unicorn',
        'ordered-imports',
        'react',
        'react-hooks',
      ],
      settings: {
        'import/resolver': {
          typescript: {},
        },
      },
      rules: {
        '@typescript-eslint/ban-types': [
          'error',
          {
            extendDefaults: true,
            types: {
              '{}': false,
            },
          },
        ],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
          },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        '@typescript-eslint/no-shadow': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/typedef': [
          'error',
          {
            arrowParameter: false,
            propertyDeclaration: true,
            parameter: true,
            memberVariableDeclaration: true,
            callSignature: true,
            variableDeclaration: true,
            arrayDestructuring: false,
            objectDestructuring: true,
          },
        ],
        'arrow-parens': [
          'error',
          'as-needed',
        ],
        complexity: [
          'error',
          14,
        ],
        'import/extensions': 'off',
        'import/no-named-default': 'off',
        'import/prefer-default-export': 'off',
        indent: [
          2,
          4,
          {
            SwitchCase: 1,
          },
        ],
        'jsx-quotes': [
          'error',
          'prefer-single',
        ],
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-noninteractive-element-interactions': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/tabindex-no-positive': [
          'warn',
        ],
        'newline-per-chained-call': [
          'error',
          {
            ignoreChainWithDepth: 1,
          },
        ],
        'max-len': [
          'error',
          120,
        ],
        'no-empty': ['error', { allowEmptyCatch: true }],
        'no-extra-boolean-cast': 'off',
        'no-nested-ternary': 'off',
        'unicorn/no-null': 'error',
        'no-param-reassign': [
          'error',
          {
            props: false,
          },
        ],
        'no-plusplus': [
          'error',
          {
            allowForLoopAfterthoughts: true,
          },
        ],
        'no-restricted-syntax': [
          'error',
          'ForIfStatement',
          'LabeledStatement',
          'WithStatement',
        ],
        'no-shadow': 'off',
        'no-use-before-define': [
          'error',
          {
            functions: false,
          },
        ],
        'object-curly-newline': 'off',
        'operator-linebreak': [
          'error',
          'before',
        ],
        'ordered-imports/ordered-imports': [
          'error',
          {
            'symbols-first': true,
            'declaration-ordering': [
              'type', {
                ordering: [
                  'namespace',
                  'destructured',
                  'default',
                  'side-effect',
                ],
                secondaryOrdering: [
                  'name',
                  'lowercase-last',
                ],
              },
            ],
            'specifier-ordering': 'case-insensitive',
            'group-ordering': [
              {
                name: 'project root',
                match: '^[@~]',
                order: 20,
              },
              {
                name: 'parent directories',
                match: '^\\.\\.',
                order: 30,
              },
              {
                name: 'current directory',
                match: '^\\.',
                order: 40,
              },
              {
                name: 'third-party',
                match: '.*',
                order: 10,
              },
            ],
          },
        ],
        'padded-blocks': 'off',
        'padding-line-between-statements': [
          'error',
          {
            blankLine: 'always',
            prev: 'directive',
            next: '*',
          },
          {
            blankLine: 'any',
            prev: 'directive',
            next: 'directive',
          },
          {
            blankLine: 'always',
            prev: 'cjs-import',
            next: '*',
          },
          {
            blankLine: 'any',
            prev: 'cjs-import',
            next: 'cjs-import',
          },
          {
            blankLine: 'always',
            prev: 'cjs-export',
            next: '*',
          },
          {
            blankLine: 'always',
            prev: 'multiline-block-like',
            next: '*',
          },
          {
            blankLine: 'always',
            prev: 'class',
            next: '*',
          },
        ],
        'prefer-destructuring': 'off',
        'react-hooks/exhaustive-deps': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react/destructuring-assignment': [
          2,
          'never',
        ],
        'react/function-component-definition': [
          'error',
          {
            namedComponents: 'arrow-function',
            unnamedComponents: 'function-expression',
          },
        ],
        'react/jsx-filename-extension': [
          1,
          {
            extensions: [
              '.tsx',
              '.jsx',
            ],
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
        'react/jsx-no-bind': [
          'error',
          {
            allowFunctions: true,
          },
        ],
        'react/jsx-no-useless-fragment': [
          0,
        ],
        'react/jsx-props-no-spreading': [
          0,
        ],
        'react/no-danger': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/require-default-props': 'off',
        semi: [
          'error',
          'never',
        ],
        'sort-keys': 'error',
      },
    },
    // linting rules for js files
    {
      files: ['./apps/**/*.jsx', './apps/**/*.js'],
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
        'react-hooks',
      ],
    },
  ],
};
