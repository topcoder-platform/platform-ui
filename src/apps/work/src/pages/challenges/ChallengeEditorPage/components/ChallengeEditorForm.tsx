import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    Link,
    useNavigate,
} from 'react-router-dom'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from '~/libs/ui'

import { FormCheckboxField } from '../../../../lib/components/form'
import {
    CHALLENGE_STATUS,
    CHALLENGE_TRACKS,
} from '../../../../lib/constants'
import {
    AUTOSAVE_DELAY_MS,
    DESIGN_WORK_TYPES,
    PRIZE_SET_TYPES,
    ROUND_TYPES,
} from '../../../../lib/constants/challenge-editor.constants'
import {
    useAutosave,
    useFetchChallengeTracks,
    useFetchChallengeTypes,
    useFetchResourceRoles,
    useFetchResources,
    useFetchTimelineTemplates,
} from '../../../../lib/hooks'
import {
    Challenge,
    ChallengeEditorFormData,
    ChallengePhase,
    ChallengeType,
    Reviewer,
} from '../../../../lib/models'
import {
    challengeEditorSchema,
} from '../../../../lib/schemas/challenge-editor.schema'
import {
    createChallenge,
    createResource,
    deleteResource,
    fetchChallenge,
    fetchResourceRoles,
    fetchResources,
    patchChallenge,
} from '../../../../lib/services'
import {
    formatLastSaved,
    showErrorToast,
    showSuccessToast,
    transformChallengeToFormData,
    transformFormDataToChallenge,
} from '../../../../lib/utils'

import {
    AssignedMemberField,
} from './AssignedMemberField'
import {
    AttachmentsField,
} from './AttachmentsField'
import {
    ChallengeDescriptionField,
} from './ChallengeDescriptionField'
import {
    ChallengeScheduleSection,
} from './ChallengeScheduleSection'
import {
    ChallengeFeeField,
} from './ChallengeFeeField'
import {
    ChallengeNameField,
} from './ChallengeNameField'
import {
    ChallengePrivateDescriptionField,
} from './ChallengePrivateDescriptionField'
import {
    ChallengePrizesField,
} from './ChallengePrizesField'
import {
    ChallengeSkillsField,
} from './ChallengeSkillsField'
import {
    ChallengeTagsField,
} from './ChallengeTagsField'
import {
    ChallengeTotalField,
} from './ChallengeTotalField'
import {
    ChallengeTrackField,
} from './ChallengeTrackField'
import {
    ChallengeTypeField,
} from './ChallengeTypeField'
import {
    CheckpointPrizesField,
} from './CheckpointPrizesField'
import {
    CopilotField,
} from './CopilotField'
import {
    CopilotFeeField,
} from './CopilotFeeField'
import {
    DesignWorkTypeField,
} from './DesignWorkTypeField'
import {
    FunChallengeField,
} from './FunChallengeField'
import {
    GroupsField,
} from './GroupsField'
import {
    MaximumSubmissionsField,
} from './MaximumSubmissionsField'
import {
    MarathonMatchScorerSection,
} from './MarathonMatchScorerSection'
import {
    NDAField,
} from './NDAField'
import {
    ReviewCostField,
} from './ReviewCostField'
import {
    ReviewersField,
} from './ReviewersField'
import {
    ReviewTypeField,
} from './ReviewTypeField'
import {
    RoundTypeField,
} from './RoundTypeField'
import {
    StockArtsField,
} from './StockArtsField'
import {
    SubmissionVisibilityField,
} from './SubmissionVisibilityField'
import {
    TermsField,
} from './TermsField'
import {
    COPILOT_RESOURCE_ROLE_NAMES,
    findMatchingResourceRole,
    resolveCreateRoundType,
    resolveCreateTimelineTemplateId,
    resolveResourceAssignmentValue,
    ResourceAssignmentValueField,
    shouldUseManualReviewers,
    SUBMITTER_RESOURCE_ROLE_NAMES,
    TASK_REVIEWER_RESOURCE_ROLE_NAMES,
} from './ChallengeEditorForm.utils'
import styles from './ChallengeEditorForm.module.scss'

interface ChallengeEditorFormProps {
    canLaunchChallenge?: boolean
    challenge?: Challenge
    isLaunchDisabled?: boolean
    isEditMode?: boolean
    launchButtonLabel?: string
    onChallengeStatusChange?: (status?: string) => void
    onLaunchOpen?: () => void
    onRegisterLaunchAction?: (action: (() => Promise<void>) | undefined) => void
    onSavingChange?: (isSaving: boolean) => void
    projectId?: string
}

interface SaveChallengeOptions {
    isAutosave?: boolean
    statusOverride?: string
    successMessage?: string
}

interface SaveStatusMetadata {
    isSaveAsDraft: boolean
    payloadStatus?: string
}

type SingleAssignmentFieldName = 'assignedMemberId' | 'copilot' | 'reviewer'

interface SingleAssignmentConfig {
    fieldName: SingleAssignmentFieldName
    roleNames: readonly string[]
    valueField: ResourceAssignmentValueField
}

interface SyncSingleAssignmentResourceParams extends Omit<SingleAssignmentConfig, 'fieldName'> {
    challengeId: string
    nextValue?: string
}

const SAVE_VALIDATION_ERROR_MESSAGE = 'Please fix validation errors before saving.'
const CHALLENGE_TYPE_CHALLENGE_ABBREVIATION = 'CH'
const CHALLENGE_TYPE_CHALLENGE_NAME = 'CHALLENGE'
const CHALLENGE_TYPE_MARATHON_MATCH_NAME = 'MARATHONMATCH'
const CHALLENGE_TYPE_MARATHON_MATCH_SHORT_ABBREVIATION = 'MM'
const CHALLENGE_TYPE_TASK_NAME = 'TASK'
const CHALLENGE_TYPE_TASK_SHORT_ABBREVIATION = 'TSK'
const CHECKPOINT_REQUIRED_PHASES = [
    'Checkpoint Submission',
    'Checkpoint Screening',
    'Checkpoint Review',
]
const REVIEWER_REQUIRED_PHASES = [
    'Screening',
    'Review',
    'Post-mortem',
    'Approval',
    'Checkpoint Screening',
    'Iterative Review',
]
const REVIEWER_REQUIRED_PHASE_KEYS = new Set(
    REVIEWER_REQUIRED_PHASES
        .map(phaseName => normalizeReviewerPhaseName(phaseName)),
)
const DESIGN_WORK_TYPE_BY_TOKEN = new Map<string, string>(
    DESIGN_WORK_TYPES
        .map(workType => [
            normalizeChallengeTypeToken(workType),
            workType,
        ]),
)
const COPILOT_ASSIGNMENT_CONFIG: SingleAssignmentConfig = {
    fieldName: 'copilot',
    roleNames: COPILOT_RESOURCE_ROLE_NAMES,
    valueField: 'memberHandle',
}
const TASK_ASSIGNED_MEMBER_ASSIGNMENT_CONFIG: SingleAssignmentConfig = {
    fieldName: 'assignedMemberId',
    roleNames: SUBMITTER_RESOURCE_ROLE_NAMES,
    valueField: 'memberId',
}
const TASK_REVIEWER_ASSIGNMENT_CONFIG: SingleAssignmentConfig = {
    fieldName: 'reviewer',
    roleNames: TASK_REVIEWER_RESOURCE_ROLE_NAMES,
    valueField: 'memberHandle',
}

function normalizePhaseName(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

function hasCheckpointPhases(phases: unknown): boolean {
    if (!Array.isArray(phases)) {
        return false
    }

    const phaseNames = new Set(
        phases
            .map(phase => normalizePhaseName((phase as ChallengePhase)?.name))
            .filter(Boolean),
    )

    return CHECKPOINT_REQUIRED_PHASES
        .every(phaseName => phaseNames.has(normalizePhaseName(phaseName)))
}

function isTaskChallengeType(challengeType?: ChallengeType): boolean {
    if (!challengeType) {
        return false
    }

    if (challengeType.isTask) {
        return true
    }

    return isTaskChallengeTypeByNameAndAbbreviation({
        abbreviation: challengeType.abbreviation,
        name: challengeType.name,
    })
}

function isTaskChallengeTypeByNameAndAbbreviation({
    abbreviation,
    name,
}: {
    abbreviation?: string
    name?: string
}): boolean {
    const normalizedChallengeTypeName = (name || '')
        .trim()
        .toUpperCase()
    const normalizedChallengeTypeAbbreviation = (abbreviation || '')
        .trim()
        .toUpperCase()

    return normalizedChallengeTypeName === CHALLENGE_TYPE_TASK_NAME
        || normalizedChallengeTypeAbbreviation === CHALLENGE_TYPE_TASK_NAME
        || normalizedChallengeTypeAbbreviation === CHALLENGE_TYPE_TASK_SHORT_ABBREVIATION
}

function normalizeTextValue(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim()
}

function hasSameNormalizedValue(valueA: unknown, valueB: unknown): boolean {
    return normalizeTextValue(valueA)
        .toLowerCase() === normalizeTextValue(valueB)
        .toLowerCase()
}

function getSingleAssignmentConfigs(isTaskChallenge: boolean): SingleAssignmentConfig[] {
    return isTaskChallenge
        ? [
            COPILOT_ASSIGNMENT_CONFIG,
            TASK_ASSIGNED_MEMBER_ASSIGNMENT_CONFIG,
            TASK_REVIEWER_ASSIGNMENT_CONFIG,
        ]
        : [COPILOT_ASSIGNMENT_CONFIG]
}

function getSingleAssignmentFieldValue(
    formData: ChallengeEditorFormData,
    fieldName: SingleAssignmentFieldName,
): string | undefined {
    return normalizeTextValue(formData[fieldName]) || undefined
}

function applySingleAssignmentFieldValues(
    formData: ChallengeEditorFormData,
    sourceFormData: ChallengeEditorFormData,
    isTaskChallenge: boolean,
): ChallengeEditorFormData {
    const nextFormData: ChallengeEditorFormData = {
        ...formData,
        copilot: getSingleAssignmentFieldValue(sourceFormData, 'copilot'),
    }

    if (!isTaskChallenge) {
        nextFormData.assignedMemberId = undefined
        nextFormData.reviewer = undefined

        return nextFormData
    }

    nextFormData.assignedMemberId = getSingleAssignmentFieldValue(sourceFormData, 'assignedMemberId')
    nextFormData.reviewer = getSingleAssignmentFieldValue(sourceFormData, 'reviewer')

    return nextFormData
}

function buildSingleAssignmentPayload(
    challengeId: string,
    roleId: string,
    valueField: ResourceAssignmentValueField,
    memberValue: string,
): {
    challengeId: string
    memberHandle?: string
    memberId?: string
    roleId: string
} {
    return valueField === 'memberId'
        ? {
            challengeId,
            memberId: memberValue,
            roleId,
        }
        : {
            challengeId,
            memberHandle: memberValue,
            roleId,
        }
}

function normalizeChallengeTypeToken(value: unknown): string {
    return normalizeTextValue(value)
        .toUpperCase()
        .replace(/[-_\s]/g, '')
}

function normalizeDesignWorkType(value: unknown): string | undefined {
    const normalizedToken = normalizeChallengeTypeToken(value)

    return DESIGN_WORK_TYPE_BY_TOKEN.get(normalizedToken)
}

function mergeTagsWithDesignWorkType(
    tags: unknown,
    workType: unknown,
): string[] {
    const normalizedTags = Array.isArray(tags)
        ? tags
            .map(tag => normalizeTextValue(tag))
            .filter(Boolean)
        : []
    const normalizedWorkType = normalizeDesignWorkType(workType)
    const tagsWithoutWorkType = normalizedTags
        .filter(tag => !DESIGN_WORK_TYPE_BY_TOKEN.has(normalizeChallengeTypeToken(tag)))

    if (!normalizedWorkType) {
        return tagsWithoutWorkType
    }

    return [
        ...tagsWithoutWorkType,
        normalizedWorkType,
    ]
}

function normalizeReviewerPhaseName(value: unknown): string {
    return normalizeTextValue(value)
        .toLowerCase()
        .replace(/[-\s]/g, '')
}

function normalizeReviewerPhaseId(phase: {
    id?: string
    phaseId?: string
} | undefined): string {
    return normalizeTextValue(phase?.phaseId) || normalizeTextValue(phase?.id)
}

function isMarathonMatchChallengeTypeByNameAndAbbreviation({
    abbreviation,
    name,
}: {
    abbreviation?: string
    name?: string
}): boolean {
    const normalizedChallengeTypeName = normalizeChallengeTypeToken(name)
    const normalizedChallengeTypeAbbreviation = normalizeChallengeTypeToken(abbreviation)

    return normalizedChallengeTypeName === CHALLENGE_TYPE_MARATHON_MATCH_NAME
        || normalizedChallengeTypeAbbreviation === CHALLENGE_TYPE_MARATHON_MATCH_NAME
        || normalizedChallengeTypeAbbreviation === CHALLENGE_TYPE_MARATHON_MATCH_SHORT_ABBREVIATION
}

function getRequiredReviewerPhases(
    phases: ChallengeEditorFormData['phases'],
): Array<{
    id: string
    name: string
}> {
    if (!Array.isArray(phases)) {
        return []
    }

    const requiredPhases: Array<{
        id: string
        name: string
    }> = []
    const requiredPhaseIdSet = new Set<string>()

    phases.forEach(phase => {
        const phaseId = normalizeReviewerPhaseId(phase)
        const phaseName = normalizeTextValue(phase.name)

        if (!phaseId || !REVIEWER_REQUIRED_PHASE_KEYS.has(normalizeReviewerPhaseName(phaseName))) {
            return
        }

        if (requiredPhaseIdSet.has(phaseId)) {
            return
        }

        requiredPhaseIdSet.add(phaseId)
        requiredPhases.push({
            id: phaseId,
            name: phaseName || phaseId,
        })
    })

    return requiredPhases
}

function isAiReviewer(reviewer: Reviewer | undefined): boolean {
    return normalizeTextValue(reviewer?.aiWorkflowId).length > 0
        || reviewer?.isMemberReview === false
}

function getRequiredMemberReviewerCount(reviewer: Reviewer | undefined): number {
    const reviewerCountValue = Number(reviewer?.memberReviewerCount)
    const reviewerCount = Number.isFinite(reviewerCountValue)
        ? Math.trunc(reviewerCountValue)
        : 1

    return reviewerCount
}

function getAssignedMemberReviewerSlots(reviewer: Reviewer | undefined): string[] {
    if (!reviewer) {
        return []
    }

    const additionalMemberIds = Array.isArray(reviewer.additionalMemberIds)
        ? reviewer.additionalMemberIds
        : []

    return [
        normalizeTextValue(reviewer.memberId),
        ...additionalMemberIds.map(memberId => normalizeTextValue(memberId)),
    ]
}

function getReviewerEntryValidationError(reviewer: Reviewer | undefined): string | undefined {
    if (!reviewer) {
        return undefined
    }

    if (isAiReviewer(reviewer)) {
        if (!normalizeTextValue(reviewer.aiWorkflowId)) {
            return 'AI workflow is required for AI reviewer type.'
        }
    } else {
        if (!normalizeTextValue(reviewer.scorecardId)) {
            return 'Scorecard is required for member reviewer type.'
        }

        const reviewerCount = getRequiredMemberReviewerCount(reviewer)

        if (!Number.isInteger(reviewerCount) || reviewerCount < 1) {
            return 'Number of reviewers must be a positive integer.'
        }

        if (reviewer.shouldOpenOpportunity !== true) {
            const requiredAssignedMembers = getAssignedMemberReviewerSlots(reviewer)
                .slice(0, reviewerCount)
            const hasAllRequiredMembers = requiredAssignedMembers.length === reviewerCount
                && requiredAssignedMembers.every(Boolean)

            if (!hasAllRequiredMembers) {
                return 'Assign all required members when public review opportunity is closed.'
            }
        }
    }

    return normalizeReviewerPhaseId(reviewer)
        ? undefined
        : 'Phase is required for each reviewer.'
}

function getMissingRequiredPhaseCoverageError(
    reviewers: Reviewer[],
    requiredPhases: Array<{
        id: string
        name: string
    }>,
): string | undefined {
    const uncoveredPhase = requiredPhases
        .find(requiredPhase => !reviewers.some(reviewer => (
            normalizeReviewerPhaseId(reviewer) === requiredPhase.id
            && !!normalizeTextValue(reviewer?.scorecardId)
        )))

    if (!uncoveredPhase) {
        return undefined
    }

    return `At least one member reviewer with a scorecard is required for phase "${uncoveredPhase.name}".`
}

interface ReviewerValidationOptions {
    challengeTypeAbbreviation?: string
    challengeTypeName?: string
    requiredReviewersErrorMessage: string
    isTaskChallenge: boolean
}

/**
 * Validates reviewer setup using the same phase coverage checks as work-manager.
 */
function getReviewerValidationError(
    formData: ChallengeEditorFormData,
    options: ReviewerValidationOptions,
): string | undefined {
    if (options.isTaskChallenge) {
        return undefined
    }

    const reviewers = Array.isArray(formData.reviewers)
        ? formData.reviewers
        : []
    const requiredPhases = getRequiredReviewerPhases(formData.phases)
    const isMarathonMatch = isMarathonMatchChallengeTypeByNameAndAbbreviation({
        abbreviation: options.challengeTypeAbbreviation,
        name: options.challengeTypeName,
    })

    if (!isMarathonMatch && reviewers.length === 0 && requiredPhases.length > 0) {
        return options.requiredReviewersErrorMessage
    }

    const invalidReviewer = reviewers
        .map(reviewer => getReviewerEntryValidationError(reviewer))
        .find(Boolean)
    if (invalidReviewer) {
        return invalidReviewer
    }

    if (isMarathonMatch) {
        return undefined
    }

    return getMissingRequiredPhaseCoverageError(reviewers, requiredPhases)
}

function getStatusText(
    saveStatus: 'error' | 'idle' | 'saved' | 'saving',
): string {
    if (saveStatus === 'saving') {
        return 'Saving...'
    }

    if (saveStatus === 'saved') {
        return 'Saved'
    }

    if (saveStatus === 'error') {
        return 'Save failed'
    }

    return ''
}

function normalizeProjectId(value: unknown): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    if (typeof value === 'string') {
        const normalizedValue = value.trim()
        return normalizedValue || undefined
    }

    return undefined
}

function getCreateRoundType(
    fallbackRoundType: ChallengeEditorFormData['roundType'],
    formElement: HTMLFormElement | null,
): ChallengeEditorFormData['roundType'] {
    const formRoundTypeValue = formElement
        ? new FormData(formElement)
            .get('roundType')
        : undefined

    return resolveCreateRoundType({
        fallbackRoundType,
        formRoundTypeValue,
    })
}

function getChallengesListPath(projectId?: string): string {
    return projectId
        ? `/projects/${projectId}/challenges`
        : '/challenges'
}

function normalizeStatus(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalizedValue = value
        .trim()
        .toUpperCase()

    return normalizedValue || undefined
}

function getSubmitButtonLabel(status?: string): string {
    if (status === CHALLENGE_STATUS.NEW) {
        return 'Save as Draft'
    }

    if (status === CHALLENGE_STATUS.ACTIVE) {
        return 'Update Challenge'
    }

    return 'Save Challenge'
}

function getSaveStatusMetadata(
    status: unknown,
    options: SaveChallengeOptions,
): SaveStatusMetadata {
    const currentStatus = normalizeStatus(status)
    const isSaveAsDraft = !options.isAutosave
        && !options.statusOverride
        && currentStatus === CHALLENGE_STATUS.NEW
    const payloadStatus = options.statusOverride
        || (isSaveAsDraft
            ? CHALLENGE_STATUS.DRAFT
            : currentStatus)

    return {
        isSaveAsDraft,
        payloadStatus,
    }
}

function getSaveSuccessMessage(
    isSaveAsDraft: boolean,
    options: SaveChallengeOptions,
): string {
    if (options.successMessage) {
        return options.successMessage
    }

    return isSaveAsDraft
        ? 'Challenge saved as draft successfully'
        : 'Challenge saved successfully'
}

// eslint-disable-next-line complexity
export const ChallengeEditorForm: FC<ChallengeEditorFormProps> = (
    props: ChallengeEditorFormProps,
) => {
    const navigate = useNavigate()
    const isEditMode = props.isEditMode
    const onChallengeStatusChange = props.onChallengeStatusChange
    const onLaunchOpen = props.onLaunchOpen
    const onRegisterLaunchAction = props.onRegisterLaunchAction
    const onSavingChange = props.onSavingChange
    const formElementRef = useRef<HTMLFormElement>(null)
    const defaultedDiscussionForumTypeIdRef = useRef<string | undefined>()
    const fallbackProjectId = useMemo(
        () => normalizeProjectId(props.projectId) || normalizeProjectId(props.challenge?.projectId),
        [
            props.challenge?.projectId,
            props.projectId,
        ],
    )
    const challengesListPath = useMemo(
        () => getChallengesListPath(fallbackProjectId),
        [fallbackProjectId],
    )

    const [currentChallengeId, setCurrentChallengeId] = useState<string | undefined>(props.challenge?.id)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [lastSaved, setLastSaved] = useState<Date | undefined>()
    const [saveError, setSaveError] = useState<string | undefined>()
    const [saveValidationError, setSaveValidationError] = useState<string | undefined>()
    const [saveStatus, setSaveStatus] = useState<'error' | 'idle' | 'saved' | 'saving'>('idle')
    const [scorerHasUnsavedChanges, setScorerHasUnsavedChanges] = useState<boolean>(false)
    const [scorerHasError, setScorerHasError] = useState<boolean>(false)

    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: transformChallengeToFormData(props.challenge),
        mode: 'onChange',
        resolver: yupResolver(challengeEditorSchema) as any,
    })

    const formState = formMethods.formState
    const getValues = formMethods.getValues
    const handleSubmit = formMethods.handleSubmit
    const reset = formMethods.reset
    const clearErrors = formMethods.clearErrors
    const setError = formMethods.setError
    const setValue = formMethods.setValue
    const trigger = formMethods.trigger
    const watch = formMethods.watch
    const values = watch()
    const challengeTracks = useFetchChallengeTracks().tracks
    const challengeTypes = useFetchChallengeTypes().challengeTypes
    const timelineTemplates = useFetchTimelineTemplates().timelineTemplates
    const challengeResourcesResult = useFetchResources(currentChallengeId)
    const resourceRolesResult = useFetchResourceRoles()
    const resourceRoles = resourceRolesResult.resourceRoles
    const challengeResources = challengeResourcesResult.resources
    const mutateChallengeResources = challengeResourcesResult.mutate

    const selectedChallengeType = useMemo<ChallengeType | undefined>(
        () => challengeTypes.find(challengeType => challengeType.id === values.typeId),
        [
            challengeTypes,
            values.typeId,
        ],
    )
    const fallbackChallengeTypeName = useMemo(
        (): string | undefined => {
            const challengeType = props.challenge?.type

            if (!challengeType) {
                return undefined
            }

            if (typeof challengeType === 'string') {
                return challengeType
            }

            return challengeType.name || challengeType.abbreviation
        },
        [props.challenge?.type],
    )
    const fallbackChallengeTypeAbbreviation = useMemo(
        (): string | undefined => {
            const challengeType = props.challenge?.type

            if (!challengeType) {
                return undefined
            }

            if (typeof challengeType === 'string') {
                return challengeType
            }

            return challengeType.abbreviation || challengeType.name
        },
        [props.challenge?.type],
    )
    const resolvedChallengeTypeName = selectedChallengeType?.name || fallbackChallengeTypeName
    const resolvedChallengeTypeAbbreviation = selectedChallengeType?.abbreviation || fallbackChallengeTypeAbbreviation
    const selectedChallengeTrack = useMemo(
        () => challengeTracks.find(challengeTrack => challengeTrack.id === values.trackId),
        [
            challengeTracks,
            values.trackId,
        ],
    )
    const isDesignTrackSelected = useMemo(
        (): boolean => {
            const normalizedTrack = (
                selectedChallengeTrack?.track
                || selectedChallengeTrack?.name
                || selectedChallengeTrack?.abbreviation
                || ''
            )
                .trim()
                .toUpperCase()

            return normalizedTrack === CHALLENGE_TRACKS.DESIGN
        },
        [selectedChallengeTrack],
    )
    const isChallengeTypeSelected = useMemo(
        (): boolean => {
            const normalizedChallengeTypeName = (selectedChallengeType?.name || '')
                .trim()
                .toUpperCase()
            const normalizedChallengeTypeAbbreviation = (selectedChallengeType?.abbreviation || '')
                .trim()
                .toUpperCase()

            return normalizedChallengeTypeName === CHALLENGE_TYPE_CHALLENGE_NAME
                || normalizedChallengeTypeAbbreviation === CHALLENGE_TYPE_CHALLENGE_ABBREVIATION
        },
        [selectedChallengeType],
    )
    const isTaskChallengeSelected = useMemo(
        (): boolean => isTaskChallengeType(selectedChallengeType)
            || isTaskChallengeTypeByNameAndAbbreviation({
                abbreviation: resolvedChallengeTypeAbbreviation,
                name: resolvedChallengeTypeName,
            }),
        [
            resolvedChallengeTypeAbbreviation,
            resolvedChallengeTypeName,
            selectedChallengeType,
        ],
    )
    const isMarathonMatchChallengeSelected = useMemo(
        (): boolean => isMarathonMatchChallengeTypeByNameAndAbbreviation({
            abbreviation: resolvedChallengeTypeAbbreviation,
            name: resolvedChallengeTypeName,
        }),
        [
            resolvedChallengeTypeAbbreviation,
            resolvedChallengeTypeName,
        ],
    )
    const showRoundTypeField = isDesignTrackSelected && isChallengeTypeSelected
    const showDesignWorkTypeField = isDesignTrackSelected && isChallengeTypeSelected
    const showSubmissionSettingsSection = isDesignTrackSelected && isChallengeTypeSelected
    const showCheckpointPrizes = useMemo(
        () => hasCheckpointPhases(values.phases),
        [values.phases],
    )
    const normalizedChallengeStatus = useMemo(
        () => normalizeStatus(values.status) || normalizeStatus(props.challenge?.status),
        [
            props.challenge?.status,
            values.status,
        ],
    )
    const isChallengeCreated = !!currentChallengeId
    const isFunChallengeSelected = values.funChallenge === true
    const showFunChallengeField = isMarathonMatchChallengeSelected
    const showMarathonMatchScorerSection = isMarathonMatchChallengeSelected && isChallengeCreated
    const showPrizesAndBillingSection = !isFunChallengeSelected
    const usesManualReviewers = useMemo(
        (): boolean => shouldUseManualReviewers({
            isMarathonMatchChallenge: isMarathonMatchChallengeSelected,
            isTaskChallenge: isTaskChallengeSelected,
        }),
        [
            isMarathonMatchChallengeSelected,
            isTaskChallengeSelected,
        ],
    )
    const isScorerBlockingChallengeActions = showMarathonMatchScorerSection
        && (scorerHasUnsavedChanges || scorerHasError)
    const getPersistedAssignmentValue = useCallback((
        fallbackValue: string | undefined,
        roleNames: readonly string[],
        valueField: ResourceAssignmentValueField,
        resourcesOverride?: typeof challengeResources,
        resourceRolesOverride?: typeof resourceRoles,
    ): string | undefined => resolveResourceAssignmentValue({
        fallbackValue,
        resourceRoles: resourceRolesOverride || resourceRoles,
        resources: resourcesOverride || challengeResources,
        roleNames,
        valueField,
    }), [
        challengeResources,
        resourceRoles,
    ])
    const isTaskSingleAssignmentChallenge = useCallback((
        formData: ChallengeEditorFormData,
        resourcesOverride?: typeof challengeResources,
        resourceRolesOverride?: typeof resourceRoles,
    ): boolean => {
        if (formData.legacy?.isTask === true || isTaskChallengeSelected) {
            return true
        }

        return !!getPersistedAssignmentValue(
            getSingleAssignmentFieldValue(formData, 'reviewer'),
            TASK_REVIEWER_RESOURCE_ROLE_NAMES,
            'memberHandle',
            resourcesOverride,
            resourceRolesOverride,
        ) || !!getPersistedAssignmentValue(
            getSingleAssignmentFieldValue(formData, 'assignedMemberId'),
            SUBMITTER_RESOURCE_ROLE_NAMES,
            'memberId',
            resourcesOverride,
            resourceRolesOverride,
        )
    }, [
        getPersistedAssignmentValue,
        isTaskChallengeSelected,
    ])
    const applyPersistedSingleAssignments = useCallback((
        formData: ChallengeEditorFormData,
        resourcesOverride?: typeof challengeResources,
        resourceRolesOverride?: typeof resourceRoles,
    ): ChallengeEditorFormData => {
        const nextFormData: ChallengeEditorFormData = {
            ...formData,
            copilot: getPersistedAssignmentValue(
                getSingleAssignmentFieldValue(formData, 'copilot'),
                COPILOT_RESOURCE_ROLE_NAMES,
                'memberHandle',
                resourcesOverride,
                resourceRolesOverride,
            ),
        }

        if (!isTaskSingleAssignmentChallenge(formData, resourcesOverride, resourceRolesOverride)) {
            nextFormData.assignedMemberId = undefined
            nextFormData.reviewer = undefined

            return nextFormData
        }

        nextFormData.assignedMemberId = getPersistedAssignmentValue(
            getSingleAssignmentFieldValue(formData, 'assignedMemberId'),
            SUBMITTER_RESOURCE_ROLE_NAMES,
            'memberId',
            resourcesOverride,
            resourceRolesOverride,
        )
        nextFormData.reviewer = getPersistedAssignmentValue(
            getSingleAssignmentFieldValue(formData, 'reviewer'),
            TASK_REVIEWER_RESOURCE_ROLE_NAMES,
            'memberHandle',
            resourcesOverride,
            resourceRolesOverride,
        )

        return nextFormData
    }, [
        getPersistedAssignmentValue,
        isTaskSingleAssignmentChallenge,
    ])
    const loadSingleAssignmentResourceRoles = useCallback(
        async (): Promise<typeof resourceRoles> => (
            resourceRoles.length
                ? resourceRoles
                : fetchResourceRoles()
        ),
        [resourceRoles],
    )
    const loadSingleAssignmentResources = useCallback(
        async (challengeId: string): Promise<typeof challengeResources> => (
            challengeResourcesResult.isLoading
            || currentChallengeId !== challengeId
                ? fetchResources(challengeId)
                : challengeResources
        ),
        [
            challengeResources,
            challengeResourcesResult.isLoading,
            currentChallengeId,
        ],
    )
    const syncSingleAssignmentResource = useCallback(async (
        params: SyncSingleAssignmentResourceParams,
    ): Promise<void> => {
        const resolvedResourceRoles = await loadSingleAssignmentResourceRoles()
        const resolvedResources = await loadSingleAssignmentResources(params.challengeId)
        const currentValue = resolveResourceAssignmentValue({
            resourceRoles: resolvedResourceRoles,
            resources: resolvedResources,
            roleNames: params.roleNames,
            valueField: params.valueField,
        })
        const normalizedCurrentValue = normalizeTextValue(currentValue)
        const normalizedNextValue = normalizeTextValue(params.nextValue)
        const role = findMatchingResourceRole(resolvedResourceRoles, params.roleNames)

        if (hasSameNormalizedValue(normalizedCurrentValue, normalizedNextValue)) {
            return
        }

        if (!role) {
            if (!normalizedCurrentValue && !normalizedNextValue) {
                return
            }

            throw new Error(`Unable to find resource role for ${params.roleNames.join(' / ')}`)
        }

        if (normalizedCurrentValue) {
            await deleteResource(buildSingleAssignmentPayload(
                params.challengeId,
                role.id,
                params.valueField,
                normalizedCurrentValue,
            ))
        }

        if (!normalizedNextValue) {
            return
        }

        try {
            await createResource(buildSingleAssignmentPayload(
                params.challengeId,
                role.id,
                params.valueField,
                normalizedNextValue,
            ))
        } catch (error) {
            if (normalizedCurrentValue) {
                try {
                    await createResource(buildSingleAssignmentPayload(
                        params.challengeId,
                        role.id,
                        params.valueField,
                        normalizedCurrentValue,
                    ))
                } catch {
                    // Preserve the original error when rollback also fails.
                }
            }

            throw error
        }
    }, [
        loadSingleAssignmentResourceRoles,
        loadSingleAssignmentResources,
    ])
    const syncDraftSingleAssignments = useCallback(async (
        challengeId: string,
        formData: ChallengeEditorFormData,
    ): Promise<void> => {
        const resourceSyncOperations = getSingleAssignmentConfigs(
            isTaskSingleAssignmentChallenge(formData),
        )
            .map(config => {
                const nextValue = getSingleAssignmentFieldValue(formData, config.fieldName)
                const persistedValue = getPersistedAssignmentValue(
                    undefined,
                    config.roleNames,
                    config.valueField,
                )

                return hasSameNormalizedValue(nextValue, persistedValue)
                    ? undefined
                    : syncSingleAssignmentResource({
                        challengeId,
                        nextValue,
                        roleNames: config.roleNames,
                        valueField: config.valueField,
                    })
            })
            .filter((operation): operation is Promise<void> => !!operation)

        if (resourceSyncOperations.length === 0) {
            return
        }

        await Promise.all(resourceSyncOperations)
        await mutateChallengeResources()
    }, [
        getPersistedAssignmentValue,
        isTaskSingleAssignmentChallenge,
        mutateChallengeResources,
        syncSingleAssignmentResource,
    ])

    const handleScorerConfigChange = useCallback(
        (hasUnsavedChanges: boolean, hasError: boolean): void => {
            setScorerHasUnsavedChanges(hasUnsavedChanges)
            setScorerHasError(hasError)
        },
        [],
    )

    useEffect(() => {
        if (!onSavingChange) {
            return undefined
        }

        onSavingChange(isSaving)

        return () => {
            onSavingChange(false)
        }
    }, [
        isSaving,
        onSavingChange,
    ])

    useEffect(() => {
        let isActive = true

        setCurrentChallengeId(props.challenge?.id)
        defaultedDiscussionForumTypeIdRef.current = undefined
        const baseFormData = transformChallengeToFormData(props.challenge)
        const challengeId = props.challenge?.id

        if (!challengeId) {
            reset(baseFormData)

            return () => {
                isActive = false
            }
        }

        Promise.all([
            fetchResources(challengeId),
            resourceRoles.length
                ? Promise.resolve(resourceRoles)
                : fetchResourceRoles(),
        ])
            .then(([
                fetchedResources,
                fetchedResourceRoles,
            ]) => {
                if (!isActive) {
                    return
                }

                reset(applyPersistedSingleAssignments(
                    baseFormData,
                    fetchedResources,
                    fetchedResourceRoles,
                ))
            })
            .catch(() => {
                if (!isActive) {
                    return
                }

                reset(baseFormData)
            })

        return () => {
            isActive = false
        }
    }, [
        applyPersistedSingleAssignments,
        props.challenge,
        reset,
        resourceRoles,
    ])

    useEffect(() => {
        if (
            !currentChallengeId
            || formState.isDirty
            || challengeResourcesResult.isLoading
            || resourceRolesResult.isLoading
        ) {
            return
        }

        const currentFormValues = getValues()
        const persistedValues = applyPersistedSingleAssignments(currentFormValues)

        getSingleAssignmentConfigs(isTaskSingleAssignmentChallenge(currentFormValues))
            .forEach(config => {
                const currentValue = getSingleAssignmentFieldValue(currentFormValues, config.fieldName)
                const persistedValue = getSingleAssignmentFieldValue(persistedValues, config.fieldName)

                if (hasSameNormalizedValue(currentValue, persistedValue)) {
                    return
                }

                setValue(config.fieldName, persistedValue, {
                    shouldDirty: false,
                    shouldValidate: true,
                })
            })
    }, [
        applyPersistedSingleAssignments,
        currentChallengeId,
        formState.isDirty,
        getValues,
        isTaskSingleAssignmentChallenge,
        resourceRolesResult.isLoading,
        setValue,
        challengeResourcesResult.isLoading,
    ])

    useEffect(() => {
        const normalizedTypeId = values.typeId?.trim()

        if (!normalizedTypeId) {
            defaultedDiscussionForumTypeIdRef.current = undefined
            return
        }

        if (currentChallengeId) {
            defaultedDiscussionForumTypeIdRef.current = normalizedTypeId
            return
        }

        if (!selectedChallengeType || selectedChallengeType.id !== normalizedTypeId) {
            return
        }

        if (defaultedDiscussionForumTypeIdRef.current === normalizedTypeId) {
            return
        }

        defaultedDiscussionForumTypeIdRef.current = normalizedTypeId
        setValue('discussionForum', !isTaskChallengeType(selectedChallengeType), {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        currentChallengeId,
        selectedChallengeType,
        setValue,
        values.typeId,
    ])

    useEffect(() => {
        setValue('legacy.isTask', isTaskChallengeSelected, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        isTaskChallengeSelected,
        setValue,
    ])

    useEffect(() => {
        if (showDesignWorkTypeField || !values.workType) {
            return
        }

        setValue('workType', undefined, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        setValue,
        showDesignWorkTypeField,
        values.workType,
    ])

    useEffect(() => {
        if (isChallengeCreated || isMarathonMatchChallengeSelected || values.funChallenge !== true) {
            return
        }

        setValue('funChallenge', false, {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        isChallengeCreated,
        isMarathonMatchChallengeSelected,
        setValue,
        values.funChallenge,
    ])

    useEffect(() => {
        if (showCheckpointPrizes) {
            return
        }

        if (!Array.isArray(values.prizeSets)) {
            return
        }

        const hasCheckpointPrizeSet = values.prizeSets
            .some(prizeSet => prizeSet?.type === PRIZE_SET_TYPES.CHECKPOINT)

        if (!hasCheckpointPrizeSet) {
            return
        }

        setValue('prizeSets', values.prizeSets
            .filter(prizeSet => prizeSet?.type !== PRIZE_SET_TYPES.CHECKPOINT), {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        setValue,
        showCheckpointPrizes,
        values.prizeSets,
    ])

    useEffect(() => {
        if (showMarathonMatchScorerSection) {
            return
        }

        setScorerHasUnsavedChanges(false)
        setScorerHasError(false)
    }, [showMarathonMatchScorerSection])

    useEffect(() => {
        if (!saveValidationError || !formState.isValid) {
            return
        }

        setSaveValidationError(undefined)
    }, [formState.isValid, saveValidationError])

    useEffect(() => {
        if (usesManualReviewers) {
            return
        }

        clearErrors('reviewers')

        if (!Array.isArray(values.reviewers) || values.reviewers.length === 0) {
            return
        }

        // Task and marathon match challenges use dedicated reviewer flows instead.
        setValue('reviewers', [], {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        clearErrors,
        setValue,
        usesManualReviewers,
        values.reviewers,
    ])

    const createNewChallenge = useCallback(
        async (): Promise<void> => {
            const isBasicInfoValid = await trigger([
                'name',
                'trackId',
                'typeId',
                'roundType',
            ])

            if (!isBasicInfoValid) {
                return
            }

            setIsSaving(true)
            setSaveStatus('saving')
            setSaveError(undefined)
            setSaveValidationError(undefined)

            try {
                const formData = getValues()
                const selectedRoundType = getCreateRoundType(formData.roundType, formElementRef.current)
                const createProjectId = normalizeProjectId(formData.projectId) || fallbackProjectId
                if (!createProjectId) {
                    throw new Error('Project id is required to create challenge')
                }

                const timelineTemplateId = resolveCreateTimelineTemplateId({
                    roundType: selectedRoundType,
                    timelineTemplates,
                    trackId: formData.trackId,
                    typeId: formData.typeId,
                })
                if (selectedRoundType === ROUND_TYPES.TWO_ROUNDS && !timelineTemplateId) {
                    throw new Error(
                        'Unable to find a two-round timeline template for the selected track and type',
                    )
                }

                const tags = mergeTagsWithDesignWorkType(formData.tags, formData.workType)
                const createdChallenge = await createChallenge({
                    funChallenge: formData.funChallenge === true,
                    name: formData.name,
                    projectId: createProjectId,
                    status: CHALLENGE_STATUS.NEW,
                    tags: tags.length
                        ? tags
                        : undefined,
                    timelineTemplateId,
                    trackId: formData.trackId,
                    typeId: formData.typeId,
                })
                const savedChallenge = await fetchChallenge(createdChallenge.id)
                    .catch(() => createdChallenge)
                const nextValues = transformChallengeToFormData(savedChallenge)
                const normalizedWorkType = normalizeDesignWorkType(formData.workType)

                if (selectedRoundType === ROUND_TYPES.TWO_ROUNDS && nextValues.roundType !== ROUND_TYPES.TWO_ROUNDS) {
                    nextValues.roundType = selectedRoundType
                }

                if (!nextValues.timelineTemplateId && timelineTemplateId) {
                    nextValues.timelineTemplateId = timelineTemplateId
                }

                if (normalizedWorkType) {
                    nextValues.workType = normalizedWorkType
                    nextValues.tags = mergeTagsWithDesignWorkType(nextValues.tags, normalizedWorkType)
                }

                const savedAt = new Date()

                setCurrentChallengeId(savedChallenge.id)
                setLastSaved(savedAt)
                setSaveStatus('saved')

                reset(nextValues)
                showSuccessToast('Challenge created successfully')
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to create challenge'

                setSaveError(errorMessage)
                setSaveStatus('error')
                showErrorToast('Failed to create challenge')
            } finally {
                setIsSaving(false)
            }
        },
        [
            fallbackProjectId,
            getValues,
            reset,
            timelineTemplates,
            trigger,
        ],
    )

    const saveChallenge = useCallback(
        async (
            formData: ChallengeEditorFormData,
            options: SaveChallengeOptions = {},
        ): Promise<void> => {
            if (!currentChallengeId) {
                throw new Error('Challenge id is required to save challenge')
            }

            if (!options.isAutosave) {
                setIsSaving(true)
                setSaveStatus('saving')
            }

            setSaveError(undefined)
            setSaveValidationError(undefined)

            try {
                const {
                    isSaveAsDraft,
                    payloadStatus,
                }: SaveStatusMetadata = getSaveStatusMetadata(formData.status, options)
                const isTaskChallenge = isTaskSingleAssignmentChallenge(formData)
                const payload = transformFormDataToChallenge({
                    ...formData,
                    reviewers: usesManualReviewers
                        ? formData.reviewers
                        : [],
                    status: payloadStatus,
                })
                const savedChallenge = await patchChallenge(currentChallengeId, payload)
                await syncDraftSingleAssignments(currentChallengeId, formData)

                const nextValues = applySingleAssignmentFieldValues(
                    applyPersistedSingleAssignments(
                        transformChallengeToFormData(savedChallenge),
                    ),
                    formData,
                    isTaskChallenge,
                )
                const savedAt = new Date()

                setCurrentChallengeId(savedChallenge.id)
                setLastSaved(savedAt)
                setSaveStatus('saved')

                reset(nextValues)
                onChallengeStatusChange?.(normalizeStatus(nextValues.status))

                if (!options.isAutosave) {
                    showSuccessToast(getSaveSuccessMessage(isSaveAsDraft, options))
                }

                if (isSaveAsDraft && !isEditMode) {
                    navigate(`/challenges/${encodeURIComponent(savedChallenge.id)}/edit`)
                }
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Failed to save challenge'

                setSaveError(errorMessage)
                setSaveStatus('error')

                if (!options.isAutosave) {
                    showErrorToast('Failed to save challenge')
                }

                throw error
            } finally {
                if (!options.isAutosave) {
                    setIsSaving(false)
                }
            }
        },
        [
            applyPersistedSingleAssignments,
            currentChallengeId,
            isEditMode,
            isTaskSingleAssignmentChallenge,
            navigate,
            onChallengeStatusChange,
            reset,
            syncDraftSingleAssignments,
            usesManualReviewers,
        ],
    )

    const launchChallenge = useCallback(async (): Promise<void> => {
        if (isScorerBlockingChallengeActions) {
            showErrorToast('Save a valid scorer configuration before launching the challenge')
            throw new Error('Scorer configuration is blocking challenge launch')
        }

        await handleSubmit(
            async formData => {
                await saveChallenge(formData, {
                    statusOverride: CHALLENGE_STATUS.ACTIVE,
                    successMessage: 'Challenge launched successfully',
                })
            },
            () => {
                showErrorToast('Please fix validation errors before launching')
                throw new Error('Challenge launch validation failed')
            },
        )()
    }, [
        handleSubmit,
        isScorerBlockingChallengeActions,
        saveChallenge,
    ])

    useEffect(() => {
        if (!onRegisterLaunchAction) {
            return undefined
        }

        onRegisterLaunchAction(currentChallengeId && !isScorerBlockingChallengeActions
            ? launchChallenge
            : undefined)

        return () => {
            onRegisterLaunchAction(undefined)
        }
    }, [
        currentChallengeId,
        isScorerBlockingChallengeActions,
        launchChallenge,
        onRegisterLaunchAction,
    ])

    const autosaveResult = useAutosave<ChallengeEditorFormData>({
        delay: AUTOSAVE_DELAY_MS,
        enabled: !!currentChallengeId
            && formState.isDirty
            && formState.isValid
            && !isScorerBlockingChallengeActions
            && normalizedChallengeStatus !== CHALLENGE_STATUS.NEW,
        formValues: values,
        onSave: async formData => {
            await saveChallenge(formData, {
                isAutosave: true,
            })
        },
    })

    useEffect(() => {
        if (autosaveResult.saveStatus === 'idle') {
            return
        }

        setSaveStatus(autosaveResult.saveStatus)

        if (autosaveResult.lastSaved) {
            setLastSaved(autosaveResult.lastSaved)
        }
    }, [autosaveResult.lastSaved, autosaveResult.saveStatus])

    const onSubmit = useCallback(
        async (formData: ChallengeEditorFormData): Promise<void> => {
            const {
                isSaveAsDraft,
            }: SaveStatusMetadata = getSaveStatusMetadata(formData.status, {})

            if (isScorerBlockingChallengeActions) {
                showErrorToast('Save a valid scorer configuration before saving the challenge')
                return
            }

            if (isSaveAsDraft) {
                const reviewerValidationError = getReviewerValidationError(formData, {
                    challengeTypeAbbreviation: resolvedChallengeTypeAbbreviation,
                    challengeTypeName: resolvedChallengeTypeName,
                    isTaskChallenge: isTaskChallengeSelected,
                    requiredReviewersErrorMessage:
                        'Reviewers are required for configured review phases before saving as draft.',
                })

                if (reviewerValidationError) {
                    setError('reviewers', {
                        message: reviewerValidationError,
                        type: 'manual',
                    })
                    setSaveStatus('idle')
                    setSaveValidationError(reviewerValidationError)
                    showErrorToast(reviewerValidationError)
                    return
                }
            }

            clearErrors('reviewers')
            await saveChallenge(formData)
        },
        [
            clearErrors,
            isScorerBlockingChallengeActions,
            isTaskChallengeSelected,
            resolvedChallengeTypeAbbreviation,
            resolvedChallengeTypeName,
            saveChallenge,
            setError,
        ],
    )

    const onInvalidSubmit = useCallback((): void => {
        setSaveStatus('idle')
        setSaveValidationError(SAVE_VALIDATION_ERROR_MESSAGE)
    }, [])

    const statusText = useMemo(
        () => getStatusText(isSaving ? 'saving' : saveStatus),
        [isSaving, saveStatus],
    )
    const submitButtonLabel = useMemo(
        () => getSubmitButtonLabel(normalizedChallengeStatus),
        [normalizedChallengeStatus],
    )

    return (
        <FormProvider {...formMethods}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} ref={formElementRef}>
                <input type='hidden' {...formMethods.register('id')} />
                <input type='hidden' {...formMethods.register('status')} />

                <section className={styles.section}>
                    <h3 className={styles.sectionTitle}>Basic Information</h3>
                    <div className={styles.grid}>
                        <ChallengeNameField />
                        <ChallengeTrackField disabled={isChallengeCreated} />
                        <ChallengeTypeField disabled={isChallengeCreated} />
                        {showFunChallengeField
                            ? <FunChallengeField />
                            : undefined}
                        {showRoundTypeField
                            ? <RoundTypeField disabled={isChallengeCreated} />
                            : undefined}
                        {showDesignWorkTypeField
                            ? <DesignWorkTypeField disabled={isChallengeCreated} />
                            : undefined}
                    </div>
                </section>

                {!isChallengeCreated
                    ? (
                        <div className={styles.footer}>
                            <div className={styles.statusArea}>
                                {statusText
                                    ? <span className={styles.statusText}>{statusText}</span>
                                    : undefined}
                                <span className={styles.lastSaved}>{formatLastSaved(lastSaved)}</span>
                                {saveValidationError
                                    ? <span className={styles.errorText}>{saveValidationError}</span>
                                    : undefined}
                                {saveError
                                    ? <span className={styles.errorText}>{saveError}</span>
                                    : undefined}
                            </div>

                            <div className={styles.actions}>
                                <Link className={styles.cancelLink} to={challengesListPath}>
                                    Cancel
                                </Link>
                                <Button
                                    disabled={isSaving}
                                    label='New'
                                    onClick={createNewChallenge}
                                    primary
                                    size='lg'
                                    type='button'
                                />
                            </div>
                        </div>
                    )
                    : undefined}

                {isChallengeCreated
                    ? (
                        <>
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Specification</h3>
                                <div className={styles.block}>
                                    <ChallengeDescriptionField />
                                    <ChallengePrivateDescriptionField />
                                </div>
                            </section>

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Metadata</h3>
                                <div className={styles.grid}>
                                    <ChallengeTagsField />
                                    <ChallengeSkillsField />
                                </div>
                            </section>

                            {showPrizesAndBillingSection
                                ? (
                                    <section className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Prizes &amp; Billing</h3>
                                        <div className={styles.prizesBillingGrid}>
                                            <div className={styles.prizeInputs}>
                                                <div className={styles.challengePrizesColumn}>
                                                    <ChallengePrizesField
                                                        challengeTypeAbbreviation={resolvedChallengeTypeAbbreviation}
                                                        challengeTypeName={resolvedChallengeTypeName}
                                                        name='prizeSets'
                                                    />
                                                    {showCheckpointPrizes
                                                        ? <CheckpointPrizesField name='prizeSets' />
                                                        : undefined}
                                                </div>
                                                <div className={styles.copilotFeeColumn}>
                                                    <CopilotFeeField name='prizeSets' />
                                                </div>
                                            </div>
                                            <div className={styles.billingSummary}>
                                                <ReviewCostField name='prizeSets' />
                                                <ChallengeFeeField challengeFee={values.challengeFee} />
                                                <ChallengeTotalField />
                                            </div>
                                        </div>
                                    </section>
                                )
                                : undefined}

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Timeline &amp; Schedule</h3>
                                <div className={styles.block}>
                                    <ChallengeScheduleSection />
                                </div>
                            </section>

                            {showMarathonMatchScorerSection
                                ? (
                                    <section className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Scorer</h3>
                                        <div className={styles.block}>
                                            <MarathonMatchScorerSection
                                                challengeId={currentChallengeId || ''}
                                                onScorerConfigChange={handleScorerConfigChange}
                                                phases={values.phases ?? []}
                                            />
                                        </div>
                                    </section>
                                )
                                : undefined}

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Advanced Options</h3>
                                <div className={styles.grid}>
                                    {isTaskChallengeSelected
                                        ? <AssignedMemberField />
                                        : undefined}
                                    <CopilotField projectId={fallbackProjectId} />
                                    {isTaskChallengeSelected
                                        ? (
                                            <ReviewTypeField
                                                isTaskChallenge={isTaskChallengeSelected}
                                                projectId={fallbackProjectId}
                                            />
                                        )
                                        : undefined}
                                    <GroupsField />
                                    <TermsField />
                                    <NDAField />
                                    <FormCheckboxField
                                        label='Wipro Allowed'
                                        name='wiproAllowed'
                                    />
                                </div>
                            </section>

                            {showSubmissionSettingsSection
                                ? (
                                    <section className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Submission Settings</h3>
                                        <div className={styles.grid}>
                                            <SubmissionVisibilityField />
                                            <StockArtsField />
                                            <MaximumSubmissionsField />
                                        </div>
                                    </section>
                                )
                                : undefined}

                            {usesManualReviewers
                                ? (
                                    <section className={styles.section}>
                                        <h3 className={styles.sectionTitle}>Reviewers</h3>
                                        <div className={styles.block}>
                                            <ReviewersField />
                                        </div>
                                    </section>
                                )
                                : undefined}

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Attachments</h3>
                                <div className={styles.block}>
                                    <AttachmentsField />
                                </div>
                            </section>

                            <div className={styles.footer}>
                                <div className={styles.statusArea}>
                                    {statusText
                                        ? <span className={styles.statusText}>{statusText}</span>
                                        : undefined}
                                    <span className={styles.lastSaved}>{formatLastSaved(lastSaved)}</span>
                                    {saveValidationError
                                        ? <span className={styles.errorText}>{saveValidationError}</span>
                                        : undefined}
                                    {saveError
                                        ? <span className={styles.errorText}>{saveError}</span>
                                        : undefined}
                                    {isScorerBlockingChallengeActions
                                        ? (
                                            <span className={styles.warningText}>
                                                The scorer configuration must be saved and valid before the
                                                {' '}
                                                challenge can be saved or launched.
                                            </span>
                                        )
                                        : undefined}
                                </div>

                                <div className={styles.actions}>
                                    <Link className={styles.cancelLink} to={challengesListPath}>
                                        Cancel
                                    </Link>
                                    <Button
                                        disabled={
                                            (!formState.isDirty || isSaving)
                                            || isScorerBlockingChallengeActions
                                        }
                                        label={submitButtonLabel}
                                        primary
                                        size='lg'
                                        type='submit'
                                    />
                                    {props.canLaunchChallenge && onLaunchOpen
                                        ? (
                                            <Button
                                                className={styles.launchButton}
                                                disabled={props.isLaunchDisabled}
                                                label={props.launchButtonLabel || 'Launch'}
                                                onClick={onLaunchOpen}
                                                primary
                                                size='lg'
                                                type='button'
                                            />
                                        )
                                        : undefined}
                                </div>
                            </div>
                        </>
                    )
                    : undefined}
            </form>
        </FormProvider>
    )
}

export default ChallengeEditorForm
