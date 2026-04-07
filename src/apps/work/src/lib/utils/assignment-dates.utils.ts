const ASSIGNMENT_CANONICAL_UTC_HOUR = 12

function createLocalAssignmentDate(
    year: number,
    month: number,
    day: number,
): Date {
    return new Date(
        year,
        month,
        day,
        ASSIGNMENT_CANONICAL_UTC_HOUR,
        0,
        0,
        0,
    )
}

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

/**
 * Converts a stored assignment date into a DateInput-friendly local Date value.
 *
 * @param value assignment date from persisted state or API data.
 * @returns local Date when parsing succeeds; otherwise `undefined`.
 */
export function deserializeTentativeAssignmentDate(
    value: Date | string | undefined | null,
): Date | undefined {
    if (!value) {
        return undefined
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return undefined
        }

        return createLocalAssignmentDate(
            value.getFullYear(),
            value.getMonth(),
            value.getDate(),
        )
    }

    const parsedDate = new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return undefined
    }

    return createLocalAssignmentDate(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
    )
}
