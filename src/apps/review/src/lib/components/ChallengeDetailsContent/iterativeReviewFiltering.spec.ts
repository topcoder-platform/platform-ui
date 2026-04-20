import {
    BackendPhase,
    BackendResource,
    SubmissionInfo,
} from '../../models'

import {
    filterIterativeReviewRows,
    limitFirst2FinishIterativeRows,
} from './iterativeReviewFiltering'

const createPhase = (
    id: string,
    name: string,
    phaseId = id,
): BackendPhase => ({
    constraints: [],
    description: '',
    duration: 0,
    id,
    isOpen: false,
    name,
    phaseId,
    scheduledEndDate: '2026-03-30T00:00:00Z',
    scheduledStartDate: '2026-03-30T00:00:00Z',
})

const createResource = (
    id: string,
    roleName: string,
): BackendResource => ({
    challengeId: 'challenge-1',
    created: '2026-03-30T00:00:00Z',
    createdBy: 'system',
    id,
    memberHandle: `${id}-handle`,
    memberId: `${id}-member`,
    roleId: `${roleName}-role`,
    roleName,
})

const createSubmission = (
    resourceId: string,
    phaseId?: string,
): SubmissionInfo => ({
    id: `submission-${resourceId}`,
    memberId: 'submitter-1',
    review: {
        committed: false,
        createdAt: '',
        finalScore: 0,
        id: '',
        initialScore: 0,
        metadata: {},
        phaseId: phaseId ?? '',
        phaseName: '',
        resourceId,
        reviewDate: '',
        reviewItems: [],
        scorecardId: '',
        status: '',
        submissionId: `submission-${resourceId}`,
        submitterHandle: '',
        submitterMaxRating: undefined,
        updatedAt: '',
    },
})

describe('filterIterativeReviewRows', () => {
    const challengePhases: BackendPhase[] = [
        createPhase('submission-1', 'Submission'),
        createPhase('iterative-1', 'Iterative Review', 'iterative-phase-1'),
        createPhase('review-1', 'Review', 'review-phase-1'),
    ]

    it('keeps a phase-less iterative placeholder when a single iterative phase is selected', () => {
        const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [iterativeReviewer],
            sourceRows: [createSubmission(iterativeReviewer.id)],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe(`submission-${iterativeReviewer.id}`)
    })

    it('does not show a phase-less standard reviewer placeholder on the iterative tab', () => {
        const standardReviewer = createResource('review-resource-1', 'Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [standardReviewer],
            sourceRows: [createSubmission(standardReviewer.id)],
        })

        expect(results)
            .toEqual([])
    })

    it('still keeps explicit phase-id matches when the review exists', () => {
        const standardReviewer = createResource('review-resource-1', 'Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [standardReviewer],
            sourceRows: [createSubmission(standardReviewer.id, 'iterative-phase-1')],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].review?.phaseId)
            .toBe('iterative-phase-1')
    })

    it('maps phase-less AI-failed submissions to iterative tabs by submission order', () => {
        const multiIterativePhases: BackendPhase[] = [
            createPhase('submission-1', 'Submission'),
            createPhase('iterative-1', 'Iterative Review', 'iterative-phase-1'),
            createPhase('iterative-2', 'Iterative Review', 'iterative-phase-2'),
            createPhase('review-1', 'Review', 'review-phase-1'),
        ]

        const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
        const firstAiFailedSubmission: SubmissionInfo = {
            ...createSubmission(iterativeReviewer.id),
            id: 'submission-1',
            status: 'AI_FAILED_REVIEW',
            submittedDate: '2026-04-01T04:56:13.405Z',
        }

        const secondAiFailedSubmission: SubmissionInfo = {
            ...createSubmission(iterativeReviewer.id),
            id: 'submission-2',
            status: 'AI_FAILED_REVIEW',
            submittedDate: '2026-04-01T04:57:13.405Z',
        }

        const phase1Results = filterIterativeReviewRows({
            challengePhases: multiIterativePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [iterativeReviewer],
            sourceRows: [secondAiFailedSubmission, firstAiFailedSubmission],
        })

        const phase2Results = filterIterativeReviewRows({
            challengePhases: multiIterativePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-2',
            reviewerResources: [iterativeReviewer],
            sourceRows: [secondAiFailedSubmission, firstAiFailedSubmission],
        })

        expect(phase1Results)
            .toHaveLength(1)
        expect(phase1Results[0].id)
            .toBe('submission-1')

        expect(phase2Results)
            .toHaveLength(1)
        expect(phase2Results[0].id)
            .toBe('submission-2')
    })

    it(
        'skips iterative phases that already have assigned reviews when mapping phase-less AI-failed submissions',
        () => {
            const multiIterativePhases: BackendPhase[] = [
                createPhase('submission-1', 'Submission'),
                createPhase('iterative-1', 'Iterative Review', 'iterative-phase-1'),
                createPhase('iterative-2', 'Iterative Review', 'iterative-phase-2'),
                createPhase('review-1', 'Review', 'review-phase-1'),
            ]

            const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
            const assignedSubmission: SubmissionInfo = {
                ...createSubmission('assigned-reviewer', 'iterative-phase-1'),
                id: 'assigned-submission',
            }

            const aiFailedSubmission: SubmissionInfo = {
                ...createSubmission(iterativeReviewer.id),
                id: 'ai-failed-submission',
                status: 'AI_FAILED_REVIEW',
                submittedDate: '2026-04-01T04:56:13.405Z',
            }

            const phase1Results = filterIterativeReviewRows({
                challengePhases: multiIterativePhases,
                isPostMortemPhase: false,
                phaseIdFilter: 'iterative-1',
                reviewerResources: [iterativeReviewer],
                sourceRows: [assignedSubmission, aiFailedSubmission],
            })

            const phase2Results = filterIterativeReviewRows({
                challengePhases: multiIterativePhases,
                isPostMortemPhase: false,
                phaseIdFilter: 'iterative-2',
                reviewerResources: [iterativeReviewer],
                sourceRows: [assignedSubmission, aiFailedSubmission],
            })

            expect(phase1Results)
                .toHaveLength(1)
            expect(phase1Results[0].id)
                .toBe('assigned-submission')

            expect(phase2Results)
                .toHaveLength(1)
            expect(phase2Results[0].id)
                .toBe('ai-failed-submission')
        },
    )

    it('keeps a phase-less AI-failed submission when only one iterative phase exists', () => {
        const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
        const aiFailedSubmission: SubmissionInfo = {
            ...createSubmission(iterativeReviewer.id),
            status: 'AI_FAILED_REVIEW',
        }

        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            phaseIdFilter: 'iterative-1',
            reviewerResources: [iterativeReviewer],
            sourceRows: [aiFailedSubmission],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe(`submission-${iterativeReviewer.id}`)
    })

    it('limits completed F2F rows to the supplied winning submission ids', () => {
        const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
        const losingReviewer = createResource('iterative-resource-2', 'Iterative Reviewer')
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            limitToSubmissionIds: [`submission-${iterativeReviewer.id}`],
            reviewerResources: [iterativeReviewer, losingReviewer],
            sourceRows: [
                {
                    ...createSubmission(iterativeReviewer.id),
                    memberId: 'winner-member',
                },
                {
                    ...createSubmission(losingReviewer.id),
                    memberId: 'losing-member',
                },
            ],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe(`submission-${iterativeReviewer.id}`)
    })

    it('falls back to the earliest row when F2F limiter ids do not match rendered row ids', () => {
        const iterativeReviewer = createResource('iterative-resource-1', 'Iterative Reviewer')
        const losingReviewer = createResource('iterative-resource-2', 'Iterative Reviewer')
        const laterRow = createSubmission(iterativeReviewer.id)
        const earlierRow = createSubmission(losingReviewer.id)
        const results = filterIterativeReviewRows({
            challengePhases,
            isPostMortemPhase: false,
            limitToSubmissionIds: ['actual-submission-id'],
            reviewerResources: [iterativeReviewer, losingReviewer],
            sourceRows: [
                {
                    ...laterRow,
                    id: 'synthetic-row-2',
                    review: {
                        ...laterRow.review!,
                        createdAt: '2026-04-01T04:57:38.244Z',
                        submissionId: 'later-submission-id',
                        updatedAt: '',
                    },
                    submittedDate: '2026-04-01T04:57:36.849Z',
                },
                {
                    ...earlierRow,
                    id: 'synthetic-row-1',
                    review: {
                        ...earlierRow.review!,
                        createdAt: '2026-04-01T04:56:15.294Z',
                        submissionId: 'earlier-submission-id',
                        updatedAt: '',
                    },
                    submittedDate: '2026-04-01T04:56:13.405Z',
                },
            ],
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe('synthetic-row-1')
    })
})

describe('limitFirst2FinishIterativeRows', () => {
    it('keeps the earliest row when no preferred submission ids are available', () => {
        const laterRow = createSubmission('iterative-resource-1')
        const earlierRow = createSubmission('iterative-resource-2')

        const results = limitFirst2FinishIterativeRows([
            {
                ...laterRow,
                id: 'submission-later',
                review: {
                    ...laterRow.review!,
                    createdAt: '2026-04-01T04:57:38.244Z',
                    submissionId: 'submission-later',
                    updatedAt: '',
                },
                submittedDate: '2026-04-01T04:57:36.849Z',
            },
            {
                ...earlierRow,
                id: 'submission-earlier',
                review: {
                    ...earlierRow.review!,
                    createdAt: '2026-04-01T04:56:15.294Z',
                    submissionId: 'submission-earlier',
                    updatedAt: '',
                },
                submittedDate: '2026-04-01T04:56:13.405Z',
            },
        ], undefined, {
            forceSingleRow: true,
        })

        expect(results)
            .toHaveLength(1)
        expect(results[0].id)
            .toBe('submission-earlier')
    })
})
