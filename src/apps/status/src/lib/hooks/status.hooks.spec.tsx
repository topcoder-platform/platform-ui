/* eslint-disable @typescript-eslint/typedef, import/no-extraneous-dependencies */
import { renderHook, waitFor } from '@testing-library/react'

import { getSendgridMessages } from '../services'

import { useSendgridMessages } from './status.hooks'

jest.mock('../services', () => ({
    getSendgridMessages: jest.fn(),
}))

const mockedGetSendgridMessages = getSendgridMessages as jest.Mock

describe('Status route-scoped hooks', () => {
    beforeEach(() => {
        mockedGetSendgridMessages.mockReset()
        mockedGetSendgridMessages.mockResolvedValue({
            data: { messages: [] },
            meta: {
                complete: true,
                generatedAt: '2026-07-20T00:00:00.000Z',
                source: ['sendgrid'],
                warnings: [],
            },
        })
    })

    it('does not fetch SendGrid activity until its disclosure opens', async () => {
        const { rerender, result } = renderHook(
            ({ enabled }) => useSendgridMessages(enabled),
            { initialProps: { enabled: false } },
        )

        expect(mockedGetSendgridMessages).not.toHaveBeenCalled()
        expect(result.current.loading)
            .toBe(false)

        rerender({ enabled: true })

        await waitFor(() => expect(mockedGetSendgridMessages)
            .toHaveBeenCalledTimes(1))
        await waitFor(() => expect(result.current.data?.data.messages)
            .toEqual([]))
    })
})
