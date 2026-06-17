/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'

import type { UserProfile, UserStats, UserStatsDistributionResponse } from '~/libs/core'
import { useMemberStats, useStatsDistribution } from '~/libs/core'

import MemberRatingCard from './MemberRatingCard'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn(() => '#616BD5'),
    useMemberStats: jest.fn(),
    useStatsDistribution: jest.fn(),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    Tooltip: (props: PropsWithChildren) => <>{props.children}</>,
}), {
    virtual: true,
})

jest.mock('../../../components', () => ({
    EditMemberPropertyBtn: () => <button type='button'>Edit</button>,
}))

jest.mock('../../../lib', () => ({
    getPreferredRolesText: jest.fn(() => undefined),
}))

jest.mock('./MemberRatingInfoModal', () => ({
    MemberRatingInfoModal: () => <div />,
}))

jest.mock('./ModifyPreferredRolesModal', () => ({
    ModifyPreferredRolesModal: () => <div />,
}))

const mockedUseMemberStats = useMemberStats as jest.MockedFunction<typeof useMemberStats>
const mockedUseStatsDistribution = useStatsDistribution as jest.MockedFunction<typeof useStatsDistribution>
const profile = { handle: 'dave' } as UserProfile
const ratingDistribution: UserStatsDistributionResponse = {
    createdAt: '2026-06-15T00:00:00.000Z',
    createdBy: 'test',
    distribution: {
        ratingRange0To899: 10,
        ratingRange900To1199: 20,
        ratingRange1200To1499: 70,
    },
    subTrack: 'MARATHON_MATCH',
    track: 'DATA_SCIENCE',
    updatedAt: '2026-06-15T00:00:00.000Z',
    updatedBy: 'test',
}
const defaultProps = {
    authProfile: undefined,
    memberPersonalizationTraitsData: undefined,
    mutatePersonalizationTraits: jest.fn(),
    profile,
}

describe('MemberRatingCard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedUseStatsDistribution.mockReturnValue(ratingDistribution)
    })

    it('hides percentile details when the member rating is zero', () => {
        mockedUseMemberStats.mockReturnValue({
            DATA_SCIENCE: {
                MARATHON_MATCH: {
                    mostRecentEventDate: 1000,
                    rank: {
                        percentile: 100,
                        rating: 0,
                    },
                },
            },
            maxRating: {
                rating: '0' as unknown as number,
            },
        } as unknown as UserStats)

        render(<MemberRatingCard {...defaultProps} />)

        expect(screen.getByText('0'))
            .toBeInTheDocument()
        expect(screen.getByText('Rating'))
            .toBeInTheDocument()
        expect(screen.queryByText('Top 100%'))
            .not
            .toBeInTheDocument()
        expect(screen.queryByText('Data Scientists'))
            .not
            .toBeInTheDocument()
    })

    it('shows percentile details when the member has a positive rating', () => {
        mockedUseMemberStats.mockReturnValue({
            DATA_SCIENCE: {
                MARATHON_MATCH: {
                    mostRecentEventDate: 1000,
                    rank: {
                        percentile: 42,
                        rating: 1200,
                    },
                },
            },
            maxRating: {
                rating: 1200,
            },
        } as unknown as UserStats)

        render(<MemberRatingCard {...defaultProps} />)

        expect(screen.getByText('1200'))
            .toBeInTheDocument()
        expect(screen.getByText('Top 70%'))
            .toBeInTheDocument()
        expect(screen.getByText('Top 70%'))
            .not
            .toHaveAttribute('style')
        expect(screen.getByText('Data Scientists'))
            .toBeInTheDocument()
    })
})
