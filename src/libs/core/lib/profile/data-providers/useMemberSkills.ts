import { keys } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { UserSkill } from '../user-skill.model'
import { getProfileUrl } from '../profile-functions'

// This is currently providing legacy TC skills, not EMSI!
export function useMemberSkills(handle?: string): UserSkill[] | undefined {
    const { data }: SWRResponse = useSWR(handle ? `${getProfileUrl(handle)}/skills` : undefined)

    const skills: UserSkill[] | undefined
        = data?.skills ? keys(data.skills)
            .map(skillKey => ({ id: skillKey, ...data.skills[skillKey] }))
            // sort by challenge verified first
            .sort((a, b) => b.sources.indexOf('CHALLENGE') - a.sources.indexOf('CHALLENGE')) : undefined

    return skills
}
