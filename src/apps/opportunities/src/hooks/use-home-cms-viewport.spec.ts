/* eslint-disable import/no-extraneous-dependencies */
import { renderHook, RenderHookResult } from '@testing-library/react'

import { HomeCmsViewportState, useHomeCmsViewport } from './use-home-cms-viewport'

const mockUseCmsCollection = jest.fn()

jest.mock('~/libs/cms', () => ({
    useCmsCollection: (...args: unknown[]) => mockUseCmsCollection(...args),
}), { virtual: true })

type ViewportHookResult = RenderHookResult<HomeCmsViewportState, unknown>

describe('useHomeCmsViewport', () => {
    beforeEach(() => jest.clearAllMocks())

    it('queries one viewport with nested includes from the default CMS space', () => {
        mockUseCmsCollection.mockReturnValue({
            data: {
                items: [{
                    fields: {
                        content: [{
                            fields: { text: 'Join us on Discord' },
                            sys: { contentType: { sys: { id: 'contentBlock' } }, id: 'discord', type: 'Entry' },
                        }],
                    },
                    sys: { contentType: { sys: { id: 'viewport' } }, id: 'viewport', type: 'Entry' },
                }],
            },
            loading: false,
        })

        const { result }: ViewportHookResult = renderHook(() => useHomeCmsViewport('viewport'))

        expect(mockUseCmsCollection)
            .toHaveBeenCalledWith('default', { include: 10, limit: 1, 'sys.id': 'viewport' }, true)
        expect(result.current)
            .toEqual({
                blocks: [{ id: 'discord', kind: 'markdown', text: 'Join us on Discord' }],
                error: undefined,
                loading: false,
            })
    })

    it('passes loading and CMS errors through without blocks', () => {
        const error = new Error('Payload CMS access is not configured for the default space.')
        mockUseCmsCollection.mockReturnValueOnce({ loading: true })
        const { rerender, result }: ViewportHookResult = renderHook(() => useHomeCmsViewport('viewport'))

        expect(result.current)
            .toEqual({ blocks: [], error: undefined, loading: true })

        mockUseCmsCollection.mockReturnValueOnce({ error, loading: false })
        rerender()

        expect(result.current)
            .toEqual({ blocks: [], error, loading: false })
    })

    it('does not request an empty viewport ID', () => {
        mockUseCmsCollection.mockReturnValue({ loading: false })

        renderHook(() => useHomeCmsViewport(''))

        expect(mockUseCmsCollection.mock.calls[0][2])
            .toBe(false)
    })
})
