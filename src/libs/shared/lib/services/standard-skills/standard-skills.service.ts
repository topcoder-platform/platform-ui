import { EnvironmentConfig } from '~/config'
import { SearchUserSkill, UserSkill, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

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

export async function fetchSkillsByIds(skillIds: string[]): Promise<SearchUserSkill[]> {
    const uniqueIds = Array.from(new Set(skillIds.filter(Boolean)))
    if (!uniqueIds.length) {
        return []
    }

    const params = new URLSearchParams()
    uniqueIds.forEach(skillId => params.append('skillId', skillId))
    params.set('disablePagination', 'true')

    return xhrGetAsync(`${baseUrl}/skills?${params.toString()}`)
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
