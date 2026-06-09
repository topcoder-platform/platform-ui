import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    useController,
    useFormContext,
    UseFormSetValue,
    useWatch,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import {
    FormSelectField,
    FormSelectOption,
    FormTextField,
    FormUserAutocomplete,
} from '../../../../../lib/components/form'
import {
    useFetchChallengeTracks,
    useFetchChallengeTypes,
    useFetchResourceRoles,
    UseFetchResourceRolesResult,
    useFetchResources,
} from '../../../../../lib/hooks'
import {
    MAX_MANUAL_REVIEWER_COUNT,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    ChallengeEditorFormData,
    DefaultReviewer,
    Resource,
    Reviewer,
    Scorecard,
} from '../../../../../lib/models'
import {
    createResource,
    deleteResource,
    fetchDefaultReviewers,
    fetchProfile,
    fetchScorecards,
    updateResourceRoleAssignment,
} from '../../../../../lib/services'
import {
    calculateEstimatedReviewerCost,
    getFirstPlacePrizeValue,
} from '../../../../../lib/utils'

import { isAiReviewer } from './reviewers-field.utils'
import {
    buildAssignedResourcesByReviewer,
} from './reviewerAssignments.utils'
import styles from './ReviewersField.module.scss'

const SCORECARD_TRACK_ALIASES: Record<string, string> = {
    DATA_SCIENCE: 'DATA_SCIENCE',
    DATASCIENCE: 'DATA_SCIENCE',
    DES: 'DESIGN',
    DESIGN: 'DESIGN',
    DEV: 'DEVELOPMENT',
    DEVELOP: 'DEVELOPMENT',
    DEVELOPMENT: 'DEVELOPMENT',
    DS: 'DATA_SCIENCE',
    QA: 'QUALITY_ASSURANCE',
    QUALITY_ASSURANCE: 'QUALITY_ASSURANCE',
    QUALITYASSURANCE: 'QUALITY_ASSURANCE',
}
const ITERATIVE_REVIEW_ROLE_NAMES = [
    'Iterative Reviewer',
    'Iterative Review',
    'Reviewer',
]
const NON_REVIEWER_PHASE_KEYS = new Set([
    'checkpointsubmission',
    'registration',
    'submission',
    'topcodersubmission',
    'topgearsubmission',
])
const APPEAL_PHASE_KEYS = new Set([
    'appeals',
    'appealsresponse',
])
const REVIEW_OPPORTUNITY_TYPES = {
    COMPONENT_DEV_REVIEW: 'COMPONENT_DEV_REVIEW',
    ITERATIVE_REVIEW: 'ITERATIVE_REVIEW',
    REGULAR_REVIEW: 'REGULAR_REVIEW',
    SCENARIOS_REVIEW: 'SCENARIOS_REVIEW',
    SPEC_REVIEW: 'SPEC_REVIEW',
} as const
const REVIEW_OPPORTUNITY_OPTIONS: FormSelectOption[] = [
    {
        label: 'Regular Review',
        value: REVIEW_OPPORTUNITY_TYPES.REGULAR_REVIEW,
    },
    {
        label: 'Component Dev Review',
        value: REVIEW_OPPORTUNITY_TYPES.COMPONENT_DEV_REVIEW,
    },
    {
        label: 'Spec Review',
        value: REVIEW_OPPORTUNITY_TYPES.SPEC_REVIEW,
    },
    {
        label: 'Iterative Review',
        value: REVIEW_OPPORTUNITY_TYPES.ITERATIVE_REVIEW,
    },
    {
        label: 'Scenarios Review',
        value: REVIEW_OPPORTUNITY_TYPES.SCENARIOS_REVIEW,
    },
]

function toNumber(value: unknown): number {
    const parsed = Number(value)

    return Number.isFinite(parsed)
        ? parsed
        : 0
}

function normalizeText(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value
        .trim()
}

function normalizeKey(value: unknown): string {
    return normalizeText(value)
        .toLowerCase()
        .replace(/[-_\s]/g, '')
}

/**
 * Compares reviewer-related text values without treating casing drift as a mismatch.
 */
function hasSameNormalizedText(valueA: unknown, valueB: unknown): boolean {
    return normalizeText(valueA)
        .toLowerCase() === normalizeText(valueB)
        .toLowerCase()
}

function normalizeTrackForScorecards(value: unknown): string {
    const normalizedValue = normalizeText(value)
        .toUpperCase()
        .replace(/\s+/g, '_')

    if (!normalizedValue) {
        return ''
    }

    return SCORECARD_TRACK_ALIASES[normalizedValue] || normalizedValue
}

/**
 * Returns whether a phase should appear in the manual reviewer phase selector.
 * Appeal phases stay hidden because the review-phase reviewers cover those
 * responsibilities for every challenge type.
 */
function isSelectableReviewerPhaseName(
    phaseName: string | undefined,
    allowAppealPhases: boolean = true,
): boolean {
    const normalizedPhaseName = normalizeKey(phaseName)

    return !!normalizedPhaseName
        && !NON_REVIEWER_PHASE_KEYS.has(normalizedPhaseName)
        && (allowAppealPhases || !APPEAL_PHASE_KEYS.has(normalizedPhaseName))
}

function normalizePhaseToken(value: unknown): string {
    return normalizeText(value)
        .toLowerCase()
        .replace(/\bphase\b$/, '')
        .replace(/[-_\s]/g, '')
}

function getPhaseMatchedScorecards(
    scorecards: Scorecard[],
    phaseId: string | undefined,
    phaseNameById: Map<string, string>,
): Scorecard[] {
    const reviewerPhaseId = normalizeText(phaseId)
    const reviewerPhaseName = reviewerPhaseId
        ? phaseNameById.get(reviewerPhaseId)
        : undefined
    const normalizedReviewerPhase = normalizePhaseToken(reviewerPhaseName)

    return scorecards.filter(scorecard => {
        const scorecardPhaseId = normalizeText(scorecard.phaseId)
        const normalizedScorecardType = normalizePhaseToken(scorecard.type)

        if (!reviewerPhaseId && !normalizedReviewerPhase) {
            return true
        }

        const matchesPhaseId = reviewerPhaseId
            && scorecardPhaseId
            && scorecardPhaseId === reviewerPhaseId
        const matchesPhaseType = normalizedReviewerPhase
            && normalizedScorecardType
            && normalizedScorecardType === normalizedReviewerPhase

        if (matchesPhaseId || matchesPhaseType) {
            return true
        }

        return !scorecardPhaseId && !normalizedScorecardType
    })
}

/**
 * Returns row-specific phase options, excluding phases already assigned on other
 * manual reviewer cards while preserving the current row's selection.
 */
function getReviewerPhaseOptions(params: {
    allowAppealPhases: boolean
    options: FormSelectOption[]
    phaseNameById: Map<string, string>
    reviewerIndex: number
    reviewers: Reviewer[]
}): FormSelectOption[] {
    const currentPhaseId = normalizeText(params.reviewers[params.reviewerIndex]?.phaseId)
    const assignedPhaseIds = new Set(
        params.reviewers
            .map((reviewer, index) => (
                index === params.reviewerIndex
                    ? ''
                    : normalizeText(reviewer.phaseId)
            ))
            .filter(Boolean),
    )

    return params.options.filter(option => {
        const phaseId = normalizeText(option.value)

        if (!phaseId) {
            return false
        }

        if (phaseId === currentPhaseId) {
            return true
        }

        if (assignedPhaseIds.has(phaseId)) {
            return false
        }

        return isSelectableReviewerPhaseName(
            params.phaseNameById.get(phaseId),
            params.allowAppealPhases,
        )
    })
}

function formatScorecardLabel(scorecard: Scorecard): string {
    const scorecardName = normalizeText(scorecard.name) || scorecard.id
    const scorecardType = normalizeText(scorecard.type)
    const scorecardTrack = normalizeText(scorecard.challengeTrack) || normalizeText(scorecard.track)
    const scorecardVersion = normalizeText(scorecard.version)

    if (!scorecardType && !scorecardTrack && !scorecardVersion) {
        return scorecardName
    }

    const details = `${scorecardType || 'Unknown'} (${scorecardTrack || 'Unknown'})`

    return scorecardVersion
        ? `${scorecardName} - ${details} v${scorecardVersion}`
        : `${scorecardName} - ${details}`
}

function toUniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)))
}

function countMatchingValues(values: string[], value: string): number {
    return values.filter(item => item === value)
        .length
}

function getReviewerCount(reviewer?: Reviewer): number {
    return Math.min(
        MAX_MANUAL_REVIEWER_COUNT,
        Math.max(1, Math.trunc(toNumber(reviewer?.memberReviewerCount) || 1)),
    )
}

function getAdditionalMemberIds(reviewer?: Reviewer): string[] {
    const additionalMemberIds = reviewer?.additionalMemberIds

    if (!Array.isArray(additionalMemberIds)) {
        return []
    }

    return additionalMemberIds.map(memberId => normalizeText(memberId))
}

function getAssignedMemberIds(reviewer?: Reviewer): string[] {
    return [
        normalizeText(reviewer?.memberId),
        ...getAdditionalMemberIds(reviewer),
    ]
}

function getMemberFieldName(
    reviewerPrefix: string,
    memberIndex: number,
): string {
    if (memberIndex === 0) {
        return `${reviewerPrefix}.memberId`
    }

    return `${reviewerPrefix}.additionalMemberIds.${memberIndex - 1}`
}

function isMemberReviewer(defaultReviewer?: DefaultReviewer): boolean {
    if (!defaultReviewer) {
        return true
    }

    if (typeof defaultReviewer.isMemberReview === 'boolean') {
        return defaultReviewer.isMemberReview
    }

    return !defaultReviewer.aiWorkflowId
}

function isPublicOpportunityOpen(reviewer?: Reviewer): boolean {
    return reviewer?.shouldOpenOpportunity === true
}

/**
 * Returns whether a manual reviewer row can be hydrated from persisted challenge resources.
 *
 * @param reviewer reviewer row from form state.
 * @param fieldIndex resolved reviewer field-array index.
 * @returns `true` when the row should receive persisted reviewer assignments.
 */
function canHydrateAssignedReviewer(
    reviewer: Reviewer | undefined,
    fieldIndex: number | undefined,
): boolean {
    return fieldIndex !== undefined
        && !!reviewer
        && reviewer.isMemberReview !== false
        && !isPublicOpportunityOpen(reviewer)
}

/**
 * Resolves member ids from persisted reviewer resources, using looked-up user ids for
 * legacy handle-only assignments when the challenge API omitted `memberId`.
 *
 * @param assignedResources persisted reviewer resources for a single reviewer row.
 * @param userIdsByHandle resolved profile ids keyed by lower-cased handle.
 * @returns de-duplicated reviewer member ids in persisted order.
 */
function getHydratedMemberIdsForResources(
    assignedResources: Resource[],
    userIdsByHandle: Map<string, string>,
): string[] {
    return toUniqueValues(
        assignedResources
            .map(resource => {
                const memberId = normalizeText(resource.memberId)

                if (memberId) {
                    return memberId
                }

                const memberHandle = normalizeText(resource.memberHandle)

                return memberHandle
                    ? userIdsByHandle.get(memberHandle.toLowerCase()) || ''
                    : ''
            })
            .filter(Boolean),
    )
}

interface HydratedReviewerAssignment {
    assignedHandle?: string
    assignedRoleId?: string
    memberIds: string[]
}

/**
 * Builds the reviewer assignment payload that should be rehydrated into a reviewer row.
 *
 * @param reviewer reviewer row from form state.
 * @param assignedResources persisted resources allocated to the reviewer row.
 * @param userIdsByHandle resolved profile ids keyed by lower-cased handle.
 * @returns the normalized reviewer assignment, or `undefined` when nothing can be restored.
 */
function getHydratedReviewerAssignment(
    reviewer: Reviewer,
    assignedResources: Resource[],
    userIdsByHandle: Map<string, string>,
): HydratedReviewerAssignment | undefined {
    const memberIds = getHydratedMemberIdsForResources(assignedResources, userIdsByHandle)
        .slice(0, getReviewerCount(reviewer))
    const assignedHandle = normalizeText(reviewer.handle)
        || normalizeText(assignedResources[0]?.memberHandle)
        || undefined
    const assignedRoleId = normalizeText(reviewer.roleId)
        || normalizeText(assignedResources[0]?.roleId)
        || undefined

    if (!memberIds.length && !assignedHandle && !assignedRoleId) {
        return undefined
    }

    return {
        assignedHandle,
        assignedRoleId,
        memberIds,
    }
}

/**
 * Writes a restored reviewer assignment back into the form without marking the draft dirty.
 *
 * @param params reviewer row metadata and assignment values to apply.
 */
function applyHydratedReviewerAssignment(params: {
    assignment: HydratedReviewerAssignment
    fieldIndex: number
    reviewer: Reviewer
    setValue: UseFormSetValue<ChallengeEditorFormData>
}): void {
    const existingAssignedMemberIds = toUniqueValues(getAssignedMemberIds(params.reviewer))

    if (!existingAssignedMemberIds.length && params.assignment.memberIds.length) {
        const [
            memberId,
            ...additionalMemberIds
        ] = params.assignment.memberIds

        params.setValue(`reviewers.${params.fieldIndex}.memberId` as any, memberId || undefined, {
            shouldDirty: false,
            shouldValidate: true,
        })
        params.setValue(
            `reviewers.${params.fieldIndex}.additionalMemberIds` as any,
            additionalMemberIds.length
                ? additionalMemberIds
                : undefined,
            {
                shouldDirty: false,
                shouldValidate: true,
            },
        )
    }

    if (
        params.assignment.assignedHandle
        && normalizeText(params.reviewer.handle) !== params.assignment.assignedHandle
    ) {
        params.setValue(`reviewers.${params.fieldIndex}.handle` as any, params.assignment.assignedHandle, {
            shouldDirty: false,
            shouldValidate: false,
        })
    }

    if (
        params.assignment.assignedRoleId
        && normalizeText(params.reviewer.roleId) !== params.assignment.assignedRoleId
    ) {
        params.setValue(`reviewers.${params.fieldIndex}.roleId` as any, params.assignment.assignedRoleId, {
            shouldDirty: false,
            shouldValidate: false,
        })
    }
}

/**
 * Returns the stable id used by reviewer rows for a challenge phase.
 *
 * @param phase challenge phase row from the editor form.
 * @returns the normalized phase id or `undefined` when the row has no id.
 */
function getChallengePhaseId(
    phase: NonNullable<ChallengeEditorFormData['phases']>[number] | undefined,
): string | undefined {
    return normalizeText(phase?.phaseId) || normalizeText(phase?.id) || undefined
}

/**
 * Returns the first phase that is valid for a newly added manual reviewer row.
 *
 * @param phases current challenge schedule phases.
 * @returns a review phase id, another selectable reviewer phase id, or `undefined`.
 */
function getFallbackReviewerPhaseId(
    phases: ChallengeEditorFormData['phases'],
    assignedPhaseIds: Set<string> = new Set(),
): string | undefined {
    if (!Array.isArray(phases) || !phases.length) {
        return undefined
    }

    const isUnassignedSelectablePhase = (
        phase: NonNullable<ChallengeEditorFormData['phases']>[number] | undefined,
    ): boolean => {
        const phaseId = getChallengePhaseId(phase)

        return !!phaseId
            && !assignedPhaseIds.has(phaseId)
            && isSelectableReviewerPhaseName(phase?.name, false)
    }

    const reviewPhase = phases.find(phase => (
        isUnassignedSelectablePhase(phase)
        && normalizeKey(phase?.name)
            .includes('review')
    ))
    const selectablePhase = phases.find(isUnassignedSelectablePhase)
    const fallbackPhase = phases.find(phase => (
        isSelectableReviewerPhaseName(phase?.name, false)
    ))

    return getChallengePhaseId(reviewPhase)
        || getChallengePhaseId(selectablePhase)
        || getChallengePhaseId(fallbackPhase)
        || getChallengePhaseId(phases[0])
}

function getReviewerPhaseId(
    defaultReviewer: DefaultReviewer | undefined,
    phases: ChallengeEditorFormData['phases'],
): string | undefined {
    const defaultPhaseId = normalizeText(defaultReviewer?.phaseId)

    if (defaultPhaseId) {
        const phaseRows = Array.isArray(phases)
            ? phases
            : []
        const hasMatchingPhase = !phaseRows.length
            || phaseRows.some(phase => getChallengePhaseId(phase) === defaultPhaseId)

        if (hasMatchingPhase) {
            return defaultPhaseId
        }
    }

    return getFallbackReviewerPhaseId(phases)
}

/**
 * Returns the next default reviewer row that maps to an unassigned selectable phase.
 *
 * @param params default reviewer metadata and current manual reviewer phase usage.
 * @returns matching default reviewer metadata, or `undefined` when no unused default phase exists.
 */
function getNextDefaultReviewerForManualRow(params: {
    assignedPhaseIds: Set<string>
    defaultReviewers: DefaultReviewer[]
    phaseNameById: Map<string, string>
    phases: ChallengeEditorFormData['phases']
}): DefaultReviewer | undefined {
    return params.defaultReviewers.find(defaultReviewer => {
        if (!isMemberReviewer(defaultReviewer)) {
            return false
        }

        const phaseId = getReviewerPhaseId(defaultReviewer, params.phases)

        return !!phaseId
            && !params.assignedPhaseIds.has(phaseId)
            && isSelectableReviewerPhaseName(params.phaseNameById.get(phaseId), false)
    })
}

/**
 * Resolves the stored review opportunity type for a manual reviewer row.
 *
 * Legacy drafts may omit the manual-reviewer `type` field even though work-manager
 * treated iterative-review rows as `ITERATIVE_REVIEW`. Prefer the matching default
 * reviewer configuration when present, then fall back to the iterative-review phase
 * mapping before using the regular review default.
 */
function getReviewOpportunityTypeForReviewer(params: {
    defaultReviewers: DefaultReviewer[]
    phaseId: string | undefined
    phaseNameById: Map<string, string>
    phases: ChallengeEditorFormData['phases']
}): string {
    const normalizedPhaseId = normalizeText(params.phaseId)
    const matchingDefaultReviewer = normalizedPhaseId
        ? params.defaultReviewers.find(defaultReviewer => (
            isMemberReviewer(defaultReviewer)
            && normalizeText(getReviewerPhaseId(defaultReviewer, params.phases)) === normalizedPhaseId
        ))
        : undefined
    const configuredOpportunityType = normalizeText(matchingDefaultReviewer?.opportunityType)

    if (configuredOpportunityType) {
        return configuredOpportunityType
    }

    const phaseName = normalizedPhaseId
        ? params.phaseNameById.get(normalizedPhaseId)
        : undefined

    return normalizeKey(phaseName) === 'iterativereview'
        ? REVIEW_OPPORTUNITY_TYPES.ITERATIVE_REVIEW
        : REVIEW_OPPORTUNITY_TYPES.REGULAR_REVIEW
}

function getRoleNameForPhaseName(phaseName: string | undefined): string {
    const normalizedPhaseName = normalizeKey(phaseName)

    if (normalizedPhaseName === 'approval') {
        return 'Approver'
    }

    if (normalizedPhaseName === 'checkpointscreening') {
        return 'Checkpoint Screener'
    }

    if (normalizedPhaseName === 'checkpointreview') {
        return 'Checkpoint Reviewer'
    }

    if (normalizedPhaseName === 'iterativereview') {
        return 'Iterative Reviewer'
    }

    if (normalizedPhaseName === 'screening') {
        return 'Screener'
    }

    return 'Reviewer'
}

/**
 * Resolves the accepted reviewer resource-role aliases for a phase.
 */
function getReviewerRoleNamesForPhaseName(phaseName: string | undefined): string[] {
    return normalizeKey(phaseName) === 'iterativereview'
        ? ITERATIVE_REVIEW_ROLE_NAMES
        : [getRoleNameForPhaseName(phaseName)]
}

function mapDefaultReviewerToReviewer(
    defaultReviewer: DefaultReviewer | undefined,
    phases: ChallengeEditorFormData['phases'],
): Reviewer {
    const memberReview = isMemberReviewer(defaultReviewer)
    const defaultReviewerCount = Math.max(
        1,
        Math.trunc(toNumber(defaultReviewer?.memberReviewerCount) || 1),
    )

    return {
        aiWorkflowId: memberReview
            ? undefined
            : defaultReviewer?.aiWorkflowId,
        baseCoefficient: defaultReviewer?.baseCoefficient !== undefined
            ? toNumber(defaultReviewer.baseCoefficient)
            : (memberReview ? 0.13 : 0),
        incrementalCoefficient: defaultReviewer?.incrementalCoefficient !== undefined
            ? toNumber(defaultReviewer.incrementalCoefficient)
            : (memberReview ? 0.05 : 0),
        isMemberReview: memberReview,
        memberReviewerCount: memberReview
            ? Math.min(defaultReviewerCount, MAX_MANUAL_REVIEWER_COUNT)
            : undefined,
        phaseId: getReviewerPhaseId(defaultReviewer, phases),
        roleId: defaultReviewer?.roleId,
        scorecardId: defaultReviewer?.scorecardId,
        shouldOpenOpportunity: memberReview
            ? (defaultReviewer?.shouldOpenOpportunity ?? false)
            : undefined,
        type: memberReview
            ? (
                normalizeText(defaultReviewer?.opportunityType)
                || REVIEW_OPPORTUNITY_TYPES.REGULAR_REVIEW
            )
            : undefined,
    }
}

function getSelectValue(selected: unknown): string {
    if (!selected || typeof selected !== 'object') {
        return ''
    }

    const optionValue = (selected as FormSelectOption).value

    return typeof optionValue === 'string'
        ? optionValue
        : ''
}

/**
 * Maps the stored reviewer type value to the matching select option while
 * defaulting legacy reviewer rows to `Regular Review` when the field is absent.
 *
 * @param value current form value for the reviewer type field.
 * @param options available reviewer type select options.
 * @returns the matching select option, or `undefined` when no option matches.
 * @remarks Used by `HumanReviewTab` to keep manual reviewer cards aligned with
 * the legacy work manager UI.
 */
function getReviewTypeFieldValue(
    value: unknown,
    options: FormSelectOption[],
): FormSelectOption | undefined {
    const selectedValue = normalizeText(value)
        || REVIEW_OPPORTUNITY_TYPES.REGULAR_REVIEW

    return options.find(option => option.value === selectedValue)
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message
    }

    return fallbackMessage
}

interface PublicOpportunityCheckboxFieldProps {
    name: string
    onChange?: (checked: boolean) => void
}

const PublicOpportunityCheckboxField: FC<PublicOpportunityCheckboxFieldProps> = (
    props: PublicOpportunityCheckboxFieldProps,
) => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const controller = useController({
        control: formContext.control,
        name: props.name,
    })
    const field = controller.field
    const checked = field.value === true

    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>): void => {
            const nextValue = event.target.checked
            field.onChange(nextValue)
            props.onChange?.(nextValue)
        },
        [
            field,
            props,
        ],
    )

    return (
        <div className={styles.publicOpportunityField}>
            <label
                className={styles.publicOpportunityLabel}
                htmlFor={props.name}
            >
                <input
                    checked={checked}
                    className={styles.publicOpportunityInput}
                    id={props.name}
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={handleChange}
                    type='checkbox'
                />
                <span>Open public review opportunity</span>
            </label>
        </div>
    )
}

export const HumanReviewTab: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()
    const reviewersFieldState = useController({
        control: formContext.control,
        name: 'reviewers',
    }).fieldState
    const challengeTracksResult = useFetchChallengeTracks()
    const challengeTypesResult = useFetchChallengeTypes()
    const challengeTracks = challengeTracksResult.tracks
    const challengeTypes = challengeTypesResult.challengeTypes

    const {
        resourceRoles,
    }: UseFetchResourceRolesResult = useFetchResourceRoles()

    const [defaultReviewers, setDefaultReviewers] = useState<DefaultReviewer[]>([])
    const [scorecards, setScorecards] = useState<Scorecard[]>([])
    // Keep existing selections intact until the first scorecard fetch resolves.
    const [isScorecardsLoading, setIsScorecardsLoading] = useState<boolean>(true)
    const [loadError, setLoadError] = useState<string | undefined>()
    const autoBackfilledReviewerTypesRef = useRef<Record<string, string>>({})
    const trimmedAdditionalMemberIdsRef = useRef<Record<string, string>>({})
    const reconciledScorecardSelectionsRef = useRef<Record<string, string>>({})

    const challengeId = useWatch({
        control: formContext.control,
        name: 'id',
    }) as string | undefined
    const normalizedChallengeId = normalizeText(challengeId)
    const challengeResourcesResult = useFetchResources(normalizedChallengeId || undefined)
    const mutateChallengeResources = challengeResourcesResult.mutate
    const phases = useWatch({
        control: formContext.control,
        name: 'phases',
    }) as ChallengeEditorFormData['phases']
    const reviewers = useWatch({
        control: formContext.control,
        name: 'reviewers',
    }) as Reviewer[] | undefined
    const trackId = useWatch({
        control: formContext.control,
        name: 'trackId',
    }) as string | undefined
    const typeId = useWatch({
        control: formContext.control,
        name: 'typeId',
    }) as string | undefined
    const prizeSets = useWatch({
        control: formContext.control,
        name: 'prizeSets',
    }) as ChallengeEditorFormData['prizeSets']

    const allReviewerRows = useMemo<Reviewer[]>(
        () => (Array.isArray(reviewers)
            ? reviewers
            : []),
        [reviewers],
    )
    const reviewerFieldIndices = useMemo<number[]>(
        () => allReviewerRows
            .map((reviewer, index) => (
                isAiReviewer(reviewer)
                    ? undefined
                    : index
            ))
            .filter((index): index is number => index !== undefined),
        [allReviewerRows],
    )
    const reviewerRows = useMemo<Reviewer[]>(
        () => reviewerFieldIndices
            .map(index => allReviewerRows[index])
            .filter((reviewer): reviewer is Reviewer => !!reviewer),
        [
            allReviewerRows,
            reviewerFieldIndices,
        ],
    )
    const isFormDirty = formContext.formState.isDirty
    const getReviewerFieldIndex = useCallback(
        (reviewerIndex: number): number | undefined => reviewerFieldIndices[reviewerIndex],
        [reviewerFieldIndices],
    )
    const normalizedTrackId = normalizeText(trackId)
    const normalizedTypeId = normalizeText(typeId)

    const phaseNameById = useMemo<Map<string, string>>(
        () => {
            const nextPhaseNameById = new Map<string, string>()

            if (!Array.isArray(phases)) {
                return nextPhaseNameById
            }

            phases.forEach(phase => {
                const phaseName = normalizeText(phase.name)
                const phaseId = normalizeText(phase.phaseId) || normalizeText(phase.id)

                if (phaseId && phaseName) {
                    nextPhaseNameById.set(phaseId, phaseName)
                }
            })

            return nextPhaseNameById
        },
        [phases],
    )
    const allowAppealPhases = false

    const roleIdByName = useMemo<Map<string, string>>(
        () => {
            const nextRoleIdByName = new Map<string, string>()

            resourceRoles
                .forEach(role => {
                    const normalizedRoleName = normalizeKey(role.name)

                    if (normalizedRoleName) {
                        nextRoleIdByName.set(normalizedRoleName, role.id)
                    }
                })

            return nextRoleIdByName
        },
        [resourceRoles],
    )

    const resolveRoleIdForPhase = useCallback(
        (phaseId: string | undefined): string | undefined => {
            const normalizedPhaseId = normalizeText(phaseId)
            if (!normalizedPhaseId) {
                return undefined
            }

            const phaseName = phaseNameById.get(normalizedPhaseId)
            if (!phaseName) {
                return undefined
            }

            const roleNames = getReviewerRoleNamesForPhaseName(phaseName)

            return roleNames
                .map(roleName => roleIdByName.get(normalizeKey(roleName)))
                .find((roleId): roleId is string => !!roleId)
        },
        [phaseNameById, roleIdByName],
    )

    const resolveRoleIdForReviewer = useCallback(
        (reviewer: Reviewer | undefined): string | undefined => {
            if (!reviewer) {
                return undefined
            }

            return normalizeText(reviewer.roleId) || resolveRoleIdForPhase(reviewer.phaseId) || undefined
        },
        [resolveRoleIdForPhase],
    )

    const phaseOptions = useMemo<FormSelectOption[]>(
        () => (Array.isArray(phases)
            ? phases
                .map(phase => {
                    const phaseName = normalizeText(phase.name)
                    const phaseId = normalizeText(phase.phaseId) || normalizeText(phase.id)

                    if (!phaseName || !phaseId) {
                        return undefined
                    }

                    return {
                        label: phaseName,
                        value: phaseId,
                    }
                })
                .filter((phaseOption): phaseOption is FormSelectOption => !!phaseOption)
            : []),
        [phases],
    )
    const getPhaseOptionsForReviewer = useCallback(
        (reviewerIndex: number): FormSelectOption[] => getReviewerPhaseOptions({
            allowAppealPhases,
            options: phaseOptions,
            phaseNameById,
            reviewerIndex,
            reviewers: reviewerRows,
        }),
        [
            allowAppealPhases,
            phaseNameById,
            phaseOptions,
            reviewerRows,
        ],
    )
    const selectedScorecardTrack = useMemo(
        (): string => {
            if (!normalizedTrackId) {
                return ''
            }

            const selectedTrack = challengeTracks.find(track => normalizeText(track.id) === normalizedTrackId)
            if (!selectedTrack) {
                return ''
            }

            return normalizeTrackForScorecards(
                selectedTrack.track || selectedTrack.name || selectedTrack.abbreviation,
            )
        },
        [challengeTracks, normalizedTrackId],
    )
    const selectedScorecardType = useMemo(
        (): string => {
            if (!normalizedTypeId) {
                return ''
            }

            const selectedType = challengeTypes.find(type => normalizeText(type.id) === normalizedTypeId)

            return normalizeText(selectedType?.name)
        },
        [challengeTypes, normalizedTypeId],
    )
    const isLoading = isScorecardsLoading
    const reviewersValidationError = typeof reviewersFieldState.error?.message === 'string'
        ? reviewersFieldState.error.message
        : undefined
    const firstPlacePrize = useMemo(
        () => getFirstPlacePrizeValue(prizeSets),
        [prizeSets],
    )
    const getPhaseMatchedScorecardsForPhase = useCallback(
        (phaseId: string | undefined): Scorecard[] => getPhaseMatchedScorecards(
            scorecards,
            phaseId,
            phaseNameById,
        ),
        [
            phaseNameById,
            scorecards,
        ],
    )
    const getAvailableScorecardsForReviewer = useCallback(
        (reviewer: Reviewer | undefined): Scorecard[] => getPhaseMatchedScorecardsForPhase(reviewer?.phaseId),
        [getPhaseMatchedScorecardsForPhase],
    )

    const getScorecardOptionsForReviewer = useCallback(
        (reviewer: Reviewer | undefined): FormSelectOption[] => {
            const optionsById = new Map<string, FormSelectOption>()
            const availableScorecards = getAvailableScorecardsForReviewer(reviewer)

            availableScorecards.forEach(scorecard => {
                const scorecardId = normalizeText(scorecard.id)
                if (!scorecardId || optionsById.has(scorecardId)) {
                    return
                }

                optionsById.set(scorecardId, {
                    label: formatScorecardLabel(scorecard),
                    value: scorecardId,
                })
            })

            return Array.from(optionsById.values())
        },
        [
            getAvailableScorecardsForReviewer,
        ],
    )

    const estimatedReviewerCost = useMemo(
        () => calculateEstimatedReviewerCost(firstPlacePrize, reviewerRows),
        [
            firstPlacePrize,
            reviewerRows,
        ],
    )

    useEffect(() => {
        let mounted = true

        setIsScorecardsLoading(true)
        setLoadError(undefined)

        const scorecardFilters = {
            challengeTrack: selectedScorecardTrack || undefined,
            challengeType: selectedScorecardType || undefined,
            page: 1,
            perPage: 200,
            status: 'ACTIVE',
        }

        fetchScorecards(scorecardFilters)
            .then(fetchedScorecards => {
                if (!mounted) {
                    return
                }

                setScorecards(fetchedScorecards)
            })
            .catch((error: unknown) => {
                if (!mounted) {
                    return
                }

                setLoadError(getErrorMessage(error, 'Failed to load reviewer scorecards'))
            })
            .finally(() => {
                if (mounted) {
                    setIsScorecardsLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [selectedScorecardTrack, selectedScorecardType])

    useEffect(() => {
        const selectedTypeId = typeId?.trim() || ''
        const selectedTrackId = trackId?.trim() || ''

        if (!selectedTypeId || !selectedTrackId) {
            setDefaultReviewers([])
            return undefined
        }

        let mounted = true

        fetchDefaultReviewers(selectedTypeId, selectedTrackId)
            .then(fetchedDefaultReviewers => {
                if (!mounted) {
                    return
                }

                setDefaultReviewers(fetchedDefaultReviewers)
            })
            .catch(() => {
                if (mounted) {
                    setDefaultReviewers([])
                }
            })

        return () => {
            mounted = false
        }
    }, [trackId, typeId])

    useEffect(() => {
        const activeReviewerTypeFieldNames = new Set<string>()

        reviewerRows.forEach((reviewer, reviewerIndex) => {
            const fieldIndex = getReviewerFieldIndex(reviewerIndex)
            if (
                fieldIndex === undefined
                || !reviewer
                || reviewer.isMemberReview === false
            ) {
                return
            }

            const reviewerTypeFieldName = `reviewers.${fieldIndex}.type`
            const currentReviewerType = normalizeText(reviewer.type)
            const autoBackfilledReviewerType = autoBackfilledReviewerTypesRef.current[reviewerTypeFieldName]

            activeReviewerTypeFieldNames.add(reviewerTypeFieldName)

            if (currentReviewerType && !autoBackfilledReviewerType) {
                return
            }

            if (
                currentReviewerType
                && autoBackfilledReviewerType
                && currentReviewerType !== autoBackfilledReviewerType
            ) {
                delete autoBackfilledReviewerTypesRef.current[reviewerTypeFieldName]
                return
            }

            const nextReviewerType = getReviewOpportunityTypeForReviewer({
                defaultReviewers,
                phaseId: reviewer.phaseId,
                phaseNameById,
                phases,
            })

            autoBackfilledReviewerTypesRef.current[reviewerTypeFieldName] = nextReviewerType

            if (currentReviewerType === nextReviewerType) {
                return
            }

            formContext.setValue(
                reviewerTypeFieldName as any,
                nextReviewerType,
                {
                    shouldDirty: false,
                    shouldValidate: true,
                },
            )
        })

        Object.keys(autoBackfilledReviewerTypesRef.current)
            .forEach(reviewerTypeFieldName => {
                if (!activeReviewerTypeFieldNames.has(reviewerTypeFieldName)) {
                    delete autoBackfilledReviewerTypesRef.current[reviewerTypeFieldName]
                }
            })
    }, [
        defaultReviewers,
        formContext,
        getReviewerFieldIndex,
        phaseNameById,
        phases,
        reviewerRows,
    ])

    useEffect(() => {
        if (isScorecardsLoading || loadError) {
            return
        }

        reviewerRows.forEach((reviewer, reviewerIndex) => {
            const fieldIndex = getReviewerFieldIndex(reviewerIndex)
            if (
                fieldIndex === undefined
                || !reviewer
                || reviewer.isMemberReview === false
            ) {
                return
            }

            const scorecardFieldName = `reviewers.${fieldIndex}.scorecardId`
            const selectedScorecardId = normalizeText(reviewer.scorecardId)
            const scorecardSelectionKey = `${normalizeText(reviewer.phaseId)}:${selectedScorecardId}`
            if (!selectedScorecardId) {
                if (!reconciledScorecardSelectionsRef.current[scorecardFieldName]?.startsWith('invalid:')) {
                    delete reconciledScorecardSelectionsRef.current[scorecardFieldName]
                }

                return
            }

            const hasSelectedScorecard = getAvailableScorecardsForReviewer(reviewer)
                .some(scorecard => hasSameNormalizedText(scorecard.id, selectedScorecardId))
            if (hasSelectedScorecard) {
                const selectedScorecardKey = `valid:${scorecardSelectionKey}`
                if (reconciledScorecardSelectionsRef.current[scorecardFieldName] === selectedScorecardKey) {
                    return
                }

                reconciledScorecardSelectionsRef.current[scorecardFieldName] = selectedScorecardKey

                formContext.clearErrors(scorecardFieldName as any)

                return
            }

            const selectedScorecardKey = `invalid:${scorecardSelectionKey}`
            if (reconciledScorecardSelectionsRef.current[scorecardFieldName] === selectedScorecardKey) {
                return
            }

            reconciledScorecardSelectionsRef.current[scorecardFieldName] = selectedScorecardKey
            formContext.setValue(
                scorecardFieldName as any,
                undefined,
                {
                    shouldDirty: false,
                    shouldValidate: true,
                },
            )
        })
    }, [
        formContext,
        getAvailableScorecardsForReviewer,
        getReviewerFieldIndex,
        isScorecardsLoading,
        loadError,
        reviewerRows,
    ])

    useEffect(() => {
        if (
            !normalizedChallengeId
            || isFormDirty
            || challengeResourcesResult.isLoading
            || !resourceRoles.length
            || !reviewerRows.length
        ) {
            return undefined
        }

        let isActive = true
        const assignedResourcesByReviewer = buildAssignedResourcesByReviewer({
            getReviewerCount,
            phaseNameById,
            resourceRoles,
            resources: challengeResourcesResult.resources,
            reviewers: reviewerRows,
        })
        const handlesMissingUserIds = Array.from(new Set(
            assignedResourcesByReviewer
                .flat()
                .map(resource => {
                    const memberHandle = normalizeText(resource.memberHandle)
                    const memberId = normalizeText(resource.memberId)

                    return memberHandle && !memberId
                        ? memberHandle
                        : ''
                })
                .filter(Boolean),
        ))

        const hydrateAssignedMembers = async (): Promise<void> => {
            const userIdsByHandle = new Map<string, string>()

            await Promise.all(handlesMissingUserIds.map(async handle => {
                const profile = await fetchProfile(handle)
                    .catch(() => undefined)
                const userId = normalizeText(profile?.userId)

                if (userId) {
                    userIdsByHandle.set(handle.toLowerCase(), userId)
                }
            }))

            if (!isActive) {
                return
            }

            reviewerRows.forEach((reviewer, reviewerIndex) => {
                const fieldIndex = getReviewerFieldIndex(reviewerIndex)
                if (!canHydrateAssignedReviewer(reviewer, fieldIndex) || fieldIndex === undefined) {
                    return
                }

                const assignedResources = assignedResourcesByReviewer[reviewerIndex] || []
                const assignment = getHydratedReviewerAssignment(
                    reviewer,
                    assignedResources,
                    userIdsByHandle,
                )

                if (!assignment) {
                    return
                }

                applyHydratedReviewerAssignment({
                    assignment,
                    fieldIndex,
                    reviewer,
                    setValue: formContext.setValue,
                })
            })
        }

        hydrateAssignedMembers()
            .catch(() => undefined)

        return () => {
            isActive = false
        }
    }, [
        challengeResourcesResult.isLoading,
        challengeResourcesResult.resources,
        formContext,
        getReviewerFieldIndex,
        isFormDirty,
        normalizedChallengeId,
        phaseNameById,
        resourceRoles,
        reviewerRows,
    ])

    const sanitizeIntegerValue = useCallback(
        (value: string): string => {
            const digitsOnly = value.replace(/[^\d]/g, '')
            if (!digitsOnly) {
                return ''
            }

            const parsedValue = Number.parseInt(digitsOnly, 10)
            if (!Number.isFinite(parsedValue)) {
                return String(MAX_MANUAL_REVIEWER_COUNT)
            }

            return String(Math.min(Math.max(parsedValue, 1), MAX_MANUAL_REVIEWER_COUNT))
        },
        [],
    )

    const handleResourceError = useCallback(
        (error: unknown, fallbackMessage: string): void => {
            setLoadError(getErrorMessage(error, fallbackMessage))
        },
        [],
    )
    const refreshChallengeResources = useCallback((): void => {
        if (!normalizedChallengeId) {
            return
        }

        mutateChallengeResources()
            .catch(() => undefined)
    }, [
        mutateChallengeResources,
        normalizedChallengeId,
    ])

    useEffect(() => {
        reviewerRows.forEach((reviewer, reviewerIndex) => {
            const fieldIndex = getReviewerFieldIndex(reviewerIndex)
            if (
                fieldIndex === undefined
                || !reviewer
                || reviewer.isMemberReview === false
                || isPublicOpportunityOpen(reviewer)
            ) {
                return
            }

            const reviewerCount = getReviewerCount(reviewer)
            const maxAdditionalMembers = Math.max(0, reviewerCount - 1)
            const additionalMemberIds = getAdditionalMemberIds(reviewer)
            const additionalMemberIdsFieldName = `reviewers.${fieldIndex}.additionalMemberIds`

            if (additionalMemberIds.length <= maxAdditionalMembers) {
                if (additionalMemberIds.length > 0 || maxAdditionalMembers > 0) {
                    delete trimmedAdditionalMemberIdsRef.current[additionalMemberIdsFieldName]
                }

                return
            }

            // React Hook Form can continue reporting a just-unregistered blank slot briefly.
            // Avoid re-running the same trim when the watched value has not actually moved.
            const trimSignature = JSON.stringify({
                additionalMemberIds,
                maxAdditionalMembers,
            })
            if (trimmedAdditionalMemberIdsRef.current[additionalMemberIdsFieldName] === trimSignature) {
                return
            }

            trimmedAdditionalMemberIdsRef.current[additionalMemberIdsFieldName] = trimSignature

            const nextAdditionalMemberIds = additionalMemberIds.slice(0, maxAdditionalMembers)
            const removedAdditionalMemberIds = additionalMemberIds.slice(maxAdditionalMembers)
            const keptMemberIds = toUniqueValues([
                normalizeText(reviewer.memberId),
                ...nextAdditionalMemberIds,
            ])
            const removedMemberIds = toUniqueValues(
                removedAdditionalMemberIds
                    .filter(memberId => !keptMemberIds.includes(memberId)),
            )
            const hasRemovedAdditionalMemberValue = removedAdditionalMemberIds.some(Boolean)

            removedAdditionalMemberIds.forEach((_, removedIndex) => {
                formContext.unregister(
                    `reviewers.${fieldIndex}.additionalMemberIds.${maxAdditionalMembers + removedIndex}` as any,
                )
            })

            formContext.setValue(
                additionalMemberIdsFieldName as any,
                nextAdditionalMemberIds.length
                    ? nextAdditionalMemberIds
                    : undefined,
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )

            const roleId = resolveRoleIdForReviewer(reviewer)
            if (
                !hasRemovedAdditionalMemberValue
                || !normalizedChallengeId
                || !roleId
                || !removedMemberIds.length
            ) {
                return
            }

            Promise.all(removedMemberIds.map(memberId => deleteResource({
                challengeId: normalizedChallengeId,
                memberId,
                roleId,
            })))
                .then(() => {
                    refreshChallengeResources()
                })
                .catch(error => {
                    handleResourceError(error, 'Failed to update reviewer assignments')
                })
        })
    }, [
        formContext,
        getReviewerFieldIndex,
        handleResourceError,
        normalizedChallengeId,
        refreshChallengeResources,
        resolveRoleIdForReviewer,
        reviewerRows,
    ])

    const clearReviewerAssignments = useCallback(
        (
            reviewerIndex: number,
            reviewer: Reviewer | undefined,
            fallbackMessage: string,
        ): void => {
            const fieldIndex = getReviewerFieldIndex(reviewerIndex)
            if (fieldIndex === undefined) {
                return
            }

            const roleId = resolveRoleIdForReviewer(reviewer)
            const assignedMemberIds = toUniqueValues(getAssignedMemberIds(reviewer))

            formContext.setValue(`reviewers.${fieldIndex}.memberId` as any, undefined, {
                shouldDirty: true,
                shouldValidate: true,
            })
            formContext.setValue(`reviewers.${fieldIndex}.additionalMemberIds` as any, undefined, {
                shouldDirty: true,
                shouldValidate: true,
            })

            if (!normalizedChallengeId || !roleId || !assignedMemberIds.length) {
                return
            }

            Promise.all(assignedMemberIds.map(memberId => deleteResource({
                challengeId: normalizedChallengeId,
                memberId,
                roleId,
            })))
                .then(() => {
                    refreshChallengeResources()
                })
                .catch(error => {
                    handleResourceError(error, fallbackMessage)
                })
        },
        [
            formContext,
            getReviewerFieldIndex,
            handleResourceError,
            normalizedChallengeId,
            refreshChallengeResources,
            resolveRoleIdForReviewer,
        ],
    )

    const handleMemberSelectionChange = useCallback(
        (reviewerIndex: number, memberIndex: number, selectedMemberId: string): void => {
            const reviewer = reviewerRows[reviewerIndex]
            const normalizedSelectedMemberId = normalizeText(selectedMemberId)

            if (
                !reviewer
                || reviewer.isMemberReview === false
                || isPublicOpportunityOpen(reviewer)
                || !normalizedChallengeId
            ) {
                return
            }

            const roleId = resolveRoleIdForReviewer(reviewer)
            if (!roleId) {
                return
            }

            const previousAssignedMemberIds = getAssignedMemberIds(reviewer)
            const previousMemberId = normalizeText(previousAssignedMemberIds[memberIndex])
            const nextAssignedMemberIds = [...previousAssignedMemberIds]

            while (nextAssignedMemberIds.length <= memberIndex) {
                nextAssignedMemberIds.push('')
            }

            nextAssignedMemberIds[memberIndex] = normalizedSelectedMemberId

            const syncAssignedMember = async (): Promise<void> => {
                if (
                    previousMemberId
                    && previousMemberId !== normalizedSelectedMemberId
                    && countMatchingValues(nextAssignedMemberIds, previousMemberId) === 0
                ) {
                    await deleteResource({
                        challengeId: normalizedChallengeId,
                        memberId: previousMemberId,
                        roleId,
                    })
                }

                if (
                    normalizedSelectedMemberId
                    && normalizedSelectedMemberId !== previousMemberId
                    && countMatchingValues(previousAssignedMemberIds, normalizedSelectedMemberId) === 0
                ) {
                    await createResource({
                        challengeId: normalizedChallengeId,
                        memberId: normalizedSelectedMemberId,
                        roleId,
                    })
                }

                return undefined
            }

            syncAssignedMember()
                .then(() => {
                    refreshChallengeResources()
                })
                .catch(error => {
                    handleResourceError(error, 'Failed to update reviewer assignment')
                })
        },
        [
            handleResourceError,
            normalizedChallengeId,
            refreshChallengeResources,
            resolveRoleIdForReviewer,
            reviewerRows,
        ],
    )

    const syncReviewerScorecardForPhase = useCallback(
        (reviewerIndex: number, reviewer: Reviewer, nextPhaseId: string): void => {
            const fieldIndex = getReviewerFieldIndex(reviewerIndex)
            const normalizedCurrentPhaseId = normalizeText(reviewer.phaseId)
            const normalizedNextPhaseId = normalizeText(nextPhaseId)
            if (
                fieldIndex === undefined
                || reviewer.isMemberReview === false
                || !normalizedNextPhaseId
                || normalizedCurrentPhaseId === normalizedNextPhaseId
            ) {
                return
            }

            const matchingScorecards = getPhaseMatchedScorecardsForPhase(nextPhaseId)
            const selectedScorecardId = normalizeText(reviewer.scorecardId)
            const hasSelectedScorecard = selectedScorecardId
                ? matchingScorecards.some(scorecard => (
                    hasSameNormalizedText(scorecard.id, selectedScorecardId)
                ))
                : false
            if (hasSelectedScorecard) {
                return
            }

            formContext.setValue(
                `reviewers.${fieldIndex}.scorecardId` as any,
                undefined,
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )
        },
        [
            formContext,
            getPhaseMatchedScorecardsForPhase,
            getReviewerFieldIndex,
        ],
    )

    const handlePhaseChange = useCallback(
        (reviewerIndex: number, nextPhaseId: string): void => {
            const reviewer = reviewerRows[reviewerIndex]
            const fieldIndex = getReviewerFieldIndex(reviewerIndex)

            if (!reviewer || fieldIndex === undefined) {
                return
            }

            const nextRoleId = resolveRoleIdForPhase(nextPhaseId)
            if (nextRoleId && reviewer.roleId !== nextRoleId) {
                formContext.setValue(`reviewers.${fieldIndex}.roleId` as any, nextRoleId, {
                    shouldDirty: true,
                    shouldValidate: true,
                })
            }

            syncReviewerScorecardForPhase(reviewerIndex, reviewer, nextPhaseId)

            if (
                reviewer.isMemberReview === false
                || isPublicOpportunityOpen(reviewer)
                || !normalizedChallengeId
            ) {
                return
            }

            const assignedMemberIds = toUniqueValues(getAssignedMemberIds(reviewer))
            if (!assignedMemberIds.length) {
                return
            }

            const previousRoleId = resolveRoleIdForReviewer(reviewer)
            if (!previousRoleId || !nextRoleId || previousRoleId === nextRoleId) {
                return
            }

            Promise.all(assignedMemberIds.map(memberId => updateResourceRoleAssignment({
                challengeId: normalizedChallengeId,
                currentRoleId: previousRoleId,
                memberId,
                newRoleId: nextRoleId,
            })))
                .then(() => {
                    refreshChallengeResources()
                })
                .catch(error => {
                    handleResourceError(error, 'Failed to update reviewer role assignment')
                })
        },
        [
            formContext,
            getReviewerFieldIndex,
            handleResourceError,
            normalizedChallengeId,
            refreshChallengeResources,
            resolveRoleIdForPhase,
            resolveRoleIdForReviewer,
            reviewerRows,
            syncReviewerScorecardForPhase,
        ],
    )

    const handlePublicOpportunityChange = useCallback(
        (reviewerIndex: number, nextValue: boolean): void => {
            if (!nextValue) {
                return
            }

            const reviewer = reviewerRows[reviewerIndex]
            if (!reviewer) {
                return
            }

            clearReviewerAssignments(reviewerIndex, reviewer, 'Failed to clear reviewer assignment')
        },
        [
            clearReviewerAssignments,
            reviewerRows,
        ],
    )

    const addReviewer = useCallback((): void => {
        const assignedPhaseIds = new Set(
            reviewerRows
                .map(reviewer => normalizeText(reviewer.phaseId))
                .filter(Boolean),
        )
        const defaultReviewer = getNextDefaultReviewerForManualRow({
            assignedPhaseIds,
            defaultReviewers,
            phaseNameById,
            phases,
        })
        const reviewerFromDefaults = mapDefaultReviewerToReviewer(
            defaultReviewer,
            phases,
        )
        const phaseId = (defaultReviewer ? reviewerFromDefaults.phaseId : undefined)
            || getFallbackReviewerPhaseId(phases, assignedPhaseIds)
        const roleIdForResolvedPhase = resolveRoleIdForPhase(phaseId)

        formContext.setValue('reviewers', [
            ...allReviewerRows,
            {
                ...reviewerFromDefaults,
                phaseId,
                roleId: roleIdForResolvedPhase || reviewerFromDefaults.roleId,
            },
        ], {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        defaultReviewers,
        allReviewerRows,
        formContext,
        phaseNameById,
        phases,
        reviewerRows,
        resolveRoleIdForPhase,
    ])

    const removeReviewer = useCallback(
        async (reviewerIndex: number): Promise<void> => {
            const reviewer = reviewerRows[reviewerIndex]
            const fieldIndex = getReviewerFieldIndex(reviewerIndex)
            const assignedMemberIds = toUniqueValues(getAssignedMemberIds(reviewer))
            const roleId = resolveRoleIdForReviewer(reviewer)

            if (
                fieldIndex !== undefined
                && reviewer
                && reviewer.isMemberReview !== false
                && !isPublicOpportunityOpen(reviewer)
                && normalizedChallengeId
                && assignedMemberIds.length
                && roleId
            ) {
                try {
                    await Promise.all(assignedMemberIds.map(memberId => deleteResource({
                        challengeId: normalizedChallengeId,
                        memberId,
                        roleId,
                    })))
                    refreshChallengeResources()
                } catch (error) {
                    handleResourceError(error, 'Failed to remove reviewer resource')
                }
            }

            if (fieldIndex === undefined) {
                return
            }

            formContext.setValue('reviewers', allReviewerRows
                .filter((_, index) => index !== fieldIndex), {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [
            allReviewerRows,
            formContext,
            getReviewerFieldIndex,
            handleResourceError,
            normalizedChallengeId,
            refreshChallengeResources,
            resolveRoleIdForReviewer,
            reviewerRows,
        ],
    )

    const getRemoveReviewerHandler = useCallback(
        (reviewerIndex: number): (() => void) => () => {
            removeReviewer(reviewerIndex)
                .catch(() => undefined)
        },
        [removeReviewer],
    )

    const getPhaseFieldValueHandler = useCallback(
        (reviewerIndex: number): ((selected: unknown) => string) => (selected: unknown): string => {
            const nextPhaseId = getSelectValue(selected)
            handlePhaseChange(reviewerIndex, nextPhaseId)

            return nextPhaseId
        },
        [handlePhaseChange],
    )

    const getPublicOpportunityChangeHandler = useCallback(
        (reviewerIndex: number): ((checked: boolean) => void) => (checked: boolean): void => {
            handlePublicOpportunityChange(reviewerIndex, checked)
        },
        [handlePublicOpportunityChange],
    )

    const getMemberValueChangeHandler = useCallback(
        (reviewerIndex: number, memberIndex: number): ((value: string) => void) => (value: string): void => {
            handleMemberSelectionChange(reviewerIndex, memberIndex, value)
        },
        [handleMemberSelectionChange],
    )

    return (
        <div className={styles.container}>
            <div className={styles.summary}>
                <div className={styles.estimatedCost}>
                    Estimated reviewer cost: $
                    {' '}
                    {estimatedReviewerCost.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                    })}
                </div>
                {loadError
                    ? <div className={styles.error}>{loadError}</div>
                    : undefined}
                {reviewersValidationError
                    ? <div className={styles.error}>{reviewersValidationError}</div>
                    : undefined}
            </div>

            <div className={styles.actions}>
                <Button
                    disabled={isLoading}
                    label='Add reviewer'
                    onClick={addReviewer}
                    secondary
                />
            </div>

            <div className={styles.rows}>
                {reviewerRows.map((reviewer, index) => {
                    const fieldIndex = getReviewerFieldIndex(index)
                    if (fieldIndex === undefined) {
                        return undefined
                    }

                    const shouldOpenOpportunity = isPublicOpportunityOpen(reviewer)
                    const reviewerCount = getReviewerCount(reviewer)
                    const scorecardOptions = getScorecardOptionsForReviewer(reviewer)
                    const reviewerPrefix = `reviewers.${fieldIndex}`
                    const reviewerIdentity = reviewer.resourceId
                        || reviewer.phaseId
                        || index
                    const reviewerKey = `${reviewerPrefix}-${reviewerIdentity}`

                    return (
                        <div
                            className={styles.row}
                            key={reviewerKey}
                        >
                            <div className={styles.grid}>
                                <div className={styles.primaryFields}>
                                    <FormSelectField
                                        label='Phase'
                                        name={`${reviewerPrefix}.phaseId`}
                                        options={getPhaseOptionsForReviewer(index)}
                                        placeholder='Select phase'
                                        toFieldValue={getPhaseFieldValueHandler(index)}
                                    />
                                    <FormSelectField
                                        className={styles.memberScorecardField}
                                        label='Scorecard'
                                        name={`${reviewerPrefix}.scorecardId`}
                                        options={scorecardOptions}
                                        placeholder='Select scorecard'
                                        required
                                    />
                                </div>
                                <div className={styles.memberReviewSettings}>
                                    <FormTextField
                                        label='Reviewer Count'
                                        max={MAX_MANUAL_REVIEWER_COUNT}
                                        min={1}
                                        name={`${reviewerPrefix}.memberReviewerCount`}
                                        sanitize={sanitizeIntegerValue}
                                        type='number'
                                    />
                                    <FormSelectField
                                        className={styles.memberReviewTypeField}
                                        fromFieldValue={getReviewTypeFieldValue}
                                        label='Review Type'
                                        name={`${reviewerPrefix}.type`}
                                        options={REVIEW_OPPORTUNITY_OPTIONS}
                                    />
                                    <PublicOpportunityCheckboxField
                                        name={`${reviewerPrefix}.shouldOpenOpportunity`}
                                        onChange={getPublicOpportunityChangeHandler(index)}
                                    />
                                </div>
                            </div>

                            {!shouldOpenOpportunity
                                ? (
                                    <div className={styles.memberAssignments}>
                                        <div className={styles.memberAssignmentsLabel}>Assign member(s):</div>
                                        <div className={styles.memberAssignmentsGrid}>
                                            {Array.from({
                                                length: reviewerCount,
                                            })
                                                .map((_, memberIndex) => {
                                                    const memberFieldName = getMemberFieldName(
                                                        reviewerPrefix,
                                                        memberIndex,
                                                    )

                                                    return (
                                                        <FormUserAutocomplete
                                                            key={memberFieldName}
                                                            label={`Member ${memberIndex + 1}`}
                                                            name={memberFieldName}
                                                            onValueChange={getMemberValueChangeHandler(
                                                                index,
                                                                memberIndex,
                                                            )}
                                                            placeholder='Search member'
                                                            required
                                                            valueField='userId'
                                                        />
                                                    )
                                                })}
                                        </div>
                                    </div>
                                )
                                : undefined}

                            <div className={styles.rowActions}>
                                <Button
                                    label='Remove reviewer'
                                    onClick={getRemoveReviewerHandler(index)}
                                    secondary
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default HumanReviewTab
