/** Shared request lifecycle for analytics reports and filter options. */
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import { AnalyticsRequestError } from '../models'

export interface AnalyticsResourceState<T> {
    data?: T
    error?: AnalyticsRequestError
    loading: boolean
    refreshing: boolean
    refresh: () => void
}

interface InternalState<T> {
    data?: T
    error?: AnalyticsRequestError
    loading: boolean
    refreshing: boolean
}

type AnalyticsRetryWait = (milliseconds: number) => Promise<void>

const ANALYTICS_TIMEOUT_RETRY_DELAY = 1_000

/**
 * Waits before retrying a cold analytics warehouse request.
 *
 * @param milliseconds bounded retry delay.
 * @returns promise resolved after the delay.
 * @throws Does not throw.
 */
function waitForAnalyticsRetry(milliseconds: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds)
    })
}

/**
 * Converts an intercepted analytics request failure into a safe display error.
 *
 * @param error unknown rejected request value.
 * @returns sanitized request category and message.
 * @throws Does not throw.
 */
export function classifyAnalyticsError(error: unknown): AnalyticsRequestError {
    const candidate = error as {
        code?: string
        message?: string
        status?: number
        response?: { status?: number }
    }
    const status = candidate?.status ?? candidate?.response?.status

    if (candidate?.message?.includes('not configured')) {
        return {
            kind: 'configuration',
            message: 'Analytics has not been configured for this environment.',
            status,
        }
    }

    if (status === 401 || status === 403) {
        return {
            kind: 'authorization',
            message: status === 401
                ? 'Your session is missing or expired. Sign in again to view Analytics.'
                : 'The analytics role is required to view this data.',
            status,
        }
    }

    if (status === 504 || candidate?.code === 'ECONNABORTED') {
        return {
            kind: 'timeout',
            message: 'The analytics warehouse is taking longer than expected. Try again.',
            status,
        }
    }

    if (status === 429 || status === 503) {
        return {
            kind: 'throttled',
            message: 'Analytics is temporarily busy. Wait a moment and try again.',
            status,
        }
    }

    return {
        kind: 'general',
        message: 'Analytics data could not be loaded. Try again.',
        status,
    }
}

/**
 * Runs an analytics request and retries one warehouse timeout after a short delay.
 *
 * @param request function performing the authenticated analytics GET request.
 * @param wait delay implementation; tests inject an immediate deterministic wait.
 * @returns analytics response from the initial request or its single retry.
 * @throws Rejects immediately for non-timeout failures and after a failed retry.
 */
export async function requestAnalyticsWithRetry<T>(
    request: () => Promise<T>,
    wait: AnalyticsRetryWait = waitForAnalyticsRetry,
): Promise<T> {
    try {
        return await request()
    } catch (error) {
        if (classifyAnalyticsError(error).kind !== 'timeout') throw error
        await wait(ANALYTICS_TIMEOUT_RETRY_DELAY)
        return request()
    }
}

/**
 * Loads a read-only analytics resource with stale-response suppression.
 *
 * @param key stable request identity, or undefined to disable loading.
 * @param request function performing the authenticated GET request.
 * @returns current data/error/loading state and explicit refresh action.
 * @throws Does not throw; failures are returned as safe state.
 */
export function useAnalyticsResource<T>(
    key: string | undefined,
    request: () => Promise<T>,
): AnalyticsResourceState<T> {
    const requestRef = useRef(request)
    requestRef.current = request
    const requestSequence = useRef(0)
    const activeKey = useRef<string | undefined>(undefined)
    const [revision, setRevision]: [number, Dispatch<SetStateAction<number>>] = useState(0)
    const [state, setState] = useState<InternalState<T>>({
        loading: Boolean(key),
        refreshing: false,
    })

    useEffect(() => {
        if (!key) {
            activeKey.current = undefined
            setState({ loading: false, refreshing: false })
            return undefined
        }

        const keyChanged = activeKey.current !== key

        activeKey.current = key
        const sequence = requestSequence.current + 1
        requestSequence.current = sequence
        setState(previous => ({
            data: keyChanged ? undefined : previous.data,
            error: undefined,
            loading: keyChanged || !previous.data,
            refreshing: !keyChanged && Boolean(previous.data),
        }))
        requestAnalyticsWithRetry(requestRef.current)
            .then(data => {
                if (requestSequence.current !== sequence) return
                setState({ data, loading: false, refreshing: false })
            })
            .catch((error: unknown) => {
                if (requestSequence.current !== sequence) return
                setState(previous => ({
                    data: previous.data,
                    error: classifyAnalyticsError(error),
                    loading: false,
                    refreshing: false,
                }))
            })
        return () => {
            if (requestSequence.current === sequence) requestSequence.current += 1
        }
    }, [key, revision])

    const refresh = useCallback(() => {
        if (key) setRevision(current => current + 1)
    }, [key])

    return { ...state, refresh }
}
