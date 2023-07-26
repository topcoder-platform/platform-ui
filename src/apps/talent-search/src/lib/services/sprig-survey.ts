import { sprigTriggerForUser } from '~/libs/shared'
import { UserProfile } from '~/libs/core'

import { SPRIG_CES_SURVEY_ID } from '../../config'

export function triggerSprigSurvey({ userId }: UserProfile): void {
    sprigTriggerForUser(SPRIG_CES_SURVEY_ID, userId)
}
