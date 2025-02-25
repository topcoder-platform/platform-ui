import { toast } from 'react-toastify'
import _ from 'lodash'

import { ChallengeFilterCriteria } from '../models'

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
        errMessage = error.message
    }

    toast.error(`${errMessage} (${error.status})`)
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

export const replaceBrowserUrlQuery = (qs: string): void => {
    const newUrl = `${window.location.pathname}?${qs}`
    window.history.replaceState({}, '', newUrl)
}
