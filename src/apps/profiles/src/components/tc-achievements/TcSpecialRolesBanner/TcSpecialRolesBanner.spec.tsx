/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren, ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { MemberRoleStats, UserProfile } from '~/libs/core'

import TcSpecialRolesBanner from './TcSpecialRolesBanner'

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        ChevronRightIcon: (): JSX.Element => <svg />,
        InformationCircleIcon: (): JSX.Element => <svg />,
    },
    Tooltip: (props: PropsWithChildren<{ content?: ReactNode }>): JSX.Element => (
        <div data-testid='role-tooltip'>
            {props.children}
            <span>{props.content}</span>
        </div>
    ),
}), {
    virtual: true,
})

jest.mock('../../../profiles.routes', () => ({
    getUserProfileRoleRoute: (handle: string, role: string): string => (
        `/${handle}/stats/roles/${role}`
    ),
}))

jest.mock('../../../lib', () => ({
    formatPlural: (count: number, label: string): string => `${label}${count === 1 ? '' : 's'}`,
}))

const profile = { handle: 'Tester' } as UserProfile

/**
 * Renders role summary cards inside the router required by their detail links.
 *
 * This test helper does not intentionally throw; render failures are reported by Testing Library.
 *
 * @param {MemberRoleStats | undefined} roleStats - Summary response under test.
 * @returns {void}
 */
function renderRoles(roleStats?: MemberRoleStats): void {
    render(
        <MemoryRouter>
            <TcSpecialRolesBanner profile={profile} roleStats={roleStats} />
        </MemoryRouter>,
    )
}

describe('TcSpecialRolesBanner', () => {
    it('renders reviewer first and copilot second when the member has both roles', () => {
        renderRoles({
            copilot: { challengeCount: 86 },
            reviewer: { challengeCount: 9 },
        })

        const links = screen.getAllByRole('link')

        expect(links)
            .toHaveLength(2)
        expect(links[0])
            .toHaveAttribute('href', '/Tester/stats/roles/reviewer')
        expect(links[1])
            .toHaveAttribute('href', '/Tester/stats/roles/copilot')
        expect(screen.getByText('9'))
            .toBeInTheDocument()
        expect(screen.getByText('86'))
            .toBeInTheDocument()
    })

    it.each([
        ['reviewer', { reviewer: { challengeCount: 1 } }, '/Tester/stats/roles/reviewer'],
        ['copilot', { copilot: { challengeCount: 12 } }, '/Tester/stats/roles/copilot'],
    ] as const)('renders a single full-row %s card', (_role, roleStats, expectedRoute) => {
        renderRoles(roleStats)

        expect(screen.getAllByRole('link'))
            .toHaveLength(1)
        expect(screen.getByRole('link'))
            .toHaveAttribute('href', expectedRoute)
    })

    it('renders no role cards for a missing or zero-count summary', () => {
        renderRoles({
            copilot: { challengeCount: 0 },
            reviewer: { challengeCount: 0 },
        })

        expect(screen.queryByRole('link')).not
            .toBeInTheDocument()
        expect(screen.queryByTestId('role-tooltip')).not
            .toBeInTheDocument()
    })

    it('provides the exact Figma tooltip copy for both roles', () => {
        renderRoles({
            copilot: { challengeCount: 86 },
            reviewer: { challengeCount: 9 },
        })

        expect(screen.getByText(
            'A Topcoder reviewer is an expert community member who evaluates submissions,'
                + ' scores them against requirements, and provides actionable feedback.',
        ))
            .toBeInTheDocument()
        expect(screen.getByText(
            'A Topcoder Copilot is an elite expert who turns client’s requirements into challenges'
                + ' and guides the community to deliver quality solutions.',
        ))
            .toBeInTheDocument()
    })
})
