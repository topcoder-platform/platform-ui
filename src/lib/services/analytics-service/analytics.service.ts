import TagManager from 'react-gtm-module'

import { GlobalConfig } from '../../global-config.model'

export class AnalyticsService {

    initializeTagManager(config: GlobalConfig): void {

        // if we don't have an ID
        // then tags aren't supported in this environment,
        // so don't initialize anything
        if (!config.TAG_MANAGER_ID) {
            return
        }

        TagManager.initialize({
            gtmId: config.TAG_MANAGER_ID,
        })
    }
}
