/**
 * Challenge Phases service
 */
import { xhrPutAsync } from '~/libs/core'
import { EnvironmentConfig } from '~/config'

const challengePhaseBaseUrl = `${EnvironmentConfig.API.V6}`

export interface UpdateChallengePhaseRequest {
    isOpen: boolean
    duration?: number
}

/**
 * Update a challenge phase by id.
 * @param challengePhaseId phase identifier
 * @param payload update payload
 */
export const updateChallengePhase = async (
    challengePhaseId: string,
    payload: UpdateChallengePhaseRequest,
): Promise<void> => {
    await xhrPutAsync<UpdateChallengePhaseRequest, void>(
        `${challengePhaseBaseUrl}/challenge-phases/${challengePhaseId}`,
        payload,
    )
}
