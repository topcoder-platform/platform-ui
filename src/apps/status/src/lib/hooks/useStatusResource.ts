/**
 * Shared request lifecycle for Status pages, including last-good-data retention
 * and stale-response suppression.
 */
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'

import { StatusRequestError } from '../models'

export interface StatusResourceState<T> {
    data?: T
    error?: StatusRequestError
    loading: boolean
    refreshing: boolean
    stale: boolean
    refresh: () => void
}

interface InternalState<T> {
    data?: T
    error?: StatusRequestError
    loading: boolean
    refreshing: boolean
    stale: boolean
}

/**
 * Converts an intercepted XHR error into a safe UI category and message.
 *
 * @param error unknown rejected request value.
 * @returns sanitized request error suitable for administrator UI display.
 * @throws Does not throw.
 */
export function classifyStatusError(error: unknown): StatusRequestError {
    const candidate = error as {
        code?: string
        message?: string
        status?: number
        response?: { status?: number }
    }
    const status = candidate?.status ?? candidate?.response?.status

    if (status === 401 || status === 403) {
        return {
            kind: 'authorization',
            message: status === 401
                ? 'Your session is missing or expired. Sign in again to view Status.'
                : 'Administrator access is required to view this Status data.',
            status,
        }
    }

    if (status === 504 || candidate?.code === 'ECONNABORTED') {
        return {
            kind: 'timeout',
            message: 'The monitoring source timed out. Existing data may be stale.',
            status,
        }
    }

    if (status === 429 || status === 503) {
        return {
            kind: 'throttled',
            message: 'The monitoring source is temporarily unavailable or rate limited.',
            status,
        }
    }

    return {
        kind: 'general',
        message: 'Status data could not be loaded. Try again.',
        status,
    }
}

/**
 * Loads a read-only Status resource when enabled and retains the last successful
 * result during refresh failures.
 *
 * @param key stable identity for the current request, or undefined to disable it.
 * @param request function performing the GET request.
 * @returns request state and an explicit refresh action.
 * @throws Does not throw; failures are returned in state.
 */
export function useStatusResource<T>(
    key: string | undefined,
    request: () => Promise<T>,
): StatusResourceState<T> {
    const requestRef = useRef(request)
    requestRef.current = request
    const requestSequence = useRef(0)
    const activeKey = useRef<string | undefined>(undefined)
    const [revision, setRevision]: [number, Dispatch<SetStateAction<number>>] = useState(0)
    const [state, setState] = useState<InternalState<T>>({
        loading: Boolean(key),
        refreshing: false,
        stale: false,
    })

    useEffect(() => {
        if (!key) {
            activeKey.current = undefined
            setState({ loading: false, refreshing: false, stale: false })
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
            stale: false,
        }))

        requestRef.current()
            .then(data => {
                if (requestSequence.current !== sequence) {
                    return
                }

                setState({
                    data,
                    loading: false,
                    refreshing: false,
                    stale: false,
                })
            })
            .catch((error: unknown) => {
                if (requestSequence.current !== sequence) {
                    return
                }

                setState(previous => ({
                    data: previous.data,
                    error: classifyStatusError(error),
                    loading: false,
                    refreshing: false,
                    stale: Boolean(previous.data),
                }))
            })

        return () => {
            if (requestSequence.current === sequence) {
                requestSequence.current += 1
            }
        }
    }, [key, revision])

    const refresh = useCallback(() => {
        if (key) {
            setRevision(current => current + 1)
        }
    }, [key])

    return {
        ...state,
        refresh,
    }
}
