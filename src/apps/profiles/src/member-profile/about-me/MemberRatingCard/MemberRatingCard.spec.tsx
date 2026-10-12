/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'

import type { UserProfile, UserStats, UserStatsDistributionResponse } from '~/libs/core'
import { useMemberStats, useProfileCompleteness, useStatsDistribution } from '~/libs/core'

import { getPreferredRolesText } from '../../../lib'

import MemberRatingCard from './MemberRatingCard'

type MockTooltipProps = PropsWithChildren<{ disableTooltip?: boolean, offset?: number }>

const mockTooltip = jest.fn((props: MockTooltipProps) => <>{props.children}</>)

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn(() => '#616BD5'),
    useMemberStats: jest.fn(),
    useProfileCompleteness: jest.fn(() => ({
        entries: {},
        isLoading: false,
        mutate: jest.fn(),
        percent: 100,
    })),
    useStatsDistribution: jest.fn(),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    Tooltip: (props: MockTooltipProps) => mockTooltip(props),
}), {
    virtual: true,
})

jest.mock('../../../components', () => ({
    AddButton: (props: { label: string, onClick: () => void }): JSX.Element => (
        <button type='button' onClick={props.onClick}>{props.label}</button>
    ),
    EditMemberPropertyBtn: () => <button type='button'>Edit</button>,
}))

jest.mock('../../../lib', () => ({
    getPreferredRolesText: jest.fn(() => ''),
}))

jest.mock('./MemberRatingInfoModal', () => ({
    MemberRatingInfoModal: (props: { onClose: () => void }) => (
        <div role='dialog'>
            <button type='button' onClick={props.onClose}>Close rating modal</button>
        </div>
    ),
}))

jest.mock('./ModifyPreferredRolesModal', () => ({
    ModifyPreferredRolesModal: () => <div />,
}))

const mockedUseMemberStats = useMemberStats as jest.MockedFunction<typeof useMemberStats>
const mockedUseStatsDistribution = useStatsDistribution as jest.MockedFunction<typeof useStatsDistribution>
const mockedUseProfileCompleteness = useProfileCompleteness as jest.MockedFunction<typeof useProfileCompleteness>
const mockedGetPreferredRolesText = getPreferredRolesText as jest.MockedFunction<typeof getPreferredRolesText>
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

/**
 * Returns the props from the latest mocked Tooltip render.
 * Used to verify the rating card's percentile tooltip offset and that it is disabled while the rating modal is open.
 *
 * @returns The most recent Tooltip props captured by the mock.
 */
function getLastTooltipProps(): MockTooltipProps {
    const lastTooltipCall = mockTooltip.mock.calls[mockTooltip.mock.calls.length - 1]

    return lastTooltipCall[0]
}

describe('MemberRatingCard', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockTooltip.mockImplementation((props: MockTooltipProps) => (
            <>{props.children}</>
        ))
        mockedUseStatsDistribution.mockReturnValue(ratingDistribution)
        mockedUseProfileCompleteness.mockReturnValue({
            entries: {},
            isLoading: false,
            mutate: jest.fn(),
            percent: 100,
        } as unknown as ReturnType<typeof useProfileCompleteness>)
        mockedGetPreferredRolesText.mockReturnValue('')
    })

    it('shows preferred roles when rating data is unavailable', () => {
        mockedUseMemberStats.mockReturnValue(undefined)
        mockedGetPreferredRolesText.mockReturnValue('Designer\nFront-End Developer')

        render(<MemberRatingCard {...defaultProps} />)

        expect(screen.queryByText('Rating'))
            .not
            .toBeInTheDocument()
        expect(screen.queryByText('What is this?'))
            .not
            .toBeInTheDocument()
        expect(screen.getByText('Designer'))
            .toBeInTheDocument()
        expect(screen.getByText('Front-End Developer'))
            .toBeInTheDocument()
    })

    it('shows the preferred roles add action for the profile owner when rating data is unavailable', () => {
        mockedUseMemberStats.mockReturnValue(undefined)

        render(<MemberRatingCard {...defaultProps} authProfile={profile} />)

        expect(screen.queryByText('Rating'))
            .not
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Add preferred roles' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Edit' }))
            .not
            .toBeInTheDocument()
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

    it('shows top one percent when the member rating is above the highest distribution range', () => {
        mockedUseMemberStats.mockReturnValue({
            DATA_SCIENCE: {
                MARATHON_MATCH: {
                    mostRecentEventDate: 1000,
                    rank: {
                        rating: 4051,
                    },
                },
            },
            maxRating: {
                rating: 4051,
            },
        } as unknown as UserStats)

        render(<MemberRatingCard {...defaultProps} />)

        expect(screen.getByText('4051'))
            .toBeInTheDocument()
        expect(screen.getByText('Top 1%'))
            .toBeInTheDocument()
        expect(screen.getByText('Data Scientists'))
            .toBeInTheDocument()
    })

    it('offsets the percentile tooltip above the card so its arrow has room', () => {
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

        expect(getLastTooltipProps().offset)
            .toBe(16)
    })

    it('disables the percentile tooltip while the rating modal is open', () => {
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

        expect(getLastTooltipProps().disableTooltip)
            .toBe(false)

        fireEvent.click(screen.getByRole('button', { name: /Top 70% Data Scientists/i }))

        expect(screen.getByRole('dialog'))
            .toBeInTheDocument()
        expect(getLastTooltipProps().disableTooltip)
            .toBe(true)

        fireEvent.click(screen.getByRole('button', { name: 'Close rating modal' }))

        expect(screen.queryByRole('dialog'))
            .not
            .toBeInTheDocument()
        expect(getLastTooltipProps().disableTooltip)
            .toBe(false)
    })
})
