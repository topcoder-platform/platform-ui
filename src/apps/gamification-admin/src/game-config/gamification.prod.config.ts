import { GamificationConfigModel } from './gamification-config.model'
import { GamificationConfigDefault } from './gamification.default.config'

export const GamificationConfigProd: GamificationConfigModel = {
    ...GamificationConfigDefault,
    ORG_ID: 'e111f8df-6ac8-44d1-b4da-bb916f5e3425',
}
