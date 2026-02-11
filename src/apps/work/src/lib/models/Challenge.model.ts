import { Attachment } from './Attachment.model'
import { PrizeSet } from './Prize.model'
import { Reviewer } from './Reviewer.model'
import { Skill } from './Skill.model'
import { Submission } from './Submission.model'

export interface ChallengeTypeRef {
    id?: string
    name?: string
    abbreviation?: string
}

export interface ChallengeTrackRef {
    id?: string
    name?: string
    abbreviation?: string
    track?: string
}

export interface ChallengePhase {
    id?: string
    phaseId?: string
    name?: string
    isOpen?: boolean
    status?: string
    duration?: number
    predecessor?: string
    scheduledStartDate?: string | Date
    scheduledEndDate?: string | Date
    actualStartDate?: string
    actualEndDate?: string
}

export interface ChallengeDiscussion {
    id?: string
    type?: string
    url?: string
}

export type ChallengeReviewType = 'COMMUNITY' | 'INTERNAL' | 'SYSTEM' | 'PROVISIONAL' | 'EXAMPLE'

export interface ChallengeLegacy {
    forumId?: number
    reviewType?: ChallengeReviewType
    track?: string
    useSchedulingAPI?: boolean
}

export interface ChallengeTaskInfo {
    isTask?: boolean
}

export interface ChallengeMetadata {
    name: string
    value: unknown
}

export interface Challenge {
    id: string
    assignedMemberId?: string
    attachments?: Attachment[]
    billing?: {
        billingAccountId?: string | number
    }
    challengeFee?: number
    checkpoints?: Submission[]
    name: string
    description?: string
    descriptionFormat?: string
    privateDescription?: string
    status: string
    projectId?: number | string
    trackId?: string
    typeId?: string
    timelineTemplateId?: string
    type?: string | ChallengeTypeRef
    track?: string | ChallengeTrackRef
    startDate?: string | Date
    endDate?: string | Date
    submissionStartDate?: string
    submissionEndDate?: string
    submissionViewable?: string
    registrationStartDate?: string
    registrationEndDate?: string
    numOfRegistrants?: number
    numOfSubmissions?: number
    numOfCheckpointSubmissions?: number
    phases?: ChallengePhase[]
    discussions?: ChallengeDiscussion[]
    legacyId?: number
    legacy?: ChallengeLegacy
    task?: ChallengeTaskInfo
    submitTriggered?: boolean
    prizeSets?: PrizeSet[]
    tags?: string[]
    skills?: Skill[]
    created?: string
    updated?: string
    createdBy?: string
    copilot?: string
    discussionForum?: boolean
    groups?: string[]
    roundType?: string
    terms?: string[]
    updatedBy?: string
    reviewers?: Reviewer[]
    metadata?: ChallengeMetadata[]
    [key: string]: unknown
}

export type ChallengeReviewer = Reviewer
