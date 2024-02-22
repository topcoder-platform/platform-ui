import { omit } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { UserSkillCategory, xhrDeleteAsync, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.STANDARDIZED_SKILLS_API}/categories`

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StandardizedSkillCategory extends UserSkillCategory {}

export const useFetchCategories = (): SWRResponse<StandardizedSkillCategory[]> => {
    const url = `${baseUrl}?disablePagination=true&sortBy=name`

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

export const archiveStandardizedSkillCategory = (category: StandardizedSkillCategory)
: Promise<void> => {
    const url = `${baseUrl}/${category.id}`

    return xhrDeleteAsync(url)
}
