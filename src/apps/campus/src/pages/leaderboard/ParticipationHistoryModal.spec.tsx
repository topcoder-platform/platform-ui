import '@testing-library/jest-dom'
import type { PropsWithChildren } from 'react'
import { render, screen } from '@testing-library/react'

import { ParticipationHistoryModal } from './ParticipationHistoryModal'
import type { CampusLeaderboardMember, CampusParticipation } from '../../lib/models'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        REVIEW: { CHALLENGE_PAGE_URL: 'https://review.example.test' },
    },
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    textFormatDateLocaleShortString: (date?: Date): string | undefined => date?.toISOString(),
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />

    return {
        BaseModal: (props: PropsWithChildren<{ open?: boolean; title?: string }>): JSX.Element => (
            props.open ? <div>{props.children}</div> : <></>
        ),
        IconOutline: { ExternalLinkIcon: Icon },
        Table: <T, >(props: { columns: ReadonlyArray<{ columnId?: string; renderer?: (data: T) => React.ReactNode }>; data: ReadonlyArray<T> }): JSX.Element => (
            <table>
                <tbody>
                    {props.data.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {props.columns.map(column => (
                                <td key={column.columnId ?? String(rowIndex)}>
                                    {column.renderer?.(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        ),
    }
}, { virtual: true })

const baseParticipation = (): CampusParticipation => ({
    challengeEndDate: '2026-02-01T00:00:00.000Z',
    challengeId: 'c1',
    challengeName: 'Campus Sprint',
    challengeStatus: 'COMPLETED',
    challengeTrack: 'Development',
    challengeType: 'Challenge',
    isCampusChallenge: true,
    isPublicChallenge: false,
    passedReview: true,
    placement: null,
    registered: true,
    registeredAt: '2026-01-05T00:00:00.000Z',
    score: 95,
    submitted: true,
    submittedDate: '2026-01-20T00:00:00.000Z',
    won: false,
})

const baseMember = (overrides: Partial<CampusLeaderboardMember> = {}): CampusLeaderboardMember => ({
    challenges: [baseParticipation()],
    firstName: 'Ada',
    handle: 'testaws1',
    hasActivity: true,
    lastName: 'Lovelace',
    memberSince: '2025-01-01T00:00:00.000Z',
    passingSubmissions: 1,
    photoURL: null,
    rank: 1,
    rating: 1500,
    ratingColor: '#3f3',
    registrations: 1,
    signupDate: '2026-01-01T00:00:00.000Z',
    submissions: 1,
    userId: '1',
    wins: 0,
    ...overrides,
})

describe('ParticipationHistoryModal', () => {
    it('shows 2nd place for a second-place finish', () => {
        const member = baseMember({
            challenges: [
                {
                    ...baseParticipation(),
                    passedReview: true,
                    placement: 2,
                },
            ],
        })

        render(<ParticipationHistoryModal member={member} onClose={jest.fn()} />)

        expect(screen.getByText('2nd place')).toBeInTheDocument()
    })

    it('shows 3rd place for a third-place finish', () => {
        const member = baseMember({
            challenges: [
                {
                    ...baseParticipation(),
                    passedReview: true,
                    placement: 3,
                },
            ],
        })

        render(<ParticipationHistoryModal member={member} onClose={jest.fn()} />)

        expect(screen.getByText('3rd place')).toBeInTheDocument()
    })
})
