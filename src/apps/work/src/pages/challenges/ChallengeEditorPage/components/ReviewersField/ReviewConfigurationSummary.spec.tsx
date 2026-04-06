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

import { ReviewConfigurationSummary } from './ReviewConfigurationSummary'

jest.mock('../../../../../lib/hooks', () => ({
    useFetchResourceRoles: jest.fn(),
    useFetchResources: jest.fn(),
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
        expect(screen.getByText('reviewer-one')).not.toBeNull()
        expect(screen.getByText('Regular Review')).not.toBeNull()
        expect(screen.getByText('Review Flow')).not.toBeNull()
        expect(screen.getByText('Estimated Review Cost:')).not.toBeNull()
        expect(mockedFetchAiReviewConfigByChallenge)
            .toHaveBeenCalledWith('challenge-1')
        expect(mockedFetchScorecards)
            .toHaveBeenCalledWith({
                perPage: 200,
                typeId: 'type-1',
            })
    })
})
