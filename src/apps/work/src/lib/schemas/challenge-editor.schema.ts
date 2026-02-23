import * as yup from 'yup'

import {
    MAX_CHALLENGE_NAME_LENGTH,
    MAX_PRIZE_VALUE,
    MIN_DESCRIPTION_LENGTH,
    PHASE_DURATION_MIN_MINUTES,
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
    REVIEW_TYPES,
    ROUND_TYPES,
} from '../constants/challenge-editor.constants'
import { ChallengeEditorFormData } from '../models'
import { isSkillsRequired } from '../utils/challenge-editor.utils'

function isSchedulingApiEnabled(value: unknown): boolean {
    return value !== false
}

function emptyStringToUndefined(value: unknown, originalValue: unknown): unknown {
    if (originalValue === '') {
        return undefined
    }

    return value
}

const skillSchema = yup.object({
    id: yup.string()
        .required('Skill id is required'),
    name: yup.string()
        .required('Skill name is required'),
})

const prizeSchema = yup.object({
    description: yup.string()
        .optional(),
    type: yup.mixed<'POINT' | 'USD'>()
        .oneOf([
            PRIZE_TYPES.USD,
            PRIZE_TYPES.POINT,
        ])
        .required('Prize type is required'),
    value: yup.number()
        .typeError('Prize value must be a number')
        .integer('Prize value must be an integer')
        .min(1, 'Prize value must be at least 1')
        .max(MAX_PRIZE_VALUE, `Prize value cannot exceed ${MAX_PRIZE_VALUE}`)
        .required('Prize value is required'),
})

const prizeSetSchema = yup.object({
    description: yup.string()
        .optional(),
    prizes: yup.array()
        .of(prizeSchema)
        .default([])
        .test(
            'descending-prizes',
            'Placement prizes must be in descending order',
            function validateDescendingPrizes(prizes: unknown): boolean {
                const prizeSetType = this.parent?.type

                if (prizeSetType !== PRIZE_SET_TYPES.PLACEMENT) {
                    return true
                }

                if (!Array.isArray(prizes) || prizes.length < 2) {
                    return true
                }

                for (let index = 1; index < prizes.length; index += 1) {
                    const previousValue = Number((prizes[index - 1] as { value?: number })?.value || 0)
                    const currentValue = Number((prizes[index] as { value?: number })?.value || 0)

                    if (
                        previousValue > 0
                        && currentValue > 0
                        && currentValue >= previousValue
                    ) {
                        return false
                    }
                }

                return true
            },
        ),
    type: yup.string()
        .oneOf(Object.values(PRIZE_SET_TYPES))
        .required('Prize set type is required'),
})

const challengePhaseSchema = yup.object({
    duration: yup.number()
        .typeError('Phase duration must be a number')
        .integer('Phase duration must be an integer')
        .min(
            PHASE_DURATION_MIN_MINUTES,
            `Phase duration must be at least ${PHASE_DURATION_MIN_MINUTES} minute`,
        )
        .required('Phase duration is required'),
    phaseId: yup.string()
        .required('Phase id is required'),
    predecessor: yup.string()
        .optional(),
    scheduledEndDate: yup.date()
        .optional(),
    scheduledStartDate: yup.date()
        .optional(),
})

const milestoneConfigurationSchema = yup.object({
    enabled: yup.boolean()
        .default(false),
    milestoneCount: yup.number()
        .transform(emptyStringToUndefined)
        .typeError('Milestone count must be a number')
        .integer('Milestone count must be an integer')
        .min(1, 'Milestone count must be at least 1')
        .when('enabled', {
            is: true,
            otherwise: schema => schema.optional(),
            then: schema => schema.required('Milestone count is required when milestones are enabled'),
        }),
    milestoneDurationDays: yup.number()
        .transform(emptyStringToUndefined)
        .typeError('Milestone duration must be a number')
        .integer('Milestone duration must be an integer')
        .min(1, 'Milestone duration must be at least 1 day')
        .when('enabled', {
            is: true,
            otherwise: schema => schema.optional(),
            then: schema => schema.required('Milestone duration is required when milestones are enabled'),
        }),
})
    .default({
        enabled: false,
    })

const metadataSchema = yup.object({
    name: yup.string()
        .required('Metadata name is required'),
    value: yup.mixed()
        .required('Metadata value is required'),
})

const attachmentSchema = yup.object({
    fileSize: yup.number()
        .optional(),
    id: yup.string()
        .optional(),
    name: yup.string()
        .required('Attachment name is required'),
    url: yup.string()
        .required('Attachment URL is required'),
})

function toNormalizedText(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim()
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    return ''
}

function getRequiredReviewerSlots(value: unknown): number {
    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue)) {
        return 1
    }

    return Math.max(1, Math.trunc(parsedValue))
}

const reviewerSchema = yup.object({
    additionalMemberIds: yup.array()
        .of(yup.string()
            .optional())
        .optional(),
    aiWorkflowId: yup.string()
        .when('isMemberReview', {
            is: false,
            otherwise: schema => schema.optional(),
            then: schema => schema.required('AI workflow is required for AI reviewer type'),
        }),
    baseCoefficient: yup.number()
        .optional(),
    handle: yup.string()
        .optional(),
    incrementalCoefficient: yup.number()
        .optional(),
    isMemberReview: yup.boolean()
        .optional(),
    memberId: yup.string()
        .when([
            'isMemberReview',
            'shouldOpenOpportunity',
        ], {
            is: (isMemberReview: boolean | undefined, shouldOpenOpportunity: boolean | undefined): boolean => (
                isMemberReview !== false && shouldOpenOpportunity !== true
            ),
            otherwise: schema => schema.optional(),
            then: schema => schema.required('Member is required when public review opportunity is closed'),
        }),
    memberReviewerCount: yup.number()
        .optional(),
    phaseId: yup.string()
        .optional(),
    resourceId: yup.string()
        .optional(),
    roleId: yup.string()
        .optional(),
    scorecardId: yup.string()
        .when('isMemberReview', {
            is: (isMemberReview: boolean | undefined): boolean => isMemberReview !== false,
            otherwise: schema => schema.optional(),
            then: schema => schema.required('Scorecard is required for member reviewer type'),
        }),
    shouldOpenOpportunity: yup.boolean()
        .optional(),
})
    .test(
        'all-member-slots-required-when-opportunity-closed',
        'All assigned member slots are required when public review opportunity is closed',
        function validateMemberSlots(value: unknown): boolean | yup.ValidationError {
            if (typeof value !== 'object' || !value) {
                return true
            }

            const reviewer = value as {
                additionalMemberIds?: unknown
                isMemberReview?: boolean
                memberId?: unknown
                memberReviewerCount?: unknown
                shouldOpenOpportunity?: boolean
            }
            const isMemberReview = reviewer.isMemberReview !== false
            const shouldOpenOpportunity = reviewer.shouldOpenOpportunity === true

            if (!isMemberReview || shouldOpenOpportunity) {
                return true
            }

            const reviewerSlots = getRequiredReviewerSlots(reviewer.memberReviewerCount)
            const additionalMemberIds = Array.isArray(reviewer.additionalMemberIds)
                ? reviewer.additionalMemberIds
                : []
            const normalizedAssignedMemberSlots = [
                reviewer.memberId,
                ...additionalMemberIds,
            ]
                .slice(0, reviewerSlots)
                .map(memberId => toNormalizedText(memberId))
            const missingSlotIndex = normalizedAssignedMemberSlots.findIndex(memberId => !memberId)
            const hasAllAssignments = normalizedAssignedMemberSlots.length === reviewerSlots
                && missingSlotIndex === -1

            if (hasAllAssignments) {
                return true
            }

            const rootPath = this.path || ''
            const firstMissingSlotIndex = missingSlotIndex >= 0
                ? missingSlotIndex
                : normalizedAssignedMemberSlots.length
            const missingSlotFieldPath = firstMissingSlotIndex === 0
                ? 'memberId'
                : `additionalMemberIds.${firstMissingSlotIndex - 1}`
            const validationPath = rootPath
                ? `${rootPath}.${missingSlotFieldPath}`
                : missingSlotFieldPath

            return this.createError({
                message: 'Assign all required members when public review opportunity is closed',
                path: validationPath,
            })
        },
    )

type ChallengeBasicInfoFormData = Omit<
    ChallengeEditorFormData,
    'legacy' | 'milestoneConfiguration' | 'phases' | 'startDate' | 'timelineTemplateId'
>

export const challengeBasicInfoSchema: yup.ObjectSchema<ChallengeBasicInfoFormData> = yup
    .object({
        billing: yup.object({
            billingAccountId: yup.mixed<number | string>()
                .optional(),
        })
            .optional(),
        challengeFee: yup.number()
            .optional(),
        description: yup
            .string()
            .min(
                MIN_DESCRIPTION_LENGTH,
                `Public specification must be at least ${MIN_DESCRIPTION_LENGTH} characters`,
            )
            .required('Public specification is required'),
        funChallenge: yup.boolean()
            .default(false)
            .optional(),
        id: yup.string()
            .optional(),
        name: yup
            .string()
            .max(MAX_CHALLENGE_NAME_LENGTH, `Challenge name cannot exceed ${MAX_CHALLENGE_NAME_LENGTH} characters`)
            .required('Challenge name is required'),
        privateDescription: yup.string()
            .optional(),
        prizeSets: yup.array()
            .when('funChallenge', {
                is: true,
                otherwise: schema => schema
                    .of(prizeSetSchema)
                    .test(
                        'placement-prize-required',
                        'At least one first-place prize is required',
                        (value: unknown): boolean => {
                            if (!Array.isArray(value)) {
                                return false
                            }

                            const placementPrizeSet = value.find(prizeSet => (
                                typeof prizeSet === 'object'
                                    && prizeSet
                                    && (prizeSet as { type?: string }).type === PRIZE_SET_TYPES.PLACEMENT
                            )) as {
                                prizes?: unknown[]
                            } | undefined

                            return Array.isArray(placementPrizeSet?.prizes)
                                && (placementPrizeSet?.prizes?.length || 0) > 0
                        },
                    )
                    .optional(),
                then: schema => schema.optional(),
            }),
        skills: yup
            .array()
            .of(skillSchema)
            .default([])
            .test(
                'skills-required',
                'Select at least one skill',
                function validateSkills(value: unknown): boolean {
                    const currentBilling = this.parent?.billing

                    if (!isSkillsRequired(currentBilling)) {
                        return true
                    }

                    return Array.isArray(value) && value.length > 0
                },
            ),
        tags: yup
            .array()
            .of(yup.string()
                .required())
            .default([]),
        trackId: yup.string()
            .required('Challenge track is required'),
        typeId: yup.string()
            .required('Challenge type is required'),
    })
    .required()

export const challengeScheduleSchema = yup.object({
    legacy: yup.object({
        isTask: yup.boolean()
            .default(false),
        reviewType: yup.string()
            .oneOf(Object.values(REVIEW_TYPES))
            .default(REVIEW_TYPES.INTERNAL)
            .required('Review type is required'),
        useSchedulingAPI: yup.boolean()
            .default(true),
    })
        .default({
            isTask: false,
            reviewType: REVIEW_TYPES.INTERNAL,
            useSchedulingAPI: true,
        }),
    milestoneConfiguration: milestoneConfigurationSchema
        .required('Milestone configuration is required'),
    phases: yup.array()
        .when('legacy.useSchedulingAPI', {
            is: isSchedulingApiEnabled,
            otherwise: () => yup.array()
                .optional(),
            then: schema => schema
                .of(challengePhaseSchema)
                .min(1, 'At least one phase is required')
                .required('Phases are required'),
        }),
    startDate: yup.date()
        .when('legacy.useSchedulingAPI', {
            is: isSchedulingApiEnabled,
            otherwise: schema => schema.optional(),
            then: schema => schema
                .typeError('Challenge start date is required')
                .required('Challenge start date is required'),
        }),
    timelineTemplateId: yup.string()
        .optional(),
})

export const challengeAdvancedOptionsSchema = yup.object({
    assignedMemberId: yup.string()
        .transform(emptyStringToUndefined)
        .optional(),
    attachments: yup.array()
        .of(attachmentSchema)
        .optional(),
    copilot: yup.string()
        .transform(emptyStringToUndefined)
        .optional(),
    discussionForum: yup.boolean()
        .optional(),
    groups: yup.array()
        .of(yup.string()
            .required())
        .optional(),
    metadata: yup.array()
        .of(metadataSchema)
        .optional(),
    reviewer: yup.string()
        .transform(emptyStringToUndefined)
        .when([
            'legacy.isTask',
            'legacy.reviewType',
        ], {
            is: (
                isTask: boolean | undefined,
                reviewType: string | undefined,
            ): boolean => (
                isTask === true
                && String(reviewType || '')
                    .trim()
                    .toUpperCase() === REVIEW_TYPES.INTERNAL
            ),
            otherwise: schema => schema.optional(),
            then: schema => schema.required('Select a reviewer'),
        }),
    reviewers: yup.array()
        .of(reviewerSchema)
        .optional(),
    roundType: yup.string()
        .oneOf([
            ROUND_TYPES.SINGLE_ROUND,
            ROUND_TYPES.TWO_ROUNDS,
        ])
        .default(ROUND_TYPES.SINGLE_ROUND)
        .required('Round type is required'),
    terms: yup.array()
        .of(yup.string()
            .required())
        .optional(),
    wiproAllowed: yup.boolean()
        .default(false)
        .optional(),
})

export const challengeEditorSchema: yup.ObjectSchema<ChallengeEditorFormData> = challengeBasicInfoSchema
    .concat(challengeScheduleSchema)
    .concat(challengeAdvancedOptionsSchema) as yup.ObjectSchema<ChallengeEditorFormData>

export type ChallengeEditorSchemaData = ChallengeEditorFormData
