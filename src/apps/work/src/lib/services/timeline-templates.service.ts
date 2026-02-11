import { xhrGetPaginatedAsync } from '~/libs/core'

import {
    PhaseDefinition,
    TimelineTemplate,
    TimelineTemplatePhase,
} from '../models'

const TIMELINE_TEMPLATES_URL = '/v6/timeline-templates?page=1&perPage=100'
const CHALLENGE_PHASES_URL = '/v5/challenge-phases?page=1&perPage=100'

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

function normalizeTemplatePhase(
    phase: Partial<TimelineTemplatePhase>,
): TimelineTemplatePhase | undefined {
    if (!phase.phaseId || !phase.name) {
        return undefined
    }

    return {
        duration: Number(phase.duration) || 0,
        isActive: phase.isActive !== false,
        name: phase.name,
        phaseId: phase.phaseId,
        predecessor: phase.predecessor,
    }
}

function normalizeTimelineTemplate(
    template: Partial<TimelineTemplate>,
): TimelineTemplate | undefined {
    if (!template.id || !template.name || !template.trackId || !template.typeId) {
        return undefined
    }

    const phases = Array.isArray(template.phases)
        ? template.phases
            .map(phase => normalizeTemplatePhase(phase))
            .filter((phase): phase is TimelineTemplatePhase => !!phase)
        : []

    return {
        id: template.id,
        isActive: template.isActive !== false,
        name: template.name,
        phases,
        trackId: template.trackId,
        typeId: template.typeId,
    }
}

function normalizePhaseDefinition(
    phase: Partial<PhaseDefinition>,
): PhaseDefinition | undefined {
    if (!phase.id || !phase.name) {
        return undefined
    }

    return {
        description: phase.description,
        id: phase.id,
        isActive: phase.isActive !== false,
        name: phase.name,
    }
}

export async function fetchTimelineTemplates(): Promise<TimelineTemplate[]> {
    try {
        const response = await xhrGetPaginatedAsync<TimelineTemplate[]>(TIMELINE_TEMPLATES_URL)

        return (response.data || [])
            .map(template => normalizeTimelineTemplate(template))
            .filter((template): template is TimelineTemplate => !!template)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch timeline templates')
    }
}

export async function fetchChallengePhases(): Promise<PhaseDefinition[]> {
    try {
        const response = await xhrGetPaginatedAsync<PhaseDefinition[]>(CHALLENGE_PHASES_URL)

        return (response.data || [])
            .map(phase => normalizePhaseDefinition(phase))
            .filter((phase): phase is PhaseDefinition => !!phase)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch challenge phases')
    }
}
