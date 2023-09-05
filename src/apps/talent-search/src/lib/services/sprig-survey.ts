import { sprigTriggerForUser } from '~/libs/shared'
import { UserProfile } from '~/libs/core'

import { SPRIG_CES_SURVEY_ID } from '../../config'

export function triggerSprigSurvey(profile?: UserProfile): void {

    // eslint-disable-next-line no-console
    console.info(`Trigger sprig survey ${SPRIG_CES_SURVEY_ID}, ${profile}`)
    if (profile?.userId) {
        sprigTriggerForUser(SPRIG_CES_SURVEY_ID, profile?.userId)
    } else {
        sprigTriggerForUser(SPRIG_CES_SURVEY_ID)
    }
}
