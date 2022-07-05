import { WorkPrice } from './work-price.model'
import { WorkTimeline } from './work-timeline.model'
import { WorkType } from './work-type.enum'

export interface WorkTypeConfig extends WorkPrice {
    about: string,
    bgImage: string,
    description: string,
    duration: number,
    featured: boolean,
    intakeFormRoutes: ReadonlyArray<string>
    results: string,
    shortDescription: string,
    startRoute: string,
    subtitle: string,
    timeline: ReadonlyArray<WorkTimeline>
    timelineTemplateId: string,
    title: string,
    trackId: string,
    type: WorkType,
    typeId: string,
}
