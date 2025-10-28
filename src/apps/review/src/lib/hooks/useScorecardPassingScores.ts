import { useMemo } from 'react'
import useSWR from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

type ScorecardThresholdResponse = {
    id?: string
    minScore?: number | null
    minimumPassingScore?: number | null
}

const SCORECARD_BASE_URL = `${EnvironmentConfig.API.V6}/scorecards`

const normalizeIdList = (ids: Iterable<string> | undefined): string[] => {
    if (!ids) {
        return []
    }

    const unique = new Set<string>()
    const normalizedIds = Array.isArray(ids) ? ids : Array.from(ids)

    for (let index = 0; index < normalizedIds.length; index += 1) {
        const id = normalizedIds[index]
        const trimmed = typeof id === 'string' ? id.trim() : ''

        if (trimmed) {
            unique.add(trimmed)
        }
    }

    return Array
        .from(unique)
        .sort((first, second) => first.localeCompare(second))
}

const fetchPassingScores = async (
    ids: string[],
): Promise<Map<string, number | undefined>> => {
    if (!ids.length) {
        return new Map()
    }

    const entries: Array<[string, number | undefined]> = []

    await Promise.all(ids.map(async id => {
        try {
            const response = await xhrGetAsync<ScorecardThresholdResponse>(
                `${SCORECARD_BASE_URL}/${id}`,
            )

            const thresholdCandidates = [
                response.minimumPassingScore,
                response.minScore,
            ]

            const resolved = thresholdCandidates.find(
                (value): value is number => typeof value === 'number' && Number.isFinite(value),
            )

            entries.push([response.id ?? id, resolved])
        } catch {
            entries.push([id, undefined])
        }
    }))

    return new Map(entries)
}

export const useScorecardPassingScores = (
    scorecardIds: Iterable<string> | undefined,
): Map<string, number | undefined> => {
    const normalizedIds = useMemo(
        () => normalizeIdList(scorecardIds),
        [scorecardIds],
    )

    const swrKey: Readonly<[string, string[]]> | undefined = normalizedIds.length
        ? ['scorecard-passing-scores', normalizedIds]
        : undefined

    const {
        data,
    }: { data?: Map<string, number | undefined> } = useSWR<Map<string, number | undefined>>(
        swrKey,
        () => fetchPassingScores(normalizedIds),
        {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    )

    return useMemo(
        () => data ?? new Map<string, number | undefined>(),
        [data],
    )
}
