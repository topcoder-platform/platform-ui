import { ChallengeMetadata } from './challenge-metadata.model'
import { ChallengePhase } from './challenge-phase'
import { WorkTimeline } from './work-timeline.model'

export interface Challenge {
    created: string
    description: string
    id: string
    metadata: Array<ChallengeMetadata>
    name: string
    numOfRegistrants?: number
    numOfSubmissions?: number
    phases: Array<ChallengePhase>
    status: string
    tags: Array<string>
    updated?: string
}

export interface ChallengeCreateBody {
    description: string,
    discussions: Array<{ [key: string]: string }>,
    legacy: { [key: string]: any },
    name: string,
    tags: Array<string>
    timelineTemplateId: string,
    trackId: string,
    typeId: string,
}

interface PrizeSetsType {
    type: 'USD',
    value: number,
}

export interface ChallengeUpdateBody {
    description: string,
    id: string, // Maria do we include id here?
    metadata: Array<ChallengeMetadata>
    name: string,
    phases: ReadonlyArray<WorkTimeline>
    prizeSets: Array<PrizeSetsType>
}
