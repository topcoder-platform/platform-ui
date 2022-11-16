import task from '@cypress/code-coverage/task'
import { defineConfig } from 'cypress'

export default defineConfig({
    defaultCommandTimeout: 10000,
    e2e: {
        // baseUrl: 'https://local.topcoder-dev.com',
        baseUrl: 'http://localhost:3000',
        setupNodeEvents: setUpNodeEvents,
        specPattern: 'cypress/e2e/**/*.spec.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/e2e.ts',
        viewportHeight: 1000,
        viewportWidth: 1280,
    },
    fixturesFolder: false,
    reporter: 'junit',
    reporterOptions: {
        mochaFile: 'cypress/test-report/test-result-[hash].xml',
        toConsole: false,
    },
    screenshotOnRunFailure: true,
    video: true,
})

// adds the config to node setup events
function setUpNodeEvents(
    on: Cypress.PluginEvents,
    config: Cypress.PluginConfigOptions
): Cypress.PluginConfigOptions {
    task(on, config)
    return config
}
