import { EnvironmentConfig } from '~/config'
import { UserSkill, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.API.V5}/standardized-skills`

export interface UpdateUserSkillDTO {
    id: string
    levelId?: string
    displatModeId?: string
}

export async function autoCompleteSkills(queryTerm: string): Promise<UserSkill[]> {
    if (!queryTerm) {
        return Promise.resolve([])
    }

    const encodedQuery = encodeURIComponent(queryTerm)
    return xhrGetAsync(`${baseUrl}/skills/autocomplete?term=${encodedQuery}`)
}

export type FetchMemberSkillsConfig = {
    skipPagination: boolean
}
export async function fetchMemberSkills(
    userId: string | number | undefined,
    config: FetchMemberSkillsConfig,
): Promise<UserSkill[]> {
    const url = `${baseUrl}/user-skills/${userId}?disablePagination=${config.skipPagination}`
    return xhrGetAsync(url)
}

export async function createMemberSkills(userId: number, skills: UpdateUserSkillDTO[]): Promise<void> {
    return xhrPostAsync(`${baseUrl}/user-skills/${userId}`, {
        skills,
    })
}

export async function updateMemberSkills(
    userId: string | number,
    skills: UpdateUserSkillDTO[],
): Promise<void> {
    return xhrPutAsync(`${baseUrl}/user-skills/${userId}`, {
        skills,
    })
}

/**
 * Fetch skills by their IDs
 * @param skillIds Array of skill UUIDs
 * @returns Promise with array of UserSkill objects
 */
export async function fetchSkillsByIds(skillIds: string[]): Promise<UserSkill[]> {
    if (!skillIds || skillIds.length === 0) {
        return Promise.resolve([])
    }

    try {
        const skillPromises = skillIds.map(skillId => xhrGetAsync<UserSkill>(`${baseUrl}/skills/${skillId}`)
            .catch(() => undefined))
        const results = await Promise.all(skillPromises)
        return results.filter((skill): skill is UserSkill => (skill !== null || skill !== undefined))
    } catch {
        return []
    }
}
