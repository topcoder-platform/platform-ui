import {
    aiReviewConfigHasChanges,
    getAiReviewerPhaseId,
    normalizeTrackForAiTemplates,
    syncAiConfigReviewers,
    validateAiReviewConfiguration,
} from './reviewers-field.utils'

describe('reviewers-field utils track normalization', () => {
    it('normalizes develop aliases to development', () => {
        expect(normalizeTrackForAiTemplates('develop'))
            .toBe('DEVELOPMENT')
        expect(normalizeTrackForAiTemplates('DEV'))
            .toBe('DEVELOPMENT')
    })
})

describe('reviewers-field utils ai review config validation', () => {
    it('reports missing ids and invalid weight totals', () => {
        expect(validateAiReviewConfiguration({
            autoFinalize: false,
            challengeId: '',
            minPassingThreshold: 75,
            mode: 'AI_GATING',
            workflows: [
                {
                    isGating: true,
                    weightPercent: 60,
                    workflowId: 'workflow-1',
                },
            ],
        }))
            .toEqual([
                'Challenge ID is required.',
                'Workflow weights must total 100%. Current total: 60.00%.',
            ])
    })

    it('accepts a valid configuration', () => {
        expect(validateAiReviewConfiguration({
            autoFinalize: false,
            challengeId: 'challenge-id',
            minPassingThreshold: 75,
            mode: 'AI_GATING',
            workflows: [
                {
                    isGating: true,
                    weightPercent: 50,
                    workflowId: 'workflow-1',
                },
                {
                    isGating: false,
                    weightPercent: 50,
                    workflowId: 'workflow-2',
                },
            ],
        }))
            .toEqual([])
    })
})

describe('reviewers-field utils ai review config comparisons', () => {
    const baseConfiguration = {
        autoFinalize: false,
        challengeId: 'challenge-id',
        minPassingThreshold: 75,
        mode: 'AI_GATING' as const,
        templateId: 'template-id',
        workflows: [
            {
                isGating: true,
                weightPercent: 50,
                workflowId: 'workflow-1',
            },
            {
                isGating: false,
                weightPercent: 50,
                workflowId: 'workflow-2',
            },
        ],
    }

    it('treats equivalent workflow sets as unchanged', () => {
        expect(aiReviewConfigHasChanges(baseConfiguration, {
            ...baseConfiguration,
            workflows: [...baseConfiguration.workflows].reverse(),
        }))
            .toBe(false)
    })

    it('detects workflow changes', () => {
        expect(aiReviewConfigHasChanges(baseConfiguration, {
            ...baseConfiguration,
            workflows: [
                {
                    isGating: true,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        }))
            .toBe(true)
    })
})

describe('reviewers-field utils ai reviewer syncing', () => {
    it('preserves human reviewers and replaces ai reviewers from config workflows', () => {
        expect(syncAiConfigReviewers({
            availableWorkflows: [
                {
                    id: 'workflow-1',
                    name: 'Workflow 1',
                    scorecardId: 'scorecard-1',
                },
                {
                    id: 'workflow-2',
                    name: 'Workflow 2',
                    scorecardId: 'scorecard-2',
                },
            ],
            phases: [
                {
                    name: 'Review',
                    phaseId: 'review-phase-id',
                },
            ],
            reviewers: [
                {
                    isMemberReview: true,
                    memberId: 'member-1',
                    phaseId: 'review-phase-id',
                    scorecardId: 'human-scorecard',
                },
                {
                    aiWorkflowId: 'legacy-workflow',
                    isMemberReview: false,
                    phaseId: 'old-phase-id',
                    scorecardId: 'legacy-scorecard',
                },
            ],
            workflows: [
                {
                    isGating: true,
                    weightPercent: 50,
                    workflowId: 'workflow-1',
                },
                {
                    isGating: false,
                    weightPercent: 50,
                    workflowId: 'workflow-2',
                },
            ],
        }))
            .toEqual([
                {
                    isMemberReview: true,
                    memberId: 'member-1',
                    phaseId: 'review-phase-id',
                    scorecardId: 'human-scorecard',
                },
                {
                    additionalMemberIds: undefined,
                    aiWorkflowId: 'workflow-1',
                    handle: undefined,
                    isMemberReview: false,
                    memberId: undefined,
                    memberReviewerCount: undefined,
                    phaseId: 'old-phase-id',
                    resourceId: undefined,
                    roleId: undefined,
                    scorecardId: 'scorecard-1',
                    shouldOpenOpportunity: false,
                },
                {
                    additionalMemberIds: undefined,
                    aiWorkflowId: 'workflow-2',
                    handle: undefined,
                    isMemberReview: false,
                    memberId: undefined,
                    memberReviewerCount: undefined,
                    phaseId: 'old-phase-id',
                    resourceId: undefined,
                    roleId: undefined,
                    scorecardId: 'scorecard-2',
                    shouldOpenOpportunity: false,
                },
            ])
    })

    it('falls back to the first review phase for new ai reviewers', () => {
        expect(getAiReviewerPhaseId([
            {
                name: 'Submission',
                phaseId: 'submission-phase-id',
            },
            {
                name: 'Screening',
                phaseId: 'screening-phase-id',
            },
        ]))
            .toBe('screening-phase-id')
    })
})
