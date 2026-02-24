import { ROUND_TYPES } from '../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    TimelineTemplate,
} from '../../../../lib/models'

interface ResolveCreateTimelineTemplateIdParams {
    roundType: ChallengeEditorFormData['roundType']
    timelineTemplates: TimelineTemplate[]
    trackId?: string
    typeId?: string
}

const CHECKPOINT_PHASE_NAMES = [
    'checkpoint submission',
    'checkpoint screening',
    'checkpoint review',
]
const CHECKPOINT_PHASE_IDS = [
    'd8a2cdbe-84d1-4687-ab75-78a6a7efdcc8',
    'ce1afb4c-74f9-496b-9e4b-087ae73ab032',
    '84b43897-2aab-44d6-a95a-42c433657eed',
]

function normalizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = value
        .trim()
        .toLowerCase()

    return normalized || undefined
}

function hasCheckpointPhases(template: TimelineTemplate): boolean {
    const phaseNames = new Set(
        (template.phases || [])
            .map(phase => normalizeOptionalString(phase.name))
            .filter((phaseName): phaseName is string => !!phaseName),
    )
    const phaseIds = new Set(
        (template.phases || [])
            .map(phase => normalizeOptionalString(phase.phaseId))
            .filter((phaseId): phaseId is string => !!phaseId),
    )
    const hasCheckpointPhasesByName = CHECKPOINT_PHASE_NAMES
        .every(phaseName => phaseNames.has(phaseName))
    const hasCheckpointPhasesById = CHECKPOINT_PHASE_IDS
        .every(phaseId => phaseIds.has(phaseId))

    return hasCheckpointPhasesByName || hasCheckpointPhasesById
}

/**
 * Resolves the timeline template id to use when creating a challenge.
 *
 * For two-round challenges, this selects an active template for the chosen track/type
 * that includes all checkpoint phases (matched by phase names or canonical phase ids),
 * preferring a default template when present.
 *
 * @param params challenge creation context from the form and timeline metadata.
 * @returns resolved timeline template id, or `undefined` when not required/unavailable.
 */
export function resolveCreateTimelineTemplateId(
    params: ResolveCreateTimelineTemplateIdParams,
): string | undefined {
    if (params.roundType !== ROUND_TYPES.TWO_ROUNDS) {
        return undefined
    }

    if (!params.trackId || !params.typeId) {
        return undefined
    }

    const matchingTwoRoundTemplates = params.timelineTemplates
        .filter(template => template.isActive !== false)
        .filter(template => template.trackId === params.trackId && template.typeId === params.typeId)
        .filter(template => hasCheckpointPhases(template))

    const preferredTemplate = matchingTwoRoundTemplates
        .find(template => template.isDefault)
        || matchingTwoRoundTemplates[0]

    return preferredTemplate?.id
}
