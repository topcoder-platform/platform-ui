import { datadogLogs } from '@datadog/browser-logs'

import { GlobalConfig } from '../../global-config.model'

export class LoggingService {

    initialize(config: GlobalConfig): void {

        // if we don't have a token,
        // logging isn't supported in this environment,
        // so don't initialize anything
        if (!config.LOGGING_TOKEN) {
            return
        }

        datadogLogs.init({
            clientToken: config.LOGGING_TOKEN,
            env: config.ENV,
            forwardErrorsToLogs: true,
        })
    }

    logError(message: string, messageContext: object): void {
        datadogLogs.logger.error(message, messageContext)
    }

    logInfo(message: string, messageContext: object): void {
        datadogLogs.logger.info(message, messageContext)
    }
}
