import { getTcUniNav } from '~/apps/platform/src/utils'

import { CES_SURVEY_ID } from '../config'

export function triggerSurvey(): void {
    getTcUniNav()?.('triggerFlow', CES_SURVEY_ID, {})
}
