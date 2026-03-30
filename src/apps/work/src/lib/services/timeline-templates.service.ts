import {
    xhrGetPaginatedAsync,
} from '~/libs/core'
import { EnvironmentConfig } from '~/config'

import {
    PhaseDefinition,
    TimelineTemplate,
    TimelineTemplatePhase,
} from '../models'

const TIMELINE_TEMPLATES_URL = `${EnvironmentConfig.API.V6}/timeline-templates`
const CHALLENGE_PHASES_URL = `${EnvironmentConfig.API.V6}/challenge-phases?page=1&perPage=100`
const TIMELINE_TEMPLATES_PER_PAGE = 100

interface RawTimelineTemplatePhase extends Partial<TimelineTemplatePhase> {
    defaultDuration?: number
}

interface NormalizedTimelineTemplate {
    id: string
    name: string
    isActive: boolean
    phases: TimelineTemplatePhase[]
    trackId?: string
    typeId?: string
    isDefault?: boolean
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

function normalizeTemplatePhase(
    phase: RawTimelineTemplatePhase,
): TimelineTemplatePhase | undefined {
    if (!phase.phaseId) {
        return undefined
    }

    return {
        duration: Number(phase.duration ?? phase.defaultDuration) || 0,
        isActive: phase.isActive !== false,
        name: phase.name,
        phaseId: phase.phaseId,
        predecessor: phase.predecessor,
    }
}

function normalizeTimelineTemplate(
    template: Partial<TimelineTemplate>,
): NormalizedTimelineTemplate | undefined {
    if (!template.id || !template.name) {
        return undefined
    }

    const phases = Array.isArray(template.phases)
        ? template.phases
            .map(phase => normalizeTemplatePhase(phase as RawTimelineTemplatePhase))
            .filter((phase): phase is TimelineTemplatePhase => !!phase)
        : []

    return {
        id: template.id,
        isActive: template.isActive !== false,
        isDefault: template.isDefault === true,
        name: template.name,
        phases,
        trackId: template.trackId,
        typeId: template.typeId,
    }
}

async function fetchAllTimelineTemplates(): Promise<NormalizedTimelineTemplate[]> {
    const firstPageResponse = await xhrGetPaginatedAsync<Partial<TimelineTemplate>[]>(
        `${TIMELINE_TEMPLATES_URL}?page=1&perPage=${TIMELINE_TEMPLATES_PER_PAGE}`,
    )
    const totalPages = Math.max(firstPageResponse.totalPages || 1, 1)

    const firstPageTemplates = (firstPageResponse.data || [])
        .map(template => normalizeTimelineTemplate(template))
        .filter((template): template is NormalizedTimelineTemplate => !!template)

    if (totalPages === 1) {
        return firstPageTemplates
    }

    const remainingPageRequests = Array.from({
        length: totalPages - 1,
    })
        .map((_, index) => xhrGetPaginatedAsync<Partial<TimelineTemplate>[]>(
            `${TIMELINE_TEMPLATES_URL}?page=${index + 2}&perPage=${TIMELINE_TEMPLATES_PER_PAGE}`,
        ))

    const remainingPageResponses = await Promise.all(remainingPageRequests)
    const remainingTemplates = remainingPageResponses
        .flatMap(response => response.data || [])
        .map(template => normalizeTimelineTemplate(template))
        .filter((template): template is NormalizedTimelineTemplate => !!template)

    return [
        ...firstPageTemplates,
        ...remainingTemplates,
    ]
}

function mapTemplatesFromTimelineTemplatesResponse(
    timelineTemplates: NormalizedTimelineTemplate[],
): TimelineTemplate[] {
    return dedupeTimelineTemplates(timelineTemplates
        .filter(template => !!template.trackId && !!template.typeId)
        .map(template => ({
            id: template.id,
            isActive: template.isActive,
            isDefault: template.isDefault,
            name: template.name,
            phases: template.phases,
            trackId: template.trackId as string,
            typeId: template.typeId as string,
        })))
}

function dedupeTimelineTemplates(
    timelineTemplates: TimelineTemplate[],
): TimelineTemplate[] {
    const dedupedTemplatesByKey = new Map<string, TimelineTemplate>()

    timelineTemplates.forEach(template => {
        const key = `${template.trackId}:${template.typeId}:${template.id}`
        const existingTemplate = dedupedTemplatesByKey.get(key)

        if (!existingTemplate) {
            dedupedTemplatesByKey.set(key, template)
            return
        }

        dedupedTemplatesByKey.set(key, {
            ...existingTemplate,
            isDefault: existingTemplate.isDefault || template.isDefault,
        })
    })

    return Array.from(dedupedTemplatesByKey.values())
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
        const timelineTemplates = await fetchAllTimelineTemplates()
        return mapTemplatesFromTimelineTemplatesResponse(timelineTemplates)
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
