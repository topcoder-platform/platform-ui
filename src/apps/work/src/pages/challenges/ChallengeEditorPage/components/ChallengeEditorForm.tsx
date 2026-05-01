import {
    ChangeEvent,
    FC,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
    Link,
    useLocation,
    useNavigate,
} from 'react-router-dom'

import { yupResolver } from '@hookform/resolvers/yup'
import { Button } from '~/libs/ui'

import { FormCheckboxField } from '../../../../lib/components/form'
import {
    CHALLENGE_APPROVAL_STATUS,
    CHALLENGE_STATUS,
    CHALLENGE_TRACKS,
    CREATE_FORUM_TYPE_IDS,
} from '../../../../lib/constants'
import { WorkAppContext } from '../../../../lib/contexts'
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
    useFetchProjectBillingAccount,
    useFetchResourceRoles,
    useFetchResources,
    useFetchTimelineTemplates,
} from '../../../../lib/hooks'
import {
    Challenge,
    ChallengeEditorFormData,
    ChallengePhase,
    ChallengeType,
    Resource,
    ResourceRole,
    Reviewer,
} from '../../../../lib/models'
import {
    challengeEditorSchema,
} from '../../../../lib/schemas/challenge-editor.schema'
import {
    createChallenge,
    createResource,
    deleteResource,
    fetchAiReviewConfigByChallenge,
    fetchAiReviewTemplates,
    fetchChallenge,
    fetchProfile,
    fetchProjectBillingAccount,
    fetchResourceRoles,
    fetchResources,
    fetchWorkflows,
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
    getProjectBillingAccountChallengeErrorMessage,
    getProjectBillingAccountChallengeIssue,
} from '../../../../lib/utils/project-billing-account.utils'
import {
    resolveMatchingChallengeViewPath,
} from '../ChallengeEditorPage.utils'

import {
    AssignedMemberField,
} from './AssignedMemberField'
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
    buildChallengeTypeOptions,
} from './ChallengeTypeField.utils'
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
    FinalDeliverablesField,
} from './FinalDeliverablesField'
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
    applyProjectBillingToChallengeFormData,
    COPILOT_RESOURCE_ROLE_NAMES,
    findMatchingResourceRole,
    hasSameChallengeBillingInfo,
    mergeChallengeBillingWithProjectBilling,
    resolveCreateRoundType,
    resolveCreateTimelineTemplateId,
    resolveResourceAssignmentValue,
    ResourceAssignmentValueField,
    shouldTreatChallengeAsTask,
    shouldUseManualReviewers,
    SUBMITTER_RESOURCE_ROLE_NAMES,
    TASK_REVIEWER_RESOURCE_ROLE_NAMES,
} from './ChallengeEditorForm.utils'
import {
    buildAssignedResourcesByReviewer,
} from './ReviewersField/reviewerAssignments.utils'
import styles from './ChallengeEditorForm.module.scss'

interface ChallengeEditorFormProps {
    canLaunchChallenge?: boolean
    challenge?: Challenge
    isLaunchDisabled?: boolean
    isEditMode?: boolean
    isReadOnly?: boolean
    launchButtonLabel?: string
    onChallengeCreated?: (
        challenge: Pick<Challenge, 'id' | 'name' | 'projectId' | 'status'>,
    ) => void
    onChallengeStatusChange?: (status?: string) => void
    onLaunchOpen?: () => void
    onRegisterLaunchAction?: (action: (() => Promise<void>) | undefined) => void
    onSavingChange?: (isSaving: boolean) => void
    projectId?: string
}

interface SaveChallengeOptions {
    isAutosave?: boolean
    redirectToViewOnSuccess?: boolean
    statusOverride?: string
    successMessage?: string
}

interface SaveStatusMetadata {
    isSaveAsDraft: boolean
    payloadStatus?: string
}

interface ResolvePostSaveNavigationPathParams {
    isEditMode?: boolean
    isSaveAsDraft: boolean
    projectId?: string
    redirectToViewOnSuccess?: boolean
    savedChallengeId: string
    viewModePath?: string
}

type SingleAssignmentFieldName = 'assignedMemberId' | 'copilot' | 'reviewer'

interface SingleAssignmentConfig {
    fieldName: SingleAssignmentFieldName
    roleNames: readonly string[]
    resourceValueFields?: readonly ResourceAssignmentValueField[]
    valueField: ResourceAssignmentValueField
}

interface SyncSingleAssignmentResourceParams extends Omit<SingleAssignmentConfig, 'fieldName'> {
    challengeId: string
    nextValue?: string
    resourceRolesOverride?: ResourceRole[]
    resourcesOverride?: Resource[]
}

interface PersistCreatedChallengeCopilotParams {
    challengeId: string
    formData: ChallengeEditorFormData
    syncSingleAssignmentResource: (params: SyncSingleAssignmentResourceParams) => Promise<void>
}

interface PersistCreatedChallengeCopilotResult {
    resetSourceFormData: ChallengeEditorFormData
    warningMessage?: string
}

const SAVE_VALIDATION_ERROR_MESSAGE = 'Please fix validation errors before saving.'
const DESIGN_WORK_TYPE_REQUIRED_MESSAGE = 'Select a work type'
const TASK_ASSIGNED_MEMBER_REQUIRED_FOR_LAUNCH_MESSAGE
    = 'Assign a member before launching a task challenge.'
const APPROVAL_REQUIRED_FOR_LAUNCH_MESSAGE
    = 'Challenge launch is blocked until budget approval is Approved.'
const DISABLED_AI_WORKFLOW_FOR_CHALLENGE_ACTION_MESSAGE
    = 'One or more saved AI workflows were disabled. '
    + 'Update the AI workflow configuration before saving or launching this challenge.'
const DISABLED_AI_TEMPLATE_FOR_CHALLENGE_ACTION_MESSAGE
    = 'The saved AI review template was disabled. '
    + 'Update the AI template selection before saving or launching this challenge.'
const CHALLENGE_TYPE_CHALLENGE_ABBREVIATION = 'CH'
const CHALLENGE_TYPE_CHALLENGE_NAME = 'CHALLENGE'
const CHALLENGE_TYPE_FIRST_2_FINISH_ABBREVIATION = 'F2F'
const CHALLENGE_TYPE_FIRST_2_FINISH_NAME = 'FIRST2FINISH'
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
    resourceValueFields: [
        'memberHandle',
        'memberId',
    ],
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

/**
 * Builds the initial forum discussion payload for newly created challenges.
 *
 * This keeps the new work app aligned with the legacy work-manager flow by sending the
 * `discussions` payload on the first create request whenever the selected challenge type is
 * forum-enabled. The helper is used only by the draft challenge creation path.
 *
 * @param params.challengeName challenge name used to generate the discussion title.
 * @param params.challengeTypeId challenge type id selected in the create form.
 * @param params.discussionForum optional form-level forum toggle state.
 * @param params.selectedChallengeType resolved challenge type metadata for task detection.
 * @returns the challenge discussion payload for forum-enabled challenge types, or `undefined`
 * when no discussion should be created.
 * @throws Does not throw.
 */
function buildCreateChallengeDiscussions(params: {
    challengeName: string
    challengeTypeId: string
    discussionForum?: boolean
    selectedChallengeType?: ChallengeType
}): Challenge['discussions'] | undefined {
    const shouldCreateForumDiscussion = CREATE_FORUM_TYPE_IDS.includes(params.challengeTypeId)
        && (
            typeof params.discussionForum === 'boolean'
                ? params.discussionForum
                : !isTaskChallengeType(params.selectedChallengeType)
        )

    if (!shouldCreateForumDiscussion) {
        return undefined
    }

    return [{
        name: `${params.challengeName} Discussion`,
        provider: 'vanilla',
        type: 'CHALLENGE',
    }]
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

/**
 * Persists the basic-information copilot selection right after the initial draft is created.
 *
 * The first create request only sends the minimal challenge payload, so the selected copilot must
 * be synchronized separately through the `Copilot` resource assignment before the form resets from
 * fetched challenge data.
 *
 * @param params.challengeId newly created challenge id.
 * @param params.formData create-form values that may already contain a selected copilot.
 * @param params.syncSingleAssignmentResource helper that writes the resource assignment.
 * @returns A promise that resolves when the copilot resource has been synchronized, or immediately
 * when no copilot is selected.
 */
async function persistCreatedChallengeCopilot(
    params: PersistCreatedChallengeCopilotParams,
): Promise<void> {
    const selectedCopilot = getSingleAssignmentFieldValue(
        params.formData,
        COPILOT_ASSIGNMENT_CONFIG.fieldName,
    )

    if (!selectedCopilot) {
        return
    }

    await params.syncSingleAssignmentResource({
        challengeId: params.challengeId,
        nextValue: selectedCopilot,
        resourceValueFields: COPILOT_ASSIGNMENT_CONFIG.resourceValueFields,
        roleNames: COPILOT_ASSIGNMENT_CONFIG.roleNames,
        valueField: COPILOT_ASSIGNMENT_CONFIG.valueField,
    })
}

/**
 * Computes which create-form values should be restored after the draft challenge is created.
 *
 * The copilot assignment is persisted as a follow-up resource write after the draft exists. When
 * that write fails, the draft should still open in edit mode but the optimistic copilot value
 * should be cleared so the form does not imply that the assignment was saved.
 *
 * @param params challenge id and create-form values for the newly created draft.
 * @returns the reset source form data plus an optional warning for a failed copilot sync.
 */
async function resolveCreatedChallengeResetSourceFormData(
    params: PersistCreatedChallengeCopilotParams,
): Promise<PersistCreatedChallengeCopilotResult> {
    try {
        await persistCreatedChallengeCopilot(params)

        return {
            resetSourceFormData: params.formData,
        }
    } catch {
        return {
            resetSourceFormData: {
                ...params.formData,
                copilot: undefined,
            },
            warningMessage:
                'Challenge created, but the selected copilot could not be saved. Please add it again.',
        }
    }
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

/**
 * Resolves the persisted resource fields that a single-assignment sync should inspect.
 *
 * Most selectors map to one resource field, but copilot assignments may still exist as either a
 * `memberHandle` or a legacy `memberId`. The save flow shares this helper anywhere it needs to
 * compare or delete an existing single-assignment resource.
 *
 * @param config single-assignment config or sync params with the primary field and any fallbacks.
 * @returns the ordered resource fields that should be searched for an existing assignment.
 */
function getSingleAssignmentResourceValueFields(
    config: Pick<SingleAssignmentConfig, 'resourceValueFields' | 'valueField'>,
): readonly ResourceAssignmentValueField[] {
    return config.resourceValueFields || [config.valueField]
}

/**
 * Resolves the first persisted single-member resource assignment across one or more value fields.
 *
 * Challenge resources can temporarily store the same logical assignment under different payload
 * shapes while the editor migrates legacy data. The sync flow needs the original field name so it
 * can delete or restore the matching resource without creating duplicates.
 *
 * @param params resource data, accepted role names, and the resource fields to inspect.
 * @returns the matched resource value together with the field it came from, or `undefined` when no
 * persisted assignment exists.
 */
function resolvePersistedResourceAssignment(params: {
    resourceRoles: ResourceRole[]
    resources: Resource[]
    roleNames: readonly string[]
    valueFields: readonly ResourceAssignmentValueField[]
}): {
    value: string
    valueField: ResourceAssignmentValueField
} | undefined {
    for (const valueField of params.valueFields) {
        const value = resolveResourceAssignmentValue({
            fallbackValue: undefined,
            resourceRoles: params.resourceRoles,
            resources: params.resources,
            roleNames: params.roleNames,
            valueField,
        })

        if (value) {
            return {
                value,
                valueField,
            }
        }
    }

    return undefined
}

/**
 * Resolves the payload value that should be used when deleting or restoring a single assignment.
 *
 * The sync flow prefers the exact persisted field/value that was loaded from challenge resources.
 * When no resource-backed assignment exists, it falls back to the normalized in-memory value so
 * callers can still construct a valid rollback payload.
 *
 * @param currentAssignment persisted assignment matched from resources, if any.
 * @param fallbackValue normalized assignment value to use when no resource match exists.
 * @param fallbackValueField primary resource field for the assignment type.
 * @returns the field/value pair that should be sent to the resource API.
 */
function resolveSingleAssignmentResourcePayloadValue(
    currentAssignment: {
        value: string
        valueField: ResourceAssignmentValueField
    } | undefined,
    fallbackValue: string,
    fallbackValueField: ResourceAssignmentValueField,
): {
    value: string
    valueField: ResourceAssignmentValueField
} {
    if (currentAssignment) {
        return currentAssignment
    }

    return {
        value: fallbackValue,
        valueField: fallbackValueField,
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

/**
 * Returns the validation error for the design challenge work type on create.
 *
 * @param isRequired Whether the current track/type selection requires a work type.
 * @param workType The current form value for the design work type field.
 * @returns The validation message when the field is required but unset, otherwise `undefined`.
 * @remarks Used only by the new challenge flow because work type is locked after creation.
 */
function getCreateChallengeWorkTypeValidationError({
    isRequired,
    workType,
}: {
    isRequired: boolean
    workType: unknown
}): string | undefined {
    if (!isRequired) {
        return undefined
    }

    return normalizeDesignWorkType(workType)
        ? undefined
        : DESIGN_WORK_TYPE_REQUIRED_MESSAGE
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

function getAssignedMemberReviewerValidationSlots(reviewer: Reviewer | undefined): string[] {
    if (!reviewer) {
        return []
    }

    const additionalMemberIds = Array.isArray(reviewer.additionalMemberIds)
        ? reviewer.additionalMemberIds
        : []

    return [
        normalizeTextValue(reviewer.memberId) || normalizeTextValue(reviewer.handle),
        ...additionalMemberIds.map(memberId => normalizeTextValue(memberId)),
    ]
}

function getPersistedReviewerMemberIds(
    assignedReviewerResources: Resource[],
    userIdsByHandle?: Map<string, string>,
): string[] {
    return Array.from(new Set(
        assignedReviewerResources
            .map(resource => {
                const memberId = normalizeTextValue(resource.memberId)

                if (memberId) {
                    return memberId
                }

                const memberHandle = normalizeTextValue(resource.memberHandle)

                if (!memberHandle || !userIdsByHandle) {
                    return ''
                }

                return userIdsByHandle.get(memberHandle.toLowerCase()) || ''
            })
            .filter(Boolean),
    ))
}

/**
 * Backfills manual reviewer member ids from persisted challenge resources.
 *
 * Reviewer assignments for closed public opportunities are stored as resources and older
 * challenge payloads may omit the matching `memberId` fields on `reviewers`. The editable
 * human-review tab patches those ids into the form, but read-only `/view` launches do not mount
 * that tab. This helper mirrors the persisted-resource lookup at the form layer so validation and
 * launch flows see the same reviewer assignments shown in the summary UI.
 *
 * @param formData current challenge form snapshot.
 * @param resources loaded challenge resources for the current challenge.
 * @param resourceRoles loaded resource role definitions used to map review phases to resources.
 * @returns a form-data copy with missing reviewer member ids hydrated from persisted resources.
 * @remarks Only reviewers with closed public opportunities and no existing assigned member ids are
 * backfilled. Existing form assignments are preserved.
 * @throws Does not throw.
 */
function applyPersistedManualReviewerAssignments(
    formData: ChallengeEditorFormData,
    resources: Resource[],
    resourceRoles: ResourceRole[],
    userIdsByHandle?: Map<string, string>,
): ChallengeEditorFormData {
    if (!Array.isArray(formData.reviewers) || formData.reviewers.length === 0 || resourceRoles.length === 0) {
        return formData
    }

    const phaseNameById = new Map(
        (Array.isArray(formData.phases)
            ? formData.phases
            : [])
            .map(phase => {
                const phaseId = normalizeReviewerPhaseId(phase)
                const phaseName = normalizeTextValue(phase.name)

                return phaseId && phaseName
                    ? [phaseId, phaseName] as const
                    : undefined
            })
            .filter((entry): entry is readonly [string, string] => !!entry),
    )
    const humanReviewers = formData.reviewers.filter((reviewer): reviewer is Reviewer => (
        !!reviewer && !isAiReviewer(reviewer)
    ))
    const assignedResourcesByReviewer = buildAssignedResourcesByReviewer({
        getReviewerCount: getRequiredMemberReviewerCount,
        phaseNameById,
        resourceRoles,
        resources,
        reviewers: humanReviewers,
    })
    const assignedResourcesByHumanReviewer = new Map(
        humanReviewers.map((reviewer, index) => [
            reviewer,
            assignedResourcesByReviewer[index] || [],
        ] as const),
    )
    let hasChanges = false
    const reviewers = formData.reviewers.map(reviewer => {
        const assignedReviewerResources = assignedResourcesByHumanReviewer.get(reviewer) || []

        if (
            !reviewer
            || isAiReviewer(reviewer)
            || reviewer.shouldOpenOpportunity === true
            || getAssignedMemberReviewerSlots(reviewer)
                .some(Boolean)
        ) {
            return reviewer
        }

        const memberIds = getPersistedReviewerMemberIds(
            assignedReviewerResources,
            userIdsByHandle,
        )
            .slice(0, getRequiredMemberReviewerCount(reviewer))
        const assignedHandle = normalizeTextValue(reviewer.handle)
            || normalizeTextValue(assignedReviewerResources[0]?.memberHandle)
            || undefined
        const assignedRoleId = normalizeTextValue(reviewer.roleId)
            || normalizeTextValue(assignedReviewerResources[0]?.roleId)
            || undefined

        if (memberIds.length === 0 && !assignedHandle) {
            return reviewer
        }

        const [
            memberId,
            ...additionalMemberIds
        ] = memberIds

        hasChanges = true

        return {
            ...reviewer,
            additionalMemberIds: additionalMemberIds.length
                ? additionalMemberIds
                : undefined,
            handle: assignedHandle,
            memberId: memberId || undefined,
            roleId: assignedRoleId,
        }
    })

    return hasChanges
        ? {
            ...formData,
            reviewers,
        }
        : formData
}

async function hydratePersistedManualReviewerAssignments(
    formData: ChallengeEditorFormData,
    resources: Resource[],
    resourceRoles: ResourceRole[],
): Promise<ChallengeEditorFormData> {
    if (!Array.isArray(formData.reviewers) || formData.reviewers.length === 0 || resourceRoles.length === 0) {
        return formData
    }

    const phaseNameById = new Map(
        (Array.isArray(formData.phases)
            ? formData.phases
            : [])
            .map(phase => {
                const phaseId = normalizeReviewerPhaseId(phase)
                const phaseName = normalizeTextValue(phase.name)

                return phaseId && phaseName
                    ? [phaseId, phaseName] as const
                    : undefined
            })
            .filter((entry): entry is readonly [string, string] => !!entry),
    )
    const humanReviewers = formData.reviewers.filter((reviewer): reviewer is Reviewer => (
        !!reviewer && !isAiReviewer(reviewer)
    ))
    const handlesMissingUserIds = Array.from(new Set(
        buildAssignedResourcesByReviewer({
            getReviewerCount: getRequiredMemberReviewerCount,
            phaseNameById,
            resourceRoles,
            resources,
            reviewers: humanReviewers,
        })
            .flat()
            .map(resource => {
                const memberHandle = normalizeTextValue(resource.memberHandle)
                const memberId = normalizeTextValue(resource.memberId)

                return memberHandle && !memberId
                    ? memberHandle
                    : ''
            })
            .filter(Boolean),
    ))

    if (!handlesMissingUserIds.length) {
        return applyPersistedManualReviewerAssignments(formData, resources, resourceRoles)
    }

    const userIdsByHandle = new Map<string, string>()

    await Promise.all(handlesMissingUserIds.map(async handle => {
        const profile = await fetchProfile(handle)
            .catch(() => undefined)
        const userId = normalizeTextValue(profile?.userId)

        if (userId) {
            userIdsByHandle.set(handle.toLowerCase(), userId)
        }
    }))

    return applyPersistedManualReviewerAssignments(
        formData,
        resources,
        resourceRoles,
        userIdsByHandle,
    )
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
            const requiredAssignedMembers = getAssignedMemberReviewerValidationSlots(reviewer)
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

async function getDisabledAiWorkflowForActionError(
    formData: ChallengeEditorFormData,
    challengeId: string | undefined,
    challengeTrack?: string,
    challengeType?: string,
): Promise<string | undefined> {
    const selectedAiWorkflowIds = (Array.isArray(formData.reviewers)
        ? formData.reviewers
        : [])
        .map(reviewer => normalizeTextValue(reviewer?.aiWorkflowId))
        .filter(Boolean)
    const normalizedChallengeId = normalizeTextValue(challengeId)
    const persistedAiConfig = normalizedChallengeId
        ? await fetchAiReviewConfigByChallenge(normalizedChallengeId)
            .catch(() => undefined)
        : undefined
    const persistedWorkflowIds = (persistedAiConfig?.workflows || [])
        .map(workflow => normalizeTextValue(workflow.workflowId))
        .filter(Boolean)
    const configuredAiWorkflowIds = Array.from(new Set([
        ...selectedAiWorkflowIds,
        ...persistedWorkflowIds,
    ]))
    const selectedTemplateId = normalizeTextValue(persistedAiConfig?.templateId)

    if (selectedTemplateId) {
        const templates = await fetchAiReviewTemplates({
            challengeTrack,
            challengeType,
        })
        let selectedTemplate = templates.find(template => (
            normalizeTextValue(template.id) === selectedTemplateId
        ))

        if (!selectedTemplate && (challengeTrack || challengeType)) {
            const allTemplates = await fetchAiReviewTemplates()

            selectedTemplate = allTemplates.find(template => (
                normalizeTextValue(template.id) === selectedTemplateId
            ))
        }

        if (selectedTemplate?.disabled === true) {
            return DISABLED_AI_TEMPLATE_FOR_CHALLENGE_ACTION_MESSAGE
        }
    }

    if (!configuredAiWorkflowIds.length) {
        return undefined
    }

    const workflows = await fetchWorkflows()
    const workflowMapById = new Map(
        workflows.map(workflow => [
            normalizeTextValue(workflow.id),
            workflow,
        ] as const),
    )
    const hasDisabledWorkflow = configuredAiWorkflowIds.some(workflowId => {
        const matchedWorkflow = workflowMapById.get(workflowId)

        return matchedWorkflow?.disabled === true
    })

    return hasDisabledWorkflow
        ? DISABLED_AI_WORKFLOW_FOR_CHALLENGE_ACTION_MESSAGE
        : undefined
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

/**
 * Resolves the project id used for the initial create request.
 *
 * The create form may carry the project id either in the form state or in the page-level fallback
 * prop. A project id is mandatory for draft creation, so this helper normalizes the available
 * value and throws when neither source is present.
 *
 * @param value project id captured in the form state.
 * @param fallbackProjectId project id provided by the page route.
 * @returns the normalized project id for the create request.
 * @throws Error when no project id is available.
 */
function resolveRequiredCreateProjectId(
    value: unknown,
    fallbackProjectId?: string,
): string {
    const createProjectId = normalizeProjectId(value) || fallbackProjectId

    if (!createProjectId) {
        throw new Error('Project id is required to create challenge')
    }

    return createProjectId
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

/**
 * Builds the canonical read-only challenge route for the saved challenge.
 *
 * @param challengeId Saved challenge identifier.
 * @param projectId Optional project identifier for project-scoped challenge routes.
 * @returns The view-mode route for the resolved challenge.
 */
function getChallengeViewPath(challengeId: string, projectId?: string): string {
    return projectId
        ? `/projects/${encodeURIComponent(projectId)}/challenges/${encodeURIComponent(challengeId)}/view`
        : `/challenges/${encodeURIComponent(challengeId)}/view`
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

function getApprovalStatusText(approvalStatus: string | undefined): string {
    if (approvalStatus === CHALLENGE_APPROVAL_STATUS.APPROVED) {
        return 'Approved'
    }

    if (approvalStatus === CHALLENGE_APPROVAL_STATUS.REJECTED) {
        return 'Rejected'
    }

    return 'Pending Approval'
}

interface TaskLaunchValidationParams {
    assignedMemberId?: unknown
    currentStatus?: unknown
    isTaskChallenge: boolean
    nextStatus?: unknown
}

interface HandledLaunchBlockError extends Error {
    isHandledLaunchBlockError: true
}

export function getTaskLaunchValidationError(
    params: TaskLaunchValidationParams,
): string | undefined {
    if (!params.isTaskChallenge) {
        return undefined
    }

    if (normalizeStatus(params.currentStatus) === CHALLENGE_STATUS.ACTIVE) {
        return undefined
    }

    if (normalizeStatus(params.nextStatus) !== CHALLENGE_STATUS.ACTIVE) {
        return undefined
    }

    if (normalizeTextValue(params.assignedMemberId)) {
        return undefined
    }

    return TASK_ASSIGNED_MEMBER_REQUIRED_FOR_LAUNCH_MESSAGE
}

/**
 * Resolves the next route after a manual challenge save succeeds.
 *
 * Draft saves from the create route should open the canonical read-only challenge view. Existing
 * edit-route saves still return to the matching read-only challenge route when requested by the
 * caller.
 *
 * @param params Save-context values needed to choose the next route.
 * @returns The post-save route, or `undefined` when the user should stay on the current page.
 */
function resolvePostSaveNavigationPath(
    params: ResolvePostSaveNavigationPathParams,
): string | undefined {
    if (params.isSaveAsDraft && !params.isEditMode) {
        return getChallengeViewPath(params.savedChallengeId, params.projectId)
    }

    if (params.redirectToViewOnSuccess && params.viewModePath) {
        return params.viewModePath
    }

    return undefined
}

/**
 * Creates an error for launch-blocking validation paths that already surfaced a
 * specific message to the user.
 *
 * @param message The validation message that was already shown in the UI.
 * @returns An error instance that preserves launch rejection without triggering
 * generic save-failure handling.
 * @remarks Used by launch-only blockers so callers can keep the launch modal
 * open while the form avoids duplicate generic toasts.
 */
function createHandledLaunchBlockError(
    message: string,
): HandledLaunchBlockError {
    return Object.assign(new Error(message), {
        isHandledLaunchBlockError: true as const,
    })
}

/**
 * Detects launch-blocking errors that should skip generic save-failure UI.
 *
 * @param error Unknown error caught while saving or launching a challenge.
 * @returns `true` when the error already surfaced a specific validation message.
 * @remarks Used in the save flow catch block to preserve the handled launch
 * rejection without overwriting the existing form state or toast.
 */
function isHandledLaunchBlockError(
    error: unknown,
): error is HandledLaunchBlockError {
    return error instanceof Error
        && 'isHandledLaunchBlockError' in error
        && error.isHandledLaunchBlockError === true
}

// eslint-disable-next-line complexity
export const ChallengeEditorForm: FC<ChallengeEditorFormProps> = (
    props: ChallengeEditorFormProps,
) => {
    const workAppContext = useContext(WorkAppContext)
    const location = useLocation()
    const navigate = useNavigate()
    const isEditMode = props.isEditMode
    const isReadOnly = props.isReadOnly === true
    const onChallengeCreated = props.onChallengeCreated
    const onChallengeStatusChange = props.onChallengeStatusChange
    const onLaunchOpen = props.onLaunchOpen
    const onRegisterLaunchAction = props.onRegisterLaunchAction
    const onSavingChange = props.onSavingChange
    const formElementRef = useRef<HTMLFormElement>(null)
    const challengeRef = useRef<Challenge | undefined>(props.challenge)
    const pendingChallengeRefreshRef = useRef<Challenge | undefined>()
    const defaultedDiscussionForumTypeIdRef = useRef<string | undefined>()
    const fallbackProjectId = useMemo(
        () => normalizeProjectId(props.projectId) || normalizeProjectId(props.challenge?.projectId),
        [
            props.challenge?.projectId,
            props.projectId,
        ],
    )
    const viewModePath = useMemo(
        (): string | undefined => resolveMatchingChallengeViewPath(location.pathname),
        [location.pathname],
    )
    const projectBillingAccountResult = useFetchProjectBillingAccount(fallbackProjectId)
    const projectBillingAccount = projectBillingAccountResult.billingAccount
    const projectBillingAccountRef = useRef(projectBillingAccount)
    const challengesListPath = useMemo(
        () => getChallengesListPath(fallbackProjectId),
        [fallbackProjectId],
    )
    const handleCancelClick = useCallback((): void => {
        navigate(challengesListPath)
    }, [challengesListPath, navigate])

    const [currentChallengeId, setCurrentChallengeId] = useState<string | undefined>(props.challenge?.id)
    const currentChallengeIdRef = useRef<string | undefined>(props.challenge?.id)
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [isInitialResourceHydrationPending, setIsInitialResourceHydrationPending] = useState<boolean>(
        !!props.challenge?.id,
    )
    const isInitialResourceHydrationPendingRef = useRef<boolean>(!!props.challenge?.id)
    const [lastSaved, setLastSaved] = useState<Date | undefined>()
    const [saveError, setSaveError] = useState<string | undefined>()
    const [saveValidationError, setSaveValidationError] = useState<string | undefined>()
    const [saveStatus, setSaveStatus] = useState<'error' | 'idle' | 'saved' | 'saving'>('idle')
    const [scorerHasUnsavedChanges, setScorerHasUnsavedChanges] = useState<boolean>(false)
    const [scorerHasError, setScorerHasError] = useState<boolean>(false)
    const [isUpdatingApproval, setIsUpdatingApproval] = useState<boolean>(false)
    const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('')

    const formMethods = useForm<ChallengeEditorFormData>({
        defaultValues: applyProjectBillingToChallengeFormData(
            transformChallengeToFormData(props.challenge),
            projectBillingAccount,
        ),
        mode: 'onChange',
        resolver: yupResolver(challengeEditorSchema) as any,
    })

    const formState = formMethods.formState
    const isFormDirtyRef = useRef<boolean>(formState.isDirty)
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
    const resourceRolesRef = useRef(resourceRoles)
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
    const persistedTaskFlag = useMemo(
        (): boolean => props.challenge?.task?.isTask === true || values.legacy?.isTask === true,
        [
            props.challenge?.task?.isTask,
            values.legacy?.isTask,
        ],
    )
    const hasResolvedChallengeType = useMemo(
        (): boolean => !!normalizeTextValue(resolvedChallengeTypeName)
            || !!normalizeTextValue(resolvedChallengeTypeAbbreviation),
        [
            resolvedChallengeTypeAbbreviation,
            resolvedChallengeTypeName,
        ],
    )
    const isTaskChallenge = useMemo(
        (): boolean => shouldTreatChallengeAsTask({
            hasResolvedChallengeType,
            isTaskTypeSelected: isTaskChallengeSelected,
            persistedTaskFlag,
        }),
        [
            hasResolvedChallengeType,
            isTaskChallengeSelected,
            persistedTaskFlag,
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
    const challengeTypeOptions = useMemo(
        () => buildChallengeTypeOptions(challengeTypes, selectedChallengeTrack),
        [
            challengeTypes,
            selectedChallengeTrack,
        ],
    )
    const showSubmissionSettingsSection = useMemo(
        (): boolean => {
            if (!isDesignTrackSelected) {
                return false
            }

            const normalizedChallengeTypeName = normalizeChallengeTypeToken(resolvedChallengeTypeName)
            const normalizedChallengeTypeAbbreviation
                = normalizeChallengeTypeToken(resolvedChallengeTypeAbbreviation)

            return normalizedChallengeTypeName === CHALLENGE_TYPE_CHALLENGE_NAME
                || normalizedChallengeTypeAbbreviation === CHALLENGE_TYPE_CHALLENGE_ABBREVIATION
                || normalizedChallengeTypeName === CHALLENGE_TYPE_FIRST_2_FINISH_NAME
                || normalizedChallengeTypeAbbreviation === CHALLENGE_TYPE_FIRST_2_FINISH_ABBREVIATION
        },
        [
            isDesignTrackSelected,
            resolvedChallengeTypeAbbreviation,
            resolvedChallengeTypeName,
        ],
    )
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
    const normalizedApprovalStatus = useMemo(
        () => normalizeStatus(values.approvalStatus)
            || normalizeStatus(props.challenge?.approvalStatus)
            || CHALLENGE_APPROVAL_STATUS.PENDING_APPROVAL,
        [
            props.challenge?.approvalStatus,
            values.approvalStatus,
        ],
    )
    const canApproveChallengeBudget = workAppContext.isAdmin || workAppContext.isManager
    const arePrizeFieldsLockedForRole = normalizedChallengeStatus === CHALLENGE_STATUS.ACTIVE
        && !canApproveChallengeBudget
    const arePrizeFieldsDisabled = isReadOnly || arePrizeFieldsLockedForRole
    const canRenderApprovalActions = !isReadOnly
        && canApproveChallengeBudget
        && !!currentChallengeId
        && normalizedChallengeStatus !== CHALLENGE_STATUS.ACTIVE
    const isChallengeCreated = !!currentChallengeId
    const isFunChallengeSelected = values.funChallenge === true
    const showFunChallengeField = isMarathonMatchChallengeSelected
    const showMarathonMatchScorerSection = isMarathonMatchChallengeSelected && isChallengeCreated
    const showPrizesAndBillingSection = !isFunChallengeSelected
    const showEditableTimelineSection = !isTaskChallenge
    const usesManualReviewers = useMemo(
        (): boolean => shouldUseManualReviewers({
            isMarathonMatchChallenge: isMarathonMatchChallengeSelected,
            isTaskChallenge,
        }),
        [
            isMarathonMatchChallengeSelected,
            isTaskChallenge,
        ],
    )
    const isScorerBlockingChallengeActions = showMarathonMatchScorerSection
        && (scorerHasUnsavedChanges || scorerHasError)

    useEffect(() => {
        const nextReason = typeof values.approvalRejectionReason === 'string'
            ? values.approvalRejectionReason
            : ''

        setRejectionReasonInput(nextReason)
    }, [values.approvalRejectionReason])

    const getPersistedAssignmentValueByFields = useCallback((
        fallbackValue: string | undefined,
        roleNames: readonly string[],
        valueFields: readonly ResourceAssignmentValueField[],
        resourcesOverride?: typeof challengeResources,
        resourceRolesOverride?: typeof resourceRoles,
    ): string | undefined => {
        const resourceAssignment = resolvePersistedResourceAssignment({
            resourceRoles: resourceRolesOverride || resourceRoles,
            resources: resourcesOverride || challengeResources,
            roleNames,
            valueFields,
        })

        if (resourceAssignment) {
            return resourceAssignment.value
        }

        const normalizedFallbackValue = normalizeTextValue(fallbackValue)

        return normalizedFallbackValue || undefined
    }, [
        challengeResources,
        resourceRoles,
    ])
    const getPersistedAssignmentValue = useCallback((
        fallbackValue: string | undefined,
        roleNames: readonly string[],
        valueField: ResourceAssignmentValueField,
        resourcesOverride?: typeof challengeResources,
        resourceRolesOverride?: typeof resourceRoles,
    ): string | undefined => getPersistedAssignmentValueByFields(
        fallbackValue,
        roleNames,
        [valueField],
        resourcesOverride,
        resourceRolesOverride,
    ), [
        getPersistedAssignmentValueByFields,
    ])
    const getPersistedCopilotValue = useCallback((
        fallbackValue: string | undefined,
        resourcesOverride?: typeof challengeResources,
        resourceRolesOverride?: typeof resourceRoles,
    ): string | undefined => {
        const resourceAssignment = resolvePersistedResourceAssignment({
            resourceRoles: resourceRolesOverride || resourceRoles,
            resources: resourcesOverride || challengeResources,
            roleNames: COPILOT_RESOURCE_ROLE_NAMES,
            valueFields: getSingleAssignmentResourceValueFields(COPILOT_ASSIGNMENT_CONFIG),
        })
        const normalizedFallbackValue = normalizeTextValue(fallbackValue)

        if (!resourceAssignment) {
            return normalizedFallbackValue || undefined
        }

        if (
            resourceAssignment.valueField === 'memberId'
            && normalizedFallbackValue
            && !hasSameNormalizedValue(resourceAssignment.value, normalizedFallbackValue)
        ) {
            return normalizedFallbackValue
        }

        return resourceAssignment.value
    }, [
        challengeResources,
        resourceRoles,
    ])
    const isTaskSingleAssignmentChallenge = useCallback((
        formData: ChallengeEditorFormData,
    ): boolean => shouldTreatChallengeAsTask({
        hasResolvedChallengeType,
        isTaskTypeSelected: isTaskChallengeSelected,
        persistedTaskFlag: props.challenge?.task?.isTask === true || formData.legacy?.isTask === true,
    }), [
        hasResolvedChallengeType,
        isTaskChallengeSelected,
        props.challenge?.task?.isTask,
    ])
    const applyPersistedSingleAssignments = useCallback((
        formData: ChallengeEditorFormData,
        resourcesOverride?: typeof challengeResources,
        resourceRolesOverride?: typeof resourceRoles,
    ): ChallengeEditorFormData => {
        const nextFormData: ChallengeEditorFormData = {
            ...formData,
            copilot: getPersistedCopilotValue(
                getSingleAssignmentFieldValue(formData, 'copilot'),
                resourcesOverride,
                resourceRolesOverride,
            ),
        }

        if (!isTaskSingleAssignmentChallenge(formData)) {
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
        getPersistedCopilotValue,
        getPersistedAssignmentValue,
        isTaskSingleAssignmentChallenge,
    ])
    const applyPersistedSingleAssignmentsRef = useRef(applyPersistedSingleAssignments)
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
    const resolveProjectBillingAccount = useCallback(
        async (): Promise<typeof projectBillingAccount> => {
            if (projectBillingAccount) {
                return projectBillingAccount
            }

            if (!fallbackProjectId) {
                return undefined
            }

            return fetchProjectBillingAccount(fallbackProjectId)
                .then(response => response.billingAccount)
                .catch(() => undefined)
        },
        [
            fallbackProjectId,
            projectBillingAccount,
        ],
    )
    const syncSingleAssignmentResource = useCallback(async (
        params: SyncSingleAssignmentResourceParams,
    ): Promise<void> => {
        const resolvedResourceRoles = params.resourceRolesOverride
            || await loadSingleAssignmentResourceRoles()
        const resolvedResources = params.resourcesOverride
            || await loadSingleAssignmentResources(params.challengeId)
        const currentAssignment = resolvePersistedResourceAssignment({
            resourceRoles: resolvedResourceRoles,
            resources: resolvedResources,
            roleNames: params.roleNames,
            valueFields: getSingleAssignmentResourceValueFields(params),
        })
        const normalizedCurrentValue = normalizeTextValue(currentAssignment?.value)
        const normalizedNextValue = normalizeTextValue(params.nextValue)
        const currentPayloadAssignment = resolveSingleAssignmentResourcePayloadValue(
            currentAssignment,
            normalizedCurrentValue,
            params.valueField,
        )
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
                currentPayloadAssignment.valueField,
                currentPayloadAssignment.value,
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
                        currentPayloadAssignment.valueField,
                        currentPayloadAssignment.value,
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
    /**
     * Synchronizes single-member assignments against the latest persisted challenge resources.
     *
     * The edit flow keeps a SWR cache of resources for the Resources tab, but challenge saves
     * should compare against the freshest backend state so a newly selected copilot still creates
     * the required `Copilot` resource even when the local cache is stale.
     *
     * @param challengeId saved challenge identifier whose assignments should be synchronized.
     * @param formData current form snapshot containing the selected assignment values.
     * @returns Resolves after all changed single-member assignments are saved and the local
     * resource cache is revalidated.
     */
    const syncDraftSingleAssignments = useCallback(async (
        challengeId: string,
        formData: ChallengeEditorFormData,
    ): Promise<void> => {
        const [
            persistedResources,
            persistedResourceRoles,
        ] = await Promise.all([
            fetchResources(challengeId),
            loadSingleAssignmentResourceRoles(),
        ])
        const resourceSyncOperations = getSingleAssignmentConfigs(
            isTaskSingleAssignmentChallenge(formData),
        )
            .map(config => {
                const nextValue = getSingleAssignmentFieldValue(formData, config.fieldName)
                const persistedValue = getPersistedAssignmentValueByFields(
                    undefined,
                    config.roleNames,
                    getSingleAssignmentResourceValueFields(config),
                    persistedResources,
                    persistedResourceRoles,
                )

                return hasSameNormalizedValue(nextValue, persistedValue)
                    ? undefined
                    : syncSingleAssignmentResource({
                        challengeId,
                        nextValue,
                        resourceRolesOverride: persistedResourceRoles,
                        resourcesOverride: persistedResources,
                        resourceValueFields: config.resourceValueFields,
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
        getPersistedAssignmentValueByFields,
        isTaskSingleAssignmentChallenge,
        loadSingleAssignmentResourceRoles,
        mutateChallengeResources,
        syncSingleAssignmentResource,
    ])
    /**
     * Reapplies resource-backed assignments after a save response resets the form.
     *
     * Challenge patch responses may omit persisted copilot and manual-reviewer member selections
     * even though those resources were saved successfully. Reloading resources before the post-save
     * reset keeps the editor aligned with the persisted draft state.
     *
     * @param challengeId saved challenge identifier whose persisted resources should be reloaded.
     * @param formData form-state snapshot derived from the saved challenge payload.
     * @returns the same form data with persisted resource assignments restored.
     */
    const hydratePersistedSavedFormData = useCallback(async (
        challengeId: string,
        formData: ChallengeEditorFormData,
    ): Promise<ChallengeEditorFormData> => {
        const [
            persistedResources,
            persistedResourceRoles,
        ] = await Promise.all([
            fetchResources(challengeId),
            loadSingleAssignmentResourceRoles(),
        ])

        return hydratePersistedManualReviewerAssignments(
            applyPersistedSingleAssignments(
                formData,
                persistedResources,
                persistedResourceRoles,
            ),
            persistedResources,
            persistedResourceRoles,
        )
    }, [
        applyPersistedSingleAssignments,
        loadSingleAssignmentResourceRoles,
    ])

    const handleScorerConfigChange = useCallback(
        (hasUnsavedChanges: boolean, hasError: boolean): void => {
            setScorerHasUnsavedChanges(hasUnsavedChanges)
            setScorerHasError(hasError)
        },
        [],
    )
    const hydrateChallengeSnapshot = useCallback((
        challenge?: Challenge,
    ): (() => void) => {
        let isActive = true
        const challengeId = challenge?.id
        const baseFormData = applyProjectBillingToChallengeFormData(
            transformChallengeToFormData(challenge),
            projectBillingAccountRef.current,
        )

        setCurrentChallengeId(challengeId)
        defaultedDiscussionForumTypeIdRef.current = undefined
        setIsInitialResourceHydrationPending(!!challengeId)

        reset(baseFormData)

        if (!challengeId) {
            setIsInitialResourceHydrationPending(false)

            return () => {
                isActive = false
            }
        }

        const currentResourceRoles = resourceRolesRef.current

        Promise.all([
            fetchResources(challengeId),
            currentResourceRoles.length
                ? Promise.resolve(currentResourceRoles)
                : fetchResourceRoles(),
        ])
            .then(async ([
                fetchedResources,
                fetchedResourceRoles,
            ]) => {
                if (
                    !isActive
                    || (isFormDirtyRef.current && !isInitialResourceHydrationPendingRef.current)
                ) {
                    return
                }

                const hydratedFormData = await hydratePersistedManualReviewerAssignments(
                    applyPersistedSingleAssignmentsRef.current(
                        baseFormData,
                        fetchedResources,
                        fetchedResourceRoles,
                    ),
                    fetchedResources,
                    fetchedResourceRoles,
                )

                if (
                    !isActive
                    || (isFormDirtyRef.current && !isInitialResourceHydrationPendingRef.current)
                ) {
                    return
                }

                reset(hydratedFormData)
            })
            .catch(() => {
                // The base form data has already been applied above.
            })
            .finally(() => {
                if (isActive) {
                    setIsInitialResourceHydrationPending(false)
                }
            })

        return () => {
            isActive = false
        }
    }, [reset])

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
        challengeRef.current = props.challenge
    }, [props.challenge])

    useEffect(() => {
        currentChallengeIdRef.current = currentChallengeId
    }, [currentChallengeId])

    useEffect(() => {
        isInitialResourceHydrationPendingRef.current = isInitialResourceHydrationPending
    }, [isInitialResourceHydrationPending])

    useEffect(() => {
        projectBillingAccountRef.current = projectBillingAccount
    }, [projectBillingAccount])

    useEffect(() => {
        resourceRolesRef.current = resourceRoles
    }, [resourceRoles])

    useEffect(() => {
        isFormDirtyRef.current = formState.isDirty
    }, [formState.isDirty])

    useEffect(() => {
        applyPersistedSingleAssignmentsRef.current = applyPersistedSingleAssignments
    }, [applyPersistedSingleAssignments])

    useEffect(() => {
        const challenge = challengeRef.current
        const challengeId = challenge?.id
        const isRefreshingCurrentChallenge = !!challengeId
            && challengeId === currentChallengeIdRef.current
            && isFormDirtyRef.current
            && !isInitialResourceHydrationPendingRef.current

        if (isRefreshingCurrentChallenge) {
            pendingChallengeRefreshRef.current = challenge

            return undefined
        }

        pendingChallengeRefreshRef.current = undefined

        return hydrateChallengeSnapshot(challenge)
    }, [
        hydrateChallengeSnapshot,
        props.challenge,
        props.challenge?.id,
        props.challenge?.updated,
    ])

    useEffect(() => {
        if (formState.isDirty) {
            return undefined
        }

        const pendingChallengeRefresh = pendingChallengeRefreshRef.current

        if (!pendingChallengeRefresh) {
            return undefined
        }

        pendingChallengeRefreshRef.current = undefined

        return hydrateChallengeSnapshot(pendingChallengeRefresh)
    }, [
        formState.isDirty,
        hydrateChallengeSnapshot,
    ])

    useEffect(() => {
        if (
            !currentChallengeId
            || (formState.isDirty && !isInitialResourceHydrationPending)
            || challengeResourcesResult.isLoading
            || resourceRolesResult.isLoading
        ) {
            return undefined
        }

        let isActive = true

        hydratePersistedManualReviewerAssignments(
            applyPersistedSingleAssignments(getValues()),
            challengeResources,
            resourceRoles,
        )
            .then(persistedValues => {
                if (!isActive) {
                    return
                }

                const currentFormValues = getValues()

                getSingleAssignmentConfigs(isTaskSingleAssignmentChallenge(currentFormValues))
                    .forEach(config => {
                        const currentValue = getSingleAssignmentFieldValue(currentFormValues, config.fieldName)
                        const persistedValue = getSingleAssignmentFieldValue(
                            persistedValues,
                            config.fieldName,
                        )

                        if (hasSameNormalizedValue(currentValue, persistedValue)) {
                            return
                        }

                        setValue(config.fieldName, persistedValue, {
                            shouldDirty: false,
                            shouldValidate: true,
                        })
                    })

                if (
                    JSON.stringify(currentFormValues.reviewers || [])
                    !== JSON.stringify(persistedValues.reviewers || [])
                ) {
                    setValue('reviewers', persistedValues.reviewers, {
                        shouldDirty: false,
                        shouldValidate: true,
                    })
                }
            })
            .catch(() => undefined)

        return () => {
            isActive = false
        }
    }, [
        applyPersistedSingleAssignments,
        challengeResources,
        currentChallengeId,
        formState.isDirty,
        getValues,
        isInitialResourceHydrationPending,
        isTaskSingleAssignmentChallenge,
        resourceRoles,
        resourceRolesResult.isLoading,
        setValue,
        challengeResourcesResult.isLoading,
    ])

    useEffect(() => {
        const currentBilling = getValues('billing')
        const nextBilling = mergeChallengeBillingWithProjectBilling(
            currentBilling,
            projectBillingAccount,
        )

        if (hasSameChallengeBillingInfo(currentBilling, nextBilling)) {
            return
        }

        setValue('billing', nextBilling, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        getValues,
        projectBillingAccount,
        setValue,
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
        const normalizedTrackId = values.trackId?.trim()
        const normalizedTypeId = values.typeId?.trim()

        if (currentChallengeId || !normalizedTrackId || !normalizedTypeId) {
            return
        }

        if (!selectedChallengeType || selectedChallengeType.id !== normalizedTypeId) {
            return
        }

        const isAllowedForTrack = challengeTypeOptions
            .some(option => option.value === normalizedTypeId)

        if (isAllowedForTrack) {
            return
        }

        setValue('typeId', '', {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        challengeTypeOptions,
        currentChallengeId,
        selectedChallengeType,
        setValue,
        values.trackId,
        values.typeId,
    ])

    useEffect(() => {
        setValue('legacy.isTask', isTaskChallenge, {
            shouldDirty: false,
            shouldValidate: true,
        })
    }, [
        isTaskChallenge,
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
        // eslint-disable-next-line complexity
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

            clearErrors('workType')
            setSaveError(undefined)
            setSaveValidationError(undefined)

            const workTypeValidationError = getCreateChallengeWorkTypeValidationError({
                isRequired: showDesignWorkTypeField,
                workType: getValues('workType'),
            })

            if (workTypeValidationError) {
                setSaveStatus('idle')
                setError('workType', {
                    message: workTypeValidationError,
                    type: 'manual',
                })
                setSaveValidationError(workTypeValidationError)
                return
            }

            setIsSaving(true)
            setSaveStatus('saving')
            setSaveError(undefined)
            setSaveValidationError(undefined)

            try {
                const formData = getValues()
                const resolvedProjectBillingAccount = await resolveProjectBillingAccount()
                const selectedRoundType = getCreateRoundType(formData.roundType, formElementRef.current)
                const createProjectId = resolveRequiredCreateProjectId(formData.projectId, fallbackProjectId)

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
                const discussions = buildCreateChallengeDiscussions({
                    challengeName: formData.name,
                    challengeTypeId: formData.typeId,
                    discussionForum: formData.discussionForum,
                    selectedChallengeType,
                })
                const createdChallenge = await createChallenge({
                    discussions,
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
                const createdCopilotResetResult: PersistCreatedChallengeCopilotResult
                    = await resolveCreatedChallengeResetSourceFormData({
                        challengeId: savedChallenge.id,
                        formData,
                        syncSingleAssignmentResource,
                    })
                const resetSourceFormData = createdCopilotResetResult.resetSourceFormData
                const createdCopilotWarningMessage = createdCopilotResetResult.warningMessage

                const nextValues = applySingleAssignmentFieldValues(
                    applyProjectBillingToChallengeFormData(
                        transformChallengeToFormData(savedChallenge),
                        resolvedProjectBillingAccount,
                    ),
                    resetSourceFormData,
                    isTaskSingleAssignmentChallenge(formData),
                )
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

                const createdChallengeStatus = normalizeStatus(nextValues.status)
                    || normalizeStatus(savedChallenge.status)
                    || CHALLENGE_STATUS.NEW
                const savedAt = new Date()

                setCurrentChallengeId(savedChallenge.id)
                setLastSaved(savedAt)
                setSaveStatus('saved')

                reset(nextValues)
                onChallengeCreated?.({
                    id: savedChallenge.id,
                    name: savedChallenge.name,
                    projectId: savedChallenge.projectId ?? createProjectId,
                    status: createdChallengeStatus,
                })
                onChallengeStatusChange?.(createdChallengeStatus)
                showSuccessToast('Challenge created successfully')

                if (createdCopilotWarningMessage) {
                    showErrorToast(createdCopilotWarningMessage)
                }
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
            clearErrors,
            fallbackProjectId,
            getValues,
            isTaskSingleAssignmentChallenge,
            reset,
            onChallengeCreated,
            onChallengeStatusChange,
            resolveProjectBillingAccount,
            selectedChallengeType,
            setError,
            showDesignWorkTypeField,
            syncSingleAssignmentResource,
            timelineTemplates,
            trigger,
        ],
    )

    const saveChallenge = useCallback(
        // eslint-disable-next-line complexity
        async (
            formData: ChallengeEditorFormData,
            options: SaveChallengeOptions = {},
        ): Promise<void> => {
            if (!currentChallengeId) {
                throw new Error('Challenge id is required to save challenge')
            }

            const {
                isSaveAsDraft,
                payloadStatus,
            }: SaveStatusMetadata = getSaveStatusMetadata(formData.status, options)
            const shouldTreatSaveAsTaskChallenge = isTaskSingleAssignmentChallenge(formData)
            const currentStatus = normalizeStatus(formData.status)
            const isChallengeBeingActivated = payloadStatus === CHALLENGE_STATUS.ACTIVE
                && currentStatus !== CHALLENGE_STATUS.ACTIVE
            const taskLaunchValidationError = getTaskLaunchValidationError({
                assignedMemberId: formData.assignedMemberId,
                currentStatus: formData.status,
                isTaskChallenge: shouldTreatSaveAsTaskChallenge,
                nextStatus: payloadStatus,
            })

            setSaveError(undefined)
            setSaveValidationError(undefined)
            clearErrors('assignedMemberId')

            if (taskLaunchValidationError) {
                setSaveStatus('idle')
                setError('assignedMemberId', {
                    message: taskLaunchValidationError,
                    type: 'manual',
                })
                setSaveValidationError(taskLaunchValidationError)

                if (!options.isAutosave) {
                    showErrorToast(taskLaunchValidationError)
                }

                throw createHandledLaunchBlockError(taskLaunchValidationError)
            }

            if (
                isChallengeBeingActivated
                && normalizeStatus(formData.approvalStatus) !== CHALLENGE_APPROVAL_STATUS.APPROVED
            ) {
                setSaveStatus('idle')
                setSaveValidationError(APPROVAL_REQUIRED_FOR_LAUNCH_MESSAGE)

                if (!options.isAutosave) {
                    showErrorToast(APPROVAL_REQUIRED_FOR_LAUNCH_MESSAGE)
                }

                throw createHandledLaunchBlockError(APPROVAL_REQUIRED_FOR_LAUNCH_MESSAGE)
            }

            const disabledAiWorkflowError = await getDisabledAiWorkflowForActionError(
                formData,
                currentChallengeId,
                selectedChallengeTrack?.track || selectedChallengeTrack?.name,
                selectedChallengeType?.name,
            )

            if (disabledAiWorkflowError) {
                setSaveStatus('idle')
                setError('reviewers', {
                    message: disabledAiWorkflowError,
                    type: 'manual',
                })
                setSaveValidationError(disabledAiWorkflowError)

                if (!options.isAutosave) {
                    showErrorToast(disabledAiWorkflowError)
                }

                throw createHandledLaunchBlockError(disabledAiWorkflowError)
            }

            if (!options.isAutosave) {
                setIsSaving(true)
                setSaveStatus('saving')
            }

            try {
                const resolvedProjectBillingAccount = await resolveProjectBillingAccount()
                const projectBillingAccountIssue = isChallengeBeingActivated
                    ? getProjectBillingAccountChallengeIssue(resolvedProjectBillingAccount)
                    : undefined
                const projectBillingAccountErrorMessage = projectBillingAccountIssue
                    ? getProjectBillingAccountChallengeErrorMessage(projectBillingAccountIssue)
                    : undefined

                if (projectBillingAccountErrorMessage) {
                    setSaveStatus('idle')
                    setSaveError(projectBillingAccountErrorMessage)

                    if (!options.isAutosave) {
                        showErrorToast(projectBillingAccountErrorMessage)
                    }

                    throw createHandledLaunchBlockError(projectBillingAccountErrorMessage)
                }

                const formDataWithProjectBilling = applyProjectBillingToChallengeFormData(
                    formData,
                    resolvedProjectBillingAccount,
                )
                const payload = transformFormDataToChallenge({
                    ...formDataWithProjectBilling,
                    reviewers: usesManualReviewers
                        ? formDataWithProjectBilling.reviewers
                        : [],
                    status: payloadStatus,
                })
                const savedChallenge = await patchChallenge(currentChallengeId, payload)
                await syncDraftSingleAssignments(currentChallengeId, formDataWithProjectBilling)
                const persistedFormData = applyProjectBillingToChallengeFormData(
                    transformChallengeToFormData(savedChallenge),
                    resolvedProjectBillingAccount,
                )

                const nextValues = applySingleAssignmentFieldValues(
                    await hydratePersistedSavedFormData(
                        currentChallengeId,
                        {
                            ...persistedFormData,
                            attachments: Array.isArray(persistedFormData.attachments)
                                ? persistedFormData.attachments
                                : formDataWithProjectBilling.attachments,
                        },
                    ),
                    formDataWithProjectBilling,
                    shouldTreatSaveAsTaskChallenge,
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

                const postSaveNavigationPath = resolvePostSaveNavigationPath({
                    isEditMode,
                    isSaveAsDraft,
                    projectId: fallbackProjectId,
                    redirectToViewOnSuccess: options.redirectToViewOnSuccess,
                    savedChallengeId: savedChallenge.id,
                    viewModePath,
                })

                if (postSaveNavigationPath) {
                    navigate(postSaveNavigationPath)
                }
            } catch (error) {
                if (isHandledLaunchBlockError(error)) {
                    throw error
                }

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
            clearErrors,
            currentChallengeId,
            fallbackProjectId,
            hydratePersistedSavedFormData,
            isEditMode,
            isTaskSingleAssignmentChallenge,
            navigate,
            onChallengeStatusChange,
            reset,
            resolveProjectBillingAccount,
            selectedChallengeTrack,
            selectedChallengeType,
            setError,
            syncDraftSingleAssignments,
            usesManualReviewers,
            viewModePath,
        ],
    )

    const updateApprovalStatus = useCallback(async (
        nextApprovalStatus: string,
        rejectionReason?: string,
    ): Promise<void> => {
        if (!currentChallengeId || isUpdatingApproval) {
            return
        }

        if (nextApprovalStatus === CHALLENGE_APPROVAL_STATUS.REJECTED && !normalizeTextValue(rejectionReason)) {
            showErrorToast('Rejection reason is required.')
            return
        }

        setIsUpdatingApproval(true)

        try {
            const payload = {
                approvalRejectionReason: nextApprovalStatus === CHALLENGE_APPROVAL_STATUS.REJECTED
                    ? normalizeTextValue(rejectionReason)
                    : undefined,
                approvalStatus: nextApprovalStatus,
            }
            const savedChallenge = await patchChallenge(currentChallengeId, payload)
            const mergedFormData = {
                ...getValues(),
                ...transformChallengeToFormData(savedChallenge),
            }

            reset(mergedFormData)
            setSaveValidationError(undefined)
            showSuccessToast(nextApprovalStatus === CHALLENGE_APPROVAL_STATUS.APPROVED
                ? 'Challenge budget approved.'
                : 'Challenge budget rejected.')
        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Failed to update approval status'
            showErrorToast(errorMessage)
        } finally {
            setIsUpdatingApproval(false)
        }
    }, [
        currentChallengeId,
        getValues,
        isUpdatingApproval,
        reset,
    ])

    const handleApproveChallengeBudget = useCallback((): void => {
        updateApprovalStatus(CHALLENGE_APPROVAL_STATUS.APPROVED)
            .catch(() => undefined)
    }, [updateApprovalStatus])

    const handleRejectChallengeBudget = useCallback((): void => {
        updateApprovalStatus(CHALLENGE_APPROVAL_STATUS.REJECTED, rejectionReasonInput)
            .catch(() => undefined)
    }, [
        rejectionReasonInput,
        updateApprovalStatus,
    ])

    const launchChallenge = useCallback(async (): Promise<void> => {
        if (isScorerBlockingChallengeActions) {
            showErrorToast('Save a valid scorer configuration before launching the challenge')
            throw new Error('Scorer configuration is blocking challenge launch')
        }

        await handleSubmit(
            async formData => {
                await saveChallenge(formData, {
                    redirectToViewOnSuccess: true,
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
        enabled: !isReadOnly
            && !!currentChallengeId
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
                    isTaskChallenge,
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
            try {
                await saveChallenge(formData, {
                    redirectToViewOnSuccess: true,
                })
            } catch (error) {
                if (isHandledLaunchBlockError(error)) {
                    return
                }

                throw error
            }
        },
        [
            clearErrors,
            isScorerBlockingChallengeActions,
            isTaskChallenge,
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
    const displayedBillingAccountId = useMemo(
        (): string => {
            const billingAccountId = values.billing?.billingAccountId ?? projectBillingAccount?.id

            if (billingAccountId === undefined || billingAccountId === null) {
                return '-'
            }

            const normalizedBillingAccountId = String(billingAccountId)
                .trim()

            return normalizedBillingAccountId || '-'
        },
        [
            projectBillingAccount?.id,
            values.billing?.billingAccountId,
        ],
    )
    const reviewSection = usesManualReviewers
        ? (
            <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Review</h3>
                <div className={styles.block}>
                    <ReviewersField isReadOnly={isReadOnly} />
                </div>
            </section>
        )
        : undefined
    const footerSection = !isReadOnly
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
                    <Button
                        label='Cancel'
                        onClick={handleCancelClick}
                        secondary
                        size='lg'
                        type='button'
                    />
                    <Button
                        disabled={
                            (!formState.isDirty || isSaving)
                            || isScorerBlockingChallengeActions
                        }
                        label={submitButtonLabel}
                        secondary
                        size='lg'
                        type='submit'
                    />
                    {props.canLaunchChallenge && onLaunchOpen
                        ? (
                            <Button
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
        )
        : undefined

    return (
        <FormProvider {...formMethods}>
            <form className={styles.form} onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} ref={formElementRef}>
                <fieldset className={styles.formContent} disabled={isReadOnly}>
                    <input type='hidden' {...formMethods.register('id')} />
                    <input type='hidden' {...formMethods.register('status')} />

                    <section className={styles.section}>
                        <h3 className={styles.sectionTitle}>Basic Information</h3>
                        <div className={styles.grid}>
                            <ChallengeNameField />
                            <ChallengeTrackField disabled={isReadOnly || isChallengeCreated} />
                            <ChallengeTypeField
                                disabled={isReadOnly || isChallengeCreated}
                                track={selectedChallengeTrack}
                            />
                            <CopilotField projectId={fallbackProjectId} />
                            {showFunChallengeField
                                ? <FunChallengeField disabled={isReadOnly} />
                                : undefined}
                            {showRoundTypeField
                                ? <RoundTypeField disabled={isReadOnly || isChallengeCreated} />
                                : undefined}
                            {showDesignWorkTypeField
                                ? <DesignWorkTypeField disabled={isReadOnly || isChallengeCreated} />
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
                                                            challengeTypeAbbreviation={
                                                                resolvedChallengeTypeAbbreviation
                                                            }
                                                            challengeTypeName={resolvedChallengeTypeName}
                                                            disabled={arePrizeFieldsDisabled}
                                                            name='prizeSets'
                                                        />
                                                        {showCheckpointPrizes
                                                            ? (
                                                                <CheckpointPrizesField
                                                                    disabled={arePrizeFieldsDisabled}
                                                                    name='prizeSets'
                                                                />
                                                            )
                                                            : undefined}
                                                    </div>
                                                    <div className={styles.copilotFeeColumn}>
                                                        <CopilotFeeField
                                                            disabled={arePrizeFieldsDisabled}
                                                            name='prizeSets'
                                                        />
                                                    </div>
                                                </div>
                                                <div className={styles.billingSummary}>
                                                    <ReviewCostField name='prizeSets' />
                                                    <ChallengeFeeField />
                                                    <ChallengeTotalField />
                                                </div>
                                                <div className={styles.approvalSection}>
                                                    <div className={styles.approvalStatusRow}>
                                                        <span className={styles.approvalStatusLabel}>
                                                            Approval status:
                                                        </span>
                                                        <span className={styles.approvalStatusValue}>
                                                            {getApprovalStatusText(normalizedApprovalStatus)}
                                                        </span>
                                                    </div>
                                                    {normalizedApprovalStatus === CHALLENGE_APPROVAL_STATUS.REJECTED
                                                        && normalizeTextValue(values.approvalRejectionReason)
                                                        ? (
                                                            <div className={styles.approvalReason}>
                                                                {`Reason: ${values.approvalRejectionReason}`}
                                                            </div>
                                                        )
                                                        : undefined}
                                                    {normalizedApprovalStatus === CHALLENGE_APPROVAL_STATUS.APPROVED
                                                        && normalizeTextValue(values.approvalApprovedBy)
                                                        ? (
                                                            <div className={styles.approvalReason}>
                                                                {`Approved by ${values.approvalApprovedBy}`}
                                                            </div>
                                                        )
                                                        : undefined}
                                                    {canRenderApprovalActions
                                                        ? (
                                                            <>
                                                                <textarea
                                                                    className={styles.rejectionReasonInput}
                                                                    disabled={isUpdatingApproval}
                                                                    onChange={function onClick(event: ChangeEvent<HTMLTextAreaElement>) {
                                                                        setRejectionReasonInput(event.target.value)
                                                                    }}
                                                                    placeholder='Reason is required to reject'
                                                                    rows={3}
                                                                    value={rejectionReasonInput}
                                                                />
                                                                <div className={styles.approvalActions}>
                                                                    <Button
                                                                        disabled={isUpdatingApproval}
                                                                        label='Approve Budget'
                                                                        onClick={handleApproveChallengeBudget}
                                                                        primary
                                                                        size='md'
                                                                        type='button'
                                                                    />
                                                                    <Button
                                                                        disabled={isUpdatingApproval}
                                                                        label='Reject Budget'
                                                                        onClick={handleRejectChallengeBudget}
                                                                        secondary
                                                                        size='md'
                                                                        type='button'
                                                                    />
                                                                </div>
                                                            </>
                                                        )
                                                        : undefined}
                                                </div>
                                            </div>
                                        </section>
                                    )
                                    : undefined}

                            </>
                        )
                        : undefined}
                </fieldset>

                {isChallengeCreated && showEditableTimelineSection
                    ? (
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Timeline &amp; Schedule</h3>
                            <div className={styles.block}>
                                <ChallengeScheduleSection disabled={isReadOnly} />
                            </div>
                        </section>
                    )
                    : undefined}

                {isChallengeCreated
                    ? (
                        <>
                            <fieldset className={styles.formContent} disabled={isReadOnly}>
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
                                        {isTaskChallenge
                                            ? <AssignedMemberField />
                                            : undefined}
                                        {isTaskChallenge
                                            ? (
                                                <ReviewTypeField
                                                    isTaskChallenge={isTaskChallenge}
                                                />
                                            )
                                            : undefined}
                                        <GroupsField />
                                        <TermsField shouldDefaultStandardTerm={!isEditMode && !isReadOnly} />
                                        <NDAField />
                                        <FormCheckboxField
                                            checkboxOnlyHitArea
                                            label='Wipro Allowed'
                                            name='wiproAllowed'
                                        />
                                        <div className={styles.readOnlyField}>
                                            <span className={styles.readOnlyFieldLabel}>Billing Account Id</span>
                                            <span className={styles.readOnlyFieldValue}>
                                                {displayedBillingAccountId}
                                            </span>
                                        </div>
                                    </div>
                                </section>

                                {showSubmissionSettingsSection
                                    ? (
                                        <section className={styles.section}>
                                            <h3 className={styles.sectionTitle}>Submission Settings</h3>
                                            <div className={styles.submissionSettingsGrid}>
                                                <FinalDeliverablesField />
                                                <StockArtsField />
                                                <SubmissionVisibilityField />
                                                <MaximumSubmissionsField
                                                    deferDirty={isInitialResourceHydrationPending}
                                                />
                                            </div>
                                        </section>
                                    )
                                    : undefined}

                                {!isReadOnly
                                    ? reviewSection
                                    : undefined}
                                {footerSection}
                            </fieldset>

                            {isReadOnly
                                ? reviewSection
                                : undefined}
                        </>
                    )
                    : undefined}
            </form>
        </FormProvider>
    )
}

export default ChallengeEditorForm
