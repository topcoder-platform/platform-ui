import { toast } from 'react-toastify'
import _ from 'lodash'
import qs from 'qs'

import { ChallengeFilterCriteria, ReviewFilterCriteria } from '../models'

/**
 * Handles api v5,v3 errors.
 */
export const handleError = (error: any): void => {
    let errMessage
    const errorMessageV5 = _.get(error, 'data.message')
    errMessage = errorMessageV5
    if (!errMessage) {
        errMessage = _.get(error, 'response.data.result.content')
    }

    if (!errMessage) {
        const errors = _.get(error, 'response.data.errors')
        if (Array.isArray(errors)) {
            errMessage = (errors as string[]).join(',')
        }
    }

    if (!errMessage) {
        errMessage = error.message
    }

    if (error.status) {
        toast.error(`${errMessage} (${error.status})`)
    } else {
        toast.error(errMessage)
    }
}

export const createChallengeQueryString = (
    filterCriteria: ChallengeFilterCriteria,
): string => {
    let filter = ''
    filter = `page=${filterCriteria.page}&perPage=${filterCriteria.perPage}`

    if (filterCriteria.legacyId) {
        filter += `&legacyId=${filterCriteria.legacyId}`
    }

    if (filterCriteria.type) {
        filter += `&types[]=${filterCriteria.type}`
    }

    if (filterCriteria.track) {
        filter += `&tracks[]=${filterCriteria.track}`
    }

    if (filterCriteria.challengeId) {
        filter += `&id=${filterCriteria.challengeId}`
    }

    if (filterCriteria.name) {
        filter += `&name=${filterCriteria.name}`
    }

    if (filterCriteria.status) filter += `&status=${filterCriteria.status}`

    filter += '&sortBy=createdAt&sortOrder=desc'

    return filter
}

export const createReviewQueryString = (
    filterCriteria: ReviewFilterCriteria,
): string => {
    const params: string[] = []

    if (filterCriteria.page) {
        params.push(`page=${filterCriteria.page}`)
    }

    if (filterCriteria.perPage) {
        params.push(`perPage=${filterCriteria.perPage}`)
    }

    if (filterCriteria.sortBy) {
        params.push(`sortBy=${filterCriteria.sortBy}`)
    }

    if (filterCriteria.order) {
        params.push(`sortOrder=${filterCriteria.order}`)
    }

    return params.join('&')
}

export const replaceBrowserUrlQuery = (query: string): void => {
    const newUrl = `${window.location.pathname}?${query}`
    window.history.replaceState({}, '', newUrl)
}

/**
 * Convert from query object to string
 * @param obj query object
 * @returns query in string
 */
const STATUS_FILTER_MAP: Record<string, string> = {
    '0': 'INACTIVE',
    '1': 'ACTIVE',
    active: 'ACTIVE',
    Active: 'ACTIVE',
    inactive: 'INACTIVE',
    Inactive: 'INACTIVE',
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
}

const formatDateForQuery = (value: Date): string => {
    const isoString = value.toISOString()
    return `${isoString.substring(0, 16)}Z`
}

/**
 * Create filter, page and sort query
 * @param criteria search criteria
 * @param pageAndSort pagination and sort
 * @returns string query
 */
export const createFilterPageSortQuery = (
    criteria: { [key: string]: string | number | Date | undefined | null },
    pageAndSort: {
        limit: number
        page: number
        sort: string
    },
): string => {
    const params: { [key: string]: string | number } = {}

    Object.entries(criteria).forEach(([key, rawValue]) => {
        if (rawValue === undefined || rawValue === null) {
            return
        }

        if (typeof rawValue === 'string' && rawValue.trim() === '') {
            return
        }

        switch (key) {
            case 'startDate': {
                const dateValue = rawValue instanceof Date
                    ? rawValue
                    : new Date(rawValue)
                if (!Number.isNaN(dateValue.getTime())) {
                    const formatted = formatDateForQuery(dateValue)
                    params.startDateFrom = formatted
                    params.startDateTo = formatted
                }
                break
            }
            case 'endDate': {
                const dateValue = rawValue instanceof Date
                    ? rawValue
                    : new Date(rawValue)
                if (!Number.isNaN(dateValue.getTime())) {
                    const formatted = formatDateForQuery(dateValue)
                    params.endDateFrom = formatted
                    params.endDateTo = formatted
                }
                break
            }
            case 'user':
            case 'userId': {
                params.userId = `${rawValue}`.trim()
                break
        }
        case 'status': {
                const normalizedStatus = `${rawValue}`.trim()
                const mappedStatus = STATUS_FILTER_MAP[normalizedStatus]
                    ?? normalizedStatus
                params.status = mappedStatus
                break
            }
            default: {
                params[key] = rawValue instanceof Date
                    ? formatDateForQuery(rawValue)
                    : `${rawValue}`.trim()
            }
        }
    })

    if (pageAndSort?.limit) {
        params.perPage = pageAndSort.limit
    }

    if (pageAndSort?.page) {
        params.page = pageAndSort.page
    }

    if (pageAndSort?.sort) {
        const trimmedSort = pageAndSort.sort.trim()
        if (trimmedSort) {
            const sortMatch = trimmedSort.match(/^([^\s]+)(?:\s+(asc|desc))?$/i)
            if (sortMatch?.[1]) {
                params.sortBy = sortMatch[1]
            }
            if (sortMatch?.[2]) {
                params.sortOrder = sortMatch[2].toLowerCase()
            }
        }
    }

    return qs.stringify(params, { skipNulls: true })
}
