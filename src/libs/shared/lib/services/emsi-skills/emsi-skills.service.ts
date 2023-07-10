import { EnvironmentConfig } from '~/config'
import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

import { EmsiSkill, Skill } from './skill.model'

export async function autoCompleteSkills(queryTerm: string): Promise<Skill[]> {
    return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/skills/auto-complete?term=${queryTerm}`)
}

export async function fetchMemberSkills(userId?: string | number): Promise<EmsiSkill[]> {
    return xhrGetAsync(`${EnvironmentConfig.API.V5}/emsi-skills/member-emsi-skills/${userId}`)
}

export async function createMemberEmsiSkills(userId: number, skills: Skill[]): Promise<void> {
    return xhrPostAsync(`${EnvironmentConfig.API.V5}/emsi-skills/member-emsi-skills`, {
        emsiSkills: skills,
        userId,
    })
}

export async function updateMemberEmsiSkills(userId: string | number, skills: Skill[]): Promise<void> {
    return xhrPutAsync(`${EnvironmentConfig.API.V5}/emsi-skills/member-emsi-skills/${userId}`, {
        emsiSkills: skills,
    })
}
