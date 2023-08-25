import { uniqBy } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { PaginatedResponse, xhrGetPaginatedAsync } from '~/libs/core'
import { Skill } from '~/libs/shared'
import Member from '@talentSearch/lib/models/Member'

export interface TalentMatchData {
    searchResults: Member[]
    partialMatches: number,
    perfectMatches: number,
    veryGoodMatches: number
}
export interface TalentMatchesResponse {
    error: boolean,
    loading: boolean,
    matches: Member[],
    partialMatches: number,
    perfectMatches: number,
    veryGoodMatches: number,
    page: number,
    ready: boolean,
    total: number,
    totalPages: number,
}

export function useFetchTalentMatches(
    skills: ReadonlyArray<Skill>,
    page: number,
    pageSize: number,
): TalentMatchesResponse {
    const searchParams = [
        ...skills.map(s => `skillId=${s.emsiId}`),
        'sortBy=skillScore',
        'includeStats=false',
        `page=${page}`,
        `perPage=${pageSize}`,
    ].join('&')

    const url = `${EnvironmentConfig.API.V5}/members/searchBySkills?${searchParams}`

    const { data, error }: SWRResponse<PaginatedResponse<TalentMatchData>>
        = useSWR(url, xhrGetPaginatedAsync<TalentMatchData>, {
            isPaused: () => !skills?.length,
            refreshInterval: 0,
            revalidateOnFocus: false,
        })

    const matches = useMemo(() => data?.data?.searchResults ?? [], [data?.data.searchResults])

    return {
        error: !!error,
        loading: !data?.data,
        matches: matches ?? [],
        page: data?.page ?? 0,
        partialMatches: data?.data?.partialMatches ?? 0,
        perfectMatches: data?.data?.perfectMatches ?? 0,
        ready: !!data?.data,
        total: data?.total ?? 0,
        totalPages: data?.totalPages ?? 0,
        veryGoodMatches: data?.data?.veryGoodMatches ?? 0,
    }
}

export interface InfiniteTalentMatchesResposne {
    fetchNext: () => void
    hasNext: boolean
    matches: Member[]
    page: number
    loading: boolean
    total: number
    perfectMatches: number
    veryGoodMatches: number
    partialMatches: number
}

export function useInfiniteTalentMatches(
    skills: ReadonlyArray<Skill>,
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
        partialMatches: matchResponse.partialMatches,
        perfectMatches: matchResponse.perfectMatches,
        total: matchResponse.total,
        veryGoodMatches: matchResponse.veryGoodMatches,
    }
}
