import { EnvironmentConfig } from '~/config'
import {
    xhrGetAsync,
    xhrPatchAsync,
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

type ReviewOpportunityApplication = {
    id: string
    opportunityId: string
    userId: string | number
    handle: string
    role?: string
    status?: string
    applicationDate?: string
    email?: string
    stats?: {
        reviewsInPast60Days?: number
        currentAssignments?: number
    }
}

type ReviewOpportunityResponse = {
    status?: string
    type?: string
    id: string
    challengeId: string
    openPositions?: number
    startDate?: string
    submissions?: number
    applications?: ReviewOpportunityApplication[]
}

type ReviewOpportunityListResponse = {
    result: {
        success: boolean
        status: number
        content: ReviewOpportunityResponse[]
    }
}

type ReviewApplicationsResponse = {
    result: {
        success: boolean
        status: number
        content: ReviewOpportunityApplication[]
    }
}

const mapApplicationToReviewer = (
    application: ReviewOpportunityApplication,
): Reviewer => {
    const stats = application.stats ?? {}
    const parsedUserId = typeof application.userId === 'number'
        ? application.userId
        : Number(application.userId)

    return {
        applicationDate: application.applicationDate ?? '',
        applicationId: application.id,
        applicationRole: application.role ?? '',
        applicationStatus: application.status ?? '',
        currentNumberOfReviewPositions:
            stats.currentAssignments ?? 0,
        emailAddress: application.email ?? '',
        handle: application.handle ?? '',
        reviewsInPast60Days: stats.reviewsInPast60Days ?? 0,
        userId: Number.isFinite(parsedUserId) ? parsedUserId : 0,
    }
}

const mapOpportunity = (
    opportunity: ReviewOpportunityResponse,
): ReviewOpportunity => ({
    applications: (opportunity.applications ?? []).map(mapApplicationToReviewer),
    challengeId: opportunity.challengeId,
    id: opportunity.id,
    openPositions: opportunity.openPositions ?? 0,
    startDate: opportunity.startDate ?? '',
    submissions: opportunity.submissions ?? 0,
    type: opportunity.type ?? '',
})

/**
 * Get review opportunity for a challenge using v6 api.
 */
export const getChallengeReviewOpportunities = async (
    challengeId: string,
): Promise<ReviewOpportunity | undefined> => {
    const response = await xhrGetAsync<ReviewOpportunityListResponse>(
        `${EnvironmentConfig.API.V6}/review-opportunities/challenge/${challengeId}`,
    )

    const opportunities = response.result.content ?? []
    if (!opportunities.length) {
        return undefined
    }

    const preferredOpportunity = opportunities.find(opportunity => opportunity.status === 'OPEN')

    return mapOpportunity(preferredOpportunity ?? opportunities[0])
}

/**
 * Get review applications for an opportunity using v6 api.
 */
export const getReviewOpportunityApplications = async (
    opportunityId: string,
): Promise<Array<Reviewer>> => {
    const response = await xhrGetAsync<ReviewApplicationsResponse>(
        `${EnvironmentConfig.API.V6}/review-applications/opportunity/${opportunityId}`,
    )

    return (response.result.content ?? []).map(mapApplicationToReviewer)
}

/**
 * Approve application for opportunity using v6 api.
 */
export const approveApplication = async (
    applicationId: string,
): Promise<unknown> => xhrPatchAsync(
    `${EnvironmentConfig.API.V6}/review-applications/${applicationId}/accept`,
    {},
)

/**
 * Reject pending applications for opportunity using v6 api.
 */
export const rejectPending = async (
    opportunityId: string,
): Promise<unknown> => xhrPatchAsync(
    `${EnvironmentConfig.API.V6}/review-applications/opportunity/${opportunityId}/reject-all`,
    {},
)
