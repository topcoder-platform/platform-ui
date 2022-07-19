import { ChallengeTag } from './challenge-tag.enum'
import { WorkPrice } from './work-price.model'
import { WorkTimeline } from './work-timeline.model'
import { WorkType } from './work-type.enum'

export interface WorkTypeConfig extends WorkPrice {
    about: string,
    bgImage: string,
    deliverablesDescription: string,
    description: string,
    duration: number,
    featured: boolean,
    intakeFormRoutes: ReadonlyArray<string>
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
    timeline: ReadonlyArray<WorkTimeline>,
    timelineTemplateId: string,
    title: string,
    trackId: string,
    type: WorkType,
    typeId: string,
}
