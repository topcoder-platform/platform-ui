/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { UserProfile } from '~/libs/core'
import {
    useMemberBadges,
    useMemberRoleStats,
    useMemberStats,
} from '~/libs/core'

import MemberTCAchievements from './MemberTCAchievements'

jest.mock('~/libs/core', () => ({
    useMemberBadges: jest.fn(),
    useMemberRoleStats: jest.fn(),
    useMemberStats: jest.fn(),
}), {
    virtual: true,
})

jest.mock('./default-achievements-view', () => ({
    DefaultAchievementsView: (): JSX.Element => <div>Default achievements</div>,
}))

jest.mock('./member-role-details-view', () => ({
    MemberRoleDetailsView: (): JSX.Element => <div>Role details</div>,
}))

jest.mock('./sub-track-view', () => ({
    SubTrackView: (): JSX.Element => <div>Subtrack</div>,
}))

jest.mock('./track-view', () => ({
    TrackView: (): JSX.Element => <div>Track</div>,
}))

const mockedUseMemberBadges = useMemberBadges as jest.MockedFunction<typeof useMemberBadges>
const mockedUseMemberRoleStats = useMemberRoleStats as jest.MockedFunction<typeof useMemberRoleStats>
const mockedUseMemberStats = useMemberStats as jest.MockedFunction<typeof useMemberStats>

const memberTCAchievementsStyles = readFileSync(`${__dirname}/MemberTCAchievements.module.scss`, 'utf8')

describe('MemberTCAchievements styles', () => {
    it('keeps the desktop card padding even at the top and bottom', () => {
        expect(memberTCAchievementsStyles)
            .toMatch(/\.container \{[\s\S]*?padding: \$sp-8;/)
    })
})

describe('MemberTCAchievements role routing', () => {
    beforeEach(() => {
        mockedUseMemberBadges.mockReturnValue(undefined)
        mockedUseMemberRoleStats.mockReturnValue({
            data: undefined,
            error: new Error('Summary unavailable'),
            isValidating: false,
            mutate: jest.fn(),
        })
        mockedUseMemberStats.mockReturnValue(undefined)
    })

    it('renders a direct role details route even when summary and ordinary stats are unavailable', () => {
        render(
            <MemoryRouter initialEntries={['/tester/stats/roles/reviewer']}>
                <Routes>
                    <Route
                        path='/tester/stats/*'
                        element={(
                            <MemberTCAchievements profile={{ handle: 'tester' } as UserProfile} />
                        )}
                    />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.getByText('Role details'))
            .toBeInTheDocument()
    })
})
