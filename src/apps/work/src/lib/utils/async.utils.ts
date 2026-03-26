export interface RetryOptions {
    baseDelayMs?: number
    factor?: number
    maxAttempts?: number
    maxDelayMs?: number
    shouldRetry?: (error: unknown, attempt: number) => boolean
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

export function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, ms)

        if (!signal) {
            return
        }

        signal.addEventListener('abort', () => {
            clearTimeout(timeout)
            reject(new DOMException('Delay aborted', 'AbortError'))
        }, { once: true })
    })
}

export async function retryWithExponentialBackoff<T>(
    fn: () => Promise<T>,
    {
        baseDelayMs = 300,
        factor = 2,
        maxAttempts = 3,
        maxDelayMs = 5000,
        shouldRetry,
    }: RetryOptions = {},
): Promise<T> {
    let attempt = 0
    let lastError: unknown

    while (attempt < maxAttempts) {
        attempt += 1

        try {
            // eslint-disable-next-line no-await-in-loop
            return await fn()
        } catch (error) {
            lastError = error

            if (attempt >= maxAttempts) {
                break
            }

            if (shouldRetry && !shouldRetry(error, attempt)) {
                break
            }

            const attemptDelay = Math.min(
                maxDelayMs,
                baseDelayMs * (factor ** (attempt - 1)),
            )

            // eslint-disable-next-line no-await-in-loop
            await wait(attemptDelay)
        }
    }

    throw lastError
}

export function debounce<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    waitMs: number,
): (...args: TArgs) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    return (...args: TArgs) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            callback(...args)
        }, waitMs)
    }
}

export function throttle<TArgs extends unknown[]>(
    callback: (...args: TArgs) => void,
    waitMs: number,
): (...args: TArgs) => void {
    let isThrottled = false
    let trailingArgs: TArgs | undefined

    const invoke = (args: TArgs): void => {
        callback(...args)
        isThrottled = true

        setTimeout(() => {
            isThrottled = false

            if (trailingArgs) {
                const nextArgs = trailingArgs
                trailingArgs = undefined
                invoke(nextArgs)
            }
        }, waitMs)
    }

    return (...args: TArgs) => {
        if (!isThrottled) {
            invoke(args)
            return
        }

        trailingArgs = args
    }
}
