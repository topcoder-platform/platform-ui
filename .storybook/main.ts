import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";
import type { StorybookConfig } from "@storybook/react-webpack5";

import cracoConfig from '../craco.config';

const config: StorybookConfig = {
  stories: ["../src/**/*.docs.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/preset-create-react-app",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../public"],
  webpackFinal: async (config, { configType }) => {

    if (config.resolve) {
        config.resolve.plugins = [
            ...(config.resolve.plugins ?? []),
            new TsconfigPathsPlugin()
        ];
        config.resolve.alias = {
            ...config.resolve.alias,
            ...cracoConfig.webpack.alias,
        };
    }

    return {
        ...config,
        plugins: config.plugins?.filter(plugin => {
          if (plugin.constructor.name === 'ESLintWebpackPlugin') {
            return false
          }
          return true
        }),
    };
  }
};
export default config;
