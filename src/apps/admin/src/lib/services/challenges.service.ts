/**
 * Challenge service helpers
 */
import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

/**
 * Close a marathon match challenge
 * @param challengeId challenge id
 */
export const closeMarathonMatch = async (
    challengeId: string,
): Promise<void> => {
    await xhrPostAsync(
        `${EnvironmentConfig.API.V6}/challenges/${challengeId}/close-marathon-match`,
        {},
    )
}
