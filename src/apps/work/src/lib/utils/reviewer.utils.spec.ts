import {
    isReviewerAssignmentOptional,
} from './reviewer.utils'

describe('isReviewerAssignmentOptional', () => {
    const phases = [
        {
            id: 'screening-instance-id',
            name: 'Screening',
            phaseId: 'screening-phase-id',
        },
        {
            id: 'review-instance-id',
            name: 'Review',
            phaseId: 'review-phase-id',
        },
        {
            id: 'approval-instance-id',
            name: 'Approval',
            phaseId: 'approval-phase-id',
        },
        {
            id: 'checkpoint-review-instance-id',
            name: 'Checkpoint Review',
            phaseId: 'checkpoint-review-phase-id',
        },
    ]

    it('defers screening assignments for every track', () => {
        expect(isReviewerAssignmentOptional({ phaseId: 'screening-phase-id' }, phases))
            .toBe(true)
    })

    it('requires review assignments outside Design challenges', () => {
        expect(isReviewerAssignmentOptional({ phaseId: 'review-phase-id' }, phases))
            .toBe(false)
        expect(isReviewerAssignmentOptional({ phaseId: 'approval-instance-id' }, phases))
            .toBe(false)
    })

    it('defers copilot assigned review phases for Design challenges', () => {
        expect(isReviewerAssignmentOptional({ phaseId: 'review-phase-id' }, phases, true))
            .toBe(true)
        expect(isReviewerAssignmentOptional({ phaseId: 'approval-instance-id' }, phases, true))
            .toBe(true)
        expect(isReviewerAssignmentOptional({ phaseId: 'checkpoint-review-phase-id' }, phases, true))
            .toBe(true)
    })

    it('keeps AI reviewer rows and unknown phases required', () => {
        expect(isReviewerAssignmentOptional({
            isMemberReview: false,
            phaseId: 'review-phase-id',
        }, phases, true))
            .toBe(false)
        expect(isReviewerAssignmentOptional({ phaseId: 'unknown-phase-id' }, phases, true))
            .toBe(false)
    })
})
