import { Engagement } from '../models'

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
})

export const formatDate = (dateString: string): string => {
    if (!dateString) {
        return 'Date TBD'
    }

    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) {
        return 'Date TBD'
    }

    return DATE_FORMATTER.format(date)
}

export const formatDuration = (duration?: Engagement['duration']): string => {
    if (!duration) {
        return 'Duration not specified'
    }

    if (duration.startDate && duration.endDate) {
        return `${formatDate(duration.startDate)} - ${formatDate(duration.endDate)}`
    }

    if (duration.lengthInMonths) {
        return `${duration.lengthInMonths} month${duration.lengthInMonths > 1 ? 's' : ''}`
    }

    if (duration.lengthInWeeks) {
        return `${duration.lengthInWeeks} week${duration.lengthInWeeks > 1 ? 's' : ''}`
    }

    return 'Duration not specified'
}

export const isDeadlinePassed = (deadline: string): boolean => {
    if (!deadline) {
        return false
    }

    const date = new Date(deadline)
    if (Number.isNaN(date.getTime())) {
        return false
    }

    return date.getTime() < Date.now()
}

export const getDaysUntilDeadline = (deadline: string): number => {
    if (!deadline) {
        return 0
    }

    const date = new Date(deadline)
    if (Number.isNaN(date.getTime())) {
        return 0
    }

    const diffMs = date.getTime() - Date.now()
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export const formatDeadlineCountdown = (deadline: string): string => {
    if (!deadline) {
        return 'Deadline TBD'
    }

    const date = new Date(deadline)
    if (Number.isNaN(date.getTime())) {
        return 'Deadline TBD'
    }

    const daysLeft = getDaysUntilDeadline(deadline)
    if (daysLeft < 0) {
        return 'Deadline passed'
    }

    if (daysLeft === 0) {
        return 'Deadline today'
    }

    if (daysLeft === 1) {
        return '1 day left'
    }

    return `${daysLeft} days left`
}
