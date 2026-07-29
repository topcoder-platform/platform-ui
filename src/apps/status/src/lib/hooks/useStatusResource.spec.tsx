/* eslint-disable @typescript-eslint/typedef, import/no-extraneous-dependencies, react/jsx-no-bind */
import { act, renderHook, waitFor } from '@testing-library/react'

import { useStatusResource } from './useStatusResource'

interface Deferred<T> {
    promise: Promise<T>
    reject: (reason?: unknown) => void
    resolve: (value: T) => void
}

/**
 * Creates an externally controlled promise for request-order tests.
 *
 * @returns deferred promise and settlement functions.
 * @throws Does not throw.
 */
function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (reason?: unknown) => void
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })
    return { promise, reject, resolve }
}

describe('useStatusResource', () => {
    it('does not fetch while a route identifier is unavailable', () => {
        const request = jest.fn()

        const { result } = renderHook(() => useStatusResource(undefined, request))

        expect(request).not.toHaveBeenCalled()
        expect(result.current.loading)
            .toBe(false)
    })

    it('suppresses a stale response after the request key changes', async () => {
        const first = deferred<string>()
        const second = deferred<string>()
        const request = jest.fn()
            .mockReturnValueOnce(first.promise)
            .mockReturnValueOnce(second.promise)
        const { rerender, result } = renderHook(
            ({ key }) => useStatusResource(key, request),
            { initialProps: { key: 'first' } },
        )

        rerender({ key: 'second' })
        await act(async () => second.resolve('new'))
        await waitFor(() => expect(result.current.data)
            .toBe('new'))
        await act(async () => first.resolve('old'))

        expect(result.current.data)
            .toBe('new')
    })

    it('retains last-good data and marks it stale when refresh fails', async () => {
        const request = jest.fn()
            .mockResolvedValueOnce('fresh')
            .mockRejectedValueOnce({ status: 503 })
        const { result } = renderHook(() => useStatusResource('resource', request))

        await waitFor(() => expect(result.current.data)
            .toBe('fresh'))
        act(() => result.current.refresh())
        await waitFor(() => expect(result.current.error?.kind)
            .toBe('throttled'))

        expect(result.current.data)
            .toBe('fresh')
        expect(result.current.stale)
            .toBe(true)
    })
})
