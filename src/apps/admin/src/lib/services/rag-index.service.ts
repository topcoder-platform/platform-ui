/**
 * TopScout RAG index administration — reads and prunes what tc-ai-api's
 * challenge_embeddings table currently holds.
 *
 * Backed by tc-ai-api's `/v6/ai-api/rag/challenges` routes, which are administrator
 * only. They follow the platform pagination convention (bare array body,
 * X-Page/X-Per-Page/X-Total/X-Total-Pages headers), so xhrGetPaginatedAsync
 * reads them with no extra plumbing.
 *
 * Note the base path is `/v6/ai-api/rag`, a SIBLING of `/v6/ai` rather than a
 * child of it: Mastra reserves its apiPrefix (`/v6/ai`) for built-in routes and
 * refuses to start if a custom route is registered beneath it. The chat route
 * (`/v6/ai-chat`) sits beside the prefix for the same reason.
 */
import { EnvironmentConfig } from '~/config'
import { PaginatedResponse, xhrDeleteAsync, xhrGetPaginatedAsync } from '~/libs/core'

const RAG_INDEX_BASE_URL = `${EnvironmentConfig.API.V6}/ai-api/rag/challenges`

export interface IndexedChallenge {
    challengeId: string
    name: string | null
    type: string | null
    track: string | null
    projectId: string | null
    /** Number of indexed chunks for this challenge. */
    chunks: number
    /** ISO-8601 timestamp of the most recent chunk. */
    ingestedAt: string | null
}

export interface IndexedChallengesFilter {
    page?: number
    perPage?: number
    projectId?: string
    track?: string
    type?: string
    /** Case-insensitive substring match on challenge name or id. */
    search?: string
}

/** Omits blank filters entirely, so the API doesn't filter on empty strings. */
export function buildIndexedChallengesQuery(filter: IndexedChallengesFilter): string {
    const params = new URLSearchParams()

    Object.entries(filter)
        .forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return
            }

            const asString = String(value)
                .trim()
            if (asString) {
                params.set(key, asString)
            }
        })

    return params.toString()
}

export const fetchIndexedChallenges = async (
    filter: IndexedChallengesFilter = {},
): Promise<PaginatedResponse<IndexedChallenge[]>> => {
    const query = buildIndexedChallengesQuery(filter)
    return xhrGetPaginatedAsync<IndexedChallenge[]>(
        query ? `${RAG_INDEX_BASE_URL}?${query}` : RAG_INDEX_BASE_URL,
    )
}

export interface DeleteIndexedChallengeResult {
    challengeId: string
    deletedChunks: number
}

/** Removes every indexed chunk of one challenge from the vector index. */
export const deleteIndexedChallenge = async (
    challengeId: string,
): Promise<DeleteIndexedChallengeResult> => xhrDeleteAsync<DeleteIndexedChallengeResult>(
    `${RAG_INDEX_BASE_URL}/${encodeURIComponent(challengeId)}`,
)
