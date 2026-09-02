/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ChallengeAiReviewConfig, ChallengeOpportunity } from '../models'

import { ChallengeSidebar } from './ChallengeSidebar'

const mockUseSWR = jest.fn()

jest.mock('swr', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseSWR(...args),
}))

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
jest.mock('../services', () => ({
    getChallengeTermsDetails: jest.fn(),
}))
jest.mock('../utils/opportunity-learning.utils', () => ({
    CHALLENGE_EXPLAINED_URL:
        'https://www.topcoder.example/thrive/articles/all-about-topcoder-challenges-tasks-and-gig-work-opportunities',
    CHECKPOINT_FEEDBACK_LEARNING_URL:
        'https://www.topcoder.example/thrive/articles/how-to-approach-the-checkpoint-feedback-to-decipher-hidden-codes',
    DESIGN_CHALLENGE_LEARNING_URL:
        'https://www.topcoder.example/thrive/articles/How%20To%20Compete%20in%20Design',
    SCREENING_LEARNING_URL: 'https://www.topcoder.example/thrive/search?title=How%20to%20Pass%20Screening',
}))

const challenge: ChallengeOpportunity = {
    id: 'challenge-id',
    name: 'Review style challenge',
    terms: [{ id: 'term-id', title: 'Standard Terms 2026' }],
    track: 'Quality Assurance',
}

const designChallenge: ChallengeOpportunity = {
    ...challenge,
    track: 'Design',
}

const developmentChallenge: ChallengeOpportunity = {
    ...challenge,
    track: 'Development',
}

function renderSidebar(
    aiReviewConfig?: ChallengeAiReviewConfig,
    sidebarChallenge: ChallengeOpportunity = challenge,
): void {
    render(
        <MemoryRouter>
            <ChallengeSidebar
                aiReviewConfig={aiReviewConfig}
                challenge={sidebarChallenge}
                onContactTeam={jest.fn()}
                onShowTerms={jest.fn()}
            />
        </MemoryRouter>,
    )
}

describe('ChallengeSidebar Review Style', () => {
    beforeEach(() => {
        mockUseSWR.mockReturnValue({ data: undefined })
    })

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

    it('uses published challenge-learning article links for the educational materials rail', () => {
        renderSidebar()

        expect(screen.getByRole('link', { name: 'Topcoder Challenges Explained' }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/all-about-topcoder-challenges-tasks-and-gig-work-opportunities',
            )
    })

    it('keeps design-only educational links and copy out of development challenges', () => {
        renderSidebar(undefined, developmentChallenge)

        expect(screen.getByRole('link', { name: 'Topcoder Challenges Explained' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'How to compete in design challenges' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'How to approach the checkpoint feedback' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Submission Format' }))
            .not.toBeInTheDocument()
        expect(screen.getByText('You must include all source files requested in the Requirements content.'))
            .toBeInTheDocument()
        expect(screen.queryByText('You must include all source files with your submission.'))
            .not.toBeInTheDocument()
    })

    it('hydrates term titles before rendering challenge term buttons', () => {
        mockUseSWR.mockReturnValue({
            data: [{ id: 'term-id', title: 'Standard Terms 2026' }],
        })

        render(
            <MemoryRouter>
                <ChallengeSidebar
                    challenge={{
                        ...designChallenge,
                        terms: [{ id: 'term-id' }],
                    }}
                    onContactTeam={jest.fn()}
                    onShowTerms={jest.fn()}
                />
            </MemoryRouter>,
        )

        expect(screen.getByRole('button', { name: 'Standard Terms 2026' }))
            .toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Challenge term 1' }))
            .not.toBeInTheDocument()
    })

    it('does not render a fallback challenge links section when no authored forum or metadata links exist', () => {
        renderSidebar()

        expect(screen.queryByRole('heading', { name: 'Challenge Links' }))
            .not.toBeInTheDocument()
    })

    it('shows design educational links for design challenges', () => {
        renderSidebar(undefined, designChallenge)

        expect(screen.getByRole('link', { name: 'Topcoder Challenges Explained' }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/all-about-topcoder-challenges-tasks-and-gig-work-opportunities',
            )
        expect(screen.getByRole('link', { name: 'How to compete in design challenges' }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/How%20To%20Compete%20in%20Design',
            )
        expect(screen.getByRole('link', { name: 'How to approach the checkpoint feedback' }))
            .toHaveAttribute(
                'href',
                'https://www.topcoder.example/thrive/articles/how-to-approach-the-checkpoint-feedback-to-decipher-hidden-codes',
            )
    })

    it('emphasizes required submission filenames in the design submission format list', () => {
        renderSidebar(undefined, designChallenge)

        for (const fileName of ['Submission.zip:', 'Source.zip:', 'Declaration.txt:', 'Preview.jpg:']) {
            const label = screen.getByText(fileName)

            expect(label.tagName)
                .toBe('STRONG')
        }
    })
})
