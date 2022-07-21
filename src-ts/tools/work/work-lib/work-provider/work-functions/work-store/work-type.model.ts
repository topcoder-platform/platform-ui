import { ChallengeTag } from './challenge-tag.enum'
import { WorkPrice } from './work-price.model'
import { WorkTimelinePhase } from './work-timeline-phase.model'
import { WorkType } from './work-type.enum'

export interface WorkTypeConfig {
    about: string,
    bgImage: string,
    deliverablesDescription: string,
    description: string,
    duration: number,
    featured: boolean,
    intakeFormRoutes: object,
    priceConfig: WorkPrice
    results: string,
    review: {
        subtitle: string,
        title: string,
        type: string,
    }
    shortDescription: string,
    startRoute: string,
    subtitle: string,
    tags: Array<ChallengeTag>,
    timeline: ReadonlyArray<WorkTimelinePhase>
    timelineTemplateId: string,
    title: string,
    trackId: string,
    type: WorkType,
    typeId: string,
}
