import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { UserSkill, xhrGetAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.API.V5}/standardized-skills`

export interface StandardizedSkill extends UserSkill {}

export const useFetchSkills = (): StandardizedSkill[] | undefined => {
    const url = `${baseUrl}/skills?perPage=9999`

    const { data: allSkills }: SWRResponse<StandardizedSkill[]>
    = useSWR(url, xhrGetAsync<StandardizedSkill[]>, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })

    return allSkills
}
