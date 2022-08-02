import { FC } from 'react'
import TagManager from 'react-gtm-module'

import { EnvironmentConfig } from '../../../config'

const GoogleTagManager: FC<{}> = () => {

    // if we  have an ID
    // then tags are supported in this environment,
    // so initialize them
    if (!!EnvironmentConfig.ANALYTICS.TAG_MANAGER_ID) {
        TagManager.initialize({
            gtmId: EnvironmentConfig.ANALYTICS.TAG_MANAGER_ID,
        })
    }

    return <></>
}

export default GoogleTagManager
