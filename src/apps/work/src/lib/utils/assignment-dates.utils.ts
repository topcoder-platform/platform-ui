const ASSIGNMENT_CANONICAL_UTC_HOUR = 12

export function serializeTentativeAssignmentDate(
    value: Date | string | undefined | null,
): string {
    if (!value) {
        return ''
    }

    const dateValue = value instanceof Date
        ? value
        : new Date(value)

    if (Number.isNaN(dateValue.getTime())) {
        return ''
    }

    const year = dateValue.getFullYear()
    const month = dateValue.getMonth()
    const day = dateValue.getDate()

    return new Date(Date.UTC(
        year,
        month,
        day,
        ASSIGNMENT_CANONICAL_UTC_HOUR,
        0,
        0,
        0,
    ))
        .toISOString()
}
