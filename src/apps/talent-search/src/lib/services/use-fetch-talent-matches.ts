import { uniqBy } from 'lodash'
import { useEffect, useState } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { PaginatedResponse, xhrGetPaginatedAsync } from '~/libs/core'
import { Skill } from '~/libs/shared'
import Member from '@talentSearch/lib/models/Member'

export interface TalentMatchesResponse {
    error: boolean,
    loading: boolean,
    matches: Member[],
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
        `page=${page}`,
        `perPage=${pageSize}`,
    ].join('&')

    const url = `${EnvironmentConfig.API.V5}/members/searchBySkills?${searchParams}`

    const { data, error }: SWRResponse<PaginatedResponse<Member[]>> = useSWR(url, xhrGetPaginatedAsync<Member[]>, {
        isPaused: () => !skills?.length,
        refreshInterval: 0,
        revalidateOnFocus: false,
    })

    const matches = data?.data

    return {
        error: !!error,
        loading: !matches,
        matches: matches ?? [],
        page: data?.page ?? 0,
        ready: !!matches,
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
    skills: ReadonlyArray<Skill>,
    pageSize: number = 10,
): InfiniteTalentMatchesResposne {
    const [matches, setMatches] = useState([] as Member[])
    const [page, setPage] = useState(1)
    const matchResponse = useFetchTalentMatches(skills, page, pageSize)

    function fetchNext(): void {
        setPage(p => p + 1)
    }

    useEffect(() => {
        setMatches(m => uniqBy([...m, ...matchResponse.matches], 'userId'))
    }, [matchResponse.matches])

    return {
        fetchNext,
        hasNext: matchResponse.page < matchResponse.totalPages,
        loading: matchResponse.loading,
        matches,
        page,
        total: matchResponse.total,
    }
}
