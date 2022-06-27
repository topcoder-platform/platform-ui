import { GlobalConfig } from '../../lib'
import { ToolTitle } from '../constants'

import { AppHostEnvironment } from './app-host-environment.enum'
import { EnvironmentConfigDefault } from './environment.default.config'

export const EnvironmentConfigProd: GlobalConfig = {
    ...EnvironmentConfigDefault,
    API: {
        V3: 'https://api.topcoder.com/v3',
        V5: 'https://api.topcoder.com/v5',
    },
    DISABLED_TOOLS: [
        ToolTitle.designLib,
    ],
    ENV: AppHostEnvironment.prod,
    TAG_MANAGER_ID: 'GTM-MXXQHG8',
    URL: {
        ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder.com',
    },
}
