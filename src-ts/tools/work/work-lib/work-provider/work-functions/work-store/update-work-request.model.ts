import { Challenge } from './challenge.model'
import { WorkTimelinePhase } from './work-timeline-phase.model'

export type UpdateWorkRequest = Pick<
    Challenge,
    'description' |
    'id' |
    'metadata' |
    'name' |
    'prizeSets'
> & {
    phases: ReadonlyArray<WorkTimelinePhase>
}
