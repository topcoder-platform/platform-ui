import { toast } from 'react-toastify'
import { ChallengeFilterCriteria } from '../models'

/**
 * Handles api v5 errors.
 */
export const handleError = (error: any) => {
  let err
  if (error && error.data) {
    err = {
      status: error.status,
      error: error.data.message,
    }
  }

  if (!err) {
    err = {
      status: error.status,
      error: error.message,
    }
  }

  toast.error(`${error.message} (${error.status})`)
}

export const createChallengeQueryString = (filterCriteria: ChallengeFilterCriteria): string => {
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

export const replaceBrowserUrlQuery = (qs: string) => {
  const newUrl = `${window.location.pathname}?${qs}`
  window.history.replaceState({}, '', newUrl)
}
