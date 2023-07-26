import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

import { EmsiSkill, Skill } from './skill.model'

const baseUrl = `${EnvironmentConfig.API.V5}/emsi-skills/member-emsi-skills`

export async function autoCompleteSkills(queryTerm: string): Promise<Skill[]> {
    return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/skills/auto-complete?term=${queryTerm}`)
}

export type FetchMemberSkillsConfig = {
    skipPagination: boolean
}
export async function fetchMemberSkills(
    userId: string | number | undefined,
    config: FetchMemberSkillsConfig,
): Promise<EmsiSkill[]> {
    const url = `${baseUrl}/${userId}?pageFlag=${!config.skipPagination}`
    return xhrGetAsync(url)
}

export async function createMemberEmsiSkills(userId: number, skills: Skill[]): Promise<void> {
    return xhrPostAsync(baseUrl, {
        emsiSkills: skills,
        userId,
    })
}

export async function updateMemberEmsiSkills(userId: string | number, skills: Skill[]): Promise<void> {
    return xhrPutAsync(`${baseUrl}/${userId}`, {
        emsiSkills: skills,
    })
}
