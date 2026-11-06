/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import React from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { fetchTrolleyLogs } from '../../../lib/services/wallet'
import { TrolleyLogReleasePair } from '../../../lib/models/TrolleyLogReleasePair'
import TrolleyLogsTab from './TrolleyLogsTab'

jest.mock('../../../lib/services/wallet', () => ({
    fetchTrolleyLogs: jest.fn(),
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: any) => (
        <button type='button' disabled={props.disabled} onClick={props.onClick}>{props.label}</button>
    ),
    LoadingCircles: () => <div>Loading...</div>,
}), {
    virtual: true,
})

const mockedFetch = fetchTrolleyLogs as jest.Mock

const pair: TrolleyLogReleasePair = {
    handle: 'sreekarReddy07',
    release1Amount: '10893.00',
    release1CreatedAt: '2026-10-09T13:05:44.000Z',
    release1Id: 'a0d1b0c8-18e2-47b1-b3bf-1093fe9068b6',
    release1Status: 'PROCESSED',
    release2Amount: '10893.00',
    release2CreatedAt: '2026-10-09T13:06:23.000Z',
    release2Id: '0cdd624c-7a7b-4851-99ba-1af52e807938',
    release2Status: 'PROCESSED',
    sharedAmount: '10893.00',
    sharedPayments: 2,
    sharedWinnings: [
        { amount: '1609.00', title: 'TaaS Payment - Week Ending 8/1/2026', winningId: 'w-1' },
        { amount: '9284.00', title: 'TaaS Payment - Week Ending 8/8/2026', winningId: 'w-2' },
    ],
    trolleyPayment1Id: 'P-Jj7B3JBkJsSVTNteSSXTkj',
    trolleyPayment2Id: 'P-QGc5yVN75pftMUF2d86sNv',
    userId: '500021412',
}

describe('TrolleyLogsTab', () => {
    beforeEach(() => {
        mockedFetch.mockReset()
    })

    it('loads the last 30 days by default and lists the release pairs', async () => {
        mockedFetch.mockResolvedValueOnce([pair])

        render(<TrolleyLogsTab />)

        expect(await screen.findByText('sreekarReddy07'))
            .toBeTruthy()
        expect(mockedFetch)
            .toHaveBeenCalledWith(30)
        expect(screen.getByText(pair.release1Id))
            .toBeTruthy()
        expect(screen.getByText(pair.release2Id))
            .toBeTruthy()
        expect(screen.getByText('P-QGc5yVN75pftMUF2d86sNv'))
            .toBeTruthy()
        expect(screen.getAllByText('$10,893.00').length)
            .toBeGreaterThan(0)
    })

    it('titles the view Trolley Logs and summarises the pairs without audit-sensitive wording', async () => {
        mockedFetch.mockResolvedValueOnce([pair])

        const { container }: { container: HTMLElement } = render(<TrolleyLogsTab />)
        await screen.findByText('sreekarReddy07')

        expect(screen.getByRole('heading', { name: 'Trolley Logs' }))
            .toBeTruthy()
        expect(screen.getByText(
            'Failed and returned releases are excluded from the below list. '
            + 'Check each pair in Trolley before taking action.',
        ))
            .toBeTruthy()
        expect(container.textContent)
            .toContain('1 pair of releases totalling $10,893.00')
        expect(container.textContent)
            .not.toMatch(/duplicate|twice|more than once/i)
    })

    it('only shows releases from October 2025 onwards', async () => {
        mockedFetch.mockResolvedValueOnce([
            pair,
            {
                ...pair,
                handle: 'preTrolleyMember',
                release1CreatedAt: '2025-09-30T23:59:59.000Z',
                release1Id: 'pre-trolley-1',
                release2Id: 'pre-trolley-2',
            },
        ])

        const { container }: { container: HTMLElement } = render(<TrolleyLogsTab />)

        expect(await screen.findByText('sreekarReddy07'))
            .toBeTruthy()
        expect(screen.queryByText('preTrolleyMember'))
            .toBeNull()
        expect(container.textContent)
            .toContain('1 pair of releases totalling')
    })

    it('shows the shared winnings when the payments count is clicked', async () => {
        mockedFetch.mockResolvedValueOnce([pair])

        render(<TrolleyLogsTab />)

        fireEvent.click(await screen.findByText('2 payments'))

        expect(screen.getByText(/Week Ending 8\/1\/2026/))
            .toBeTruthy()
        expect(screen.getByText(/Week Ending 8\/8\/2026/))
            .toBeTruthy()
    })

    it('reloads with the selected period', async () => {
        mockedFetch.mockResolvedValue([])

        render(<TrolleyLogsTab />)
        await screen.findByText('No release pairs found for this period.')

        fireEvent.click(screen.getByText('Since October 2025'))

        await waitFor(() => expect(mockedFetch)
            .toHaveBeenLastCalledWith(undefined))
    })

    it('shows an error when loading fails', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('boom'))

        render(<TrolleyLogsTab />)

        expect(await screen.findByText('Failed to load Trolley logs. Please try again.'))
            .toBeTruthy()
    })
})
