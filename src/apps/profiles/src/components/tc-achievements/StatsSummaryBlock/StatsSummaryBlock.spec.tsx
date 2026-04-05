/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import StatsSummaryBlock from './StatsSummaryBlock'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn(() => '#000000'),
    UserRole: {
        administrator: 'administrator',
        talentManager: 'talentManager',
    },
}), {
    virtual: true,
})

jest.mock('../../../lib', () => ({
    formatPlural: (count: number, label: string) => `${label}${count === 1 ? '' : 's'}`,
    numberToFixed: (value: number) => value.toString(),
}))

describe('StatsSummaryBlock', () => {
    it('renders zero wins when the wins count is missing', () => {
        render(
            <StatsSummaryBlock
                challenges={5}
                submissions={2}
                trackTitle='Bug Hunt'
            />,
        )

        expect(
            screen.getByText('Wins')
                .closest('div'),
        )
            .toHaveTextContent('0')
    })

    it.each(['First2Finish', 'Bug Hunt'])(
        'hides volatility for %s stats even when a volatility value exists',
        trackTitle => {
            render(
                <StatsSummaryBlock
                    challenges={5}
                    submissions={2}
                    trackTitle={trackTitle}
                    volatility={123}
                    wins={2}
                />,
            )

            expect(screen.queryByText(/volatility/i)).not.toBeInTheDocument()
            expect(screen.queryByText('123')).not.toBeInTheDocument()
        },
    )

    it('keeps volatility visible for tracks that support it', () => {
        render(
            <StatsSummaryBlock
                challenges={5}
                submissions={2}
                trackTitle='Marathon Match'
                volatility={123}
                wins={2}
            />,
        )

        expect(screen.getByText(/volatility/i))
            .toBeInTheDocument()
        expect(screen.getByText('123'))
            .toBeInTheDocument()
    })
})
