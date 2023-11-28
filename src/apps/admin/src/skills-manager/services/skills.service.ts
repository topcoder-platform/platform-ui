import { omit } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { UserSkill, xhrDeleteAsync, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

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

export const saveStandardizedSkill = (skill: StandardizedSkill): Promise<StandardizedSkill> => {
    const xhrSaveAsyncFn = skill.id ? xhrPutAsync : xhrPostAsync
    const url = `${baseUrl}${skill.id ? `/${skill.id}` : ''}`

    return xhrSaveAsyncFn(url, omit(skill, 'id'))
}

export const archiveStandardizedSkill = (skill: StandardizedSkill): Promise<StandardizedSkill> => {
    const url = `${baseUrl}/${skill.id}`

    return xhrDeleteAsync(url)
}
