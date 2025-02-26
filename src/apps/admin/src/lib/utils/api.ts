import { toast } from 'react-toastify'

import { ChallengeFilterCriteria, ReviewFilterCriteria } from '../models'

/**
 * Handles api v5 errors.
 */
export const handleError = (error: any): void => {
    let err
    if (error && error.data) {
        err = {
            error: error.data.message,
            status: error.status,
        }
    }

    if (!err) {
        err = {
            error: error.message,
            status: error.status,
        }
    }

    toast.error(`${error.message} (${error.status})`)
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

    return filter
}

export const createReviewQueryString = (
    filterCriteria: ReviewFilterCriteria,
): string => {
    let filter = ''

    if (filterCriteria.page) {
        filter += `page=${filterCriteria.page}`
    }

    if (filterCriteria.perPage) {
        filter += `&perPage=${filterCriteria.perPage}`
    }

    return filter
}

export const replaceBrowserUrlQuery = (qs: string): void => {
    const newUrl = `${window.location.pathname}?${qs}`
    window.history.replaceState({}, '', newUrl)
}
