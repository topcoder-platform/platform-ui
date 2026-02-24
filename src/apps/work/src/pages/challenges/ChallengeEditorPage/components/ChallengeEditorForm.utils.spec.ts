import { ROUND_TYPES } from '../../../../lib/constants/challenge-editor.constants'
import { TimelineTemplate } from '../../../../lib/models'

import { resolveCreateTimelineTemplateId } from './ChallengeEditorForm.utils'

const CHECKPOINT_SUBMISSION_PHASE_ID = 'd8a2cdbe-84d1-4687-ab75-78a6a7efdcc8'
const CHECKPOINT_SCREENING_PHASE_ID = 'ce1afb4c-74f9-496b-9e4b-087ae73ab032'
const CHECKPOINT_REVIEW_PHASE_ID = '84b43897-2aab-44d6-a95a-42c433657eed'

function buildNamedCheckpointPhases(): TimelineTemplate['phases'] {
    return [
        {
            duration: 100,
            isActive: true,
            name: 'Checkpoint Submission',
            phaseId: 'checkpoint-submission',
        },
        {
            duration: 100,
            isActive: true,
            name: 'Checkpoint Screening',
            phaseId: 'checkpoint-screening',
        },
        {
            duration: 100,
            isActive: true,
            name: 'Checkpoint Review',
            phaseId: 'checkpoint-review',
        },
    ]
}

function buildCheckpointPhasesWithoutNames(): TimelineTemplate['phases'] {
    return [
        {
            duration: 100,
            isActive: true,
            phaseId: CHECKPOINT_SUBMISSION_PHASE_ID,
        },
        {
            duration: 100,
            isActive: true,
            phaseId: CHECKPOINT_SCREENING_PHASE_ID,
        },
        {
            duration: 100,
            isActive: true,
            phaseId: CHECKPOINT_REVIEW_PHASE_ID,
        },
    ]
}

function buildTimelineTemplate(overrides: Partial<TimelineTemplate>): TimelineTemplate {
    return {
        id: 'timeline-template-id',
        isActive: true,
        isDefault: false,
        name: 'Template',
        phases: [],
        trackId: 'track-id',
        typeId: 'type-id',
        ...overrides,
    }
}

describe('resolveCreateTimelineTemplateId', () => {
    it('returns undefined for single-round challenges', () => {
        const result = resolveCreateTimelineTemplateId({
            roundType: ROUND_TYPES.SINGLE_ROUND,
            timelineTemplates: [
                buildTimelineTemplate({
                    id: 'two-round-template',
                    phases: buildNamedCheckpointPhases(),
                }),
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result)
            .toBeUndefined()
    })

    it('returns the default two-round template for matching track and type', () => {
        const result = resolveCreateTimelineTemplateId({
            roundType: ROUND_TYPES.TWO_ROUNDS,
            timelineTemplates: [
                buildTimelineTemplate({
                    id: 'fallback-two-round-template',
                    phases: buildNamedCheckpointPhases(),
                }),
                buildTimelineTemplate({
                    id: 'preferred-two-round-template',
                    isDefault: true,
                    phases: buildNamedCheckpointPhases(),
                }),
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result)
            .toBe('preferred-two-round-template')
    })

    it('prefers the canonical design two-round template id when available', () => {
        const result = resolveCreateTimelineTemplateId({
            roundType: ROUND_TYPES.TWO_ROUNDS,
            timelineTemplates: [
                buildTimelineTemplate({
                    id: 'preferred-two-round-template',
                    isDefault: true,
                    phases: buildNamedCheckpointPhases(),
                }),
                buildTimelineTemplate({
                    id: 'd4201ca4-8437-4d63-9957-3f7708184b07',
                    isDefault: false,
                    phases: buildNamedCheckpointPhases(),
                }),
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result)
            .toBe('d4201ca4-8437-4d63-9957-3f7708184b07')
    })

    it('ignores inactive timeline templates', () => {
        const result = resolveCreateTimelineTemplateId({
            roundType: ROUND_TYPES.TWO_ROUNDS,
            timelineTemplates: [
                buildTimelineTemplate({
                    id: 'inactive-two-round-template',
                    isActive: false,
                    phases: buildNamedCheckpointPhases(),
                }),
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result)
            .toBeUndefined()
    })

    it('matches two-round templates by checkpoint phase ids when phase names are unavailable', () => {
        const result = resolveCreateTimelineTemplateId({
            roundType: ROUND_TYPES.TWO_ROUNDS,
            timelineTemplates: [
                buildTimelineTemplate({
                    id: 'single-round-default-template',
                    isDefault: true,
                    phases: [
                        {
                            duration: 100,
                            isActive: true,
                            phaseId: 'a93544bc-c165-4af4-b55e-18f3593b457a',
                        },
                        {
                            duration: 100,
                            isActive: true,
                            phaseId: '6950164f-3c5e-4bdc-abc8-22aaf5a1bd49',
                        },
                    ],
                }),
                buildTimelineTemplate({
                    id: 'two-round-template-with-unnamed-phases',
                    isDefault: false,
                    phases: buildCheckpointPhasesWithoutNames(),
                }),
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result)
            .toBe('two-round-template-with-unnamed-phases')
    })
})
