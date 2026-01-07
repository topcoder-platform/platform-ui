import { toast } from 'react-toastify'

export const handleApiError = (error: any): void => {
    const errorMessage = error?.message
        || error?.data?.message
        || error?.response?.data?.message
        || 'An unexpected error occurred'

    toast.error(errorMessage)
}

export const formatEngagementDuration = (duration: {
    startDate?: string
    endDate?: string
    lengthInWeeks?: number
    lengthInMonths?: number
}): string => {
    if (duration.startDate && duration.endDate) {
        return `${new Date(duration.startDate).toLocaleDateString()} - ${new Date(
            duration.endDate,
        ).toLocaleDateString()}`
    }
    if (duration.lengthInMonths) {
        return `${duration.lengthInMonths} month${duration.lengthInMonths > 1 ? 's' : ''}`
    }
    if (duration.lengthInWeeks) {
        return `${duration.lengthInWeeks} week${duration.lengthInWeeks > 1 ? 's' : ''}`
    }
    return 'Duration not specified'
}

export const formatLocation = (countries: string[], timeZones: string[]): string => {
    if (countries.length === 0 && timeZones.length === 0) {
        return 'Any (Fully Remote)'
    }
    if (countries.includes('Any') || timeZones.includes('Any')) {
        return 'Any (Fully Remote)'
    }
    const parts: string[] = []
    if (countries.length > 0) {
        parts.push(countries.join(', '))
    }
    if (timeZones.length > 0) {
        parts.push(`(${timeZones.join(', ')})`)
    }
    return parts.join(' ')
}
