import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { UserSkillCategory, xhrGetAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.API.V5}/standardized-skills`

export interface StandardizedSkillCategory extends UserSkillCategory {}

export const useFetchCategories = (): StandardizedSkillCategory[] | undefined => {
    const url = `${baseUrl}/categories?perPage=9999`

    const { data: allCategories }: SWRResponse<StandardizedSkillCategory[]>
    = useSWR(url, xhrGetAsync<StandardizedSkillCategory[]>, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })

    return allCategories
}
