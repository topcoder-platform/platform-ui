/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { render, screen, within } from '@testing-library/react'

import type { UserProfile } from '~/libs/core'

import MemberRatingInfoModal from './MemberRatingInfoModal'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn(() => '#616BD5'),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{
        open?: boolean
        title?: JSX.Element
    }>): JSX.Element => (
        props.open ? (
            <section>
                {props.title}
                {props.children}
            </section>
        ) : <></>
    ),
}), {
    virtual: true,
})

jest.mock('../../../../lib', () => ({
    numberToFixed: (value: number | string, digits: number = 2): string => Number(value)
        .toFixed(digits),
}))

describe('MemberRatingInfoModal', () => {
    it('keeps the pyramid graphic in the position summary cell', () => {
        render(
            <MemberRatingInfoModal
                audienceLabel='developers'
                onClose={jest.fn()}
                percentile={15}
                profile={{
                    firstName: 'Emily',
                    handle: 'emily',
                    photoURL: 'https://example.com/photo.png',
                } as UserProfile}
                rating={1646}
                ratingDistribution={{
                    createdAt: '2026-06-04T00:00:00.000Z',
                    createdBy: 'test',
                    distribution: {
                        ratingRange0To899: 10,
                        ratingRange900To1199: 20,
                        ratingRange1200To1499: 30,
                        ratingRange1500To2199: 40,
                    },
                    subTrack: 'AI',
                    track: 'DATA_SCIENCE',
                    updatedAt: '2026-06-04T00:00:00.000Z',
                    updatedBy: 'test',
                }}
            />,
        )

        const positionSummary = screen.getByTestId('rating-position-summary')

        expect(within(positionSummary)
            .getByText('Position'))
            .toBeInTheDocument()
        expect(within(positionSummary)
            .getByText(/TOP\s+15%/))
            .toBeInTheDocument()
        expect(positionSummary.querySelector('svg'))
            .toBeInTheDocument()
        expect(screen.getByText('Where Emily ranks in the distribution'))
            .toBeInTheDocument()
    })
})
