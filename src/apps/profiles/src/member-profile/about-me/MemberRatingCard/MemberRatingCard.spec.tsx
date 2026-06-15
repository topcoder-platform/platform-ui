/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

import type { UserProfile, UserStats } from '~/libs/core'
import { useMemberStats } from '~/libs/core'

import MemberRatingCard from './MemberRatingCard'

jest.mock('~/libs/core', () => ({
    useMemberStats: jest.fn(),
}), {
    virtual: true,
})

jest.mock('./MemberRatingInfoModal', () => ({
    MemberRatingInfoModal: () => <div />,
}))

const mockedUseMemberStats = useMemberStats as jest.MockedFunction<typeof useMemberStats>
const profile = { handle: 'dave' } as UserProfile

describe('MemberRatingCard', () => {
    it('hides percentile details when the member rating is zero', () => {
        mockedUseMemberStats.mockReturnValue({
            DATA_SCIENCE: {
                MARATHON_MATCH: {
                    rank: {
                        percentile: 100,
                        rating: 0,
                    },
                },
            },
            maxRating: {
                rating: '0' as unknown as number,
            },
        } as UserStats)

        render(<MemberRatingCard profile={profile} />)

        expect(screen.getByText('0'))
            .toBeInTheDocument()
        expect(screen.getByText('Rating'))
            .toBeInTheDocument()
        expect(screen.queryByText('100.00'))
            .not
            .toBeInTheDocument()
        expect(screen.queryByText('Percentile'))
            .not
            .toBeInTheDocument()
    })

    it('shows percentile details when the member has a positive rating', () => {
        mockedUseMemberStats.mockReturnValue({
            DATA_SCIENCE: {
                MARATHON_MATCH: {
                    rank: {
                        percentile: 42,
                        rating: 1200,
                    },
                },
            },
            maxRating: {
                rating: 1200,
            },
        } as UserStats)

        render(<MemberRatingCard profile={profile} />)

        expect(screen.getByText('1200'))
            .toBeInTheDocument()
        expect(screen.getByText('42.00'))
            .toBeInTheDocument()
        expect(screen.getByText('Percentile'))
            .toBeInTheDocument()
    })
})
