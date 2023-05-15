import useSWR, { SWRResponse } from 'swr'

import { UserSkills } from '../user-skill.model'
import { getProfileUrl } from '../profile-functions'

export function useMemberSkills(handle?: string): UserSkills | undefined {
    const { data }: SWRResponse = useSWR(handle ? `${getProfileUrl(handle)}/skills` : undefined)

    return data?.skills
}
