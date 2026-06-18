/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { render, screen, within } from '@testing-library/react'

import type { UserProfile } from '~/libs/core'

import MemberRatingInfoModal from './MemberRatingInfoModal'

const baseProfile = {
    firstName: 'Emily',
    handle: 'emily',
    photoURL: 'https://example.com/photo.png',
} as UserProfile

const ratingDistribution = {
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
}

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
    it('renders the position summary without the pyramid graphic', () => {
        render(
            <MemberRatingInfoModal
                audienceLabel='developers'
                onClose={jest.fn()}
                percentile={15}
                profile={baseProfile}
                rating={1646}
                ratingDistribution={ratingDistribution}
            />,
        )

        const positionSummary = screen.getByTestId('rating-position-summary')

        expect(within(positionSummary)
            .getByText('Position'))
            .toBeInTheDocument()
        expect(within(positionSummary)
            .getByText(/TOP\s+15%/))
            .toBeInTheDocument()
        expect(within(positionSummary)
            .getByText(/TOP\s+15%/))
            .not
            .toHaveAttribute('style')
        expect(positionSummary.querySelector('svg'))
            .not
            .toBeInTheDocument()
        expect(screen.getByText('Where Emily ranks in the distribution'))
            .toBeInTheDocument()
    })

    it('shows a positive sub-one percentile as top one percent', () => {
        render(
            <MemberRatingInfoModal
                audienceLabel='developers'
                onClose={jest.fn()}
                percentile={0.4}
                profile={baseProfile}
                rating={3664}
                ratingDistribution={ratingDistribution}
            />,
        )

        expect(screen.getByText(/TOP\s+1%/))
            .toBeInTheDocument()
        expect(screen.queryByText(/TOP\s+0%/))
            .not
            .toBeInTheDocument()
    })

    it('stacks the marker rating for high ratings near the right edge of the chart', () => {
        render(
            <MemberRatingInfoModal
                audienceLabel='developers'
                onClose={jest.fn()}
                percentile={0.4}
                profile={baseProfile}
                rating={3664}
                ratingDistribution={ratingDistribution}
            />,
        )

        expect(screen.getByTestId('rating-member-marker'))
            .toHaveClass('memberMarkerStacked')
    })
})
