import { sprigTriggerForUser } from '~/libs/shared'
import { UserProfile } from '~/libs/core'

import { SPRIG_CES_SURVEY_ID } from '../../config'

export function triggerSprigSurvey(profile?: UserProfile): void {
    if (profile?.userId) {
        sprigTriggerForUser(SPRIG_CES_SURVEY_ID, profile?.userId)
    } else {
        sprigTriggerForUser(SPRIG_CES_SURVEY_ID)
    }
}
