import { WorkConfigConstants } from '../../../work-constants'

import { WorkTimeline } from './work-timeline.model'
import { WorkType } from './work-type.enum'

export const WorkTimelines: WorkTimeline = {
    // TODO: Determine actual timeline for Bug Hunt
    [WorkType.bugHunt]: [
        {
            // Registration
            duration: 43200, // 0.5 day
            phaseId: WorkConfigConstants.PHASE_ID_REGISTRATION,
        },
        {
            // Submission
            duration: 86400, // 1 day, will vary by package
            phaseId: WorkConfigConstants.PHASE_ID_SUBMISSION,
        },
        {
            // Review
            duration: 172800, // 2 days
            phaseId: WorkConfigConstants.PHASE_ID_REVIEW,
        },
        {
            // Appeals
            duration: 43200, // 0.5 day
            phaseId: WorkConfigConstants.PHASE_ID_APPEALS,
        },
        {
            // Appeals response
            duration: 43200, // 0.5 day
            phaseId: WorkConfigConstants.PHASE_ID_APPEALS_RESPONSE,
        },
    ],
}
