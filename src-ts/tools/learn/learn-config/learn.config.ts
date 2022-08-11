import { AppHostEnvironment } from '../../../config'

import { LearnConfigModel } from './learn-config.model'
import { LearnConfigBsouza } from './learn.bsouza.config'
import { LearnConfigDefault } from './learn.default.config'
import { LearnConfigDev } from './learn.dev.config'
import { LearnConfigProd } from './learn.prod.config'

function getConfig(): LearnConfigModel {

    switch (process.env.REACT_APP_HOST_ENV) {

        case AppHostEnvironment.bsouza:
            return LearnConfigBsouza

        case AppHostEnvironment.dev:
            return LearnConfigDev

        case AppHostEnvironment.prod:
            return LearnConfigProd

        default:
            return LearnConfigDefault
    }
}

const LearnConfig: LearnConfigModel = {
    ...getConfig(),
}

export default LearnConfig
