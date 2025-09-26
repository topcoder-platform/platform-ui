import { toast } from 'react-toastify'
import _ from 'lodash'
import qs from 'qs'

import { ChallengeFilterCriteria, ReviewFilterCriteria } from '../models'

/**
 * Handles api v5,v3 errors.
 */
export const handleError = (error: any): void => {
    const errorCode = _.get(error, 'data.code')
        ?? _.get(error, 'response.data.code')
        ?? error?.code

    let errMessage

    if (errorCode === 'SUBMISSION_NOT_CLEAN') {
        errMessage = [
            'Submission is not available in clean storage, meaning it failed antivirus checks',
            "or the antivirus checks haven't been run",
        ].join(' ')
    }

    if (!errMessage) {
        const errorMessageV5 = _.get(error, 'data.message')
        errMessage = errorMessageV5
    }

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
    0: 'INACTIVE',
    1: 'ACTIVE',
    ACTIVE: 'ACTIVE',
    Active: 'ACTIVE',
    active: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    Inactive: 'INACTIVE',
    inactive: 'INACTIVE',
}

type CriteriaValue = string | number | Date | undefined | null
type Criteria = Record<string, CriteriaValue>
type QueryParams = Record<string, string | number>
type PageAndSort = {
    limit: number
    page: number
    sort: string
}

const CRITERIA_DATE_KEYS: Record<string, { from: string; to: string }> = {
    endDate: {
        from: 'endDateFrom',
        to: 'endDateTo',
    },
    startDate: {
        from: 'startDateFrom',
        to: 'startDateTo',
    },
}

const USER_CRITERIA_KEYS = new Set(['user', 'userId'])

const shouldSkipCriteriaValue = (value: CriteriaValue): boolean => (
    value === undefined
    || value === null
    || (typeof value === 'string' && value.trim() === '')
)

const resolveDateValue = (value: CriteriaValue): Date | undefined => {
    if (value instanceof Date) {
        return value
    }

    if (typeof value === 'string' || typeof value === 'number') {
        const candidate = new Date(value)
        return Number.isNaN(candidate.getTime()) ? undefined : candidate
    }

    return undefined
}

const applyDateCriteria = (
    value: CriteriaValue,
    target: { from: string; to: string },
    params: QueryParams,
): void => {
    const dateValue = resolveDateValue(value)
    if (!dateValue) {
        return
    }

    const formatted = formatDateForQuery(dateValue)
    params[target.from] = formatted
    params[target.to] = formatted
}

const handleUserCriteria = (value: CriteriaValue, params: QueryParams): void => {
    params.userId = `${value}`.trim()
}

const handleStatusCriteria = (value: CriteriaValue, params: QueryParams): void => {
    const normalizedStatus = `${value}`.trim()
    const mappedStatus = STATUS_FILTER_MAP[normalizedStatus] ?? normalizedStatus
    params.status = mappedStatus
}

const assignDefaultCriteria = (
    key: string,
    value: CriteriaValue,
    params: QueryParams,
): void => {
    if (value instanceof Date) {
        params[key] = formatDateForQuery(value)
        return
    }

    params[key] = `${value}`.trim()
}

const assignPagination = (params: QueryParams, pageAndSort: PageAndSort): void => {
    if (pageAndSort.limit) {
        params.perPage = pageAndSort.limit
    }

    if (pageAndSort.page) {
        params.page = pageAndSort.page
    }
}

const assignSortParams = (params: QueryParams, sort: string): void => {
    const trimmedSort = sort.trim()
    if (!trimmedSort) {
        return
    }

    const sortMatch = trimmedSort.match(/^([^\s]+)(?:\s+(asc|desc))?$/i)
    if (sortMatch?.[1]) {
        params.sortBy = sortMatch[1]
    }

    if (sortMatch?.[2]) {
        params.sortOrder = sortMatch[2].toLowerCase()
    }
}

function formatDateForQuery(value: Date): string {
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
    criteria: Criteria,
    pageAndSort: PageAndSort,
): string => {
    const params: QueryParams = {}

    Object.entries(criteria)
        .forEach(([key, rawValue]) => {
            if (shouldSkipCriteriaValue(rawValue)) {
                return
            }

            const dateTarget = CRITERIA_DATE_KEYS[key]
            if (dateTarget) {
                applyDateCriteria(rawValue, dateTarget, params)
                return
            }

            if (USER_CRITERIA_KEYS.has(key)) {
                handleUserCriteria(rawValue, params)
                return
            }

            if (key === 'status') {
                handleStatusCriteria(rawValue, params)
                return
            }

            assignDefaultCriteria(key, rawValue, params)
        })

    assignPagination(params, pageAndSort)
    assignSortParams(params, pageAndSort.sort)

    return qs.stringify(params, { skipNulls: true })
}
