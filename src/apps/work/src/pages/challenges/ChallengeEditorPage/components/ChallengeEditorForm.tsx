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
    PRIZE_SET_TYPES,
} from '../../../../lib/constants/challenge-editor.constants'
import {
    useAutosave,
    useFetchChallengeTracks,
    useFetchChallengeTypes,
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
    FunChallengeField,
} from './FunChallengeField'
import {
    GroupsField,
} from './GroupsField'
import {
    MaximumSubmissionsField,
} from './MaximumSubmissionsField'
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
import styles from './ChallengeEditorForm.module.scss'

interface ChallengeEditorFormProps {
    challenge?: Challenge
    isEditMode?: boolean
    onRegisterLaunchAction?: (action: (() => Promise<void>) | undefined) => void
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

function normalizeChallengeTypeToken(value: unknown): string {
    return normalizeTextValue(value)
        .toUpperCase()
        .replace(/[-_\s]/g, '')
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
    const onRegisterLaunchAction = props.onRegisterLaunchAction
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
    const [saveStatus, setSaveStatus] = useState<'error' | 'idle' | 'saved' | 'saving'>('idle')

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
    const showRoundTypeField = isDesignTrackSelected && Boolean(values.typeId?.trim())
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
        && (!isChallengeCreated || normalizedChallengeStatus === CHALLENGE_STATUS.NEW)
    const showPrizesAndBillingSection = !isFunChallengeSelected

    useEffect(() => {
        setCurrentChallengeId(props.challenge?.id)
        defaultedDiscussionForumTypeIdRef.current = undefined
        reset(transformChallengeToFormData(props.challenge))
    }, [props.challenge, reset])

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

    const createNewChallenge = useCallback(
        async (): Promise<void> => {
            const isBasicInfoValid = await trigger([
                'name',
                'trackId',
                'typeId',
            ])

            if (!isBasicInfoValid) {
                return
            }

            setIsSaving(true)
            setSaveStatus('saving')
            setSaveError(undefined)

            try {
                const formData = getValues()
                const createProjectId = normalizeProjectId(formData.projectId) || fallbackProjectId
                if (!createProjectId) {
                    throw new Error('Project id is required to create challenge')
                }

                const savedChallenge = await createChallenge({
                    funChallenge: formData.funChallenge === true,
                    name: formData.name,
                    projectId: createProjectId,
                    status: CHALLENGE_STATUS.NEW,
                    trackId: formData.trackId,
                    typeId: formData.typeId,
                })
                const nextValues = transformChallengeToFormData(savedChallenge)
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

            try {
                const {
                    isSaveAsDraft,
                    payloadStatus,
                }: SaveStatusMetadata = getSaveStatusMetadata(formData.status, options)
                const payload = transformFormDataToChallenge({
                    ...formData,
                    status: payloadStatus,
                })
                const savedChallenge = await patchChallenge(currentChallengeId, payload)

                const nextValues = transformChallengeToFormData(savedChallenge)
                const savedAt = new Date()

                setCurrentChallengeId(savedChallenge.id)
                setLastSaved(savedAt)
                setSaveStatus('saved')

                reset(nextValues)

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
            currentChallengeId,
            isEditMode,
            navigate,
            reset,
        ],
    )

    const launchChallenge = useCallback(async (): Promise<void> => {
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
        saveChallenge,
    ])

    useEffect(() => {
        if (!onRegisterLaunchAction) {
            return undefined
        }

        onRegisterLaunchAction(currentChallengeId
            ? launchChallenge
            : undefined)

        return () => {
            onRegisterLaunchAction(undefined)
        }
    }, [
        currentChallengeId,
        launchChallenge,
        onRegisterLaunchAction,
    ])

    const autosaveResult = useAutosave<ChallengeEditorFormData>({
        delay: AUTOSAVE_DELAY_MS,
        enabled: !!currentChallengeId
            && formState.isDirty
            && formState.isValid
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
                    showErrorToast(reviewerValidationError)
                    return
                }
            }

            clearErrors('reviewers')
            await saveChallenge(formData)
        },
        [
            clearErrors,
            isTaskChallengeSelected,
            resolvedChallengeTypeAbbreviation,
            resolvedChallengeTypeName,
            saveChallenge,
            setError,
        ],
    )

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
            <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
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

                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Reviewers</h3>
                                <div className={styles.block}>
                                    <ReviewersField />
                                </div>
                            </section>

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
                                    {saveError
                                        ? <span className={styles.errorText}>{saveError}</span>
                                        : undefined}
                                </div>

                                <div className={styles.actions}>
                                    <Link className={styles.cancelLink} to={challengesListPath}>
                                        Cancel
                                    </Link>
                                    <Button
                                        disabled={!formState.isDirty || isSaving}
                                        label={submitButtonLabel}
                                        primary
                                        size='lg'
                                        type='submit'
                                    />
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
