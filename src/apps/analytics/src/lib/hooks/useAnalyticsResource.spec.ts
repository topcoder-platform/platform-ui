/* eslint-disable import/no-extraneous-dependencies */
import { classifyAnalyticsError } from './useAnalyticsResource'

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
})
