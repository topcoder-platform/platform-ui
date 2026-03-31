import { ROUND_TYPES } from '../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    Resource,
    ResourceRole,
    TimelineTemplate,
} from '../../../../lib/models'

interface ResolveCreateTimelineTemplateIdParams {
    roundType: ChallengeEditorFormData['roundType']
    timelineTemplates: TimelineTemplate[]
    trackId?: string
    typeId?: string
}

interface ResolveCreateRoundTypeParams {
    fallbackRoundType: ChallengeEditorFormData['roundType']
    formRoundTypeValue: FormDataEntryValue | null | undefined
}

interface ResolveManualReviewersParams {
    isMarathonMatchChallenge: boolean
    isTaskChallenge: boolean
}

interface ChallengeBillingInfo {
    billingAccountId?: number | string
    markup?: number
}

interface ProjectChallengeBillingInfo {
    id?: number | string
    markup?: number
}

const CHECKPOINT_PHASE_NAMES = [
    'checkpoint submission',
    'checkpoint screening',
    'checkpoint review',
]
const CHECKPOINT_PHASE_IDS = [
    'd8a2cdbe-84d1-4687-ab75-78a6a7efdcc8',
    'ce1afb4c-74f9-496b-9e4b-087ae73ab032',
    '84b43897-2aab-44d6-a95a-42c433657eed',
]
const DESIGN_TWO_ROUND_TEMPLATE_ID = 'd4201ca4-8437-4d63-9957-3f7708184b07'
export const COPILOT_RESOURCE_ROLE_NAMES = ['Copilot'] as const
export const REVIEWER_RESOURCE_ROLE_NAMES = ['Reviewer'] as const
export const SUBMITTER_RESOURCE_ROLE_NAMES = ['Submitter'] as const
export const TASK_REVIEWER_RESOURCE_ROLE_NAMES = [
    'Iterative Reviewer',
    'Iterative Review',
] as const

export type ResourceAssignmentValueField = 'memberHandle' | 'memberId'

function normalizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const normalized = value
        .trim()
        .toLowerCase()

    return normalized || undefined
}

function normalizeText(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim()
}

function normalizeBillingAccountId(value: unknown): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value)
    }

    const normalizedValue = normalizeText(value)

    return normalizedValue || undefined
}

function normalizeBillingMarkup(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value.trim())

        return Number.isFinite(parsedValue)
            ? parsedValue
            : undefined
    }

    return undefined
}

function shouldPreferProjectBillingMarkup(
    billing: ChallengeBillingInfo | undefined,
    projectBillingAccount: ProjectChallengeBillingInfo | undefined,
): boolean {
    const projectMarkup = normalizeBillingMarkup(projectBillingAccount?.markup)

    if (projectMarkup === undefined) {
        return false
    }

    const billingMarkup = normalizeBillingMarkup(billing?.markup)

    if (billingMarkup === undefined) {
        return true
    }

    if (billingMarkup !== 0) {
        return false
    }

    const billingAccountId = normalizeBillingAccountId(billing?.billingAccountId)
    const projectBillingAccountId = normalizeBillingAccountId(projectBillingAccount?.id)

    return !billingAccountId
        || !projectBillingAccountId
        || billingAccountId === projectBillingAccountId
}

function normalizeRoleName(value: unknown): string {
    return normalizeText(value)
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

function hasCheckpointPhases(template: TimelineTemplate): boolean {
    const phaseNames = new Set(
        (template.phases || [])
            .map(phase => normalizeOptionalString(phase.name))
            .filter((phaseName): phaseName is string => !!phaseName),
    )
    const phaseIds = new Set(
        (template.phases || [])
            .map(phase => normalizeOptionalString(phase.phaseId))
            .filter((phaseId): phaseId is string => !!phaseId),
    )
    const hasCheckpointPhasesByName = CHECKPOINT_PHASE_NAMES
        .every(phaseName => phaseNames.has(phaseName))
    const hasCheckpointPhasesById = CHECKPOINT_PHASE_IDS
        .every(phaseId => phaseIds.has(phaseId))

    return hasCheckpointPhasesByName || hasCheckpointPhasesById
}

/**
 * Resolves the round type selected in the create form.
 *
 * The UI occasionally reads stale `react-hook-form` state during fast clicks,
 * so this prioritizes the current DOM form value and falls back to form data.
 */
export function resolveCreateRoundType(
    params: ResolveCreateRoundTypeParams,
): ChallengeEditorFormData['roundType'] {
    const normalizedFormRoundType = normalizeOptionalString(params.formRoundTypeValue)

    if (normalizedFormRoundType === normalizeOptionalString(ROUND_TYPES.TWO_ROUNDS)) {
        return ROUND_TYPES.TWO_ROUNDS
    }

    if (normalizedFormRoundType === normalizeOptionalString(ROUND_TYPES.SINGLE_ROUND)) {
        return ROUND_TYPES.SINGLE_ROUND
    }

    if (params.fallbackRoundType === ROUND_TYPES.TWO_ROUNDS) {
        return ROUND_TYPES.TWO_ROUNDS
    }

    return ROUND_TYPES.SINGLE_ROUND
}

/**
 * Returns whether the shared reviewers matrix should be used for the current challenge type.
 *
 * Task challenges use the dedicated single-reviewer selector, and marathon matches use
 * the scorer/tester workflow instead of manual reviewer assignments.
 *
 * @param params challenge-type flags derived from the selected type metadata.
 * @returns `true` when the generic reviewers section should stay active.
 */
export function shouldUseManualReviewers(
    params: ResolveManualReviewersParams,
): boolean {
    return !params.isMarathonMatchChallenge && !params.isTaskChallenge
}

/**
 * Finds the first resource role whose name matches any of the provided role names.
 *
 * Matching is case-insensitive and whitespace-insensitive enough to handle
 * historical "Iterative Review" vs "Iterative Reviewer" naming drift.
 *
 * @param resourceRoles available challenge resource roles.
 * @param roleNames acceptable role names for the assignment being resolved.
 * @returns the matched resource role, or `undefined` when none match.
 */
export function findMatchingResourceRole(
    resourceRoles: ResourceRole[],
    roleNames: readonly string[],
): ResourceRole | undefined {
    const normalizedRoleNames = new Set(
        roleNames
            .map(roleName => normalizeRoleName(roleName))
            .filter(Boolean),
    )

    return resourceRoles.find(role => normalizedRoleNames.has(normalizeRoleName(role.name)))
}

interface ResolveResourceAssignmentHandleParams {
    fallbackHandle?: string
    resourceRoles: ResourceRole[]
    resources: Resource[]
    roleNames: readonly string[]
}

interface ResolveResourceAssignmentValueParams {
    fallbackValue?: string
    resourceRoles: ResourceRole[]
    resources: Resource[]
    roleNames: readonly string[]
    valueField: ResourceAssignmentValueField
}

/**
 * Resolves a saved single-member assignment from challenge resources.
 *
 * Work Manager persists some challenge selector values as resources instead of
 * on the challenge root. This helper prefers the resource-backed value and
 * falls back to the provided legacy field value when no matching resource exists.
 *
 * @param params resource data, accepted role names, and the resource field to read.
 * @returns the resolved selector value, or `undefined` when nothing is assigned.
 */
export function resolveResourceAssignmentValue(
    params: ResolveResourceAssignmentValueParams,
): string | undefined {
    const normalizedRoleNames = new Set(
        params.roleNames
            .map(roleName => normalizeRoleName(roleName))
            .filter(Boolean),
    )
    const matchingRoleIds = new Set(
        params.resourceRoles
            .filter(role => normalizedRoleNames.has(normalizeRoleName(role.name)))
            .map(role => normalizeText(role.id))
            .filter(Boolean),
    )
    const matchingResource = params.resources.find(resource => {
        const normalizedRoleId = normalizeText(resource.roleId)
        const normalizedResourceRoleName = normalizeRoleName(resource.role || resource.roleName)

        return matchingRoleIds.has(normalizedRoleId)
            || normalizedRoleNames.has(normalizedResourceRoleName)
    })
    const resourceValue = normalizeText(matchingResource?.[params.valueField])

    if (resourceValue) {
        return resourceValue
    }

    const fallbackValue = normalizeText(params.fallbackValue)

    return fallbackValue || undefined
}

/**
 * Resolves a saved handle for single-member challenge assignments backed by resources.
 *
 * Work Manager persists copilot and task-reviewer selections as challenge resources,
 * but older payloads may still expose root-level fields. This helper prefers the
 * current resource assignment and falls back to the provided legacy field value.
 *
 * @param params resource data plus an optional legacy fallback handle.
 * @returns the assigned member handle, or `undefined` when nothing is assigned.
 */
export function resolveResourceAssignmentHandle(
    params: ResolveResourceAssignmentHandleParams,
): string | undefined {
    return resolveResourceAssignmentValue({
        fallbackValue: params.fallbackHandle,
        resourceRoles: params.resourceRoles,
        resources: params.resources,
        roleNames: params.roleNames,
        valueField: 'memberHandle',
    })
}

/**
 * Merges challenge billing with project billing-account data without overriding
 * persisted challenge values.
 *
 * The project billing account is the fallback source for draft challenges whose
 * payload omits billing. It also replaces stale persisted `markup: 0` values
 * when the challenge is linked to the same billing account as the parent
 * project, because challenge-api currently returns that zero for drafts even
 * when the billing account has a real markup configured.
 *
 * @param billing current challenge billing stored in the form.
 * @param projectBillingAccount billing details resolved from the parent project.
 * @returns merged billing information for the challenge form.
 */
export function mergeChallengeBillingWithProjectBilling(
    billing: ChallengeBillingInfo | undefined,
    projectBillingAccount: ProjectChallengeBillingInfo | undefined,
): ChallengeBillingInfo | undefined {
    const billingAccountId = normalizeBillingAccountId(billing?.billingAccountId)
        || normalizeBillingAccountId(projectBillingAccount?.id)
    const projectMarkup = normalizeBillingMarkup(projectBillingAccount?.markup)
    const billingMarkup = normalizeBillingMarkup(billing?.markup)
    const markup = shouldPreferProjectBillingMarkup(billing, projectBillingAccount)
        ? projectMarkup
        : billingMarkup ?? projectMarkup

    if (!billingAccountId && markup === undefined) {
        return undefined
    }

    return {
        billingAccountId,
        markup,
    }
}

/**
 * Compares challenge billing values after normalizing ids and markup numbers.
 *
 * @param billingA first billing value to compare.
 * @param billingB second billing value to compare.
 * @returns `true` when both billing values represent the same data.
 */
export function hasSameChallengeBillingInfo(
    billingA: ChallengeBillingInfo | undefined,
    billingB: ChallengeBillingInfo | undefined,
): boolean {
    const normalizedBillingA = mergeChallengeBillingWithProjectBilling(billingA, undefined)
    const normalizedBillingB = mergeChallengeBillingWithProjectBilling(billingB, undefined)

    return normalizeBillingAccountId(normalizedBillingA?.billingAccountId)
        === normalizeBillingAccountId(normalizedBillingB?.billingAccountId)
        && normalizeBillingMarkup(normalizedBillingA?.markup)
        === normalizeBillingMarkup(normalizedBillingB?.markup)
}

/**
 * Applies project billing-account defaults to challenge form data.
 *
 * The returned form data keeps any saved challenge billing and fills only the
 * missing pieces needed by billing-dependent UI, such as fee calculations.
 *
 * @param formData challenge form state to normalize.
 * @param projectBillingAccount billing details resolved from the parent project.
 * @returns form data with merged billing values.
 */
export function applyProjectBillingToChallengeFormData(
    formData: ChallengeEditorFormData,
    projectBillingAccount: ProjectChallengeBillingInfo | undefined,
): ChallengeEditorFormData {
    const billing = mergeChallengeBillingWithProjectBilling(
        formData.billing,
        projectBillingAccount,
    )

    return hasSameChallengeBillingInfo(formData.billing, billing)
        ? formData
        : {
            ...formData,
            billing,
        }
}

/**
 * Resolves the timeline template id to use when creating a challenge.
 *
 * For two-round challenges, this selects an active template for the chosen track/type
 * that includes all checkpoint phases (matched by phase names or canonical phase ids),
 * preferring a default template when present.
 *
 * @param params challenge creation context from the form and timeline metadata.
 * @returns resolved timeline template id, or `undefined` when not required/unavailable.
 */
export function resolveCreateTimelineTemplateId(
    params: ResolveCreateTimelineTemplateIdParams,
): string | undefined {
    if (params.roundType !== ROUND_TYPES.TWO_ROUNDS) {
        return undefined
    }

    if (!params.trackId || !params.typeId) {
        return undefined
    }

    const matchingTwoRoundTemplates = params.timelineTemplates
        .filter(template => template.isActive !== false)
        .filter(template => template.trackId === params.trackId && template.typeId === params.typeId)
        .filter(template => hasCheckpointPhases(template))

    const preferredTemplate = matchingTwoRoundTemplates
        .find(template => template.id === DESIGN_TWO_ROUND_TEMPLATE_ID)
        || matchingTwoRoundTemplates.find(template => template.isDefault)
        || matchingTwoRoundTemplates[0]

    return preferredTemplate?.id
}
