import { toast } from 'react-toastify'
import moment from 'moment-timezone'

type TimeZoneNameStyle = 'short' | 'long'

const DEFAULT_LOCALE = 'en-US'

const getIntlTimeZoneName = (timeZone: string, style: TimeZoneNameStyle): string | undefined => {
    if (typeof Intl === 'undefined' || typeof Intl.DateTimeFormat !== 'function') {
        return undefined
    }

    try {
        const formatter = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
            timeZone,
            timeZoneName: style,
        })

        if (typeof formatter.formatToParts !== 'function') {
            return undefined
        }

        const parts = formatter.formatToParts(new Date())
        const namePart = parts.find(part => part.type === 'timeZoneName')
        return namePart?.value
    } catch (error) {
        return undefined
    }
}

const getMomentTimeZoneName = (timeZone: string): string | undefined => {
    if (!moment?.tz?.zone || !moment.tz.zone(timeZone)) {
        return undefined
    }

    try {
        return moment.tz(new Date(), timeZone)
            .format('z')
    } catch (error) {
        return undefined
    }
}

const formatTimeZoneLabel = (timeZone: string): string => {
    if (!timeZone) {
        return ''
    }

    const normalized = String(timeZone)
        .trim()
    if (!normalized) {
        return ''
    }

    if (normalized === 'Any') {
        return 'Any'
    }

    const shortName = getMomentTimeZoneName(normalized) ?? getIntlTimeZoneName(normalized, 'short')
    const longName = getIntlTimeZoneName(normalized, 'long')

    if (shortName && longName) {
        if (shortName === longName) {
            return shortName
        }

        return `${shortName} - ${longName}`
    }

    return shortName || longName || normalized
}

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
        const startDate = new Date(duration.startDate)
            .toLocaleDateString()
        const endDate = new Date(duration.endDate)
            .toLocaleDateString()

        return `${startDate} - ${endDate}`
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
        const formattedTimeZones = Array.from(
            timeZones.reduce((acc, zone) => {
                const formatted = formatTimeZoneLabel(zone)
                if (!formatted) {
                    return acc
                }

                const key = formatted
                    .trim()
                    .toLowerCase()
                if (!key || acc.has(key)) {
                    return acc
                }

                acc.set(key, formatted)
                return acc
            }, new Map<string, string>())
                .values(),
        )

        if (formattedTimeZones.length > 0) {
            parts.push(`(${formattedTimeZones.join(', ')})`)
        }
    }

    return parts.join(' ')
}
