/* eslint-disable import/no-extraneous-dependencies */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ChallengeStatus } from '~/apps/admin/src/lib/models'

import ReviewContextTab from './ReviewContextTab'

const mockUseFetchChallengeReviewContext = jest.fn()
const mockCreateChallengeReviewContext = jest.fn()
const mockFetchChallengePayload = jest.fn()
const mockFetchScorecardPayload = jest.fn()

jest.mock('../../../../../../lib', () => {
    const seedUtils = jest.requireActual('../../../../../../lib/utils/review-context-seed.utils')

    return {
        buildReviewContextSeed: seedUtils.buildReviewContextSeed,
        createChallengeReviewContext: (...args: unknown[]) => mockCreateChallengeReviewContext(...args),
        deleteChallengeReviewContext: jest.fn(),
        fetchChallengePayload: (...args: unknown[]) => mockFetchChallengePayload(...args),
        fetchScorecardPayload: (...args: unknown[]) => mockFetchScorecardPayload(...args),
        findMemberReviewScorecardId: seedUtils.findMemberReviewScorecardId,
        generateChallengeReviewContext: jest.fn(),
        projectReviewContextScorecard: seedUtils.projectReviewContextScorecard,
        showErrorToast: jest.fn(),
        showSuccessToast: jest.fn(),
        useFetchChallengeReviewContext: () => mockUseFetchChallengeReviewContext(),
    }
})

jest.mock('./ReviewContextEditor', () => ({
    __esModule: true,
    default: (props: { isLocked?: boolean }) => (
        <div
            data-testid='review-context-editor'
            data-is-locked={props.isLocked ? 'true' : 'false'}
        />
    ),
}))

describe('ReviewContextTab', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('reports the current requirement count to the parent', () => {
        const onRequirementCountChange = jest.fn()

        mockUseFetchChallengeReviewContext.mockReturnValue({
            context: {
                challengeId: 'challenge-1',
                context: {
                    requirements: [
                        {
                            constraints: [
                                { id: 'const-1', text: 'No hard-coded values.' },
                            ],
                            description: 'Ensure code is clean and maintainable.',
                            id: 'req-1',
                            priority: 'medium',
                            title: 'Code quality',
                        },
                    ],
                },
                id: 'context-1',
                status: 'AI_GENERATED',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewContextTab
                challengeId='challenge-1'
                challengeDescription={'A'.repeat(120)}
                onRequirementCountChange={onRequirementCountChange}
            />,
        )

        expect(onRequirementCountChange)
            .toHaveBeenCalledWith(1)
    })

    it('passes isLocked true to the editor when submissions exist', () => {
        mockUseFetchChallengeReviewContext.mockReturnValue({
            context: {
                challengeId: 'challenge-1',
                context: {
                    requirements: [
                        {
                            constraints: [
                                { id: 'const-1', text: 'No hard-coded values.' },
                            ],
                            description: 'Ensure code is clean and maintainable.',
                            id: 'req-1',
                            priority: 'medium',
                            title: 'Code quality',
                        },
                    ],
                },
                id: 'context-1',
                status: 'AI_GENERATED',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewContextTab
                challengeId='challenge-1'
                challengeDescription={'A'.repeat(120)}
                lockReason='HAS_SUBMISSIONS'
            />,
        )

        expect(screen.getByTestId('review-context-editor').dataset.isLocked)
            .toBe('true')
    })

    it('shows a regenerate confirmation modal when clicking Regenerate', () => {
        mockUseFetchChallengeReviewContext.mockReturnValue({
            context: {
                challengeId: 'challenge-1',
                context: {
                    requirements: [
                        {
                            constraints: [
                                { id: 'const-1', text: 'No hard-coded values.' },
                            ],
                            description: 'Ensure code is clean and maintainable.',
                            id: 'req-1',
                            priority: 'medium',
                            title: 'Code quality',
                        },
                    ],
                },
                id: 'context-1',
                status: 'AI_GENERATED',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewContextTab
                challengeId='challenge-1'
                challengeDescription={'A'.repeat(120)}
                challengeStatus={undefined}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }))

        expect(screen.getByText('Regenerate review context?'))
            .toBeInTheDocument()
        expect(screen.getByText('This will delete the existing review context and generate a new one.'))
            .toBeInTheDocument()
    })

    it('renders the manual manage button when no context exists', () => {
        mockUseFetchChallengeReviewContext.mockReturnValue({
            context: undefined,
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewContextTab
                challengeId='challenge-1'
                challengeDescription={'A'.repeat(120)}
                challengeStatus={undefined}
            />,
        )

        expect(screen.getByRole('button', { name: 'Manage Review Context' }))
            .toBeInTheDocument()
    })

    describe('Manage Review Context', () => {
        const emptyContextResult = {
            context: undefined,
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        }

        const renderTab = (): void => {
            render(
                <ReviewContextTab
                    challengeId='challenge-1'
                    challengeDescription={'A'.repeat(120)}
                    challengeStatus={ChallengeStatus.Draft}
                />,
            )
        }

        it('seeds the manual context with challenge-derived unified context fields', async () => {
            mockUseFetchChallengeReviewContext.mockReturnValue(emptyContextResult)
            mockFetchChallengePayload.mockResolvedValue({
                description: '## Spec',
                id: 'challenge-1',
                name: 'Build the widget',
                prizeSets: [{ prizes: [{ type: 'USD', value: 800 }], type: 'PLACEMENT' }],
                reviewers: [{ isMemberReview: true, scorecardId: 'sc-1' }],
                status: 'Draft',
                track: { name: 'Development' },
                type: { name: 'Challenge' },
            })
            mockFetchScorecardPayload.mockResolvedValue({
                id: 'sc-1',
                name: 'Dev Scorecard',
                scorecardGroups: [],
            })
            mockCreateChallengeReviewContext.mockResolvedValue({})

            renderTab()
            fireEvent.click(screen.getByRole('button', { name: 'Manage Review Context' }))

            await waitFor(() => expect(mockCreateChallengeReviewContext)
                .toHaveBeenCalled())

            expect(mockFetchScorecardPayload)
                .toHaveBeenCalledWith('sc-1')
            const input = mockCreateChallengeReviewContext.mock.calls[0][0]
            expect(input.status)
                .toBe('HUMAN_APPROVED')
            expect(input.context)
                .toMatchObject({
                    challenge_metadata: { track: 'Development', type: 'Challenge' },
                    challengeId: 'challenge-1',
                    descriptionRaw: '## Spec',
                    prizes: [{ currency: 'USD', placement: 1, value: 800 }],
                    requirements: [],
                    review_criteria: {
                        scorecard: { id: 'sc-1', name: 'Dev Scorecard' },
                    },
                    title: 'Build the widget',
                })
        })

        it('falls back to an empty requirements context when the challenge cannot be loaded', async () => {
            mockUseFetchChallengeReviewContext.mockReturnValue(emptyContextResult)
            mockFetchChallengePayload.mockRejectedValue(new Error('offline'))
            mockCreateChallengeReviewContext.mockResolvedValue({})

            renderTab()
            fireEvent.click(screen.getByRole('button', { name: 'Manage Review Context' }))

            await waitFor(() => expect(mockCreateChallengeReviewContext)
                .toHaveBeenCalled())

            expect(mockCreateChallengeReviewContext.mock.calls[0][0].context)
                .toEqual({ requirements: [] })
        })
    })
})
