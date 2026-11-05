import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

import type {
    CreateEngagementLeadIntakeRequest,
    CreateWiproDirectEngagementLeadIntakeRequest,
    EngagementLeadIntakeResponse,
} from '../models'

const LEADS_URL = `${EnvironmentConfig.API.V6}/engagements/engagement-leads`

export const submitEngagementLeadIntake = async (
    data: CreateEngagementLeadIntakeRequest,
): Promise<EngagementLeadIntakeResponse> => (
    xhrPostAsync<CreateEngagementLeadIntakeRequest, EngagementLeadIntakeResponse>(
        `${LEADS_URL}/intake`,
        data,
    )
)

export const submitWiproDirectEngagementLeadIntake = async (
    data: CreateWiproDirectEngagementLeadIntakeRequest,
): Promise<EngagementLeadIntakeResponse> => (
    xhrPostAsync<CreateWiproDirectEngagementLeadIntakeRequest, EngagementLeadIntakeResponse>(
        `${LEADS_URL}/intake/wipro-direct`,
        data,
    )
)
