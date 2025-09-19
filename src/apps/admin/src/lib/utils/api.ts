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
function serialize(obj: { [key: string]: string | number | Date }): string {
    const result: string[] = []
    _.forOwn(obj, (value, key) => {
        result.push(`${encodeURIComponent(key)}=${value}`)
    })

    return result.join('&')
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
    const params: { [key: string]: string | number | Date } = {}
    Object.keys(criteria)
        .forEach((key: string) => {
            let value = criteria[key]
            if (value) {
                if (key === 'startDate' || key === 'endDate') {
                    const iosString = (value as Date).toISOString()
                    value = `${iosString.substring(0, 16)}Z`
                }

                params[key] = value
            }
        })
    return qs.stringify({
        filter: serialize(params),
        limit: pageAndSort.limit,
        offset: (pageAndSort.page - 1) * 25,
        sort: pageAndSort.sort,
    })
}
