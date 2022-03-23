import { datadogLogs } from '@datadog/browser-logs'

import { GlobalConfig } from '../../global-config.model'

export function initialize(config: GlobalConfig): void {

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

<<<<<<< HEAD
    logInfo(`initialized logging for ${config.ENV}`)
}

export function logError(message: string, messageContext?: object): void {
    datadogLogs.logger.error(message, messageContext)
}

export function logInfo(message: string, messageContext?: object): void {
=======
    info(`initialized logging for ${config.ENV}`)
}

export function error(message: string, messageContext?: object): void {
    datadogLogs.logger.error(message, messageContext)
}

export function info(message: string, messageContext?: object): void {
>>>>>>> 8d9133682a2e4e8acdf9951b5bce491329744b22
    datadogLogs.logger.info(message, messageContext)
}
