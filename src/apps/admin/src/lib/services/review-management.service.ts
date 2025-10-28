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
    // v6 API returns these metrics at the top level
    openReviews?: number
    latestCompletedReviews?: number
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

type MemberEmailRecord = {
    userId: number
    email: string
}

const toTitleCase = (value?: string): string => {
    if (!value) return ''
    // Normalize known statuses from v6 API
    const map: Record<string, string> = {
        APPROVED: 'Approved',
        CANCELLED: 'Cancelled',
        PENDING: 'Pending',
        REJECTED: 'Rejected',
    }
    const upper = value.toUpperCase()
    if (map[upper]) return map[upper]
    // Fallback: generic title-case
    return value
        .toLowerCase()
        .split('_')
        .map(w => (w ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ')
}

const mapApplicationToReviewer = (
    application: ReviewOpportunityApplication,
): Reviewer => {
    const parsedUserId = typeof application.userId === 'number'
        ? application.userId
        : Number(application.userId)

    return {
        applicationDate: application.applicationDate ?? '',
        applicationId: application.id,
        applicationRole: toTitleCase(application.role),
        applicationStatus: toTitleCase(application.status),
        currentNumberOfReviewPositions:
            application.openReviews ?? 0,
        emailAddress: application.email ?? '',
        handle: application.handle ?? '',
        reviewsInPast60Days: application.latestCompletedReviews ?? 0,
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
    const applications = response.result.content ?? []

    // First map base fields from the opportunity applications
    const reviewers = applications.map(mapApplicationToReviewer)

    // If email is already present from API, we can short‑circuit
    const hasMissingEmails = reviewers.some(r => !r.emailAddress)
    if (!hasMissingEmails) {
        return reviewers
    }

    // Fetch missing emails from member-api in bulk using userIds
    const uniqueUserIds = Array.from(new Set(
        reviewers
            .filter(r => !r.emailAddress)
            .map(r => r.userId)
            .filter(id => Number.isFinite(id)),
    )) as number[]

    if (!uniqueUserIds.length) {
        return reviewers
    }

    // Build query string according to v6 members endpoint
    const qs = uniqueUserIds.length > 1
        ? uniqueUserIds
            .map(id => `userIds=${id}`)
            .join('&')
        : `userId=${uniqueUserIds[0]}`

    try {
        const emailRecords = await xhrGetAsync<MemberEmailRecord[]>(
            `${EnvironmentConfig.API.V6}/members?${qs}&fields=userId,email&perPage=${uniqueUserIds.length}`,
        )

        const emailByUserId = new Map<number, string>(
            (emailRecords || []).map(r => [Number(r.userId), r.email ?? '']),
        )

        return reviewers.map(r => (
            r.emailAddress
                ? r
                : { ...r, emailAddress: emailByUserId.get(r.userId) ?? '' }
        ))
    } catch (error) {
        // If the email lookup fails for any reason, return the base data
        return reviewers
    }
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
