import {
    Challenge,
    ChallengeMetadata,
    ChallengePhase,
    ChallengeReviewType,
} from './Challenge.model'
import { Attachment } from './Attachment.model'
import { PrizeSet } from './Prize.model'
import { Reviewer } from './Reviewer.model'
import { Skill } from './Skill.model'

export interface TagOption {
    label: string
    value: string
}

export type ChallengeSkill = Skill

export interface ChallengeMilestoneConfiguration {
    enabled?: boolean
    milestoneCount?: number
    milestoneDurationDays?: number
}

export type RoundType = 'Single round' | 'Two rounds'
export type ReviewType = ChallengeReviewType

export interface ChallengeEditorFormData extends Omit<Partial<Challenge>, 'id' | 'skills' | 'tags'> {
    assignedMemberId?: string
    attachments?: Attachment[]
    billing?: {
        billingAccountId?: number | string
    }
    challengeFee?: number
    copilot?: string
    description: string
    discussionForum?: boolean
    groups?: string[]
    id?: string
    metadata?: ChallengeMetadata[]
    name: string
    prizeSets?: PrizeSet[]
    privateDescription?: string
    reviewers?: Reviewer[]
    roundType?: RoundType
    skills: ChallengeSkill[]
    tags: string[]
    terms?: string[]
    legacy?: {
        reviewType?: ReviewType
        useSchedulingAPI?: boolean
    }
    milestoneConfiguration?: ChallengeMilestoneConfiguration
    timelineTemplateId?: string
    trackId: string
    typeId: string
    startDate?: Date | string
    phases?: ChallengePhase[]
}
