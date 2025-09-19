import { EnvironmentConfig } from '~/config'
import {
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    Reviewer,
    ReviewFilterCriteria,
    ReviewOpportunity,
    ReviewSummary,
} from '../models'
import { createReviewQueryString } from '../utils'

/**
 * Searches the review opportunities using v3 api.
 */
type BackendReviewOpportunitySummary = {
    challengeId: string
    challengeLegacyId?: string | number
    legacyChallengeId?: string | number
    challengeName: string
    challengeStatus: string
    submissionEndDate?: string | null
    numberOfSubmissions?: number
    numberOfReviewerSpots?: number
    numberOfPendingApplications?: number
    numberOfApprovedApplications?: number
}

type ReviewOpportunitiesSummaryResponse = {
    result: {
        success: boolean
        status: number
        content: BackendReviewOpportunitySummary[]
        metadata?: {
            total?: number
            totalPages?: number
            page?: number
            perPage?: number
        }
    }
}

/**
 * Searches the review opportunities using v6 api.
 */
export const getReviewOpportunities = async (
    filterCriteria: ReviewFilterCriteria,
): Promise<{
    content: ReviewSummary[]
    metadata?: {
        total?: number
        totalPages?: number
        page?: number
        perPage?: number
    }
}> => {
    const response = await xhrGetAsync<ReviewOpportunitiesSummaryResponse>(
        `${EnvironmentConfig.API.V6}/review-opportunities/summary?${createReviewQueryString(filterCriteria)}`,
    )

    const mapToReviewSummary = (
        item: BackendReviewOpportunitySummary,
    ): ReviewSummary => {
        const legacyId = item.challengeLegacyId
            ?? item.legacyChallengeId
            ?? item.challengeId

        return {
            challengeId: item.challengeId,
            challengeName: item.challengeName,
            challengeStatus: item.challengeStatus,
            legacyChallengeId: String(legacyId ?? ''),
            numberOfApprovedApplications: item.numberOfApprovedApplications ?? 0,
            numberOfPendingApplications: item.numberOfPendingApplications ?? 0,
            numberOfReviewerSpots: item.numberOfReviewerSpots ?? 0,
            numberOfSubmissions: item.numberOfSubmissions ?? 0,
            submissionEndDate: item.submissionEndDate ?? '',
        }
    }

    return {
        content: response.result.content.map(mapToReviewSummary),
        metadata: response.result.metadata,
    }
}

/**
 * Searches the reviewer for challenge using v3 api.
 */
export const getChallengeReviewers = async (
    challengeId: string,
): Promise<Array<Reviewer>> => {
  type v3Response<Reviewer> = { result: { content: Reviewer[] } }
  const data = await xhrGetAsync<v3Response<Reviewer>>(
      `${EnvironmentConfig.API.V3}/reviewOpportunities/${challengeId}/reviewApplications`,
  )
  return data.result.content
}

/**
 * Get review opportunities for challenge using v3 api.
 */
export const getChallengeReviewOpportunities = async (
    challengeId: string,
): Promise<ReviewOpportunity> => {
  type v3Response<ReviewOpportunity> = { result: { content: ReviewOpportunity } }
  const data = await xhrGetAsync<v3Response<ReviewOpportunity>>(
      `${EnvironmentConfig.API.V3}/reviewOpportunities/${challengeId}`,
  )
  return data.result.content
}

/**
 * Approve application for challenge using v3 api.
 */
export const approveApplication = async (challengeId: string, data: {
  userId: number
  reviewAuctionId: number
  applicationRoleId: number
}): Promise<unknown> => xhrPostAsync(
    // eslint-disable-next-line max-len
    `${EnvironmentConfig.API.V3}/reviewOpportunities/${challengeId}/reviewApplications/assign?userId=${data.userId}&reviewAuctionId=${data.reviewAuctionId}&applicationRoleId=${data.applicationRoleId}`,
    {},
)

/**
 * Reject pending for challenge using v3 api.
 */
export const rejectPending = async (
    challengeId: string,
): Promise<unknown> => xhrPostAsync(
    `${EnvironmentConfig.API.V3}/reviewOpportunities/${challengeId}/reviewApplications/rejectPending`,
    {},
)
