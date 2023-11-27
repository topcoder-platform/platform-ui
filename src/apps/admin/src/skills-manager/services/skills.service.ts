import { omit } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { UserSkill, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.API.V5}/standardized-skills/skills`

export interface StandardizedSkill extends UserSkill {}

export const useFetchSkills = (): SWRResponse<StandardizedSkill[]> => {
    const url = `${baseUrl}?perPage=9999`

    const response = useSWR(url, xhrGetAsync<StandardizedSkill[]>, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })

    return response
}

export const saveStandardizedSkill = (category: StandardizedSkill)
: Promise<StandardizedSkill> => {
    const xhrSaveAsyncFn = category.id ? xhrPutAsync : xhrPostAsync
    const url = `${baseUrl}${category.id ? `/${category.id}` : ''}`

    return xhrSaveAsyncFn(url, omit(category, 'id'))
}
