import {
    ReviewAttachmentUploadOptions,
    ReviewAttachmentUploadResult,
    uploadReviewAttachment,
} from '~/apps/review/src/lib/services/file-upload.service'
import {
    xhrCreateInstance,
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGetPaginatedAsync,
    xhrPatchAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    CHALLENGE_API_URL,
    CHALLENGE_API_VERSION,
    CHALLENGE_DEFAULT_REVIEWERS_URL,
    CHALLENGE_TYPES_API_URL,
    REVIEW_TYPE_API_URL,
    SCORECARDS_API_URL,
    UPDATE_SKILLS_V5_API_URL,
    WORKFLOWS_API_URL,
} from '../constants'
import {
    PHASE_DURATION_MAX_HOURS,
    PHASE_DURATION_MIN_MINUTES,
} from '../constants/challenge-editor.constants'
import {
    Challenge,
    ChallengeFilters,
    ChallengePhase,
    ChallengeType,
    DefaultReviewer,
    PaginationModel,
    PrizeSet,
    Reviewer,
    ReviewTypeMetadata,
    Scorecard,
    ScorecardFilters,
    Workflow,
} from '../models'
import { normalizeChallengeData } from '../utils'

interface FetchChallengesParams {
    page?: number
    perPage?: number
}

interface NormalizedError extends Error {
    code?: string
    status?: number
}

export interface FetchChallengesResponse {
    data: Challenge[]
    metadata: PaginationModel
}

const challengeServiceXhrInstance = xhrCreateInstance()
if (CHALLENGE_API_VERSION) {
    challengeServiceXhrInstance.defaults.headers.common['app-version']
        = CHALLENGE_API_VERSION
}

function normalizeStatusValue(status: string | string[] | undefined): string | undefined {
    if (!status) {
        return undefined
    }

    if (Array.isArray(status)) {
        const normalized = status
            .map(item => item.toUpperCase())
            .filter(Boolean)

        if (!normalized.length) {
            return undefined
        }

        return normalized.join(',')
    }

    return status.toUpperCase()
}

function asIsoDateString(value: unknown): string | undefined {
    if (!value) {
        return undefined
    }

    if (typeof value === 'string') {
        return value
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString()
    }

    return undefined
}

function toOptionalTrimmedString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

function toOptionalFiniteNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    const parsedValue = Number(value)
    return Number.isFinite(parsedValue)
        ? parsedValue
        : undefined
}

function toOptionalBooleanValue(value: unknown): boolean | undefined {
    return typeof value === 'boolean'
        ? value
        : undefined
}

function serializePrizeSets(prizeSets: unknown): PrizeSet[] | undefined {
    if (!Array.isArray(prizeSets)) {
        return undefined
    }

    const serializedPrizeSets = prizeSets
        .map(prizeSet => {
            if (typeof prizeSet !== 'object' || !prizeSet) {
                return undefined
            }

            const typedPrizeSet = prizeSet as Partial<PrizeSet>
            const normalizedType = (typedPrizeSet.type || '').trim()
            if (!normalizedType) {
                return undefined
            }

            const normalizedPrizes = Array.isArray(typedPrizeSet.prizes)
                ? typedPrizeSet.prizes
                    .map(prize => ({
                        ...prize,
                        value: Number(prize.value) || 0,
                    }))
                : []

            return {
                ...typedPrizeSet,
                prizes: normalizedPrizes,
                type: normalizedType,
            }
        })
        .filter((prizeSet): prizeSet is PrizeSet => !!prizeSet)

    return serializedPrizeSets
}

function serializePhaseDurationToSeconds(duration: unknown): number {
    const parsedDuration = Number(duration)
    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
        return 0
    }

    const maxDurationMinutes = PHASE_DURATION_MAX_HOURS * 60
    const normalizedDurationMinutes = Math.max(
        PHASE_DURATION_MIN_MINUTES,
        Math.min(maxDurationMinutes, Math.trunc(parsedDuration)),
    )

    return normalizedDurationMinutes * 60
}

function serializeChallengePhases(phases: unknown): ChallengePhase[] | undefined {
    if (!Array.isArray(phases)) {
        return undefined
    }

    const serializedPhases = phases
        .map((phase: unknown): ChallengePhase | undefined => {
            if (typeof phase !== 'object' || !phase) {
                return undefined
            }

            const typedPhase = phase as Partial<ChallengePhase>
            if (!typedPhase.phaseId) {
                return undefined
            }

            return {
                duration: serializePhaseDurationToSeconds(typedPhase.duration),
                phaseId: typedPhase.phaseId,
                predecessor: typedPhase.predecessor,
                scheduledStartDate: asIsoDateString(typedPhase.scheduledStartDate),
            }
        })
        .filter((phase): phase is ChallengePhase => !!phase)

    return serializedPhases
}

function serializeReviewers(reviewers: unknown): Reviewer[] | undefined {
    if (!Array.isArray(reviewers)) {
        return undefined
    }

    const serializedReviewers = reviewers
        .map((reviewer: unknown): Reviewer | undefined => {
            if (typeof reviewer !== 'object' || !reviewer) {
                return undefined
            }

            const typedReviewer = reviewer as Record<string, unknown>
            const aiWorkflowId = toOptionalTrimmedString(typedReviewer.aiWorkflowId)
            const explicitMemberReview = toOptionalBooleanValue(typedReviewer.isMemberReview)
            const isMemberReview = explicitMemberReview !== undefined
                ? explicitMemberReview
                : !aiWorkflowId

            return {
                aiWorkflowId: isMemberReview
                    ? undefined
                    : aiWorkflowId,
                baseCoefficient: toOptionalFiniteNumber(typedReviewer.baseCoefficient),
                incrementalCoefficient: toOptionalFiniteNumber(typedReviewer.incrementalCoefficient),
                isMemberReview,
                memberReviewerCount: isMemberReview
                    ? toOptionalFiniteNumber(typedReviewer.memberReviewerCount)
                    : undefined,
                phaseId: toOptionalTrimmedString(typedReviewer.phaseId),
                scorecardId: toOptionalTrimmedString(typedReviewer.scorecardId),
                shouldOpenOpportunity: toOptionalBooleanValue(typedReviewer.shouldOpenOpportunity),
            }
        })
        .filter((reviewer): reviewer is Reviewer => !!reviewer)

    return serializedReviewers
}

function serializeChallengePayload(params: Partial<Challenge>): Partial<Challenge> {
    return {
        ...params,
        phases: serializeChallengePhases(params.phases),
        prizeSets: serializePrizeSets(params.prizeSets),
        reviewers: serializeReviewers(params.reviewers),
        startDate: asIsoDateString(params.startDate),
        timelineTemplateId: params.timelineTemplateId,
    }
}

function buildChallengeQuery(
    filters: ChallengeFilters = {},
    params: FetchChallengesParams = {},
): string {
    const query = new URLSearchParams()

    const normalizedStatus = normalizeStatusValue(filters.status)
    const values: Record<string, string | undefined> = {
        endDateEnd: asIsoDateString(filters.endDateEnd),
        endDateStart: asIsoDateString(filters.endDateStart),
        name: filters.name?.trim() || undefined,
        page: params.page ? String(params.page) : undefined,
        perPage: params.perPage ? String(params.perPage) : undefined,
        projectId: filters.projectId !== undefined
            ? String(filters.projectId)
            : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        startDateEnd: asIsoDateString(filters.startDateEnd),
        startDateStart: asIsoDateString(filters.startDateStart),
        status: normalizedStatus,
        type: filters.type,
    }

    Object.entries(values)
        .forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                query.set(key, value)
            }
        })

    return query.toString()
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        code?: string
        message?: string
        response?: {
            data?: {
                message?: string
            }
            status?: number
        }
        status?: number
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    const normalizedError: NormalizedError = new Error(errorMessage)
    normalizedError.code = typedError?.code
    normalizedError.status = typedError?.status || typedError?.response?.status

    return normalizedError
}

function normalizeDefaultReviewer(
    reviewer: Partial<DefaultReviewer>,
): DefaultReviewer {
    const toOptionalString = (value: unknown): string | undefined => {
        if (value === undefined || value === null) {
            return undefined
        }

        const normalizedValue = String(value)
            .trim()
        return normalizedValue || undefined
    }

    const toOptionalNumber = (value: unknown): number | undefined => {
        if (value === undefined || value === null || value === '') {
            return undefined
        }

        const parsedValue = Number(value)
        return Number.isFinite(parsedValue)
            ? parsedValue
            : undefined
    }

    const toOptionalBoolean = (value: unknown): boolean | undefined => {
        if (typeof value === 'boolean') {
            return value
        }

        if (typeof value === 'string') {
            const normalizedValue = value
                .trim()
                .toLowerCase()
            if (normalizedValue === 'true') {
                return true
            }

            if (normalizedValue === 'false') {
                return false
            }
        }

        return undefined
    }

    return {
        aiWorkflowId: toOptionalString((reviewer as Record<string, unknown>).aiWorkflowId),
        baseCoefficient: toOptionalNumber((reviewer as Record<string, unknown>).baseCoefficient),
        incrementalCoefficient: toOptionalNumber((reviewer as Record<string, unknown>).incrementalCoefficient),
        isMemberReview: toOptionalBoolean((reviewer as Record<string, unknown>).isMemberReview),
        memberReviewerCount: toOptionalNumber((reviewer as Record<string, unknown>).memberReviewerCount),
        phaseId: toOptionalString(reviewer.phaseId),
        roleId: toOptionalString(reviewer.roleId),
        scorecardId: toOptionalString((reviewer as Record<string, unknown>).scorecardId),
    }
}

function normalizeWorkflow(workflow: Partial<Workflow>): Workflow | undefined {
    const id = workflow.id !== undefined && workflow.id !== null
        ? String(workflow.id)
        : ''
    const name = typeof workflow.name === 'string'
        ? workflow.name.trim()
        : ''

    if (!id || !name) {
        return undefined
    }

    return {
        id,
        name,
        scorecardId: workflow.scorecardId !== undefined && workflow.scorecardId !== null
            ? String(workflow.scorecardId)
            : undefined,
    }
}

function normalizeScorecard(scorecard: Partial<Scorecard>): Scorecard | undefined {
    const toOptionalString = (value: unknown): string | undefined => {
        if (value === undefined || value === null) {
            return undefined
        }

        const normalizedValue = String(value)
            .trim()

        return normalizedValue || undefined
    }

    const id = scorecard.id !== undefined && scorecard.id !== null
        ? String(scorecard.id)
        : ''
    const name = typeof scorecard.name === 'string'
        ? scorecard.name.trim()
        : ''

    if (!id || !name) {
        return undefined
    }

    return {
        challengeTrack: toOptionalString((scorecard as Record<string, unknown>).challengeTrack),
        challengeType: toOptionalString((scorecard as Record<string, unknown>).challengeType),
        id,
        name,
        phaseId: toOptionalString(scorecard.phaseId),
        status: toOptionalString((scorecard as Record<string, unknown>).status),
        track: toOptionalString(scorecard.track),
        trackId: toOptionalString(scorecard.trackId),
        type: toOptionalString((scorecard as Record<string, unknown>).type),
        typeId: toOptionalString(scorecard.typeId),
        version: toOptionalString((scorecard as Record<string, unknown>).version),
    }
}

function normalizeReviewType(
    reviewType: Partial<ReviewTypeMetadata>,
): ReviewTypeMetadata | undefined {
    if (!reviewType || typeof reviewType !== 'object') {
        return undefined
    }

    return {
        ...reviewType,
        id: reviewType.id !== undefined && reviewType.id !== null
            ? String(reviewType.id)
            : undefined,
        name: typeof reviewType.name === 'string'
            ? reviewType.name.trim()
            : reviewType.name,
    }
}

function mapItems<T>(response: unknown, normalize: (item: Partial<T>) => T | undefined): T[] {
    if (Array.isArray(response)) {
        return response
            .map(item => normalize(item as Partial<T>))
            .filter((item): item is T => !!item)
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as {
            data?: unknown
            result?: unknown
            scoreCards?: unknown
        }

        if (Array.isArray(typedResponse.data)) {
            return typedResponse.data
                .map(item => normalize(item as Partial<T>))
                .filter((item): item is T => !!item)
        }

        if (Array.isArray(typedResponse.result)) {
            return typedResponse.result
                .map(item => normalize(item as Partial<T>))
                .filter((item): item is T => !!item)
        }

        if (Array.isArray(typedResponse.scoreCards)) {
            return typedResponse.scoreCards
                .map(item => normalize(item as Partial<T>))
                .filter((item): item is T => !!item)
        }
    }

    return []
}

/**
 * Fetch challenges with filters and pagination.
 */
export async function fetchChallenges(
    filters: ChallengeFilters = {},
    params: FetchChallengesParams = {},
): Promise<FetchChallengesResponse> {
    const query = buildChallengeQuery(filters, params)
    const url = query
        ? `${CHALLENGE_API_URL}?${query}`
        : CHALLENGE_API_URL

    try {
        const response = await xhrGetPaginatedAsync<Challenge[]>(url, challengeServiceXhrInstance)

        return {
            data: (response.data || []).map(normalizeChallengeData),
            metadata: {
                page: response.page,
                perPage: response.perPage,
                total: response.total,
                totalPages: response.totalPages,
            },
        }
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenges')
    }
}

/**
 * Fetch one challenge by id.
 */
export async function fetchChallenge(challengeId: string): Promise<Challenge> {
    try {
        const challenge = await xhrGetAsync<Challenge>(
            `${CHALLENGE_API_URL}/${challengeId}`,
            challengeServiceXhrInstance,
        )

        return normalizeChallengeData(challenge)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenge')
    }
}

/**
 * Fetch challenge types metadata.
 */
export async function fetchChallengeTypes(): Promise<ChallengeType[]> {
    try {
        const response = await xhrGetPaginatedAsync<ChallengeType[]>(
            CHALLENGE_TYPES_API_URL,
            challengeServiceXhrInstance,
        )

        return response.data || []
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenge types')
    }
}

/**
 * Partially update challenge details.
 */
export async function patchChallenge(
    challengeId: string,
    params: Partial<Challenge>,
): Promise<Challenge> {
    try {
        const updated = await xhrPatchAsync<Partial<Challenge>, Challenge>(
            `${CHALLENGE_API_URL}/${challengeId}`,
            serializeChallengePayload(params),
            challengeServiceXhrInstance,
        )

        return normalizeChallengeData(updated)
    } catch (error) {
        throw normalizeError(error, 'Failed to update challenge')
    }
}

/**
 * Create a new challenge.
 */
export async function createChallenge(
    params: Partial<Challenge>,
): Promise<Challenge> {
    try {
        const created = await xhrPostAsync<Partial<Challenge>, Challenge>(
            CHALLENGE_API_URL,
            serializeChallengePayload(params),
            undefined,
            challengeServiceXhrInstance,
        )

        return normalizeChallengeData(created)
    } catch (error) {
        throw normalizeError(error, 'Failed to create challenge')
    }
}

/**
 * Fully update a challenge.
 */
export async function updateChallenge(
    challengeId: string,
    params: Challenge,
): Promise<Challenge> {
    try {
        const updated = await xhrPutAsync<Challenge, Challenge>(
            `${CHALLENGE_API_URL}/${challengeId}`,
            serializeChallengePayload(params) as Challenge,
            undefined,
            challengeServiceXhrInstance,
        )

        return normalizeChallengeData(updated)
    } catch (error) {
        throw normalizeError(error, 'Failed to update challenge')
    }
}

/**
 * Upload challenge attachment for markdown fields.
 */
export async function uploadChallengeAttachment(
    file: File,
    options: ReviewAttachmentUploadOptions = {},
): Promise<ReviewAttachmentUploadResult> {
    try {
        return await uploadReviewAttachment(file, {
            ...options,
            category: options.category || 'challenge-specification',
        })
    } catch (error) {
        throw normalizeError(error, 'Failed to upload challenge attachment')
    }
}

/**
 * Delete challenge.
 */
export async function deleteChallenge(challengeId: string): Promise<void> {
    try {
        await xhrDeleteAsync<unknown>(
            `${CHALLENGE_API_URL}/${challengeId}`,
            challengeServiceXhrInstance,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to delete challenge')
    }
}

/**
 * Fetch default reviewers metadata.
 */
export async function fetchDefaultReviewers(
    typeIdOrFilters: string | {
        trackId?: string
        typeId?: string
    } | undefined,
    trackId?: string,
): Promise<DefaultReviewer[]> {
    const filters = typeof typeIdOrFilters === 'string'
        ? {
            trackId,
            typeId: typeIdOrFilters,
        }
        : (typeIdOrFilters || {})
    const query = new URLSearchParams()

    if (filters.typeId?.trim()) {
        query.set('typeId', filters.typeId.trim())
    }

    if (filters.trackId?.trim()) {
        query.set('trackId', filters.trackId.trim())
    }

    try {
        const queryString = query.toString()
        const response = await xhrGetAsync<unknown>(
            queryString
                ? `${CHALLENGE_DEFAULT_REVIEWERS_URL}?${queryString}`
                : CHALLENGE_DEFAULT_REVIEWERS_URL,
            challengeServiceXhrInstance,
        )

        return mapItems<DefaultReviewer>(response, normalizeDefaultReviewer)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch default reviewers')
    }
}

/**
 * Fetch workflows metadata.
 */
export async function fetchWorkflows(): Promise<Workflow[]> {
    try {
        const response = await xhrGetAsync<unknown>(
            WORKFLOWS_API_URL,
            challengeServiceXhrInstance,
        )

        return mapItems<Workflow>(response, normalizeWorkflow)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch workflows')
    }
}

/**
 * Fetch scorecards metadata.
 */
export async function fetchScorecards(filters: ScorecardFilters = {}): Promise<Scorecard[]> {
    const query = new URLSearchParams({
        page: String(filters.page || 1),
        perPage: String(filters.perPage || 200),
    })

    if (filters.abbreviation?.trim()) {
        query.set('abbreviation', filters.abbreviation.trim())
    }

    if (filters.track?.trim()) {
        query.set('track', filters.track.trim())
    }

    if (filters.challengeTrack?.trim()) {
        query.set('challengeTrack', filters.challengeTrack.trim())
    }

    if (filters.challengeType?.trim()) {
        query.set('challengeType', filters.challengeType.trim())
    }

    if (filters.status?.trim()) {
        query.set('status', filters.status.trim())
    }

    if (filters.typeId?.trim()) {
        query.set('typeId', filters.typeId.trim())
    }

    try {
        const response = await xhrGetAsync<unknown>(
            `${SCORECARDS_API_URL}?${query.toString()}`,
            challengeServiceXhrInstance,
        )

        return mapItems<Scorecard>(response, normalizeScorecard)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch scorecards')
    }
}

/**
 * Update challenge skills.
 */
export async function updateChallengeSkills(
    challengeId: string,
    skills: unknown,
): Promise<unknown> {
    try {
        return await xhrPostAsync<unknown, unknown>(
            `${UPDATE_SKILLS_V5_API_URL}/${encodeURIComponent(challengeId)}`,
            skills,
            undefined,
            challengeServiceXhrInstance,
        )
    } catch (error) {
        throw normalizeError(error, 'Failed to update challenge skills')
    }
}

/**
 * Fetch review types metadata.
 */
export async function getReviewTypes(): Promise<ReviewTypeMetadata[]> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${REVIEW_TYPE_API_URL}?perPage=500&page=1`,
            challengeServiceXhrInstance,
        )

        return mapItems<ReviewTypeMetadata>(response, normalizeReviewType)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch review types')
    }
}
