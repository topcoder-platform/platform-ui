const dateFormat = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
    year: 'numeric',
})
const timeFormat = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone: 'UTC',
})

/** Formats calendar dates and report timestamps in UTC, including zone-less warehouse timestamps. */
export function formatReportDate(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(`${value}T00:00:00Z`)
        return Number.isNaN(date.getTime()) ? value : dateFormat.format(date)
    }

    const timestamp = value.replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T')
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)
    const date = new Date(hasZone ? timestamp : `${timestamp}Z`)
    if (!/^\d{4}-\d{2}-\d{2}T/.test(timestamp) || Number.isNaN(date.getTime())) return value
    return `${dateFormat.format(date)}, ${timeFormat.format(date)}`
}
