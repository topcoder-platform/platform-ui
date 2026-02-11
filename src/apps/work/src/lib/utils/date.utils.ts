function toDate(date?: Date | string | null): Date | undefined {
    if (!date) {
        return undefined
    }

    const parsed = date instanceof Date ? date : new Date(date)
    if (Number.isNaN(parsed.getTime())) {
        return undefined
    }

    return parsed
}

function normalizeMinutes(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 0
    }

    return Math.max(0, Math.trunc(value))
}

export interface PhaseHoursMinutes {
    hours: number
    minutes: number
}

export function getPhaseHoursMinutes(phaseDuration: number): PhaseHoursMinutes {
    const duration = normalizeMinutes(phaseDuration)

    return {
        hours: Math.floor(duration / 60),
        minutes: duration % 60,
    }
}

export function convertPhaseHoursMinutesToPhaseDuration(
    hoursMinutes: PhaseHoursMinutes,
): number {
    const normalizedHours = normalizeMinutes(hoursMinutes.hours)
    const normalizedMinutes = Math.max(0, Math.min(59, normalizeMinutes(hoursMinutes.minutes)))

    return (normalizedHours * 60) + normalizedMinutes
}

export function getPhaseEndDateInDate(
    startDate: Date,
    durationMinutes: number,
): Date {
    const parsedStartDate = toDate(startDate) || new Date()
    const normalizedDuration = normalizeMinutes(durationMinutes)

    return new Date(parsedStartDate.getTime() + (normalizedDuration * 60_000))
}

export function getPhaseEndDate(
    startDate: Date,
    durationMinutes: number,
): string {
    return getPhaseEndDateInDate(startDate, durationMinutes)
        .toISOString()
}

export function getPhaseDuration(
    startDate: Date,
    endDate: Date,
): number {
    const parsedStartDate = toDate(startDate)
    const parsedEndDate = toDate(endDate)

    if (!parsedStartDate || !parsedEndDate) {
        return 0
    }

    const diffMinutes = Math.round((parsedEndDate.getTime() - parsedStartDate.getTime()) / 60_000)

    return Math.max(0, diffMinutes)
}

export function getPhaseDurationPercentage(
    startDateTime: Date | string | null | undefined,
    endDateTime: Date | string | null | undefined,
    duration: number,
): number {
    const parsedStart = toDate(startDateTime)
    const parsedEnd = toDate(endDateTime)
    const normalizedDuration = normalizeMinutes(duration)

    if (!parsedStart || !parsedEnd || !normalizedDuration) {
        return 0
    }

    const now = Date.now()
    const startTime = parsedStart.getTime()
    const endTime = parsedEnd.getTime()

    if (now <= startTime) {
        return 0
    }

    if (now >= endTime) {
        return 100
    }

    const elapsedMinutes = (now - startTime) / 60_000
    const percentage = (elapsedMinutes / normalizedDuration) * 100

    return Math.max(0, Math.min(100, Math.round(percentage)))
}

export function formatDate(date?: Date | string | null): string {
    const parsed = toDate(date)
    if (!parsed) {
        return '-'
    }

    return parsed.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    })
}

export function formatDateTime(date?: Date | string | null): string {
    const parsed = toDate(date)
    if (!parsed) {
        return '-'
    }

    return parsed.toLocaleString('en-US', {
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}
