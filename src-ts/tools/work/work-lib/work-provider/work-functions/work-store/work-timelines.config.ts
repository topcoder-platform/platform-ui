import { WorkTimeline } from './work-timeline.model'
import { WorkType } from './work-type.enum'

export const WorkTimelines: WorkTimeline = {
    // TODO: Determine actual timeline for Bug Hunt
    [WorkType.bugHunt]: [
        {
            // Registration
            duration: 43200, // 0.5 day
            phaseId: 'a93544bc-c165-4af4-b55e-18f3593b457a',
        },
        {
            // Submission
            duration: 86400, // 1 day, will vary by package
            phaseId: '6950164f-3c5e-4bdc-abc8-22aaf5a1bd49',
        },
        {
            // Review
            duration: 172800, // 2 days
            phaseId: 'aa5a3f78-79e0-4bf7-93ff-b11e8f5b398b',
        },
        {
            // Appeals
            duration: 43200, // 0.5 day
            phaseId: '1c24cfb3-5b0a-4dbd-b6bd-4b0dff5349c6',
        },
        {
            // Appeals response
            duration: 43200, // 0.5 day
            phaseId: '797a6af7-cd3f-4436-9fca-9679f773bee9',
        },
    ],
}
