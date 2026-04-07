/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'

import {
    useFetchResourceRoles,
    useFetchResources,
} from '../../../../../lib/hooks'
import {
    fetchAiReviewConfigByChallenge,
    fetchScorecards,
    fetchWorkflows,
} from '../../../../../lib/services'

import styles from './ReviewConfigurationSummary.module.scss'
import { ReviewConfigurationSummary } from './ReviewConfigurationSummary'

jest.mock('../../../../../lib/hooks', () => ({
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
}))

const mockedFetchAiReviewConfigByChallenge = fetchAiReviewConfigByChallenge as jest.Mock
const mockedFetchScorecards = fetchScorecards as jest.Mock
const mockedFetchWorkflows = fetchWorkflows as jest.Mock
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
})
