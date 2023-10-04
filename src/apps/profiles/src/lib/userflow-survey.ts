import { TcUniNavFn } from 'universal-navigation'

import { CES_SURVEY_ID } from '../config'

declare let tcUniNav: TcUniNavFn

export function triggerSurvey(): void {
    tcUniNav('triggerFlow', CES_SURVEY_ID, {})
}
