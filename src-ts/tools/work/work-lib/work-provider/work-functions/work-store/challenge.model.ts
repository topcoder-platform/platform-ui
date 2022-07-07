import { ChallengeMetadata } from './challenge-metadata.model'
import { ChallengePhase } from './challenge-phase'

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

export interface ChallengeCreate {
    description: string,
    discussions: Array<{ [key: string]: string }>,
    legacy: { [key: string]: any },
    name: string,
    tags: Array<string>
    timelineTemplateId: string,
    trackId: string,
    typeId: string,
}
