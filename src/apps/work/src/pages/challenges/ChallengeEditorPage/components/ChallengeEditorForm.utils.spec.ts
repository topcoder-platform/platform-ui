import { ROUND_TYPES } from '../../../../lib/constants/challenge-editor.constants'
import { TimelineTemplate } from '../../../../lib/models'

import { resolveCreateTimelineTemplateId } from './ChallengeEditorForm.utils'

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
                    phases: [
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
                    ],
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
                    phases: [
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
                    ],
                }),
                buildTimelineTemplate({
                    id: 'preferred-two-round-template',
                    isDefault: true,
                    phases: [
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
                    ],
                }),
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result)
            .toBe('preferred-two-round-template')
    })

    it('ignores inactive timeline templates', () => {
        const result = resolveCreateTimelineTemplateId({
            roundType: ROUND_TYPES.TWO_ROUNDS,
            timelineTemplates: [
                buildTimelineTemplate({
                    id: 'inactive-two-round-template',
                    isActive: false,
                    phases: [
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
                    ],
                }),
            ],
            trackId: 'track-id',
            typeId: 'type-id',
        })

        expect(result)
            .toBeUndefined()
    })
})
