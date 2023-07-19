import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { Skill } from '~/libs/shared'
import Member from '@talentSearch/lib/models/Member'

export interface TalenMatchesResponse {
    error: boolean,
    loading: boolean,
    matches: Member[],
    ready: boolean,
}

export function useFetchTalenMatches(
    skills: ReadonlyArray<Skill>,
    page: number,
    pageSize: number,
): TalenMatchesResponse {
    const searchParams = [
        ...skills.map(s => `skillId=${s.emsiId}`),
        'sortBy=skillScore',
        `page=${page}`,
        `perPage=${pageSize}`,
    ].join('&')

    const url = `${EnvironmentConfig.API.V5}/members/searchBySkills?${searchParams}`

    const { data, error }: SWRResponse = useSWR(url, xhrGetAsync, {
        isPaused: () => !skills?.length,
    })

    return {
        error: !!error,
        loading: !data,
        matches: data ?? [],
        ready: !!data,
    }
}
