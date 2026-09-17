/* eslint-disable import/no-extraneous-dependencies */
import {
    classifyAnalyticsError,
    requestAnalyticsWithRetry,
} from './useAnalyticsResource'

describe('Analytics request error classification', () => {
    it('does not expose provider error messages', () => {
        expect(classifyAnalyticsError({
            message: 'sensitive upstream details',
            response: { status: 500 },
        }))
            .toEqual({
                kind: 'general',
                message: 'Analytics data could not be loaded. Try again.',
                status: 500,
            })
    })

    it.each([
        [401, 'authorization'],
        [403, 'authorization'],
        [429, 'throttled'],
        [503, 'throttled'],
        [504, 'timeout'],
    ])('maps HTTP %s to the %s category', (status, kind) => {
        expect(classifyAnalyticsError({ response: { status } }).kind)
            .toBe(kind)
    })

    it('reports disabled environment configuration clearly', () => {
        expect(classifyAnalyticsError({ message: 'Analytics API is not configured' }).kind)
            .toBe('configuration')
    })

    it('retries one warehouse timeout after a bounded delay', async () => {
        const result = { generatedAt: '2026-08-31T00:00:00Z' }
        const request = jest.fn()
            .mockRejectedValueOnce({ response: { status: 504 } })
            .mockResolvedValueOnce(result)
        const wait = jest.fn()
            .mockResolvedValue(undefined)

        await expect(requestAnalyticsWithRetry(request, wait))
            .resolves.toEqual(result)
        expect(request)
            .toHaveBeenCalledTimes(2)
        expect(wait)
            .toHaveBeenCalledWith(1_000)
    })

    it('does not retry a non-timeout failure', async () => {
        const error = { response: { status: 403 } }
        const request = jest.fn()
            .mockRejectedValue(error)
        const wait = jest.fn()
            .mockResolvedValue(undefined)

        await expect(requestAnalyticsWithRetry(request, wait))
            .rejects.toBe(error)
        expect(request)
            .toHaveBeenCalledTimes(1)
        expect(wait)
            .not.toHaveBeenCalled()
    })

    it('surfaces a failed retry without issuing a third request', async () => {
        const firstError = { response: { status: 504 } }
        const retryError = { response: { status: 504 } }
        const request = jest.fn()
            .mockRejectedValueOnce(firstError)
            .mockRejectedValueOnce(retryError)
        const wait = jest.fn()
            .mockResolvedValue(undefined)

        await expect(requestAnalyticsWithRetry(request, wait))
            .rejects.toBe(retryError)
        expect(request)
            .toHaveBeenCalledTimes(2)
    })
})
