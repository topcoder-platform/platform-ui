/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import { fireEvent, render, RenderResult, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type {
    MemberRoleChallenges,
    MemberSpecialRole,
    UserProfile,
} from '~/libs/core'
import { useMemberRoleChallenges } from '~/libs/core'

import MemberRoleDetailsView from './MemberRoleDetailsView'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: {
            CHALLENGES_PAGE: 'https://challenges.example.com',
        },
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    useMemberRoleChallenges: jest.fn(),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ChevronLeftIcon: (): JSX.Element => <svg />,
        ChevronRightIcon: (): JSX.Element => <svg />,
        XIcon: (): JSX.Element => <svg />,
    },
    LoadingSpinner: (): JSX.Element => <div>Loading</div>,
}), {
    virtual: true,
})

jest.mock('../../../profiles.routes', () => ({
    getUserProfileRoute: (handle: string): string => `/${handle}`,
}))

const mockedUseMemberRoleChallenges = useMemberRoleChallenges as jest.MockedFunction<
    typeof useMemberRoleChallenges
>
const profile = { handle: 'tester' } as UserProfile
const memberRoleDetailsStyles = readFileSync(`${__dirname}/MemberRoleDetailsView.module.scss`, 'utf8')

describe('MemberRoleDetailsView styles', () => {
    it('uses the approved role details typography and casing', () => {
        const statsHeadingStyles = memberRoleDetailsStyles.match(/> h3 \{[\s\S]*?\n\s{4}\}/)?.[0]

        expect(memberRoleDetailsStyles)
            .toMatch(/> h2 \{[\s\S]*?text-transform: none;/)
        expect(memberRoleDetailsStyles)
            .toMatch(/\.backLink \{[\s\S]*?line-height: 22px;/)
        expect(statsHeadingStyles)
            .toContain('font-size: 16px;')
        expect(statsHeadingStyles)
            .toContain('font-weight: $font-weight-medium;')
        expect(statsHeadingStyles)
            .toContain('line-height: 24px;')
        expect(statsHeadingStyles)
            .toContain('text-transform: none;')
        expect(memberRoleDetailsStyles)
            .toMatch(/> strong \{[\s\S]*?font-size: 32px;[\s\S]*?line-height: 34px;/)
    })

    it('bounds the loading state within the achievements card', () => {
        expect(memberRoleDetailsStyles)
            .toMatch(/\.loadingState \{[\s\S]*?height: 120px;[\s\S]*?overflow: hidden;/)
    })

    it('keeps long challenge lists in a bounded scrollable viewport', () => {
        expect(memberRoleDetailsStyles)
            .toMatch(/\.challengeList \{[\s\S]*?max-height: 258px;[\s\S]*?overflow-y: auto;/)
        expect(memberRoleDetailsStyles)
            .not.toMatch(/\.pagination \{/)
    })
})

/**
 * Creates a complete SWR-shaped response for a role details page.
 *
 * This test helper does not throw.
 *
 * @param {MemberRoleChallenges} data - Loaded member role challenges.
 * @returns {ReturnType<typeof useMemberRoleChallenges>} Hook response consumed by the component.
 */
function createHookResponse(data: MemberRoleChallenges): ReturnType<typeof useMemberRoleChallenges> {
    return {
        data,
        error: undefined,
        hasMore: false,
        isValidating: false,
        loadMore: jest.fn(),
        mutate: jest.fn(),
    }
}

/**
 * Renders the details view at a nested profile role route.
 *
 * This test helper does not intentionally throw; render failures are reported by Testing Library.
 *
 * @param {MemberSpecialRole} role - Copilot or reviewer route to render.
 * @param {UserProfile} memberProfile - Profile supplied to the role details view.
 * @returns {RenderResult} Testing Library controls for the rendered role route.
 */
function renderRole(role: MemberSpecialRole, memberProfile: UserProfile = profile): RenderResult {
    return render(
        <MemoryRouter initialEntries={[`/tester/stats/roles/${role}`]}>
            <Routes>
                <Route
                    path='/tester/stats/roles/:roleType'
                    element={<MemberRoleDetailsView profile={memberProfile} />}
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('MemberRoleDetailsView', () => {
    beforeEach(() => {
        mockedUseMemberRoleChallenges.mockReset()
    })

    it('shows nonzero copilot tracks, fulfillment, and linked challenge cards', () => {
        mockedUseMemberRoleChallenges.mockReturnValue(createHookResponse({
            challenges: [
                { id: 'challenge-1', name: 'Newest public challenge' },
                { id: 'challenge-2', name: 'Earlier public challenge' },
            ],
            fulfillment: {
                cancelled: 11,
                completed: 89,
                rate: 88.95,
                total: 100,
            },
            role: 'copilot',
            total: 90,
            trackCounts: {
                DATA_SCIENCE: 0,
                DESIGN: 0,
                DEVELOPMENT: 86,
                QUALITY_ASSURANCE: 4,
            },
        }))

        renderRole('copilot')

        expect(screen.getByText('Development Challenges'))
            .toBeInTheDocument()
        expect(screen.getByText('QA Challenges'))
            .toBeInTheDocument()
        expect(screen.queryByText('Design Challenges')).not.toBeInTheDocument()
        expect(screen.queryByText('Data Science Challenges')).not.toBeInTheDocument()
        expect(screen.getByText('88.95%'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: /newest public challenge/i }))
            .toHaveAttribute('href', 'https://challenges.example.com/challenge-1')
    })

    it('shows the deduplicated reviewer challenge count', () => {
        mockedUseMemberRoleChallenges.mockReturnValue(createHookResponse({
            challenges: [{ id: 'review-1', name: 'Reviewed challenge' }],
            role: 'reviewer',
            total: 9,
        }))

        renderRole('reviewer')

        expect(screen.getByText('Reviewer Stats'))
            .toBeInTheDocument()
        expect(screen.getByText('9'))
            .toBeInTheDocument()
        expect(screen.getByText('Challenges'))
            .toBeInTheDocument()
    })

    it('contains the loading spinner in the bounded loading state', () => {
        mockedUseMemberRoleChallenges.mockReturnValue({
            data: undefined,
            error: undefined,
            hasMore: false,
            isValidating: true,
            loadMore: jest.fn(),
            mutate: jest.fn(),
        })

        renderRole('reviewer')

        expect(screen.getByText('Loading').parentElement)
            .toHaveClass('loadingState')
    })

    it.each<MemberSpecialRole>(['copilot', 'reviewer'])(
        'shows the complete %s challenge list without pagination controls',
        role => {
            mockedUseMemberRoleChallenges.mockReturnValue(createHookResponse({
                challenges: [
                    { id: 'challenge-1', name: 'Challenge from the first API page' },
                    { id: 'challenge-101', name: 'Challenge from a later API page' },
                ],
                role,
                total: 101,
            }))

            renderRole(role)

            expect(mockedUseMemberRoleChallenges)
                .toHaveBeenCalledWith('tester', role)
            expect(screen.getByText('Challenge from the first API page'))
                .toBeInTheDocument()
            expect(screen.getByText('Challenge from a later API page'))
                .toBeInTheDocument()
            expect(screen.queryByRole('button'))
                .not.toBeInTheDocument()
        },
    )

    it('loads more challenges when the scrollable list reaches the bottom', () => {
        const hookResponse = createHookResponse({
            challenges: [{ id: 'challenge-1', name: 'First challenge page' }],
            role: 'reviewer',
            total: 101,
        })

        mockedUseMemberRoleChallenges.mockReturnValue({
            ...hookResponse,
            hasMore: true,
        })

        renderRole('reviewer')

        const challengeList = screen.getByRole('region', { name: 'Reviewer challenges' })

        Object.defineProperties(challengeList, {
            clientHeight: { configurable: true, value: 100 },
            scrollHeight: { configurable: true, value: 300 },
            scrollTop: { configurable: true, value: 180 },
        })
        fireEvent.scroll(challengeList)

        expect(hookResponse.loadMore)
            .toHaveBeenCalledTimes(1)
    })
})
