import { toast } from 'react-toastify'

import { EnvironmentConfig } from '~/config'

/**
 * Builds a procurement API URL using the configured v6 procurement base URL.
 *
 * @param path Endpoint path inside the procurement API.
 * @param query Optional query string values.
 * @returns Absolute procurement API URL.
 */
export function buildProcurementApiUrl(
    path: string,
    query?: Record<string, string | undefined>,
): string {
    const normalizedPath: string = path.replace(/^\/+/, '')
    const searchParams: URLSearchParams = new URLSearchParams()

    Object.entries(query || {})
        .forEach(([key, value]: [string, string | undefined]) => {
            if (value !== undefined && value.trim() !== '') {
                searchParams.set(key, value)
            }
        })

    const queryString: string = searchParams.toString()

    return `${EnvironmentConfig.PROCUREMENT_API}/${normalizedPath}${queryString ? `?${queryString}` : ''}`
}

/**
 * Extracts a readable validation or conflict message from procurement API errors.
 *
 * @param error Error thrown by the xhr layer.
 * @returns User-facing error message.
 */
export function getProcurementApiErrorMessage(error: any): string {
    const responseData: any = error?.response?.data || error?.data || {}
    const responseMessage: string | undefined = extractMessage(responseData.message)
    const responseErrors: string | undefined = extractMessage(responseData.errors)

    return responseMessage
        || responseErrors
        || error?.message
        || 'An unexpected error occurred.'
}

/**
 * Shows a procurement API error through the shared toast channel.
 *
 * @param error Error thrown by the xhr layer.
 * @returns Nothing.
 */
export function handleProcurementApiError(error: any): void {
    toast.error(getProcurementApiErrorMessage(error))
}

/**
 * Converts a date input or ISO timestamp to the date-only string accepted by procurement mutations.
 *
 * @param value Date-like value from a form or API response.
 * @returns Date-only ISO string, or `undefined` when the input is empty.
 */
export function normalizeDateOnly(value?: Date | string): string | undefined {
    if (value === undefined) {
        return undefined
    }

    if (value instanceof Date) {
        return value.toISOString()
            .slice(0, 10)
    }

    const normalizedValue: string = String(value)
        .trim()

    if (!normalizedValue) {
        return undefined
    }

    const dateOnlyMatch: RegExpMatchArray | undefined = normalizedValue.match(/^\d{4}-\d{2}-\d{2}/) || undefined

    if (dateOnlyMatch) {
        return dateOnlyMatch[0]
    }

    const parsedDate: Date = new Date(normalizedValue)

    return Number.isNaN(parsedDate.getTime())
        ? normalizedValue
        : parsedDate.toISOString()
            .slice(0, 10)
}

/**
 * Normalizes optional numeric form values before sending mutation payloads.
 *
 * @param value Number supplied by a form.
 * @returns The number when finite, otherwise `undefined`.
 */
export function normalizeOptionalNumber(value?: number): number | undefined {
    return value !== undefined && Number.isFinite(value) ? value : undefined
}

/**
 * Normalizes optional text form values before sending mutation payloads.
 *
 * @param value Text supplied by a form.
 * @returns Trimmed text, or `undefined` when blank.
 */
export function normalizeOptionalText(value?: string): string | undefined {
    const normalizedValue: string = String(value || '')
        .trim()

    return normalizedValue || undefined
}

/**
 * Normalizes required text form values before sending mutation payloads.
 *
 * @param value Text supplied by a form.
 * @returns Trimmed text.
 */
export function normalizeRequiredText(value: string): string {
    return value.trim()
}

/**
 * Extracts messages from common API error field shapes.
 *
 * @param value Unknown error message payload.
 * @returns Flattened message string when one can be found.
 */
function extractMessage(value: unknown): string | undefined {
    if (!value) {
        return undefined
    }

    if (Array.isArray(value)) {
        return value
            .map((item: unknown) => extractMessage(item))
            .filter(Boolean)
            .join(', ')
    }

    if (typeof value === 'object') {
        return Object.values(value as Record<string, unknown>)
            .map((item: unknown) => extractMessage(item))
            .filter(Boolean)
            .join(', ')
    }

    return String(value)
}
