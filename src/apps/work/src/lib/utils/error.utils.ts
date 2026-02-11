import { showErrorToast } from './toast.utils'

export interface WorkAppError extends Error {
    code?: string
    details?: unknown
    status?: number
}

interface ErrorResponseLike {
    code?: string
    details?: unknown
    message?: string
    response?: {
        data?: {
            code?: string
            details?: unknown
            message?: string
        }
        status?: number
    }
    status?: number
}

export function extractErrorMessage(error: unknown, fallbackMessage: string): string {
    const typedError = error as ErrorResponseLike

    return typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage
}

export function normalizeError(error: unknown, fallbackMessage: string): WorkAppError {
    const typedError = error as ErrorResponseLike
    const normalizedError: WorkAppError = new Error(extractErrorMessage(error, fallbackMessage))

    normalizedError.code = typedError?.code || typedError?.response?.data?.code
    normalizedError.details = typedError?.details || typedError?.response?.data?.details
    normalizedError.status = typedError?.status || typedError?.response?.status

    return normalizedError
}

export function formatErrorMessage(error: unknown, fallbackMessage: string): string {
    const message = extractErrorMessage(error, fallbackMessage)
    const normalized = message
        .trim()

    return normalized || fallbackMessage
}

export function logError(error: unknown, context?: string): void {
    if (context) {
        // eslint-disable-next-line no-console
        console.error(`[WorkApp] ${context}`, error)
        return
    }

    // eslint-disable-next-line no-console
    console.error('[WorkApp]', error)
}

export function notifyError(
    error: unknown,
    fallbackMessage: string = 'Something went wrong. Please try again.',
): WorkAppError {
    const normalizedError = normalizeError(error, fallbackMessage)

    showErrorToast(normalizedError.message)
    logError(normalizedError)

    return normalizedError
}
