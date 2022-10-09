import { EnvironmentConfig } from '../../../config'

import { LearnConfigModel } from './learn-config.model'
import { LearnConfigBrooke } from './learn.brooke.config'
import { LearnConfigDefault } from './learn.default.config'
import { LearnConfigDev } from './learn.dev.config'
import { LearnConfigProd } from './learn.prod.config'

function getConfig(): LearnConfigModel {

    switch (EnvironmentConfig.ENV) {

        case 'brooke':
            return LearnConfigBrooke

        case 'dev':
            return LearnConfigDev

        case 'prod':
            return LearnConfigProd

        default:
            return LearnConfigDefault
    }
}

const LearnConfig: LearnConfigModel = {
    ...getConfig(),
}

export default LearnConfig
