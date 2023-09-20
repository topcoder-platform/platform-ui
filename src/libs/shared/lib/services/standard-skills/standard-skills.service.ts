import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

import { Skill } from './skill.model'

const baseUrl = `${EnvironmentConfig.API.V5}/emsi-skills/member-emsi-skills`

export async function autoCompleteSkills(queryTerm: string): Promise<Skill[]> {
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
): Promise<Skill[]> {
    const url = `${baseUrl}/${userId}?pageFlag=${!config.skipPagination}`
    return xhrGetAsync(url)
}

export async function createMemberSkills(userId: number, skills: Skill[]): Promise<void> {
    return xhrPostAsync(baseUrl, {
        skills,
        userId,
    })
}

export async function updateMemberSkills(userId: string | number, skills: Skill[]): Promise<void> {
    return xhrPutAsync(`${baseUrl}/${userId}`, {
        skills,
    })
}
