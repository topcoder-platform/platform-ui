import {
    xhrCreateInstance,
    xhrGetAsync,
} from '~/libs/core'

import { SUBMISSIONS_API_URL } from '../constants'
import {
    ReviewSummation,
    Submission,
    SubmissionReview,
} from '../models'
import { buildAuthHeaders } from '../utils/auth.utils'

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 20
const FETCH_ALL_PER_PAGE = 200
const MAX_FETCH_ALL_PAGES = 100

interface ExtractedSubmissionsPayload {
    data: Partial<Submission>[]
    meta: {
        page?: number
        perPage?: number
        total?: number
    }
}

interface SubmissionRegistrant {
    email?: unknown
    memberHandle?: unknown
    memberId?: unknown
    rating?: unknown
    userId?: unknown
}

interface UnknownRecord {
    [key: string]: unknown
}

export interface FetchSubmissionsParams {
    memberId?: string
    orderBy?: 'asc' | 'desc'
    page?: number
    perPage?: number
    sortBy?: string
}

export interface FetchSubmissionsResponse {
    data: Submission[]
    page: number
    perPage: number
    total: number
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function toOptionalBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean'
        ? value
        : undefined
}

function toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value)
        if (Number.isFinite(parsedValue)) {
            return parsedValue
        }
    }

    return undefined
}

function toOptionalPositiveInteger(value: unknown): number | undefined {
    const parsedValue = toOptionalNumber(value)
    if (!parsedValue || parsedValue < 1) {
        return undefined
    }

    return Math.trunc(parsedValue)
}

function toOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function toRequiredString(value: unknown): string {
    return toOptionalString(value) || ''
}

function normalizeReview(review: unknown): SubmissionReview | undefined {
    if (typeof review !== 'object' || !review) {
        return undefined
    }

    const typedReview = review as UnknownRecord

    return {
        createdAt: toOptionalString(typedReview.createdAt ?? typedReview.created),
        id: toOptionalString(typedReview.id),
        initialScore: toOptionalNumber(typedReview.initialScore),
        isPassing: toOptionalBoolean(typedReview.isPassing),
        reviewerHandle: toOptionalString(typedReview.reviewerHandle),
        reviewerId: toOptionalString(typedReview.reviewerId),
        score: toOptionalNumber(typedReview.score ?? typedReview.finalScore),
        status: toOptionalString(typedReview.status),
        submissionId: toOptionalString(typedReview.submissionId),
        typeId: toOptionalString(typedReview.typeId),
    }
}

function normalizeReviewSummation(reviewSummation: unknown): ReviewSummation | undefined {
    if (typeof reviewSummation !== 'object' || !reviewSummation) {
        return undefined
    }

    const typedReviewSummation = reviewSummation as UnknownRecord

    return {
        aggregateScore: toOptionalNumber(typedReviewSummation.aggregateScore),
        createdAt: toOptionalString(typedReviewSummation.createdAt ?? typedReviewSummation.created),
        id: toOptionalString(typedReviewSummation.id),
        isFinal: toOptionalBoolean(typedReviewSummation.isFinal),
        isPassing: toOptionalBoolean(typedReviewSummation.isPassing),
        isProvisional: toOptionalBoolean(typedReviewSummation.isProvisional),
        memberId: toOptionalString(typedReviewSummation.memberId),
        submissionId: toOptionalString(typedReviewSummation.submissionId),
    }
}

function normalizeSubmissionReviews(
    reviews: unknown,
): SubmissionReview[] | undefined {
    if (!Array.isArray(reviews)) {
        return undefined
    }

    const normalizedReviews = reviews
        .map(review => normalizeReview(review))
        .filter((review): review is SubmissionReview => !!review)

    return normalizedReviews.length
        ? normalizedReviews
        : undefined
}

function normalizeReviewSummations(
    reviewSummation: unknown,
): ReviewSummation[] | undefined {
    if (!Array.isArray(reviewSummation)) {
        return undefined
    }

    const normalizedReviewSummations = reviewSummation
        .map(item => normalizeReviewSummation(item))
        .filter((item): item is ReviewSummation => !!item)

    return normalizedReviewSummations.length
        ? normalizedReviewSummations
        : undefined
}

function toSubmissionRegistrant(value: unknown): SubmissionRegistrant | undefined {
    if (typeof value !== 'object' || !value) {
        return undefined
    }

    return value as SubmissionRegistrant
}

function resolveCreatedBy(
    submission: Partial<Submission>,
    registrant: SubmissionRegistrant | undefined,
): string {
    return toRequiredString(
        submission.createdBy
            ?? submission.memberId
            ?? registrant?.memberId
            ?? registrant?.userId
            ?? submission.memberHandle
            ?? registrant?.memberHandle,
    )
}

function resolveCreatedAt(submission: Partial<Submission>): string | undefined {
    const submissionRecord = submission as UnknownRecord

    return toOptionalString(
        submission.createdAt
            ?? submission.created
            ?? submission.submissionTime
            ?? submissionRecord.submittedDate,
    )
}

function resolveEmail(
    submission: Partial<Submission>,
    registrant: SubmissionRegistrant | undefined,
): string | undefined {
    return toOptionalString(
        submission.email
            ?? registrant?.email,
    )
}

function resolveMemberHandle(
    submission: Partial<Submission>,
    registrant: SubmissionRegistrant | undefined,
): string | undefined {
    return toOptionalString(
        submission.memberHandle
            ?? registrant?.memberHandle,
    )
}

function resolveMemberId(
    submission: Partial<Submission>,
    registrant: SubmissionRegistrant | undefined,
): string | undefined {
    return toOptionalString(
        submission.memberId
            ?? registrant?.memberId
            ?? registrant?.userId,
    )
}

function resolveRating(
    submission: Partial<Submission>,
    registrant: SubmissionRegistrant | undefined,
): number | undefined {
    return toOptionalNumber(
        submission.rating
            ?? registrant?.rating,
    )
}

function normalizeSubmission(submission: Partial<Submission>): Submission | undefined {
    const challengeId = submission.challengeId !== undefined && submission.challengeId !== null
        ? String(submission.challengeId)
        : ''
    const id = submission.id !== undefined && submission.id !== null
        ? String(submission.id)
        : ''
    const registrant = toSubmissionRegistrant((submission as UnknownRecord).registrant)
    const createdBy = resolveCreatedBy(submission, registrant)

    if (!challengeId || !createdBy || !id) {
        return undefined
    }

    const normalizedReviews = normalizeSubmissionReviews(
        (submission as UnknownRecord).review,
    )
    const normalizedReviewSummation = normalizeReviewSummations(
        (submission as UnknownRecord).reviewSummation,
    )

    return {
        challengeId,
        created: toOptionalString(submission.created),
        createdAt: resolveCreatedAt(submission),
        createdBy,
        email: resolveEmail(submission, registrant),
        fileType: toOptionalString(submission.fileType),
        id,
        legacySubmissionId: toOptionalString(submission.legacySubmissionId),
        memberHandle: resolveMemberHandle(submission, registrant),
        memberId: resolveMemberId(submission, registrant),
        rating: resolveRating(submission, registrant),
        review: normalizedReviews,
        reviewSummation: normalizedReviewSummation,
        status: toOptionalString(submission.status),
        submissionTime: toOptionalString(submission.submissionTime),
        type: toOptionalString(submission.type),
    }
}

function extractMetaValue(meta: unknown, key: string): unknown {
    if (typeof meta !== 'object' || !meta) {
        return undefined
    }

    return (meta as UnknownRecord)[key]
}

function extractSubmissions(response: unknown): ExtractedSubmissionsPayload {
    if (Array.isArray(response)) {
        return {
            data: response as Partial<Submission>[],
            meta: {},
        }
    }

    if (typeof response !== 'object' || !response) {
        return {
            data: [],
            meta: {},
        }
    }

    const typedResponse = response as UnknownRecord
    const responseData = typedResponse.data
    const responseMeta = typedResponse.meta

    if (Array.isArray(responseData)) {
        return {
            data: responseData as Partial<Submission>[],
            meta: {
                page: toOptionalPositiveInteger(extractMetaValue(responseMeta, 'page')),
                perPage: toOptionalPositiveInteger(extractMetaValue(responseMeta, 'perPage')),
                total: toOptionalPositiveInteger(
                    extractMetaValue(responseMeta, 'totalCount')
                        ?? extractMetaValue(responseMeta, 'total'),
                ),
            },
        }
    }

    if (typeof responseData !== 'object' || !responseData) {
        return {
            data: [],
            meta: {},
        }
    }

    const nestedData = responseData as UnknownRecord
    const nestedMeta = nestedData.meta

    if (Array.isArray(nestedData.data)) {
        return {
            data: nestedData.data as Partial<Submission>[],
            meta: {
                page: toOptionalPositiveInteger(
                    extractMetaValue(nestedMeta, 'page')
                        ?? extractMetaValue(responseMeta, 'page'),
                ),
                perPage: toOptionalPositiveInteger(
                    extractMetaValue(nestedMeta, 'perPage')
                        ?? extractMetaValue(responseMeta, 'perPage'),
                ),
                total: toOptionalPositiveInteger(
                    extractMetaValue(nestedMeta, 'totalCount')
                        ?? extractMetaValue(nestedMeta, 'total')
                        ?? extractMetaValue(responseMeta, 'totalCount')
                        ?? extractMetaValue(responseMeta, 'total'),
                ),
            },
        }
    }

    return {
        data: [],
        meta: {},
    }
}

function createBlobDownloadXhrInstance(): ReturnType<typeof xhrCreateInstance> {
    const blobXhrInstance = xhrCreateInstance()
    const authorizationHeader = buildAuthHeaders().Authorization

    if (authorizationHeader) {
        blobXhrInstance.defaults.headers.common.Authorization = authorizationHeader
    }

    blobXhrInstance.defaults.headers.common.Accept = 'application/zip, application/octet-stream'
    blobXhrInstance.defaults.responseType = 'blob'

    return blobXhrInstance
}

function appendQueryParam(
    query: URLSearchParams,
    fieldName: string,
    value: unknown,
): void {
    const normalizedValue = toOptionalString(value)
    if (normalizedValue) {
        query.set(fieldName, normalizedValue)
    }
}

function getSubmissionTimestamp(submission: Submission): number {
    const createdAt = resolveCreatedAt(submission)
    if (!createdAt) {
        return 0
    }

    const parsedTimestamp = new Date(createdAt)
        .getTime()

    return Number.isFinite(parsedTimestamp)
        ? parsedTimestamp
        : 0
}

function sortSubmissionsByNewest(submissions: Submission[]): Submission[] {
    return [...submissions].sort((submissionA, submissionB) => {
        const timestampA = getSubmissionTimestamp(submissionA)
        const timestampB = getSubmissionTimestamp(submissionB)

        if (timestampA !== timestampB) {
            return timestampB - timestampA
        }

        return submissionA.id.localeCompare(submissionB.id)
    })
}

async function fetchAllSubmissionsByChallenge(
    challengeId: string,
    params: Omit<FetchSubmissionsParams, 'page' | 'perPage'> = {},
): Promise<Submission[]> {
    const firstPageResponse = await fetchSubmissionsByChallenge(
        challengeId,
        {
            ...params,
            page: DEFAULT_PAGE,
            perPage: FETCH_ALL_PER_PAGE,
        },
    )

    const firstPageSubmissions = firstPageResponse.data
    const totalPages = Math.max(
        1,
        Math.ceil(firstPageResponse.total / FETCH_ALL_PER_PAGE),
    )
    const cappedTotalPages = Math.min(totalPages, MAX_FETCH_ALL_PAGES)

    if (cappedTotalPages <= 1) {
        return firstPageSubmissions
    }

    const additionalPageResponses = await Promise.all(
        Array.from({
            length: cappedTotalPages - 1,
        }, (_, pageIndex) => fetchSubmissionsByChallenge(
            challengeId,
            {
                ...params,
                page: pageIndex + 2,
                perPage: FETCH_ALL_PER_PAGE,
            },
        )),
    )

    return [
        ...firstPageSubmissions,
        ...additionalPageResponses.flatMap(response => response.data),
    ]
}

export async function fetchSubmissionsByChallenge(
    challengeId: string,
    params: FetchSubmissionsParams,
): Promise<FetchSubmissionsResponse> {
    const normalizedChallengeId = challengeId.trim()
    const page = Math.max(1, Math.trunc(params.page || DEFAULT_PAGE))
    const perPage = Math.max(1, Math.trunc(params.perPage || DEFAULT_PER_PAGE))

    if (!normalizedChallengeId) {
        return {
            data: [],
            page,
            perPage,
            total: 0,
        }
    }

    const query = new URLSearchParams()
    query.set('challengeId', normalizedChallengeId)
    query.set('page', String(page))
    query.set('perPage', String(perPage))

    appendQueryParam(query, 'memberId', params.memberId)
    appendQueryParam(query, 'sortBy', params.sortBy)

    if (params.orderBy) {
        const normalizedOrderBy = params.orderBy
            .trim()
            .toLowerCase()

        if (normalizedOrderBy === 'asc' || normalizedOrderBy === 'desc') {
            query.set('orderBy', normalizedOrderBy)
        }
    }

    try {
        const response = await xhrGetAsync<unknown>(
            `${SUBMISSIONS_API_URL}?${query.toString()}`,
        )
        const extractedPayload = extractSubmissions(response)
        const normalizedSubmissions = extractedPayload.data
            .map(submission => normalizeSubmission(submission))
            .filter((submission): submission is Submission => !!submission)

        const responsePage = extractedPayload.meta.page || page
        const responsePerPage = extractedPayload.meta.perPage || perPage
        const responseTotal = extractedPayload.meta.total
            || (((responsePage - 1) * responsePerPage) + normalizedSubmissions.length)

        return {
            data: normalizedSubmissions,
            page: responsePage,
            perPage: responsePerPage,
            total: responseTotal,
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenge submissions')
    }
}

export async function fetchSubmissions(challengeId: string): Promise<Submission[]> {
    const normalizedChallengeId = challengeId.trim()

    if (!normalizedChallengeId) {
        return []
    }

    return fetchAllSubmissionsByChallenge(normalizedChallengeId)
}

export async function fetchSubmissionVersions(
    challengeId: string,
    memberId: string,
): Promise<Submission[]> {
    const normalizedChallengeId = challengeId.trim()
    const normalizedMemberId = memberId.trim()

    if (!normalizedChallengeId || !normalizedMemberId) {
        return []
    }

    try {
        const versions = await fetchAllSubmissionsByChallenge(
            normalizedChallengeId,
            {
                memberId: normalizedMemberId,
                orderBy: 'desc',
                sortBy: 'submittedDate',
            },
        )

        return sortSubmissionsByNewest(versions)
    } catch {
        const fallbackVersions = await fetchAllSubmissionsByChallenge(
            normalizedChallengeId,
            {
                memberId: normalizedMemberId,
            },
        )

        return sortSubmissionsByNewest(fallbackVersions)
    }
}

function extractArtifactList(response: unknown): string[] {
    if (Array.isArray(response)) {
        return response
            .map(item => toOptionalString(item))
            .filter((item): item is string => !!item)
    }

    if (typeof response !== 'object' || !response) {
        return []
    }

    const typedResponse = response as UnknownRecord
    const artifacts = typedResponse.artifacts

    if (Array.isArray(artifacts)) {
        return artifacts
            .map(item => toOptionalString(item))
            .filter((item): item is string => !!item)
    }

    const responseData = typedResponse.data
    if (typeof responseData !== 'object' || !responseData) {
        return []
    }

    const typedResponseData = responseData as UnknownRecord
    if (Array.isArray(typedResponseData.artifacts)) {
        return typedResponseData.artifacts
            .map(item => toOptionalString(item))
            .filter((item): item is string => !!item)
    }

    if (Array.isArray(typedResponseData.data)) {
        return typedResponseData.data
            .map(item => toOptionalString(item))
            .filter((item): item is string => !!item)
    }

    return []
}

export async function fetchSubmissionArtifacts(submissionId: string): Promise<string[]> {
    const normalizedSubmissionId = submissionId.trim()
    if (!normalizedSubmissionId) {
        return []
    }

    try {
        const response = await xhrGetAsync<unknown>(
            `${SUBMISSIONS_API_URL}/${encodeURIComponent(normalizedSubmissionId)}/artifacts`,
        )

        return extractArtifactList(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch submission artifacts')
    }
}

export async function downloadSubmission(submissionId: string): Promise<Blob> {
    const normalizedSubmissionId = submissionId.trim()
    if (!normalizedSubmissionId) {
        throw new Error('Submission id is required')
    }

    try {
        const xhrInstance = createBlobDownloadXhrInstance()

        return await xhrGetAsync<Blob>(
            `${SUBMISSIONS_API_URL}/${encodeURIComponent(normalizedSubmissionId)}/download`,
            xhrInstance,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to download submission')
    }
}

export async function downloadSubmissionArtifact(
    submissionId: string,
    artifactId: string,
): Promise<Blob> {
    const normalizedSubmissionId = submissionId.trim()
    const normalizedArtifactId = artifactId.trim()

    if (!normalizedSubmissionId || !normalizedArtifactId) {
        throw new Error('Submission id and artifact id are required')
    }

    try {
        const xhrInstance = createBlobDownloadXhrInstance()
        const encodedArtifactId = encodeURIComponent(normalizedArtifactId)

        return await xhrGetAsync<Blob>(
            `${SUBMISSIONS_API_URL}/${encodeURIComponent(normalizedSubmissionId)}`
                + `/artifacts/${encodedArtifactId}/download`,
            xhrInstance,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to download submission artifact')
    }
}
