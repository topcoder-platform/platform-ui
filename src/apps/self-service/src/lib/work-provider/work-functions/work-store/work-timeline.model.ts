import { WorkTimelinePhase } from './work-timeline-phase.model'

export interface WorkTimeline {
    [workType: string]: Array<WorkTimelinePhase>
}
