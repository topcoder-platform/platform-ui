import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

/**
 * Verify a set of skills for a member in member-api-v6.
 * Ensures association exists and sets level to 'verified'.
 */
export async function verifyMemberSkills(handle: string, skillIds: string[]): Promise<void> {
    if (!handle || !skillIds?.length) return

    const url = `${EnvironmentConfig.API.V6}/members/${handle}/skills/verify`
    await xhrPostAsync(url, { skillIds })
}
