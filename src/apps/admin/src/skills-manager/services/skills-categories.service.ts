import { omit } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { UserSkillCategory, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.API.V5}/standardized-skills/categories`

export interface StandardizedSkillCategory extends UserSkillCategory {}

export const useFetchCategories = (): SWRResponse<StandardizedSkillCategory[]> => {
    const url = `${baseUrl}?perPage=9999`

    const response = useSWR(url, xhrGetAsync<StandardizedSkillCategory[]>, {
        refreshInterval: 0,
        revalidateOnFocus: false,
    })

    return response
}

export const saveStandardizedSkillCategory = (category: StandardizedSkillCategory)
: Promise<StandardizedSkillCategory> => {
    const xhrSaveAsyncFn = category.id ? xhrPutAsync : xhrPostAsync
    const url = `${baseUrl}${category.id ? `/${category.id}` : ''}`

    return xhrSaveAsyncFn(url, omit(category, 'id'))
}
