import { EnvironmentConfig } from '../../../config'

import { GamificationConfigModel } from './gamification-config.model'
import { GamificationConfigDefault } from './gamification.default.config'
import { GamificationConfigDev } from './gamification.dev.config'
import { GamificationConfigProd } from './gamification.prod.config'

function getConfig(): GamificationConfigModel {

  switch (EnvironmentConfig.ENV) {

    case 'dev':
      return GamificationConfigDev

    case 'prod':
      return GamificationConfigProd

    default:
      return GamificationConfigDefault
  }
}

const GamificationConfig: GamificationConfigModel = {
  ...getConfig(),
}

export default GamificationConfig
