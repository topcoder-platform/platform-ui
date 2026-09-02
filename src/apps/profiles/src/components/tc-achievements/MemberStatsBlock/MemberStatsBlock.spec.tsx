/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import type { PropsWithChildren } from 'react'
import { render, screen, within } from '@testing-library/react'

import type { UserProfile } from '~/libs/core'

import { getActiveTracks, type MemberStatsTrack } from '../../../hooks'
import MemberStatsBlock, { MemberChallengePointsBar } from './MemberStatsBlock'

const memberStatsBlockStyles = readFileSync(`${__dirname}/MemberStatsBlock.module.scss`, 'utf8')
const mockedGetActiveTracks = getActiveTracks as jest.MockedFunction<typeof getActiveTracks>
const profile = { handle: 'tester' } as UserProfile

const createTrack = (overrides: Partial<MemberStatsTrack>): MemberStatsTrack => ({
    isActive: true,
    name: 'Development',
    subTracks: [],
    wins: 0,
    ...overrides,
})

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn(() => '#000000'),
    useMemberStats: jest.fn(),
    useStatsHistory: jest.fn(),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren): JSX.Element => <div>{props.children}</div>,
    IconOutline: {
        ChevronRightIcon: (props: { className?: string }): JSX.Element => (
            <svg
                className={props.className}
                data-testid='breakdown-chevron'
            />
        ),
    },
}), {
    virtual: true,
})

jest.mock('react-router-dom', () => ({
    Link: (props: PropsWithChildren<{ className?: string, to: string }>): JSX.Element => (
        <a className={props.className} href={props.to}>{props.children}</a>
    ),
}))

jest.mock('../../../member-profile/MemberProfile.context', () => ({
    useMemberProfileContext: jest.fn(() => ({
        statsRoute: jest.fn((handle: string, trackName: string) => `/${handle}/${trackName}`),
    })),
}))

jest.mock('../../../hooks', () => ({
    getActiveTracks: jest.fn(() => []),
    getMemberChallengePoints: jest.fn(),
}))

jest.mock('./MemberChallengePointsModal', () => jest.fn(() => ''))

jest.mock('../../../lib', () => ({
    formatPlural: (count: number, label: string): string => `${label}${count === 1 ? '' : 's'}`,
    WinnerIcon: (props: { className?: string }): JSX.Element => (
        <svg className={props.className} data-testid='winner-icon' />
    ),
}))

describe('MemberChallengePointsBar', () => {
    it('renders the breakdown chevron with the larger icon size', () => {
        render(
            <MemberChallengePointsBar
                profile={{
                    challengePoints: {
                        challenges: 5,
                        details: [{
                            challengeId: 'challenge-1',
                            challengeName: 'AI Challenge',
                            placement: 1,
                            points: 2325,
                            userId: 123,
                        }],
                        total: 2325,
                    },
                    handle: 'tester',
                } as UserProfile}
            />,
        )

        const breakdownButton = screen.getByRole('button', {
            name: /view breakdown/i,
        })
        const chevron = within(breakdownButton)
            .getByTestId('breakdown-chevron')

        expect(chevron)
            .toHaveClass('icon-lg')
        expect(chevron)
            .not
            .toHaveClass('icon-sm')
    })
})

describe('MemberStatsBlock typography styles', () => {
    it('uses the PM-5398 font sizes for the member stats section', () => {
        expect(memberStatsBlockStyles)
            .toMatch(/:global\(\.body-large-bold\) \{\s*font-size: 24px;/)
        expect(memberStatsBlockStyles)
            .toMatch(/:global\(\.body-main\) \{\s*font-size: 16px;/)
        expect(memberStatsBlockStyles)
            .toMatch(/\.count \{[\s\S]*?font-size: 26px;/)
        expect(memberStatsBlockStyles)
            .toMatch(/\.label \{[\s\S]*?font-size: 11px;/)
        expect(memberStatsBlockStyles)
            .toMatch(/\.trackName \{[\s\S]*?font-size: 16px;/)
    })

    it('lays out rating and wins side by side in track details', () => {
        expect(memberStatsBlockStyles)
            .toMatch(/\.trackDetails \{[\s\S]*?display: flex;/)
        expect(memberStatsBlockStyles)
            .toMatch(/\.trackStat \{[\s\S]*?display: flex;/)
        expect(memberStatsBlockStyles)
            .toMatch(/\.trackDetails \{[\s\S]*?gap: \$sp-4;/)
    })
})

describe('MemberStatsBlock track stats', () => {
    afterEach(() => {
        mockedGetActiveTracks.mockReset()
        mockedGetActiveTracks.mockReturnValue([])
    })

    it('shows rating and wins together when both exist', () => {
        mockedGetActiveTracks.mockReturnValue([
            createTrack({
                name: 'Development',
                rating: 1600,
                wins: 28,
            }),
        ])

        render(<MemberStatsBlock profile={profile} />)

        const developmentRow = screen.getByRole('link', { name: /Development/ })

        expect(within(developmentRow)
            .getByTestId('track-stat-rating'))
            .toHaveTextContent('1,600')
        expect(within(developmentRow)
            .getByTestId('track-stat-rating'))
            .toHaveTextContent('Rating')
        expect(within(developmentRow)
            .getByTestId('rating-icon'))
            .toBeInTheDocument()
        expect(within(developmentRow)
            .getByTestId('track-stat-winner'))
            .toHaveTextContent('28')
        expect(within(developmentRow)
            .getByTestId('track-stat-winner'))
            .toHaveTextContent('Wins')
        expect(within(developmentRow)
            .getByTestId('winner-icon'))
            .toBeInTheDocument()
    })

    it('shows only wins when a track has wins and no rating', () => {
        mockedGetActiveTracks.mockReturnValue([
            createTrack({
                name: 'Design',
                submissions: 40,
                wins: 52,
            }),
        ])

        render(<MemberStatsBlock profile={profile} />)

        const designRow = screen.getByRole('link', { name: /Design/ })

        expect(within(designRow)
            .getByTestId('track-stat-winner'))
            .toHaveTextContent('52')
        expect(within(designRow)
            .queryByTestId('track-stat-rating'))
            .not
            .toBeInTheDocument()
        expect(within(designRow)
            .queryByTestId('rating-icon'))
            .not
            .toBeInTheDocument()
        expect(within(designRow)
            .queryByText('Submissions'))
            .not
            .toBeInTheDocument()
    })

    it('shows only rating when a track has a rating and no wins', () => {
        mockedGetActiveTracks.mockReturnValue([
            createTrack({
                name: 'Competitive Programming',
                rating: 4051,
                wins: 0,
            }),
        ])

        render(<MemberStatsBlock profile={profile} />)

        const programmingRow = screen.getByRole('link', { name: /Competitive Programming/ })

        expect(within(programmingRow)
            .getByTestId('track-stat-rating'))
            .toHaveTextContent('4,051')
        expect(within(programmingRow)
            .queryByTestId('track-stat-winner'))
            .not
            .toBeInTheDocument()
        expect(within(programmingRow)
            .queryByTestId('winner-icon'))
            .not
            .toBeInTheDocument()
    })

    it('falls back to submissions when a track has no rating or wins', () => {
        mockedGetActiveTracks.mockReturnValue([
            createTrack({
                name: 'Testing',
                submissions: 13,
                wins: 0,
            }),
        ])

        render(<MemberStatsBlock profile={profile} />)

        const testingRow = screen.getByRole('link', { name: /Testing/ })

        expect(within(testingRow)
            .getByTestId('track-stat-count'))
            .toHaveTextContent('13')
        expect(within(testingRow)
            .getByTestId('track-stat-count'))
            .toHaveTextContent('Submissions')
        expect(within(testingRow)
            .queryByTestId('rating-icon'))
            .not
            .toBeInTheDocument()
        expect(within(testingRow)
            .queryByTestId('winner-icon'))
            .not
            .toBeInTheDocument()
    })
})
