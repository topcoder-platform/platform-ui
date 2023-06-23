import { datadogLogs } from '@datadog/browser-logs'
import { EnvironmentConfig, GlobalConfig } from '~/config'

let initialized: boolean = false

export function initialize(config: GlobalConfig): void {
    if (initialized) {
        return
    }

    // if we don't have a token and service,
    // logging isn't supported in this environment,
    // so don't initialize anything
    if (!config.LOGGING?.PUBLIC_TOKEN || !config.LOGGING?.SERVICE) {
        return
    }

    datadogLogs.init({
        clientToken: config.LOGGING.PUBLIC_TOKEN,
        env: config.ENV,
        service: config.LOGGING.SERVICE,
        silentMultipleInit: true,
    })

    initialized = true
    info(`initialized logging for ${config.ENV}`)
}

export function error(message: string, messageContext?: object): void {
    initialize(EnvironmentConfig)

    datadogLogs.logger.error(message, messageContext)
}

export function info(message: string, messageContext?: object): void {
    initialize(EnvironmentConfig)

    datadogLogs.logger.info(message, messageContext)
}
