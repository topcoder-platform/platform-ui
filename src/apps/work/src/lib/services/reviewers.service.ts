import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { CHALLENGE_API_URL } from '../constants'
import {
    DefaultReviewer,
    Scorecard,
    ScorecardFilters,
    Workflow,
} from '../models'

const SCORECARDS_API_URL = process.env.REACT_APP_SCORECARDS_API_URL
    || process.env.SCORECARDS_API_URL
    || `${EnvironmentConfig.API.V6}/scorecards`

const WORKFLOWS_API_URL = process.env.REACT_APP_WORKFLOWS_API_URL
    || process.env.WORKFLOWS_API_URL
    || `${EnvironmentConfig.API.V6}/workflows`

const CHALLENGE_DEFAULT_REVIEWERS_URL = process.env.REACT_APP_CHALLENGE_DEFAULT_REVIEWERS_URL
    || process.env.CHALLENGE_DEFAULT_REVIEWERS_URL
    || `${CHALLENGE_API_URL.replace(/\/challenges$/, '')}/challenge/default-reviewers`

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

function normalizeScorecard(scorecard: Partial<Scorecard>): Scorecard | undefined {
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
        id,
        name,
        phaseId: scorecard.phaseId !== undefined && scorecard.phaseId !== null
            ? String(scorecard.phaseId)
            : undefined,
        track: typeof scorecard.track === 'string'
            ? scorecard.track
            : undefined,
        trackId: scorecard.trackId !== undefined && scorecard.trackId !== null
            ? String(scorecard.trackId)
            : undefined,
        typeId: scorecard.typeId !== undefined && scorecard.typeId !== null
            ? String(scorecard.typeId)
            : undefined,
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
    }
}

function normalizeDefaultReviewer(
    reviewer: Partial<DefaultReviewer>,
): DefaultReviewer {
    return {
        phaseId: reviewer.phaseId !== undefined && reviewer.phaseId !== null
            ? String(reviewer.phaseId)
            : undefined,
        roleId: reviewer.roleId !== undefined && reviewer.roleId !== null
            ? String(reviewer.roleId)
            : undefined,
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
    }

    return []
}

export async function fetchScorecards(filters: ScorecardFilters = {}): Promise<Scorecard[]> {
    const query = new URLSearchParams({
        page: String(filters.page || 1),
        perPage: String(filters.perPage || 200),
    })

    if (filters.abbreviation) {
        query.set('abbreviation', filters.abbreviation)
    }

    if (filters.track) {
        query.set('track', filters.track)
    }

    if (filters.typeId) {
        query.set('typeId', filters.typeId)
    }

    try {
        const response = await xhrGetAsync<unknown>(
            `${SCORECARDS_API_URL}?${query.toString()}`,
        )

        return mapItems<Scorecard>(response, normalizeScorecard)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch scorecards')
    }
}

export async function fetchDefaultReviewers(
    typeId: string,
    trackId: string,
): Promise<DefaultReviewer[]> {
    const query = new URLSearchParams()

    if (typeId.trim()) {
        query.set('typeId', typeId.trim())
    }

    if (trackId.trim()) {
        query.set('trackId', trackId.trim())
    }

    try {
        const queryString = query.toString()
        const response = await xhrGetAsync<unknown>(
            queryString
                ? `${CHALLENGE_DEFAULT_REVIEWERS_URL}?${queryString}`
                : CHALLENGE_DEFAULT_REVIEWERS_URL,
        )

        return mapItems<DefaultReviewer>(response, normalizeDefaultReviewer)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch default reviewers')
    }
}

export async function fetchWorkflows(): Promise<Workflow[]> {
    try {
        const response = await xhrGetAsync<unknown>(WORKFLOWS_API_URL)

        return mapItems<Workflow>(response, normalizeWorkflow)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch workflows')
    }
}
