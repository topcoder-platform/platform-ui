import cityTimezonesModule from 'city-timezones'

interface CityTimezoneEntry {
    city?: string
    timezone?: string
}

interface CityTimezonesModule {
    lookupViaTimezone?: (timeZone: string) => CityTimezoneEntry[]
}

const cityTimezones = cityTimezonesModule as CityTimezonesModule

const DEFAULT_LOCALE = 'en-US'

export interface TimezoneOption {
    city?: string
    label: string
    value: string
}

interface TimezoneDateParts {
    day: number
    hour: number
    minute: number
    month: number
    second: number
    year: number
}

function getIntlTimeZoneName(timeZone: string, style: 'long' | 'short'): string | undefined {
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

        return namePart?.value || undefined
    } catch {
        return undefined
    }
}

function getCityForTimezone(timeZone: string): string | undefined {
    const matchedEntries = cityTimezones.lookupViaTimezone?.(timeZone)

    if (!Array.isArray(matchedEntries) || !matchedEntries.length) {
        return undefined
    }

    const firstCity = matchedEntries[0]?.city

    return typeof firstCity === 'string' && firstCity.trim()
        ? firstCity.trim()
        : undefined
}

export function detectCurrentTimezone(): string {
    try {
        return Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone || 'UTC'
    } catch {
        return 'UTC'
    }
}

export function formatTimeZoneLabel(timeZone: string): string {
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

    const shortName = getIntlTimeZoneName(normalized, 'short')
    const longName = getIntlTimeZoneName(normalized, 'long')
    const city = getCityForTimezone(normalized)
    const regionLabel = shortName && longName && shortName !== longName
        ? `${shortName} - ${longName}`
        : (shortName || longName || normalized)

    return city
        ? `${regionLabel} (${city})`
        : regionLabel
}

export function formatTimeZoneList(timeZones: string[] = [], fallback: string = 'Any'): string {
    if (!Array.isArray(timeZones) || !timeZones.length) {
        return fallback
    }

    if (timeZones.includes('Any')) {
        return fallback
    }

    const labels = timeZones
        .map(zone => formatTimeZoneLabel(zone))
        .filter(Boolean)
    const uniqueLabels = Array.from(new Set(labels))

    return uniqueLabels.length
        ? uniqueLabels.join(', ')
        : fallback
}

export function convertToTimezoneDate(
    value: string | number | Date,
    timeZone: string,
): Date {
    const sourceDate = value instanceof Date
        ? value
        : new Date(value)

    if (Number.isNaN(sourceDate.getTime())) {
        return new Date('')
    }

    let partsMap: Partial<TimezoneDateParts>

    try {
        const formatter = new Intl.DateTimeFormat(DEFAULT_LOCALE, {
            day: '2-digit',
            hour: '2-digit',
            hourCycle: 'h23',
            minute: '2-digit',
            month: '2-digit',
            second: '2-digit',
            timeZone,
            year: 'numeric',
        })

        partsMap = formatter.formatToParts(sourceDate)
            .reduce<Partial<TimezoneDateParts>>((accumulator, part) => {
                if (part.type === 'year'
                    || part.type === 'month'
                    || part.type === 'day'
                    || part.type === 'hour'
                    || part.type === 'minute'
                    || part.type === 'second') {
                    accumulator[part.type] = Number(part.value)
                }

                return accumulator
            }, {})
    } catch {
        return new Date('')
    }

    const dateParts: Array<keyof TimezoneDateParts> = ['year', 'month', 'day', 'hour', 'minute', 'second']
    const hasAllParts = dateParts.every(part => Number.isFinite(partsMap[part]))

    if (!hasAllParts) {
        return new Date('')
    }

    return new Date(Date.UTC(
        partsMap.year as number,
        (partsMap.month as number) - 1,
        partsMap.day as number,
        partsMap.hour as number,
        partsMap.minute as number,
        partsMap.second as number,
    ))
}

export function createTimezoneOptions(timeZones: string[] = []): TimezoneOption[] {
    const availableTimezones = timeZones.length
        ? timeZones
        : (
            typeof Intl !== 'undefined'
                && typeof (Intl as unknown as {
                    supportedValuesOf?: (input: string) => string[]
                }).supportedValuesOf === 'function'
                ? (Intl as unknown as {
                    supportedValuesOf: (input: string) => string[]
                }).supportedValuesOf('timeZone')
                : []
        )

    return availableTimezones
        .filter(Boolean)
        .map(timeZone => ({
            city: getCityForTimezone(timeZone),
            label: formatTimeZoneLabel(timeZone),
            value: timeZone,
        }))
}
