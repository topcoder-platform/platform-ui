/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'

import type { Challenge } from '../../models'

import { ChallengeCard } from './ChallengeCard'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}))

jest.mock('../../constants', () => ({
    COMMUNITY_APP_URL: 'https://example.com/community',
    REVIEW_APP_URL: 'https://example.com/review',
}))

jest.mock('../../utils', () => ({
    formatDate: () => 'Apr 2, 2026',
    getCurrentPhase: () => '-',
    getStatusText: (status?: string) => status || '',
    isChallengeCompleted: (status?: string) => status === 'COMPLETED',
}))

jest.mock('../ChallengeStatus', () => ({
    ChallengeStatus: (props: { statusText: string }) => <span>{props.statusText}</span>,
}))

jest.mock('../ChallengeTag', () => ({
    ChallengeTag: () => <span>TAG</span>,
}))

describe('ChallengeCard', () => {
    const baseChallenge: Challenge = {
        discussions: [{
            url: 'https://example.com/forum',
        }],
        endDate: '2026-04-02T12:00:00.000Z',
        id: 'challenge-1',
        name: 'Completed challenge',
        numOfRegistrants: 1,
        numOfSubmissions: 0,
        projectId: '200',
        startDate: '2026-04-02T10:00:00.000Z',
        status: 'ACTIVE',
        type: 'Task',
    }

    function renderCard(challenge: Challenge): void {
        render(
            <table>
                <tbody>
                    <ChallengeCard challenge={challenge} challengeTypes={[]} />
                </tbody>
            </table>,
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders edit for non-completed challenges', () => {
        renderCard(baseChallenge)

        expect(screen.getByRole('button', { name: 'Edit' }))
            .toBeTruthy()
    })

    it('hides edit for completed challenges while keeping the quick links', () => {
        renderCard({
            ...baseChallenge,
            status: 'COMPLETED',
        })

        expect(screen.queryByRole('button', { name: 'Edit' }))
            .toBeNull()
        expect(screen.getByRole('link', { name: 'Review' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: 'CA' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: 'Forum' }))
            .toBeTruthy()
    })
})
