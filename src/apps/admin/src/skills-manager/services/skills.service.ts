import { omit, pick } from 'lodash'
import qs from 'qs'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { UserSkill, xhrDeleteAsync, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.STANDARDIZED_SKILLS_API}/skills`

export interface StandardizedSkill extends UserSkill {
    deleted_at: string | null
    categoryId?: string
}

export const useFetchSkills = (showArchived?: boolean): SWRResponse<StandardizedSkill[]> => {
    const params = qs.stringify({
        disablePagination: true,
        showArchived,
    })
    const url = `${baseUrl}?${params}`

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

export const archiveStandardizedSkill = (skill: StandardizedSkill): Promise<void> => {
    const url = `${baseUrl}/${skill.id}`

    return xhrDeleteAsync(url)
}

export const restoreArchivedStandardizedSkill = (skill: StandardizedSkill): Promise<void> => {
    const url = `${baseUrl}/${skill.id}/restore`

    return xhrPutAsync(url, {})
}

export const bulkArchiveStandardizedSkills = (skills: StandardizedSkill[]): Promise<void[]> => (
    Promise.all(skills.map(archiveStandardizedSkill))
)

export const bulkUpdateStandardizedSkills = (
    skills: StandardizedSkill[],
    updates: Partial<StandardizedSkill>,
): Promise<StandardizedSkill[]> => {
    const promises = skills.map(skill => {
        const url = `${baseUrl}/${skill.id}`

        return xhrPutAsync(
            url,
            pick({ ...skill, ...updates }, 'name', 'description', 'categoryId'),
        ) as Promise<StandardizedSkill>
    })

    return Promise.all(promises)
}
