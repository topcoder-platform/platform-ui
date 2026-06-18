/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import type { PropsWithChildren } from 'react'
import { render, screen, within } from '@testing-library/react'

import type { UserProfile } from '~/libs/core'

import { MemberChallengePointsBar } from './MemberStatsBlock'

const memberStatsBlockStyles = readFileSync(`${__dirname}/MemberStatsBlock.module.scss`, 'utf8')

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
})
