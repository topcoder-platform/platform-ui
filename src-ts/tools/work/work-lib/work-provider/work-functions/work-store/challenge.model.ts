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
    legacy?: { [key: string]: any },
    metadata: Array<ChallengeMetadata>
    name: string
    numOfRegistrants?: number
    numOfSubmissions?: number
    phases: Array<ChallengePhase>
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

export interface ChallengeUpdateBody {
    description: string,
    id?: string, // Maria do we include id here?
    metadata: Array<ChallengeMetadata>
    name: string,
    phases: ReadonlyArray<WorkTimelinePhase>
    prizeSets: Array<WorkPrize>
}
