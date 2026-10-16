/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'

import { EnvironmentConfig } from '~/config'

import type { Challenge } from '../../models'

import { ChallengeCard } from './ChallengeCard'

const mockNavigate = jest.fn()

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        PLATFORMUI_URL: 'https://platform-ui.topcoder-dev.com',
        TOPCODER_URL: 'https://www.topcoder-dev.com',
    },
}), { virtual: true })

jest.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}))

jest.mock('../../constants', () => ({
    REVIEW_APP_URL: 'https://example.com/review',
}))

jest.mock('../../utils', () => ({
    formatDate: () => 'Apr 2, 2026',
    getCurrentPhase: () => '-',
    getStatusText: (status?: string) => status || '',
    isChallengeCompletedOrCancelled: (status?: string) => (
        status === 'COMPLETED' || status?.startsWith('CANCELLED')
    ),
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
        EnvironmentConfig.TOPCODER_URL = 'https://www.topcoder-dev.com'
    })

    it.each([
        'https://www.topcoder-dev.com',
        'https://www.topcoder.com',
    ])('opens the encoded challenge on the public website at %s', topcoderUrl => {
        EnvironmentConfig.TOPCODER_URL = topcoderUrl
        renderCard({ ...baseChallenge, id: 'challenge / id' })

        const challengeLink = screen.getByRole('link', { name: 'CA' })
        expect(challengeLink.getAttribute('href'))
            .toBe(`${topcoderUrl}/opportunities/challenge/challenge%20%2F%20id`)
        expect(challengeLink.getAttribute('target'))
            .toBe('_blank')
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
        expect(screen.getByRole('link', { name: 'CA' })
            .getAttribute('href'))
            .toBe('https://www.topcoder-dev.com/opportunities/challenge/challenge-1')
        expect(screen.getByRole('link', { name: 'Forum' }))
            .toBeTruthy()
    })

    it('hides edit for cancelled challenges while keeping the quick links', () => {
        renderCard({
            ...baseChallenge,
            status: 'CANCELLED_CLIENT_REQUEST',
        })

        expect(screen.queryByRole('button', { name: 'Edit' }))
            .toBeNull()
        expect(screen.getByRole('link', { name: 'Review' }))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: 'CA' })
            .getAttribute('href'))
            .toBe('https://www.topcoder-dev.com/opportunities/challenge/challenge-1')
        expect(screen.getByRole('link', { name: 'Forum' }))
            .toBeTruthy()
    })
})
