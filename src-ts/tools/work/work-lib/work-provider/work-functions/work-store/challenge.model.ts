import { ChallengeMetadata } from './challenge-metadata.model'
import { ChallengePhase } from './challenge-phase'
import { ChallengeTag } from './challenge-tag.enum'

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
    tags: Array<ChallengeTag>
    updated?: string
}

export interface ChallengeCreateBody {
    description: string,
    discussions: Array<{ [key: string]: string }>,
    legacy: { [key: string]: any },
    name: string,
    tags: Array<ChallengeTag>
    timelineTemplateId: string,
    trackId: string,
    typeId: string,
}
