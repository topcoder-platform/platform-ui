module.exports = {
    "stories": [
        "../src-ts/**/*.stories.mdx",
        "../src-ts/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    "addons": [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions",
        "@storybook/preset-create-react-app",
        "storybook-addon-react-router-v6"
    ],
    "framework": "@storybook/react",
    "core": {
        "builder": "@storybook/builder-webpack5"
    }
}