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

/**
 * Resolves the timeline template id to use when creating a challenge.
 *
 * For two-round challenges, this selects an active template for the chosen track/type
 * that includes all checkpoint phases, preferring a default template when present.
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
        .filter(template => {
            const phaseNames = new Set(
                (template.phases || [])
                    .map(phase => (phase.name || '')
                        .trim()
                        .toLowerCase()),
            )

            return CHECKPOINT_PHASE_NAMES
                .every(phaseName => phaseNames.has(phaseName))
        })

    const preferredTemplate = matchingTwoRoundTemplates
        .find(template => template.isDefault)
        || matchingTwoRoundTemplates[0]

    return preferredTemplate?.id
}
