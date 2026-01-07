import { ApplicationStatus } from '../models'

export const getApplicationAge = (dateString: string): number => {
    if (!dateString) {
        return 0
    }

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
        return 0
    }

    const diffMs = Date.now() - date.getTime()
    if (diffMs <= 0) {
        return 0
    }

    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

export const formatApplicationDate = (dateString: string): string => {
    if (!dateString) {
        return 'Date TBD'
    }

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
        return 'Date TBD'
    }

    const days = getApplicationAge(dateString)
    if (days === 0) {
        return 'Today'
    }
    if (days === 1) {
        return '1 day ago'
    }
    if (days < 7) {
        return `${days} days ago`
    }

    const weeks = Math.floor(days / 7)
    if (weeks === 1) {
        return '1 week ago'
    }
    if (weeks < 4) {
        return `${weeks} weeks ago`
    }

    const months = Math.floor(days / 30)
    if (months === 1) {
        return '1 month ago'
    }
    return `${months} months ago`
}

export const isApplicationActive = (status: ApplicationStatus): boolean => (
    status === ApplicationStatus.SUBMITTED || status === ApplicationStatus.UNDER_REVIEW
)

export const truncateText = (text: string, maxLength: number): string => {
    if (!text) {
        return ''
    }

    const trimmed = text.trim()
    if (trimmed.length <= maxLength) {
        return trimmed
    }

    const sliceLength = Math.max(0, maxLength - 3)
    return `${trimmed.slice(0, sliceLength).trimEnd()}...`
}
