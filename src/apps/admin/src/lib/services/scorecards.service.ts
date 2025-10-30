import { EnvironmentConfig } from '~/config'
import { xhrGetPaginatedAsync } from '~/libs/core'

import { Scorecard } from '../models'

type ScorecardPagePayload = {
    scoreCards?: Scorecard[]
    data?: Scorecard[]
    result?: Scorecard[]
    metadata?: {
        perPage?: number
        total?: number
        totalPages?: number
    }
}

type GetScorecardsOptions = {
    fetchAll?: boolean
    page?: number
    perPage?: number
}

const SCORECARD_DEFAULT_PAGE_SIZE = 200

const toScorecardList = (payload: Scorecard[] | ScorecardPagePayload): Scorecard[] => {
    if (Array.isArray(payload)) {
        return payload
    }

    if (payload.scoreCards && Array.isArray(payload.scoreCards)) {
        return payload.scoreCards
    }

    if (payload.data && Array.isArray(payload.data)) {
        return payload.data
    }

    if (payload.result && Array.isArray(payload.result)) {
        return payload.result
    }

    return []
}

const getTotalPagesFromPayload = (payload: Scorecard[] | ScorecardPagePayload): number => {
    if (Array.isArray(payload) || !payload.metadata) {
        return 0
    }

    const totalPages = Number(payload.metadata.totalPages)
    if (Number.isFinite(totalPages) && totalPages > 0) {
        return totalPages
    }

    const perPage = Number(payload.metadata.perPage)
    const total = Number(payload.metadata.total)

    if (
        Number.isFinite(total)
        && Number.isFinite(perPage)
        && perPage > 0
        && total >= 0
    ) {
        return Math.ceil(total / perPage)
    }

    return 0
}

export const getScorecards = async (
    options: GetScorecardsOptions = {},
): Promise<Scorecard[]> => {
    const fetchAll = options.fetchAll ?? true
    const perPage = options.perPage && options.perPage > 0
        ? options.perPage
        : SCORECARD_DEFAULT_PAGE_SIZE
    const accumulated: Scorecard[] = []
    const initialPage = options.page && options.page > 0 ? options.page : 1

    const fetchPage = async (pageNumber: number): Promise<Scorecard[]> => {
        const params = new URLSearchParams()
        params.set('page', String(pageNumber))
        params.set('perPage', String(perPage))

        const response = await xhrGetPaginatedAsync<Scorecard[] | ScorecardPagePayload>(
            `${EnvironmentConfig.API.V6}/scorecards?${params.toString()}`,
        )

        const batch = toScorecardList(response.data)

        if (!fetchAll) {
            return batch
        }

        accumulated.push(...batch)

        const totalPagesFromHeader = Number(response.totalPages)
        const totalPagesFromPayload = getTotalPagesFromPayload(response.data)
        const totalPages = totalPagesFromHeader || totalPagesFromPayload

        const hasMoreByHeader = totalPages > 0 && pageNumber < totalPages
        const hasMoreByCount = totalPages <= 0 && batch.length === perPage

        if (!hasMoreByHeader && !hasMoreByCount) {
            return accumulated
        }

        return fetchPage(pageNumber + 1)
    }

    return fetchPage(initialPage)
}
