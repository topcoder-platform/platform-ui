/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ChallengeAiReviewConfig, ChallengeOpportunity } from '../models'

import { ChallengeSidebar } from './ChallengeSidebar'

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />
    return {
        IconOutline: new Proxy({}, { get: () => Icon }),
        Tooltip: (props: { children: JSX.Element; content: string }): JSX.Element => (
            <>
                {props.children}
                <span role='tooltip'>{props.content}</span>
            </>
        ),
    }
}, { virtual: true })

jest.mock('../utils', () => ({
    challengeFileTypes: (): string[] => [],
    challengeForumUrl: (): undefined => undefined,
    challengeSidebarLinks: (): { attachments: []; challengeLinks: [] } => ({
        attachments: [],
        challengeLinks: [],
    }),
    challengeSubmissionLimit: (): undefined => undefined,
}))

const challenge: ChallengeOpportunity = {
    id: 'challenge-id',
    name: 'Review style challenge',
    terms: [{ id: 'term-id', title: 'Standard Terms 2026' }],
    track: 'Quality Assurance',
}

function renderSidebar(aiReviewConfig?: ChallengeAiReviewConfig): void {
    render(
        <MemoryRouter>
            <ChallengeSidebar
                aiReviewConfig={aiReviewConfig}
                challenge={challenge}
                onContactTeam={jest.fn()}
                onShowTerms={jest.fn()}
            />
        </MemoryRouter>,
    )
}

describe('ChallengeSidebar Review Style', () => {
    it('shows manual review with the Figma explanation when no AI config exists', () => {
        renderSidebar()

        expect(screen.getByText('Manual'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'About Manual' }))
            .toBeInTheDocument()
        expect(screen.getByText('Community Review Board performs a thorough review based on scorecards.'))
            .toBeInTheDocument()
        expect(screen.queryByText(/Instant Review is/))
            .not.toBeInTheDocument()
    })

    it('shows AI-only review and the disabled Instant Review state', () => {
        renderSidebar({
            challengeId: challenge.id,
            id: 'ai-only-config',
            instantReview: false,
            mode: 'AI_ONLY',
        })

        expect(screen.getByText('AI only'))
            .toBeInTheDocument()
        expect(screen.getByText('Instant Review is Off'))
            .toBeInTheDocument()
        expect(screen.getByText('AI will perform a thorough review based on scorecards.'))
            .toBeInTheDocument()
        expect(screen.getByText('You will not receive AI feedback during the submission phase.'))
            .toBeInTheDocument()
    })

    it('shows AI-gating review and the enabled Instant Review state', () => {
        renderSidebar({
            challengeId: challenge.id,
            id: 'ai-gating-config',
            instantReview: true,
            mode: 'AI_GATING',
        })

        expect(screen.getByText('AI Gating'))
            .toBeInTheDocument()
        expect(screen.getByText('Instant Review is On'))
            .toBeInTheDocument()
        expect(screen.getByText(
            'AI performs a preliminary review, then the Community Review Board evaluates submissions that pass.',
        ))
            .toBeInTheDocument()
        expect(screen.getByText('You will receive AI feedback during the submission phase'))
            .toBeInTheDocument()
    })
})
