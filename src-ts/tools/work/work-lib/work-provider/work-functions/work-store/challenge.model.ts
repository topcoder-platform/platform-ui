import { ChallengeMetadata } from './challenge-metadata.model'
import { ChallengePhase } from './challenge-phase'
import { ChallengeTag } from './challenge-tag.enum'

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
