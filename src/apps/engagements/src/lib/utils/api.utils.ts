import { toast } from 'react-toastify'
import codes from 'country-calling-code'

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

const formatTimeZoneLabel = (timeZone: string): string => {
    if (!timeZone) {
        return ''
    }

    const normalized = String(timeZone)
        .trim()
    if (!normalized) {
        return ''
    }

    if (normalized.toLowerCase() === 'any') {
        return 'Any'
    }

    const longName = getIntlTimeZoneName(normalized, 'long')

    return longName || normalized
}

const normalizeValues = (values: string[]): string[] => (
    (values ?? [])
        .map(value => String(value)
            .trim())
        .filter(Boolean)
)

const isAnyValue = (value: string): boolean => (
    value
        .trim()
        .toLowerCase() === 'any'
)

const dedupeByLower = (values: string[]): string[] => Array.from(
    values.reduce((acc, value) => {
        const key = value
            .trim()
            .toLowerCase()
        if (!key || acc.has(key)) {
            return acc
        }

        acc.set(key, value)
        return acc
    }, new Map<string, string>())
        .values(),
)

const formatCountryLabel = (country: string): string => {
    if (!country) {
        return ''
    }

    const normalized = String(country)
        .trim()
    if (!normalized) {
        return ''
    }

    const lowerValue = normalized.toLowerCase()
    const match = codes.find(code => (
        code.isoCode2?.toLowerCase() === lowerValue
        || code.isoCode3?.toLowerCase() === lowerValue
        || code.country?.toLowerCase() === lowerValue
    ))

    return match?.country ?? normalized
}

export type FormattedLocation = {
    locationLabel: string
    timeZoneLabel: string
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

export const formatLocation = (countries: string[], timeZones: string[]): FormattedLocation => {
    const normalizedCountries = normalizeValues(countries)
    const normalizedTimeZones = normalizeValues(timeZones)
    const hasAnyLocation = normalizedCountries.some(isAnyValue) || normalizedTimeZones.some(isAnyValue)
    const filteredCountries = normalizedCountries.filter(value => !isAnyValue(value))
    const filteredTimeZones = normalizedTimeZones.filter(value => !isAnyValue(value))
    const hasLocationValues = filteredCountries.length > 0 || filteredTimeZones.length > 0

    const formattedCountries = dedupeByLower(
        filteredCountries
            .map(formatCountryLabel)
            .filter(Boolean),
    )
    const formattedTimeZones = dedupeByLower(
        filteredTimeZones
            .map(formatTimeZoneLabel)
            .filter(Boolean),
    )

    const locationLabel = (hasAnyLocation || !hasLocationValues || formattedCountries.length === 0)
        ? 'Remote'
        : formattedCountries.join(', ')
    const timeZoneLabel = formattedTimeZones.length > 0
        ? formattedTimeZones.join(', ')
        : 'Any'

    return {
        locationLabel,
        timeZoneLabel,
    }
}
