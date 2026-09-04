/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ChallengeAiReviewConfig, ChallengeOpportunity } from '../models'

import { ChallengeSidebar } from './ChallengeSidebar'

const challengeExplainedUrl
    = 'https://www.topcoder.example/thrive/articles/all-about-topcoder-challenges-tasks-and-gig-work-opportunities'
const designChallengeLearningUrl
    = 'https://www.topcoder.example/thrive/articles/How%20To%20Compete%20in%20Design'
const checkpointFeedbackLearningUrl
    = 'https://www.topcoder.example/thrive/articles/how-to-approach-the-checkpoint-feedback-to-decipher-hidden-codes'
const marathonMatchLearningUrl
    = 'https://www.topcoder.com/thrive/articles/How%20To%20Compete%20in%20a%20Marathon%20Match'
const designSubmissionFormatUrl
    = 'https://www.topcoder.com/thrive/articles/Formatting%20Your%20Submission%20for%20Design%20Challenges'
const designScreeningLearningUrl
    = 'https://www.topcoder.com/blog/ultimate-guide-pass-screening-design-challenges'
const designPolicyUrl
    = 'https://help.topcoder.com/hc/en-us/articles/217959447-Font-Policy-for-Design-Challenges'
const aiReviewersHelpUrl
    = 'https://www.topcoder.com/thrive/articles/ai-reviewers-member-help-guide'
const usableCodeRulesUrl
    = 'https://www.topcoder.com/thrive/articles/Usable%20Code%20in%20Dev%20Challenges'

const mockUseSWR = jest.fn()
const mockChallengeSidebarLinks = jest.fn()

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
    challengeReviewAppUrl: (challengeId: string): string => (
        `https://review.topcoder-dev.com/active-challenges/${challengeId}/challenge-details`
    ),
    challengeSidebarLinks: (...args: unknown[]) => mockChallengeSidebarLinks(...args),
    challengeSubmissionLimit: (): undefined => undefined,
    isMarathonMatchChallenge: (value: ChallengeOpportunity): boolean => value.type === 'Marathon Match',
}))
jest.mock('../services', () => ({
    getChallengeTermsDetails: jest.fn(),
}))
jest.mock('../utils/opportunity-learning.utils', () => ({
    AI_REVIEWERS_HELP_URL: aiReviewersHelpUrl,
    CHALLENGE_EXPLAINED_URL: challengeExplainedUrl,
    CHECKPOINT_FEEDBACK_LEARNING_URL: checkpointFeedbackLearningUrl,
    DESIGN_CHALLENGE_LEARNING_URL: designChallengeLearningUrl,
    DESIGN_SCREENING_LEARNING_URL: designScreeningLearningUrl,
    DESIGN_SUBMISSION_FORMAT_URL: designSubmissionFormatUrl,
    MARATHON_MATCH_LEARNING_URL: marathonMatchLearningUrl,
    USABLE_CODE_RULES_URL: usableCodeRulesUrl,
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

const marathonChallenge: ChallengeOpportunity = {
    ...challenge,
    type: 'Marathon Match',
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
        mockChallengeSidebarLinks.mockReturnValue({
            attachments: [],
            challengeLinks: [],
        })
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
        const heading = screen.getByRole('heading', { name: 'Review Style' })
        expect(heading.querySelector('img'))
            .not.toBeNull()
        expect(heading.querySelector('svg'))
            .toBeNull()
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

        expect(screen.getByText('Read educational material on Topcoder Thrive.'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Topcoder Challenges Explained' }))
            .toHaveAttribute(
                'href',
                challengeExplainedUrl,
            )
        expect(screen.getByRole('link', { name: 'Topcoder Challenges Explained' }).className)
            .toContain('learningLink')
        expect(screen.getByText('The place to see your scores and feedback, and improve before the final review.'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Explore the program' }).className)
            .toContain('promoLink')
    })

    it('adds the authored Marathon Match guide and arrow indicators', () => {
        renderSidebar(undefined, marathonChallenge)

        expect(screen.getByRole('heading', { name: 'Marathon Match Tournament' }))
            .toBeInTheDocument()
        expect(screen.getByText('Join the battle of competitors in a series of challenging Marathon Matches.'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Explore the program' }))
            .toHaveAttribute('href', marathonMatchLearningUrl)
        expect(screen.queryByRole('heading', { name: 'Join the AI Exponential league' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'How to Compete on Marathon Match' }))
            .toHaveAttribute('href', marathonMatchLearningUrl)
        expect(screen.getByRole('link', { name: 'Topcoder Challenges Explained' })
            .querySelector('img'))
            .not.toBeNull()
    })

    it('uses the dedicated Review App host and hides Review Style for Marathon Matches', () => {
        renderSidebar(undefined, marathonChallenge)

        expect(screen.getByRole('link', { name: 'View Review App' }))
            .toHaveAttribute(
                'href',
                'https://review.topcoder-dev.com/active-challenges/challenge-id/challenge-details',
            )
        expect(screen.queryByRole('heading', { name: 'Review Style' }))
            .not.toBeInTheDocument()
    })

    it('shows development learning links and hides design-only submission guidance', () => {
        renderSidebar(undefined, developmentChallenge)

        expect(screen.getByRole('link', { name: 'Topcoder Challenges Explained' }))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'AI Reviewers - Member Help Guide' }))
            .toHaveAttribute('href', aiReviewersHelpUrl)
        expect(screen.getByRole('link', { name: 'Usable Code Rules' }))
            .toHaveAttribute('href', usableCodeRulesUrl)
        expect(screen.queryByRole('link', { name: 'How to compete in design challenges' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'How to approach the checkpoint feedback' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Submission Format' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Source files' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('heading', { name: 'Submission limit' }))
            .not.toBeInTheDocument()
    })

    it('omits authored Challenge Links for development challenges', () => {
        mockChallengeSidebarLinks.mockReturnValue({
            attachments: [],
            challengeLinks: [{
                label: 'Development requirements',
                url: 'https://example.com/requirements',
            }],
        })

        renderSidebar(undefined, developmentChallenge)

        expect(screen.queryByRole('heading', { name: 'Challenge Links' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('link', { name: 'Development requirements' }))
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
                challengeExplainedUrl,
            )
        expect(screen.getByRole('link', { name: 'How to compete in design challenges' }))
            .toHaveAttribute(
                'href',
                designChallengeLearningUrl,
            )
        expect(screen.getByRole('link', { name: 'How to approach the checkpoint feedback' }))
            .toHaveAttribute(
                'href',
                checkpointFeedbackLearningUrl,
            )
        expect(screen.getByRole('link', { name: 'How to approach the checkpoint feedback' }).className)
            .toContain('learningLink')
        expect(screen.getByRole('heading', { name: 'Source files' }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Submission limit' }))
            .toBeInTheDocument()
    })

    it('emphasizes required submission filenames in the design submission format list', () => {
        renderSidebar(undefined, designChallenge)

        for (const fileName of ['Submission.zip:', 'Source.zip:', 'Declaration.txt:', 'Preview.jpg:']) {
            const label = screen.getByText(fileName)

            expect(label.tagName)
                .toBe('STRONG')
        }
    })

    it('keeps the policy and screening links inline with their punctuation', () => {
        renderSidebar(undefined, designChallenge)

        const policyLink = screen.getByRole('link', { name: 'Policy' })
        const screeningLink = screen.getByRole('link', { name: 'how to pass screening' })
        const faqLink = screen.getByRole('link', { name: 'Read the FAQ.' })

        expect(policyLink.className)
            .toContain('inlineAnchor')
        expect(screeningLink.className)
            .toContain('inlineAnchor')
        expect(faqLink.className)
            .toContain('inlineAnchor')
        expect(policyLink.parentElement)
            .toHaveTextContent('the Policy.')
        expect(screeningLink.parentElement)
            .toHaveTextContent('how to pass screening.')
        expect(faqLink.parentElement)
            .toHaveTextContent('Trouble formatting your submission or want to learn more? Read the FAQ.')
        expect(policyLink)
            .toHaveAttribute('href', designPolicyUrl)
        expect(policyLink)
            .toHaveAttribute('target', '_blank')
        expect(screeningLink)
            .toHaveAttribute('href', designScreeningLearningUrl)
        expect(faqLink)
            .toHaveAttribute('href', designSubmissionFormatUrl)
    })
})
