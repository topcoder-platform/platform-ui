import { uniqBy } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'

import type { PaginatedResponse, UserSkill } from '~/libs/core'
import { EnvironmentConfig } from '~/config'
import { xhrGetPaginatedAsync } from '~/libs/core'
import type Member from '@talentSearch/lib/models/Member'

import { SKILL_SEARCH_MINIMUM } from '../../config'

export interface TalentMatchesResponse {
    error: boolean,
    loading: boolean,
    matches: Member[],
    page: number,
    ready: boolean,
    total: number,
    totalPages: number,
}

export function canSearchTalentMatches(skills: ReadonlyArray<UserSkill>): boolean {
    return skills.length >= SKILL_SEARCH_MINIMUM
}

export function isTalentSearchLoading(
    canSearch: boolean,
    data: PaginatedResponse<Member[]> | undefined,
    error: unknown,
): boolean {
    return canSearch && !error && !data?.data
}

export function useFetchTalentMatches(
    skills: ReadonlyArray<UserSkill>,
    page: number,
    pageSize: number,
): TalentMatchesResponse {
    const canSearch = canSearchTalentMatches(skills)
    const searchParams = [
        ...skills.map(s => `id=${s.id}`),
        'sortBy=skillScore',
        'includeStats=false',
        `page=${page}`,
        `perPage=${pageSize}`,
    ].join('&')

    const url = `${EnvironmentConfig.API.V6}/members/searchBySkills?${searchParams}`

    const { data, error }: SWRResponse<PaginatedResponse<Member[]>, unknown> = useSWR(
        url,
        xhrGetPaginatedAsync<Member[]>,
        {
            isPaused: () => !canSearch,
            refreshInterval: 0,
            revalidateOnFocus: false,
        },
    )

    const matches = useMemo(() => data?.data ?? [], [data])

    return {
        error: !!error,
        loading: isTalentSearchLoading(canSearch, data, error),
        matches: matches ?? [],
        page: data?.page ?? 0,
        ready: !!data?.data,
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 0,
    }
}

export interface InfiniteTalentMatchesResposne {
    fetchNext: () => void
    hasNext: boolean
    matches: Member[]
    page: number
    loading: boolean
    total: number
}

export function useInfiniteTalentMatches(
    skills: ReadonlyArray<UserSkill>,
    pageSize: number = 10,
): InfiniteTalentMatchesResposne {
    const [matches, setMatches] = useState([] as Member[])
    const [page, setPage] = useState(1)
    const matchResponse = useFetchTalentMatches(skills, page, pageSize)

    const fetchNext = useCallback(() => {
        setPage(p => p + 1)
    }, [])

    // clear matches when skills array is updated
    useEffect(() => {
        setMatches([])
        setPage(1)
    }, [skills])

    // when we have new matches, concatenate the response to the matches array
    useEffect(() => {
        setMatches(m => uniqBy([...m, ...matchResponse.matches], 'userId'))
    }, [matchResponse.matches])

    return {
        fetchNext,
        hasNext: matchResponse.page < matchResponse.totalPages,
        loading: matchResponse.loading && skills.length > 0,
        matches,
        page,
        total: matchResponse.total,
    }
}
