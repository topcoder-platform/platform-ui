import {
    xhrGetAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    ChallengeReviewContext,
    ChallengeReviewContextStatus,
} from '../models'

const CHALLENGE_REVIEW_CONTEXT_API_URL = `${EnvironmentConfig.API.V6}/ai-review/context`

function normalizeText(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value).trim()

    return normalizedValue || undefined
}

function normalizeReviewContextStatus(value: unknown): ChallengeReviewContextStatus | undefined {
    const normalizedValue = normalizeText(value)

    if (normalizedValue === 'AI_GENERATED'
        || normalizedValue === 'HUMAN_APPROVED'
        || normalizedValue === 'HUMAN_REJECTED') {
        return normalizedValue
    }

    return undefined
}

function normalizeChallengeReviewContext(
    input: unknown,
): ChallengeReviewContext | undefined {
    if (typeof input !== 'object' || input === null) {
        return undefined
    }

    const typedInput = input as Record<string, unknown>
    const id = normalizeText(typedInput.id)
    const challengeId = normalizeText(typedInput.challengeId)
    const status = normalizeReviewContextStatus(typedInput.status)
    const context = typeof typedInput.context === 'object' && typedInput.context
        ? typedInput.context as Record<string, unknown>
        : undefined

    if (!id || !challengeId || !status || !context) {
        return undefined
    }

    return {
        id,
        challengeId,
        context,
        status,
        createdAt: normalizeText(typedInput.createdAt),
        createdBy: typeof typedInput.createdBy === 'string'
            ? typedInput.createdBy
            : null,
        updatedAt: normalizeText(typedInput.updatedAt),
        updatedBy: typeof typedInput.updatedBy === 'string'
            ? typedInput.updatedBy
            : null,
    }
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

    return new Error(
        typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage,
    )
}

function serializeInput(
    input: {
        challengeId: string
        context: Record<string, unknown>
        status: ChallengeReviewContextStatus
    },
): {
    challengeId: string
    context: Record<string, unknown>
    status: ChallengeReviewContextStatus
} {
    return {
        challengeId: normalizeText(input.challengeId) || input.challengeId,
        context: input.context,
        status: input.status,
    }
}

export async function fetchChallengeReviewContextByChallenge(
    challengeId: string,
): Promise<ChallengeReviewContext | undefined> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${CHALLENGE_REVIEW_CONTEXT_API_URL}/${encodeURIComponent(challengeId.trim())}`,
        )

        return normalizeChallengeReviewContext(response)
    } catch (error) {
        const typedError = error as {
            response?: {
                status?: number
            }
            status?: number
        }
        const status = typedError?.status || typedError?.response?.status

        if (status === 404) {
            return undefined
        }

        throw normalizeError(error, 'Failed to fetch review context')
    }
}

export interface CreateChallengeReviewContextInput {
    challengeId: string
    context: Record<string, unknown>
    status: ChallengeReviewContextStatus
}

export async function createChallengeReviewContext(
    input: CreateChallengeReviewContextInput,
): Promise<ChallengeReviewContext> {
    try {
        const response = await xhrPostAsync<
            CreateChallengeReviewContextInput,
            unknown
        >(
            CHALLENGE_REVIEW_CONTEXT_API_URL,
            serializeInput(input),
        )

        const normalizedResult = normalizeChallengeReviewContext(response)

        if (!normalizedResult) {
            throw new Error('Challenge review context response was invalid')
        }

        return normalizedResult
    } catch (error) {
        throw normalizeError(error, 'Failed to create review context')
    }
}

export interface UpdateChallengeReviewContextInput {
    context: Record<string, unknown>
    status?: ChallengeReviewContextStatus
}

export async function updateChallengeReviewContext(
    challengeId: string,
    input: UpdateChallengeReviewContextInput,
): Promise<ChallengeReviewContext> {
    try {
        const response = await xhrPutAsync<
            UpdateChallengeReviewContextInput,
            unknown
        >(
            `${CHALLENGE_REVIEW_CONTEXT_API_URL}/${encodeURIComponent(challengeId.trim())}`,
            {
                context: input.context,
                status: input.status,
            },
        )

        const normalizedResult = normalizeChallengeReviewContext(response)

        if (!normalizedResult) {
            throw new Error('Challenge review context response was invalid')
        }

        return normalizedResult
    } catch (error) {
        throw normalizeError(error, 'Failed to update review context')
    }
}
