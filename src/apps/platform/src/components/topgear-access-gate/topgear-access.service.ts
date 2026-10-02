import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

/**
 * Checks Wipro - All membership using the authenticated Groups API, including
 * active parent-group memberships resolved by that API. Used before mounting
 * any routes on the Topgear host; neither email nor a cookie alone grants access.
 *
 * @param memberId ID from the signed-in profile, never from URL parameters.
 * @param signal cancels an obsolete membership check when the user or route changes.
 * @returns true only when the configured access group is in the API response.
 * @throws Propagates HTTP, timeout, cancellation, and malformed-response errors.
 */
export async function hasTopgearAccess(memberId: string, signal?: AbortSignal): Promise<boolean> {
    const groupId = EnvironmentConfig.TOPGEAR.ACCESS_GROUP_ID.trim()
    if (!memberId.trim() || !groupId) return false

    const groups = await xhrGetAsync<unknown>(
        `${EnvironmentConfig.API.V6}/groups/memberGroups/${encodeURIComponent(memberId)}?uuid=true`,
        undefined,
        { signal, timeout: 15000 },
    )
    if (!Array.isArray(groups) || groups.some(group => typeof group !== 'string')) {
        throw new Error('Invalid group membership response')
    }

    return groups.includes(groupId)
}
