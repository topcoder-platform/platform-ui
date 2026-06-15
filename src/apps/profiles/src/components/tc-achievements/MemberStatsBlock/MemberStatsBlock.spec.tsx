/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { render, screen, within } from '@testing-library/react'

import type { UserProfile } from '~/libs/core'

import { MemberChallengePointsBar } from './MemberStatsBlock'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn(() => '#000000'),
    useMemberStats: jest.fn(),
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

jest.mock('../../../member-profile/MemberProfile.context', () => ({
    useMemberProfileContext: jest.fn(() => ({
        statsRoute: jest.fn(),
    })),
}))

jest.mock('./MemberChallengePointsModal', () => jest.fn(() => ''))

jest.mock('../../../lib', () => ({
    formatPlural: (count: number, label: string): string => `${label}${count === 1 ? '' : 's'}`,
    WinnerIcon: (props: { className?: string }): JSX.Element => <svg className={props.className} />,
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
