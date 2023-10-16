import { EnvironmentConfig } from '~/config'
import { UserSkill, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.API.V5}/emsi-skills/member-emsi-skills`

export async function autoCompleteSkills(queryTerm: string): Promise<UserSkill[]> {
    if (!queryTerm) {
        return Promise.resolve([])
    }

    const encodedQuery = encodeURIComponent(queryTerm)
    return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/skills/auto-complete?term=${encodedQuery}`)
}

export type FetchMemberSkillsConfig = {
    skipPagination: boolean
}
export async function fetchMemberSkills(
    userId: string | number | undefined,
    config: FetchMemberSkillsConfig,
): Promise<UserSkill[]> {
    const url = `${baseUrl}/${userId}?pageFlag=${!config.skipPagination}`
    return xhrGetAsync(url)
}

export async function createMemberSkills(userId: number, skills: UserSkill[]): Promise<void> {
    return xhrPostAsync(baseUrl, {
        skills,
        userId,
    })
}

export async function updateMemberSkills(userId: string | number, skills: UserSkill[]): Promise<void> {
    return xhrPutAsync(`${baseUrl}/${userId}`, {
        skills,
    })
}
