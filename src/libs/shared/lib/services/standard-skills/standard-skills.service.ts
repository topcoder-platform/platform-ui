import { useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { SearchUserSkill, UserSkill, xhrGetAsync, xhrPostAsync, xhrPutAsync } from '~/libs/core'

const baseUrl = `${EnvironmentConfig.API.V5}/standardized-skills`

export interface UpdateUserSkillDTO {
    id: string
    levelId?: string
    displatModeId?: string
}

export async function autoCompleteSkills(queryTerm: string): Promise<UserSkill[]> {
    if (!queryTerm) {
        return Promise.resolve([])
    }

    const encodedQuery = encodeURIComponent(queryTerm)
    return xhrGetAsync(`${baseUrl}/skills/autocomplete?term=${encodedQuery}`)
}

export async function fetchSkillsByIds(skillIds: string[]): Promise<SearchUserSkill[]> {
    const uniqueIds = Array.from(new Set(skillIds.filter(Boolean)))
    if (!uniqueIds.length) {
        return []
    }

    const params = new URLSearchParams()
    uniqueIds.forEach(skillId => params.append('skillId', skillId))
    params.set('disablePagination', 'true')

    return xhrGetAsync(`${baseUrl}/skills?${params.toString()}`)
}

export type FetchMemberSkillsConfig = {
    skipPagination: boolean
}
export async function fetchMemberSkills(
    userId: string | number | undefined,
    config: FetchMemberSkillsConfig,
): Promise<UserSkill[]> {
    const url = `${baseUrl}/user-skills/${userId}?disablePagination=${config.skipPagination}`
    return xhrGetAsync(url)
}

export async function createMemberSkills(userId: number, skills: UpdateUserSkillDTO[]): Promise<void> {
    return xhrPostAsync(`${baseUrl}/user-skills/${userId}`, {
        skills,
    })
}

export async function updateMemberSkills(
    userId: string | number,
    skills: UpdateUserSkillDTO[],
): Promise<void> {
    return xhrPutAsync(`${baseUrl}/user-skills/${userId}`, {
        skills,
    })
}

/**
 * Fetcher function for useSWR to fetch skills by their IDs
 * @param skillIds Array of skill UUIDs
 * @returns Promise with array of UserSkill objects
 */
async function fetchSkillsByIdsFetcher(skillIds: string[]): Promise<UserSkill[]> {
    if (!skillIds || skillIds.length === 0) {
        return []
    }

    try {
        const skillPromises = skillIds.map(skillId => xhrGetAsync<UserSkill>(`${baseUrl}/skills/${skillId}`)
            .catch(() => undefined))
        const results = await Promise.all(skillPromises)
        return results.filter((skill): skill is UserSkill => skill !== null && skill !== undefined)
    } catch {
        return []
    }
}

/**
 * Hook to fetch skills by their IDs using SWR
 * @param skillIds Array of skill UUIDs
 * @returns SWRResponse with array of UserSkill objects
 */
export function useSkillsByIds(skillIds: string[] | undefined): SWRResponse<UserSkill[], Error> {
    const swrKey = useMemo(() => {
        if (!skillIds || skillIds.length === 0) {
            return undefined
        }

        return ['skills-by-ids', [...skillIds].sort()
            .join(',')]
    }, [skillIds])

    return useSWR<UserSkill[], Error>(
        swrKey,
        () => fetchSkillsByIdsFetcher(skillIds!),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    )
}

/**
 * Fetch skills by their IDs (legacy async function for backward compatibility)
 * @param skillIds Array of skill UUIDs
 * @returns Promise with array of UserSkill objects
 */
export async function fetchSkillsByIds(skillIds: string[]): Promise<UserSkill[]> {
    return fetchSkillsByIdsFetcher(skillIds)
}
