import { defineConfig } from 'cypress'

export default defineConfig({
  fixturesFolder: false,
  video: false,
  screenshotOnRunFailure: false,
  defaultCommandTimeout: 10000,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: "cypress/e2e/**/*.spec.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/e2e.ts",
    viewportHeight: 1000,
    viewportWidth: 1280,
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config)
      return config;
    },
  },
})
