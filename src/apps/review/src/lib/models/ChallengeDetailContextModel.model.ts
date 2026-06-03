import { BackendResource } from './BackendResource.model'
import { BackendSubmission } from './BackendSubmission.model'
import { ChallengeInfo } from './ChallengeInfo.model'
import { AiReviewConfig, AiReviewDecision } from './AiReview.model'

/**
 * Model for challenge detail context
 */
export interface ChallengeDetailContextModel {
    challengeId?: string
    challengeInfoError?: Error
    isLoadingChallengeInfo: boolean
    challengeResourcesError?: Error
    isLoadingChallengeResources: boolean
    challengeInfo?: ChallengeInfo
    challengeSubmissions: BackendSubmission[]
    challengeSubmissionsError?: Error
    isLoadingChallengeSubmissions: boolean
    challengeScopedFetchError?: Error
    hasChallengeScopedFetchError: boolean
    retryChallengeScopedFetches: () => void
    myResources: BackendResource[]
    myRoles: string[]
    resources: BackendResource[]
    registrants: BackendResource[]
    reviewers: BackendResource[]
    aiReviewConfig?: AiReviewConfig
    aiReviewDecisionsBySubmissionId: Record<string, AiReviewDecision>
    isLoadingAiReviewConfig: boolean
    isLoadingAiReviewDecisions: boolean
    resourceMemberIdMapping: {
        [memberId: string]: BackendResource
    }
}
