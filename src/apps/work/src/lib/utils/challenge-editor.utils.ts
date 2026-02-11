import {
    PHASE_DURATION_MAX_HOURS,
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
    REVIEW_TYPES,
    ROUND_TYPES,
    SKILLS_OPTIONAL_BILLING_ACCOUNT_IDS,
} from '../constants/challenge-editor.constants'
import {
    Attachment,
    Challenge,
    ChallengeEditorFormData,
    ChallengeMilestoneConfiguration,
    ChallengePhase,
    ChallengeReviewer,
    ChallengeSkill,
    Prize,
    PrizeSet,
} from '../models'

interface BillingInfo {
    billingAccountId?: number | string
}

interface ChallengeMetadataEntry extends Record<string, unknown> {
    name: string
    value: unknown
}

type ReviewTypeValue = typeof REVIEW_TYPES[keyof typeof REVIEW_TYPES]

const MILESTONE_METADATA_NAMES = {
    DURATION_DAYS: 'challengeMilestone.durationDays',
    ENABLED: 'challengeMilestone.enabled',
    MILESTONE_COUNT: 'challengeMilestone.count',
} as const

const MILESTONE_METADATA_KEYS: readonly string[] = Object.values(MILESTONE_METADATA_NAMES)

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0
}

function normalizeStringValue(value: unknown): string {
    return isNonEmptyString(value)
        ? value.trim()
        : ''
}

function normalizeStartDate(value: unknown): Date | undefined {
    if (!value) {
        return undefined
    }

    const parsedStartDate = value instanceof Date
        ? value
        : new Date(value as string)

    return Number.isNaN(parsedStartDate.getTime())
        ? undefined
        : parsedStartDate
}

function normalizeSkillOption(skill: Partial<ChallengeSkill>): ChallengeSkill | undefined {
    if (!skill?.id && !skill?.name) {
        return undefined
    }

    const id = (skill.id || '').trim()
    const name = (skill.name || '').trim()

    if (!id || !name) {
        return undefined
    }

    return {
        id,
        name,
    }
}

function normalizeTags(tags: Array<string | { value?: string }> | undefined): string[] {
    if (!Array.isArray(tags)) {
        return []
    }

    return tags
        .map(tag => {
            if (typeof tag === 'string') {
                return tag.trim()
            }

            if (typeof tag === 'object' && tag && typeof tag.value === 'string') {
                return tag.value.trim()
            }

            return ''
        })
        .filter(Boolean)
}

function normalizePrizeType(value: unknown): 'POINT' | 'USD' {
    return value === PRIZE_TYPES.POINT
        ? PRIZE_TYPES.POINT
        : PRIZE_TYPES.USD
}

function normalizePrizeValue(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.max(Math.trunc(value), 0)
    }

    if (typeof value === 'string') {
        const parsed = Number(value)

        if (Number.isFinite(parsed)) {
            return Math.max(Math.trunc(parsed), 0)
        }
    }

    return 0
}

function normalizeOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed)
            ? parsed
            : undefined
    }

    return undefined
}

function normalizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value.trim()

    if (!normalizedValue) {
        return undefined
    }

    return normalizedValue
}

function normalizeRoundType(value: unknown): ChallengeEditorFormData['roundType'] | undefined {
    const normalizedValue = normalizeOptionalString(value)

    if (!normalizedValue) {
        return undefined
    }

    if (
        normalizedValue === ROUND_TYPES.SINGLE_ROUND
        || normalizedValue === ROUND_TYPES.TWO_ROUNDS
    ) {
        return normalizedValue
    }

    return undefined
}

function normalizeReviewType(value: unknown): ReviewTypeValue | undefined {
    const normalizedValue = normalizeOptionalString(value)
        ?.toUpperCase()

    if (!normalizedValue) {
        return undefined
    }

    if (
        normalizedValue === REVIEW_TYPES.COMMUNITY
        || normalizedValue === REVIEW_TYPES.INTERNAL
        || normalizedValue === REVIEW_TYPES.SYSTEM
        || normalizedValue === REVIEW_TYPES.PROVISIONAL
        || normalizedValue === REVIEW_TYPES.EXAMPLE
    ) {
        return normalizedValue
    }

    return undefined
}

function normalizeMetadataEntries(metadata: unknown): ChallengeMetadataEntry[] {
    if (!Array.isArray(metadata)) {
        return []
    }

    return metadata
        .map((entry: unknown): ChallengeMetadataEntry | undefined => {
            if (typeof entry !== 'object' || !entry) {
                return undefined
            }

            const typedEntry = entry as Partial<ChallengeMetadataEntry>
            const name = normalizeStringValue(typedEntry.name)
            if (!name || typedEntry.value === undefined) {
                return undefined
            }

            return {
                name,
                value: typedEntry.value,
            }
        })
        .filter((entry): entry is ChallengeMetadataEntry => !!entry)
}

function findMetadataValue(
    metadata: ChallengeMetadataEntry[],
    metadataName: string,
): unknown {
    return metadata.find(entry => entry.name === metadataName)?.value
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        const normalized = value.trim()
            .toLowerCase()
        if (normalized === 'true') {
            return true
        }

        if (normalized === 'false') {
            return false
        }
    }

    return undefined
}

function normalizeMilestoneConfiguration(
    metadata: ChallengeMetadataEntry[],
): ChallengeMilestoneConfiguration {
    const enabled = normalizeOptionalBoolean(
        findMetadataValue(metadata, MILESTONE_METADATA_NAMES.ENABLED),
    ) || false

    return {
        enabled,
        milestoneCount: normalizeOptionalNumber(
            findMetadataValue(metadata, MILESTONE_METADATA_NAMES.MILESTONE_COUNT),
        ),
        milestoneDurationDays: normalizeOptionalNumber(
            findMetadataValue(metadata, MILESTONE_METADATA_NAMES.DURATION_DAYS),
        ),
    }
}

function buildMilestoneMetadata(
    milestoneConfiguration?: ChallengeMilestoneConfiguration,
): ChallengeMetadataEntry[] {
    if (!milestoneConfiguration?.enabled) {
        return []
    }

    const milestoneCount = normalizeOptionalNumber(milestoneConfiguration.milestoneCount)
    const milestoneDurationDays = normalizeOptionalNumber(
        milestoneConfiguration.milestoneDurationDays,
    )

    return [
        {
            name: MILESTONE_METADATA_NAMES.ENABLED,
            value: true,
        },
        {
            name: MILESTONE_METADATA_NAMES.MILESTONE_COUNT,
            value: milestoneCount,
        },
        {
            name: MILESTONE_METADATA_NAMES.DURATION_DAYS,
            value: milestoneDurationDays,
        },
    ].filter(metadataEntry => metadataEntry.value !== undefined)
}

function normalizePrize(
    prize: Partial<Prize> | undefined,
    prizeSetType?: string,
): Prize | undefined {
    if (!prize || typeof prize !== 'object') {
        return undefined
    }

    const normalizedType = normalizePrizeType(prize.type)
    const isCopilotPrize = prizeSetType === PRIZE_SET_TYPES.COPILOT

    return {
        description: isNonEmptyString(prize.description)
            ? prize.description.trim()
            : undefined,
        type: isCopilotPrize
            ? PRIZE_TYPES.USD
            : normalizedType,
        value: normalizePrizeValue(prize.value),
    }
}

function normalizePrizeSets(prizeSets: unknown): PrizeSet[] {
    if (!Array.isArray(prizeSets)) {
        return []
    }

    return prizeSets
        .map((prizeSet: unknown): PrizeSet | undefined => {
            if (typeof prizeSet !== 'object' || !prizeSet) {
                return undefined
            }

            const typedPrizeSet = prizeSet as Partial<PrizeSet>
            const type = (typedPrizeSet.type || '').trim()
            if (!type) {
                return undefined
            }

            const prizes = Array.isArray(typedPrizeSet.prizes)
                ? typedPrizeSet.prizes
                    .map(prize => normalizePrize(prize, type))
                    .filter((prize): prize is Prize => !!prize)
                : []

            return {
                description: isNonEmptyString(typedPrizeSet.description)
                    ? typedPrizeSet.description.trim()
                    : undefined,
                prizes,
                type,
            }
        })
        .filter((prizeSet): prizeSet is PrizeSet => !!prizeSet)
}

function filterEmptyPrizeSets(prizeSets: PrizeSet[]): PrizeSet[] {
    return prizeSets.filter(prizeSet => Array.isArray(prizeSet.prizes) && prizeSet.prizes.length > 0)
}

function normalizeReviewers(reviewers: unknown): ChallengeReviewer[] | undefined {
    if (!Array.isArray(reviewers)) {
        return undefined
    }

    return reviewers
        .filter((reviewer): reviewer is ChallengeReviewer => typeof reviewer === 'object' && !!reviewer)
        .map(reviewer => ({
            aiWorkflowId: isNonEmptyString(reviewer.aiWorkflowId)
                ? reviewer.aiWorkflowId.trim()
                : undefined,
            baseCoefficient: normalizeOptionalNumber(reviewer.baseCoefficient),
            handle: normalizeOptionalString(reviewer.handle),
            incrementalCoefficient: normalizeOptionalNumber(reviewer.incrementalCoefficient),
            isMemberReview: typeof reviewer.isMemberReview === 'boolean'
                ? reviewer.isMemberReview
                : undefined,
            memberId: normalizeOptionalString(reviewer.memberId),
            memberReviewerCount: normalizeOptionalNumber(reviewer.memberReviewerCount),
            phaseId: normalizeOptionalString(reviewer.phaseId),
            resourceId: normalizeOptionalString(reviewer.resourceId),
            roleId: normalizeOptionalString(reviewer.roleId),
            scorecardId: normalizeOptionalString(reviewer.scorecardId),
            shouldOpenOpportunity: typeof reviewer.shouldOpenOpportunity === 'boolean'
                ? reviewer.shouldOpenOpportunity
                : undefined,
        }))
}

function normalizeStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
        return undefined
    }

    return value
        .map(item => normalizeOptionalString(item))
        .filter((item): item is string => !!item)
}

function normalizeAttachments(attachments: unknown): Attachment[] | undefined {
    if (!Array.isArray(attachments)) {
        return undefined
    }

    return attachments
        .map((attachment: unknown): Attachment | undefined => {
            if (typeof attachment !== 'object' || !attachment) {
                return undefined
            }

            const typedAttachment = attachment as Partial<Attachment>
            const name = normalizeOptionalString(typedAttachment.name)
            const url = normalizeOptionalString(typedAttachment.url)

            if (!name || !url) {
                return undefined
            }

            return {
                fileSize: normalizeOptionalNumber(typedAttachment.fileSize),
                id: normalizeOptionalString(typedAttachment.id),
                name,
                url,
            }
        })
        .filter((attachment): attachment is Attachment => !!attachment)
}

function toIsoDateString(value: unknown): string | undefined {
    if (!value) {
        return undefined
    }

    if (typeof value === 'string') {
        return value
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString()
    }

    return undefined
}

function normalizePhaseDurationMinutes(duration: unknown): number {
    const parsedDuration = normalizeOptionalNumber(duration)
    if (!parsedDuration || parsedDuration <= 0) {
        return 0
    }

    const maxMinutesDuration = PHASE_DURATION_MAX_HOURS * 60
    if (parsedDuration > maxMinutesDuration) {
        return maxMinutesDuration
    }

    return Math.max(1, Math.trunc(parsedDuration))
}

function normalizePhasesForForm(phases: unknown): ChallengePhase[] {
    if (!Array.isArray(phases)) {
        return []
    }

    return phases
        .map((phase: unknown): ChallengePhase | undefined => {
            if (typeof phase !== 'object' || !phase) {
                return undefined
            }

            const typedPhase = phase as Partial<ChallengePhase>
            if (!typedPhase.phaseId) {
                return undefined
            }

            const durationMinutes = normalizeOptionalNumber(typedPhase.duration)

            return {
                duration: normalizePhaseDurationMinutes(
                    durationMinutes !== undefined
                        ? durationMinutes / 60
                        : durationMinutes,
                ),
                id: typedPhase.id,
                isOpen: typedPhase.isOpen,
                name: typedPhase.name,
                phaseId: typedPhase.phaseId,
                predecessor: typedPhase.predecessor,
                scheduledEndDate: toIsoDateString(typedPhase.scheduledEndDate),
                scheduledStartDate: toIsoDateString(typedPhase.scheduledStartDate),
                status: typedPhase.status,
            }
        })
        .filter((phase): phase is ChallengePhase => !!phase)
}

function serializePhasesForApi(phases: unknown): ChallengePhase[] | undefined {
    if (!Array.isArray(phases)) {
        return undefined
    }

    const serializedPhases = phases
        .map((phase: unknown): ChallengePhase | undefined => {
            if (typeof phase !== 'object' || !phase) {
                return undefined
            }

            const typedPhase = phase as Partial<ChallengePhase>
            if (!typedPhase.phaseId) {
                return undefined
            }

            return {
                duration: normalizePhaseDurationMinutes(typedPhase.duration),
                phaseId: typedPhase.phaseId,
                predecessor: typedPhase.predecessor,
                scheduledStartDate: toIsoDateString(typedPhase.scheduledStartDate),
            }
        })
        .filter((phase): phase is ChallengePhase => !!phase)

    return serializedPhases
}

function removeEmptyValues(challenge: Partial<Challenge>): Partial<Challenge> {
    const filteredEntries = Object.entries(challenge)
        .filter(([, value]) => {
            if (Array.isArray(value)) {
                return value.length > 0
            }

            if (typeof value === 'string') {
                return value.trim().length > 0
            }

            return value !== undefined
        })

    return Object.fromEntries(filteredEntries)
}

export function sanitizeChallengeName(value: string): string {
    return value
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .replace(/\s+/g, ' ')
        .trimStart()
}

export function formatLastSaved(timestamp?: Date): string {
    if (!timestamp) {
        return 'Not saved yet'
    }

    const diffMs = Date.now() - timestamp.getTime()
    if (diffMs < 5000) {
        return 'Saved just now'
    }

    return `Last saved at ${timestamp.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
    })}`
}

export function isSkillsRequired(billing?: BillingInfo): boolean {
    const billingAccountId = billing?.billingAccountId
    if (billingAccountId === undefined || billingAccountId === null) {
        return true
    }

    const normalizedId = String(billingAccountId)

    return !SKILLS_OPTIONAL_BILLING_ACCOUNT_IDS.includes(normalizedId)
}

function isSchedulingApiEnabled(useSchedulingAPI: unknown): boolean {
    return useSchedulingAPI !== false
}

export function transformChallengeToFormData(
    challenge?: Partial<Challenge>,
): ChallengeEditorFormData {
    const rawSkills = challenge?.skills
    const challengeSkills: ChallengeSkill[] = Array.isArray(rawSkills)
        ? rawSkills as ChallengeSkill[]
        : []
    const skills = challengeSkills
        .map(skill => normalizeSkillOption(skill as ChallengeSkill))
        .filter((skill): skill is ChallengeSkill => !!skill)

    const description = normalizeStringValue(challenge?.description)
    const name = normalizeStringValue(challenge?.name)
    const phases = normalizePhasesForForm(challenge?.phases)
    const privateDescription = normalizeStringValue(challenge?.privateDescription)
    const startDate = normalizeStartDate(challenge?.startDate)
    const tags = normalizeTags(challenge?.tags as Array<string | { value?: string }> | undefined)
    const timelineTemplateId = normalizeStringValue(challenge?.timelineTemplateId)
    const trackId = normalizeStringValue(challenge?.trackId)
    const typeId = normalizeStringValue(challenge?.typeId)
    const isSchedulingEnabled = isSchedulingApiEnabled(challenge?.legacy?.useSchedulingAPI)
    const metadata = normalizeMetadataEntries(challenge?.metadata)
    const metadataWithoutMilestone = metadata
        .filter(metadataEntry => !MILESTONE_METADATA_KEYS.includes(metadataEntry.name))
    const milestoneConfiguration = normalizeMilestoneConfiguration(metadata)
    const roundType = normalizeRoundType(challenge?.roundType) || ROUND_TYPES.SINGLE_ROUND
    const reviewType = normalizeReviewType(challenge?.legacy?.reviewType) || REVIEW_TYPES.INTERNAL

    return {
        assignedMemberId: normalizeOptionalString(challenge?.assignedMemberId),
        attachments: normalizeAttachments(challenge?.attachments),
        billing: {
            billingAccountId: challenge?.billing?.billingAccountId,
        },
        challengeFee: normalizeOptionalNumber(challenge?.challengeFee),
        copilot: normalizeOptionalString(challenge?.copilot),
        description,
        discussionForum: normalizeOptionalBoolean(challenge?.discussionForum),
        groups: normalizeStringArray(challenge?.groups),
        id: challenge?.id,
        legacy: {
            reviewType,
            useSchedulingAPI: isSchedulingEnabled,
        },
        metadata: metadataWithoutMilestone,
        milestoneConfiguration: {
            enabled: milestoneConfiguration.enabled || false,
            milestoneCount: normalizeOptionalNumber(milestoneConfiguration.milestoneCount),
            milestoneDurationDays: normalizeOptionalNumber(milestoneConfiguration.milestoneDurationDays),
        },
        name,
        phases,
        privateDescription,
        prizeSets: normalizePrizeSets(challenge?.prizeSets),
        reviewers: normalizeReviewers(challenge?.reviewers),
        roundType,
        skills,
        startDate,
        tags,
        terms: normalizeStringArray(challenge?.terms),
        timelineTemplateId: timelineTemplateId || undefined,
        trackId,
        typeId,
    }
}

export function transformFormDataToChallenge(
    formData: ChallengeEditorFormData,
): Partial<Challenge> {
    const normalizedSkills = (formData.skills || [])
        .map(skill => normalizeSkillOption(skill))
        .filter((skill): skill is ChallengeSkill => !!skill)
        .map(skill => ({
            id: skill.id,
            name: skill.name,
        }))
    const isSchedulingEnabled = isSchedulingApiEnabled(formData.legacy?.useSchedulingAPI)
    const metadataWithoutMilestone = normalizeMetadataEntries(formData.metadata)
        .filter(metadataEntry => !MILESTONE_METADATA_KEYS.includes(metadataEntry.name))
    const milestoneMetadata = buildMilestoneMetadata(formData.milestoneConfiguration)
    const metadata = [
        ...metadataWithoutMilestone,
        ...milestoneMetadata,
    ]
    const roundType = normalizeRoundType(formData.roundType) || ROUND_TYPES.SINGLE_ROUND
    const reviewType = normalizeReviewType(formData.legacy?.reviewType) || REVIEW_TYPES.INTERNAL

    const challenge: Partial<Challenge> = {
        assignedMemberId: normalizeOptionalString(formData.assignedMemberId),
        billing: formData.billing,
        challengeFee: normalizeOptionalNumber(formData.challengeFee),
        copilot: normalizeOptionalString(formData.copilot),
        description: formData.description,
        discussionForum: typeof formData.discussionForum === 'boolean'
            ? formData.discussionForum
            : undefined,
        groups: normalizeStringArray(formData.groups),
        legacy: {
            reviewType,
            useSchedulingAPI: isSchedulingEnabled,
        },
        metadata,
        name: formData.name,
        phases: isSchedulingEnabled
            ? serializePhasesForApi(formData.phases)
            : undefined,
        privateDescription: formData.privateDescription,
        prizeSets: filterEmptyPrizeSets(normalizePrizeSets(formData.prizeSets)),
        reviewers: normalizeReviewers(formData.reviewers),
        roundType,
        skills: normalizedSkills,
        startDate: isSchedulingEnabled
            ? toIsoDateString(formData.startDate)
            : undefined,
        tags: normalizeTags(formData.tags),
        terms: normalizeStringArray(formData.terms),
        timelineTemplateId: isSchedulingEnabled
            ? formData.timelineTemplateId
            : undefined,
        trackId: formData.trackId,
        typeId: formData.typeId,
    }

    return removeEmptyValues(challenge)
}
