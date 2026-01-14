/**
 * Challenge Phases service
 */
import { xhrPatchAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

const challengePhaseBaseUrl = `${EnvironmentConfig.API.V6}`

export interface UpdateChallengePhaseRequest {
    isOpen: boolean
    duration?: number
    scheduledEndDate?: string
}

/**
 * Update a challenge phase by id.
 * @param challengeId challenge identifier
 * @param challengePhaseId phase identifier
 * @param payload update payload
 */
export const updateChallengePhase = async (
    challengeId: string,
    challengePhaseId: string,
    payload: UpdateChallengePhaseRequest,
): Promise<void> => {
    await xhrPatchAsync<UpdateChallengePhaseRequest, void>(
        `${challengePhaseBaseUrl}/challenges/${challengeId}/phases/${challengePhaseId}`,
        payload,
    )
}
