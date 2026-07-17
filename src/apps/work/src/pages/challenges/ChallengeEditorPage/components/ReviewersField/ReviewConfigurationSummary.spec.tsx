/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'

import {
    useFetchChallengeReviewContext,
    useFetchResourceRoles,
    useFetchResources,
} from '../../../../../lib/hooks'
import {
    fetchAiReviewConfigByChallenge,
    fetchScorecards,
    fetchWorkflows,
    searchProfilesByUserIds,
} from '../../../../../lib/services'

import styles from './ReviewConfigurationSummary.module.scss'
import { ReviewConfigurationSummary } from './ReviewConfigurationSummary'

jest.mock('../../../../../lib/hooks', () => ({
    useFetchChallengeReviewContext: jest.fn(),
    useFetchResourceRoles: jest.fn(),
    useFetchResources: jest.fn(),
}))
jest.mock('../../../../../lib/constants', () => ({
    REVIEW_APP_URL: 'https://example.com/review',
}))
jest.mock('../../../../../lib/services', () => ({
    fetchAiReviewConfigByChallenge: jest.fn(),
    fetchScorecards: jest.fn(),
    fetchWorkflows: jest.fn(),
    searchProfilesByUserIds: jest.fn(),
}))

const mockedFetchAiReviewConfigByChallenge = fetchAiReviewConfigByChallenge as jest.Mock
const mockedFetchScorecards = fetchScorecards as jest.Mock
const mockedSearchProfilesByUserIds = searchProfilesByUserIds as jest.Mock
const mockedFetchWorkflows = fetchWorkflows as jest.Mock
const mockedUseFetchChallengeReviewContext = useFetchChallengeReviewContext as jest.Mock
const mockedUseFetchResourceRoles = useFetchResourceRoles as jest.Mock
const mockedUseFetchResources = useFetchResources as jest.Mock

describe('ReviewConfigurationSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'role-reviewer',
                name: 'Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: 'challenge-1',
                memberHandle: 'reviewer-one',
                memberId: 'member-1',
                roleId: 'role-reviewer',
            }],
        })
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue({
            autoFinalize: false,
            challengeId: 'challenge-1',
            id: 'ai-config-1',
            minPassingThreshold: 75,
            mode: 'AI_GATING',
            workflows: [{
                isGating: true,
                weightPercent: 100,
                workflow: {
                    id: 'workflow-1',
                    name: 'AI Submission Scanner',
                    scorecard: {
                        id: 'scorecard-2',
                        name: 'AI Scorecard',
                    },
                },
                workflowId: 'workflow-1',
            }],
        })
        mockedFetchScorecards.mockResolvedValue([{
            id: 'scorecard-1',
            name: 'Development Review Scorecard',
        }])
        mockedUseFetchChallengeReviewContext.mockReturnValue({
            context: undefined,
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedSearchProfilesByUserIds.mockResolvedValue([])
        mockedFetchWorkflows.mockResolvedValue([{
            id: 'workflow-1',
            name: 'AI Submission Scanner',
            scorecardId: 'scorecard-2',
        }])
    })

    it('renders the human and AI review overview for read-only challenges', async () => {
        render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Review',
                    phaseId: 'phase-1',
                }]}
                prizeSets={[{
                    prizes: [{
                        type: 'USD',
                        value: 500,
                    }],
                    type: 'PLACEMENT',
                }]}
                reviewers={[
                    {
                        handle: 'reviewer-one',
                        isMemberReview: true,
                        memberId: 'member-1',
                        memberReviewerCount: 1,
                        phaseId: 'phase-1',
                        scorecardId: 'scorecard-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
                typeId='type-1'
            />,
        )

        expect(screen.getByText('Review Configuration Summary')).not.toBeNull()
        expect(screen.getByRole('heading', { level: 5, name: 'Human Review' })).not.toBeNull()
        expect(screen.getByRole('heading', { level: 5, name: 'AI Review' })).not.toBeNull()

        expect(await screen.findByText('AI_GATING')).not.toBeNull()
        expect(await screen.findByText('Development Review Scorecard')).not.toBeNull()
        expect(await screen.findByText('AI Submission Scanner')).not.toBeNull()
        expect(await screen.findByText('❌ No')).not.toBeNull()
        expect(await screen.findByText('❌ Off')).not.toBeNull()
        expect(await screen.findByText('⚡ GATE')).not.toBeNull()
        expect(screen.getByText('Received')).not.toBeNull()
        expect(screen.getByText('reviewer-one')).not.toBeNull()
        expect(screen.getByText('Regular Review')).not.toBeNull()
        expect(screen.getByText('Review Flow')).not.toBeNull()
        expect(screen.getByText('Estimated Review Cost:')).not.toBeNull()
        expect(mockedFetchAiReviewConfigByChallenge)
            .toHaveBeenCalledWith('challenge-1')
        expect(mockedFetchScorecards)
            .toHaveBeenCalledWith({
                page: 1,
                perPage: 200,
                typeId: 'type-1',
            })
    })

    it('renders review context requirements when review context is available', async () => {
        mockedUseFetchChallengeReviewContext.mockReturnValue({
            context: {
                challengeId: 'challenge-1',
                context: {
                    challengeId: 'challenge-1',
                    descriptionRaw: '',
                    prizes: [],
                    requirements: [
                        {
                            constraints: [
                                {
                                    id: 'CONSTR_01_1',
                                    text: 'Must pass ESLint with zero errors',
                                },
                            ],
                            description: 'All submissions must follow established coding standards.',
                            id: 'REQ_01',
                            priority: 'high',
                            title: 'Code Quality Standards',
                        },
                    ],
                    skills: [],
                    tech_stack: [],
                    timeline: {
                        endDate: '2026-12-31',
                        registrationEndDate: '2025-12-31',
                        registrationStartDate: '2025-01-01',
                        startDate: '2026-01-01',
                        totalDurationDays: 365,
                    },
                    title: 'Review context title',
                },
                id: 'review-context-1',
                status: 'AI_GENERATED',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[]}
                reviewers={[]}
                typeId='type-1'
            />,
        )

        expect(await screen.findByRole('heading', {
            level: 5,
            name: 'Review Context Requirements (1)',
        })).not.toBeNull()
        expect(screen.getByText('[REQ_01]')).not.toBeNull()
        expect(screen.getByText('HIGH')).not.toBeNull()
        expect(screen.getByText('Code Quality Standards')).not.toBeNull()
        expect(screen.getByText('All submissions must follow established coding standards.')).not.toBeNull()
        expect(screen.getByText('Must pass ESLint with zero errors')).not.toBeNull()
    })

    it('shows empty state when review context has no requirements', async () => {
        mockedUseFetchChallengeReviewContext.mockReturnValue({
            context: {
                challengeId: 'challenge-1',
                context: {
                    challengeId: 'challenge-1',
                    descriptionRaw: '',
                    prizes: [],
                    requirements: [],
                    skills: [],
                    tech_stack: [],
                    timeline: {
                        endDate: '2026-12-31',
                        registrationEndDate: '2025-12-31',
                        registrationStartDate: '2025-01-01',
                        startDate: '2026-01-01',
                        totalDurationDays: 365,
                    },
                    title: 'Review context title',
                },
                id: 'review-context-2',
                status: 'AI_GENERATED',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[]}
                reviewers={[]}
                typeId='type-1'
            />,
        )

        expect(await screen.findByText('No review context requirements defined.')).not.toBeNull()
    })

    it('shows retry button when review context API fails', async () => {
        const mockedMutate = jest.fn()
            .mockResolvedValue(undefined)
        mockedUseFetchChallengeReviewContext.mockReturnValue({
            context: undefined,
            error: 'Failed to load review context.',
            isError: true,
            isLoading: false,
            mutate: mockedMutate,
        })

        render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[]}
                reviewers={[]}
                typeId='type-1'
            />,
        )

        expect(await screen.findByText('Failed to load review context.')).not.toBeNull()

        const retryButton = screen.getByRole('button', { name: 'Retry' })
        fireEvent.click(retryButton)

        expect(mockedMutate)
            .toHaveBeenCalled()
    })

    it('loads referenced human-review scorecard names from later scorecard catalog pages', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(undefined)
        mockedFetchScorecards.mockImplementation(({ page }: { page?: number }) => Promise.resolve(
            page === 1
                ? Array.from({ length: 200 }, (_, index) => ({
                    id: `catalog-scorecard-${index + 1}`,
                    name: `Catalog Scorecard ${index + 1}`,
                }))
                : [{
                    id: 'scorecard-2',
                    name: 'Approval Review Scorecard',
                }],
        ))

        render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Approval',
                    phaseId: 'phase-approval',
                }]}
                reviewers={[{
                    handle: 'approver-one',
                    isMemberReview: true,
                    memberId: 'member-2',
                    memberReviewerCount: 1,
                    phaseId: 'phase-approval',
                    scorecardId: 'scorecard-2',
                }]}
                typeId='type-1'
            />,
        )

        expect(await screen.findByText('Approval Review Scorecard')).not.toBeNull()
        expect(screen.queryByText('scorecard-2'))
            .toBeNull()
        expect(mockedFetchScorecards)
            .toHaveBeenNthCalledWith(1, {
                page: 1,
                perPage: 200,
                typeId: 'type-1',
            })
        expect(mockedFetchScorecards)
            .toHaveBeenNthCalledWith(2, {
                page: 2,
                perPage: 200,
                typeId: 'type-1',
            })
    })

    it('distributes repeated role assignments across matching reviewer rows in view mode', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(undefined)
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'role-approver',
                name: 'Approver',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [
                {
                    challengeId: 'challenge-1',
                    memberHandle: 'approver-one',
                    memberId: 'member-1',
                    roleId: 'role-approver',
                },
                {
                    challengeId: 'challenge-1',
                    memberHandle: 'approver-two',
                    memberId: 'member-2',
                    roleId: 'role-approver',
                },
            ],
        })
        mockedFetchScorecards.mockResolvedValue([{
            id: 'scorecard-approval',
            name: 'Approval Scorecard',
        }])

        const rendered: ReturnType<typeof render> = render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Approval',
                    phaseId: 'phase-approval',
                }]}
                reviewers={[
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'phase-approval',
                        scorecardId: 'scorecard-approval',
                    },
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'phase-approval',
                        scorecardId: 'scorecard-approval',
                    },
                ]}
                typeId='type-1'
            />,
        )
        const container: HTMLElement = rendered.container

        expect(
            await screen.findAllByText('Approval Scorecard'),
        )
            .toHaveLength(2)

        const humanReviewerRows = container.querySelectorAll('tbody tr')
        expect(humanReviewerRows)
            .toHaveLength(2)
        expect(humanReviewerRows[0]?.textContent)
            .toContain('approver-one')
        expect(humanReviewerRows[1]?.textContent)
            .toContain('approver-two')
    })

    it('continues into generic reviewer assignments when the approver pool is exhausted', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(undefined)
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [
                {
                    id: 'role-approver',
                    name: 'Approver',
                },
                {
                    id: 'role-reviewer',
                    name: 'Reviewer',
                },
            ],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [
                {
                    challengeId: 'challenge-1',
                    memberHandle: 'approver-one',
                    memberId: 'member-1',
                    roleId: 'role-approver',
                },
                {
                    challengeId: 'challenge-1',
                    memberHandle: 'approver-two',
                    memberId: 'member-2',
                    roleId: 'role-reviewer',
                },
                {
                    challengeId: 'challenge-1',
                    memberHandle: 'approver-three',
                    memberId: 'member-3',
                    roleId: 'role-reviewer',
                },
            ],
        })
        mockedFetchScorecards.mockResolvedValue([{
            id: 'scorecard-approval',
            name: 'Approval Scorecard',
        }])

        const rendered: ReturnType<typeof render> = render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Approval',
                    phaseId: 'phase-approval',
                }]}
                reviewers={[
                    {
                        isMemberReview: true,
                        memberReviewerCount: 2,
                        phaseId: 'phase-approval',
                        scorecardId: 'scorecard-approval',
                    },
                    {
                        isMemberReview: true,
                        memberReviewerCount: 1,
                        phaseId: 'phase-approval',
                        scorecardId: 'scorecard-approval',
                    },
                ]}
                typeId='type-1'
            />,
        )
        const container: HTMLElement = rendered.container

        expect(
            await screen.findAllByText('Approval Scorecard'),
        )
            .toHaveLength(2)

        const humanReviewerRows = container.querySelectorAll('tbody tr')
        expect(humanReviewerRows)
            .toHaveLength(2)
        expect(humanReviewerRows[0]?.textContent)
            .toContain('approver-one, approver-two')
        expect(humanReviewerRows[1]?.textContent)
            .toContain('approver-three')
    })

    it('shows assigned reviewers when resources only expose the reviewer role name', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(undefined)
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'role-reviewer',
                name: 'Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: 'challenge-1',
                memberHandle: 'reviewer-one',
                memberId: 'member-1',
                role: 'Reviewer',
                roleId: '',
            }],
        })
        mockedFetchScorecards.mockResolvedValue([{
            id: 'scorecard-review',
            name: 'Review Scorecard',
        }])

        render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Review',
                    phaseId: 'phase-review',
                }]}
                reviewers={[{
                    isMemberReview: true,
                    memberReviewerCount: 1,
                    phaseId: 'phase-review',
                    scorecardId: 'scorecard-review',
                }]}
                typeId='type-1'
            />,
        )

        expect(await screen.findByText('reviewer-one')).not.toBeNull()
    })

    it('falls back to the generic reviewer role for approval rows and renders resolved handles', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue(undefined)
        mockedUseFetchResourceRoles.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            resourceRoles: [{
                id: 'role-reviewer',
                name: 'Reviewer',
            }],
        })
        mockedUseFetchResources.mockReturnValue({
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
            resources: [{
                challengeId: 'challenge-1',
                memberId: '40158994',
                roleId: 'role-reviewer',
            }],
        })
        mockedSearchProfilesByUserIds.mockResolvedValue([{
            handle: 'approval-user',
            userId: '40158994',
        }])
        mockedFetchScorecards.mockResolvedValue([{
            id: 'scorecard-approval',
            name: 'Approval Scorecard',
        }])
        mockedUseFetchChallengeReviewContext.mockReturnValue({
            context: undefined,
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })
        mockedUseFetchChallengeReviewContext.mockReturnValue({
            context: undefined,
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        })

        render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Approval',
                    phaseId: 'phase-approval',
                }]}
                reviewers={[{
                    isMemberReview: true,
                    memberReviewerCount: 1,
                    phaseId: 'phase-approval',
                    scorecardId: 'scorecard-approval',
                }]}
                typeId='type-1'
            />,
        )

        expect(await screen.findByText('approval-user')).not.toBeNull()
    })

    it('groups the locked review-flow path into the centered failure branch', async () => {
        const rendered: ReturnType<typeof render> = render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Review',
                    phaseId: 'phase-1',
                }]}
                reviewers={[
                    {
                        handle: 'reviewer-one',
                        isMemberReview: true,
                        memberId: 'member-1',
                        memberReviewerCount: 1,
                        phaseId: 'phase-1',
                        scorecardId: 'scorecard-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
                typeId='type-1'
            />,
        )
        const container: HTMLElement = rendered.container

        expect(await screen.findByText('Locked')).not.toBeNull()

        const failureBranch = container.querySelector(`.${styles.failureBranch}`)
        expect(failureBranch).not.toBeNull()
        expect(failureBranch?.querySelector(`.${styles.failureArrow}`)).not.toBeNull()
        expect(failureBranch?.querySelector(`.${styles.flowStep}`)).not.toBeNull()
        expect(failureBranch?.textContent)
            .toContain('Locked')
        expect(failureBranch?.textContent)
            .toContain('No human')
        expect(failureBranch?.textContent)
            .toContain('review needed')
    })

    it('shows the locked review-flow path for AI_GATING configs without gating workflow markers', async () => {
        mockedFetchAiReviewConfigByChallenge.mockResolvedValue({
            autoFinalize: false,
            challengeId: 'challenge-1',
            id: 'ai-config-1',
            minPassingThreshold: 75,
            mode: 'AI_GATING',
            workflows: [{
                isGating: false,
                weightPercent: 100,
                workflow: {
                    id: 'workflow-1',
                    name: 'AI Submission Scanner',
                    scorecard: {
                        id: 'scorecard-2',
                        name: 'AI Scorecard',
                    },
                },
                workflowId: 'workflow-1',
            }],
        })

        const rendered: ReturnType<typeof render> = render(
            <ReviewConfigurationSummary
                challengeId='challenge-1'
                phases={[{
                    name: 'Review',
                    phaseId: 'phase-1',
                }]}
                reviewers={[
                    {
                        handle: 'reviewer-one',
                        isMemberReview: true,
                        memberId: 'member-1',
                        memberReviewerCount: 1,
                        phaseId: 'phase-1',
                        scorecardId: 'scorecard-1',
                    },
                    {
                        aiWorkflowId: 'workflow-1',
                        isMemberReview: false,
                    },
                ]}
                typeId='type-1'
            />,
        )
        const container: HTMLElement = rendered.container

        expect(await screen.findByText('Locked')).not.toBeNull()
        expect(container.querySelector(`.${styles.withAI}`)).not.toBeNull()
        expect(container.querySelector(`.${styles.failureBranch}`)).not.toBeNull()
    })
})
