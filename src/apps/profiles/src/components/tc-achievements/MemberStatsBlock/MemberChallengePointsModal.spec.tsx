/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type { PropsWithChildren, ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'

import MemberChallengePointsModal from './MemberChallengePointsModal'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: {
            CHALLENGES_PAGE: 'https://www.topcoder.com/challenges',
        },
    },
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren<{ title?: ReactNode }>): JSX.Element => (
        <section>
            {props.title}
            <div>{props.children}</div>
        </section>
    ),
}), {
    virtual: true,
})

describe('MemberChallengePointsModal', () => {
    it('renders the points breakdown title and aligned points column hooks', () => {
        render(
            <MemberChallengePointsModal
                challengePoints={{
                    challenges: 2,
                    details: [{
                        challengeId: 'challenge-1',
                        challengeName: 'Point challenge dev',
                        placement: 1,
                        points: 1000,
                        userId: 123,
                    }],
                    total: 1000,
                }}
                onClose={jest.fn()}
            />,
        )

        expect(screen.getByRole('heading', { name: 'Points Breakdown' }))
            .toBeInTheDocument()

        const tableHeader = screen.getByText('Place')
            .parentElement as HTMLElement

        expect(within(tableHeader)
            .getByText('Points'))
            .toHaveClass('pointsHeader')
        expect(screen.getByText('1,000'))
            .toHaveClass('points')
    })
})
