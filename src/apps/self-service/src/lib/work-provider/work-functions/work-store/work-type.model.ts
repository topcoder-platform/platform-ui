import { ChallengeTag } from './challenge-tag.enum'
import { PricePackageName, WorkPrice } from './work-price.model'
import { WorkTimelinePhase } from './work-timeline-phase.model'
import { WorkType } from './work-type.enum'

export interface WorkTypeConfig {
    about: string,
    bgImage: string,
    deliverablesDescription: string,
    description: string,
    duration?: {
        [key in PricePackageName]?: number
    },
    featured: boolean,
    intakeFormRoutes: object,
    priceConfig: WorkPrice
    results: string,
    review: {
        aboutYourProjectTitle: string,
        subtitle: string,
        title: string,
        type: string,
    }
    shortDescription: string,
    startRoute: string,
    submissionPhaseDuration?: {
        [key in PricePackageName]?: number
    },
    subtitle: string,
    tags: Array<ChallengeTag>,
    timeline: Array<WorkTimelinePhase>
    timelineTemplateId: string,
    title: string,
    trackId: string,
    type: WorkType,
    typeId: string,
}
