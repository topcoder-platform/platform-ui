/* eslint-disable import/no-extraneous-dependencies */
import { act, renderHook, RenderHookResult } from '@testing-library/react'

import { useTopcoderTime } from './use-topcoder-time'

describe('useTopcoderTime', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-10-08T11:31:45.000Z'))
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('shows the current Eastern time and updates at the start of each minute', () => {
        const { result }: RenderHookResult<string, unknown> = renderHook(() => useTopcoderTime())

        expect(result.current)
            .toBe('Oct 8th, 07:31 UTC-4')

        act(() => {
            jest.advanceTimersByTime(14_999)
        })
        expect(result.current)
            .toBe('Oct 8th, 07:31 UTC-4')

        act(() => {
            jest.advanceTimersByTime(1)
        })
        expect(result.current)
            .toBe('Oct 8th, 07:32 UTC-4')

        act(() => {
            jest.advanceTimersByTime(60_000)
        })
        expect(result.current)
            .toBe('Oct 8th, 07:33 UTC-4')
    })

    it('stops updating after unmount', () => {
        const { unmount }: RenderHookResult<string, unknown> = renderHook(() => useTopcoderTime())

        expect(jest.getTimerCount())
            .toBe(1)
        unmount()
        expect(jest.getTimerCount())
            .toBe(0)
    })
})
