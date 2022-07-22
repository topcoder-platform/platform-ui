import { ChallengeMetadata } from './challenge-metadata.model'
import { ChallengePhase } from './challenge-phase'
import { ChallengeTag } from './challenge-tag.enum'
import { WorkPrize } from './work-prize.model'
import { WorkTimelinePhase } from './work-timeline-phase.model'

export interface Challenge {
    created: string
    description: string
    discussions?: Array<{ [key: string]: string }>
    id: string
    legacy?: { [key: string]: any }
    metadata: Array<ChallengeMetadata>
    name: string
    numOfRegistrants?: number
    numOfSubmissions?: number
    phases: Array<ChallengePhase>
    prizeSets?: Array<WorkPrize>
    projectId?: number
    status: string
    tags: Array<ChallengeTag>
    timelineTemplateId?: string
    trackId?: string
    typeId?: string
    updated?: string
}

export type ChallengeCreateBody = Pick<
    Challenge,
    'description' |
    'discussions' |
    'legacy' |
    'metadata' |
    'name' |
    'tags' |
    'timelineTemplateId' |
    'trackId' |
    'typeId'
>

export type ChallengeUpdateBody = Pick<
    Challenge,
    'description' |
    'id' |
    'metadata' |
    'name' |
    'prizeSets'
> & {
    phases: ReadonlyArray<WorkTimelinePhase>
}
