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
export const getReviewOpportunities = async (
    filterCriteria: ReviewFilterCriteria,
): Promise<Array<ReviewSummary>> => {
  type v3Response<Review> = { result: { content: Review[], metadata: { totalCount: number } } }
  const data = await xhrGetAsync<v3Response<ReviewSummary>>(
      // eslint-disable-next-line max-len
      `${EnvironmentConfig.API.V3}/reviewOpportunities/reviewApplicationsSummary?${createReviewQueryString(filterCriteria)}`,
  )
  return data.result.content
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
