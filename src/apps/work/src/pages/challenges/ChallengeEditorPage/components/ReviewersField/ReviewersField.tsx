import {
    ChangeEvent,
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import {
    useController,
    useFormContext,
    useWatch,
} from 'react-hook-form'

import { Button } from '~/libs/ui'

import {
    FormRadioGroup,
    FormRadioOption,
    FormSelectField,
    FormSelectOption,
    FormTextField,
    FormUserAutocomplete,
} from '../../../../../lib/components/form'
import {
    PRIZE_SET_TYPES,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    useFetchResourceRoles,
    UseFetchResourceRolesResult,
} from '../../../../../lib/hooks'
import {
    ChallengeEditorFormData,
    DefaultReviewer,
    Reviewer,
    Scorecard,
    Workflow,
} from '../../../../../lib/models'
import {
    createResource,
    deleteResource,
    fetchDefaultReviewers,
    fetchScorecards,
    fetchWorkflows,
    updateResourceRoleAssignment,
} from '../../../../../lib/services'

import styles from './ReviewersField.module.scss'

const reviewerTypeOptions: FormRadioOption<boolean>[] = [
    {
        label: 'Member reviewer',
        value: true,
    },
    {
        label: 'AI reviewer',
        value: false,
    },
]

const ESTIMATED_SUBMISSIONS_COUNT = 2

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

function toUniqueValues(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)))
}

function countMatchingValues(values: string[], value: string): number {
    return values.filter(item => item === value)
        .length
}

function getReviewerCount(reviewer?: Reviewer): number {
    return Math.max(1, Math.trunc(toNumber(reviewer?.memberReviewerCount) || 1))
}

function getAdditionalMemberIds(reviewer?: Reviewer): string[] {
    const additionalMemberIds = (reviewer as {
        additionalMemberIds?: unknown
    })?.additionalMemberIds

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

function getFirstPlacePrizeValue(
    prizeSets: ChallengeEditorFormData['prizeSets'],
): number {
    if (!Array.isArray(prizeSets)) {
        return 0
    }

    const placementPrizeSet = prizeSets.find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.PLACEMENT)

    return toNumber(placementPrizeSet?.prizes?.[0]?.value)
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

function getReviewerPhaseId(
    defaultReviewer: DefaultReviewer | undefined,
    phases: ChallengeEditorFormData['phases'],
): string | undefined {
    if (defaultReviewer?.phaseId) {
        return defaultReviewer.phaseId
    }

    if (!Array.isArray(phases) || !phases.length) {
        return undefined
    }

    const reviewPhase = phases.find(phase => (
        typeof phase?.name === 'string'
            && phase.name
                .toLowerCase()
                .includes('review')
    ))

    return reviewPhase?.phaseId || reviewPhase?.id || phases[0]?.phaseId || phases[0]?.id
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
            ? defaultReviewerCount
            : undefined,
        phaseId: getReviewerPhaseId(defaultReviewer, phases),
        roleId: defaultReviewer?.roleId,
        scorecardId: defaultReviewer?.scorecardId,
        shouldOpenOpportunity: memberReview
            ? false
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

export const ReviewersField: FC = () => {
    const formContext = useFormContext<ChallengeEditorFormData>()

    const {
        resourceRoles,
    }: UseFetchResourceRolesResult = useFetchResourceRoles()

    const [defaultReviewers, setDefaultReviewers] = useState<DefaultReviewer[]>([])
    const [scorecards, setScorecards] = useState<Scorecard[]>([])
    const [workflows, setWorkflows] = useState<Workflow[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [loadError, setLoadError] = useState<string | undefined>()

    const challengeId = useWatch({
        control: formContext.control,
        name: 'id',
    }) as string | undefined
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

    const reviewerRows = useMemo<Reviewer[]>(
        () => (Array.isArray(reviewers)
            ? reviewers
            : []),
        [reviewers],
    )

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

            const roleName = getRoleNameForPhaseName(phaseName)

            return roleIdByName.get(normalizeKey(roleName))
        },
        [phaseNameById, roleIdByName],
    )

    const resolveRoleIdForReviewer = useCallback(
        (reviewer: Reviewer | undefined): string | undefined => {
            if (!reviewer) {
                return undefined
            }

            return resolveRoleIdForPhase(reviewer.phaseId) || normalizeText(reviewer.roleId) || undefined
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

    const workflowOptions = useMemo<FormSelectOption[]>(
        () => workflows
            .map(workflow => ({
                label: workflow.name,
                value: workflow.id,
            })),
        [workflows],
    )

    const normalizedTrackId = normalizeText(trackId)
    const normalizedTypeId = normalizeText(typeId)
    const firstPlacePrize = useMemo(
        () => getFirstPlacePrizeValue(prizeSets),
        [prizeSets],
    )

    const getScorecardOptionsForReviewer = useCallback(
        (reviewer: Reviewer | undefined): FormSelectOption[] => {
            const reviewerPhaseId = normalizeText(reviewer?.phaseId)

            const matchingScorecards = scorecards.filter(scorecard => {
                const scorecardTrackId = normalizeText(scorecard.trackId)
                const scorecardTypeId = normalizeText(scorecard.typeId)
                const scorecardPhaseId = normalizeText(scorecard.phaseId)

                const matchesTrack = !normalizedTrackId || !scorecardTrackId || scorecardTrackId === normalizedTrackId
                const matchesType = !normalizedTypeId || !scorecardTypeId || scorecardTypeId === normalizedTypeId
                const matchesPhase = !reviewerPhaseId || !scorecardPhaseId || scorecardPhaseId === reviewerPhaseId

                return matchesTrack && matchesType && matchesPhase
            })

            const scorecardsToUse = matchingScorecards.length
                ? matchingScorecards
                : scorecards

            return scorecardsToUse.map(scorecard => ({
                label: scorecard.name,
                value: scorecard.id,
            }))
        },
        [
            normalizedTrackId,
            normalizedTypeId,
            scorecards,
        ],
    )

    const estimatedReviewerCost = useMemo(
        () => reviewerRows
            .reduce((sum, reviewer) => {
                if (reviewer?.isMemberReview === false) {
                    return sum
                }

                const fixedAmount = toNumber((reviewer as {
                    fixedAmount?: unknown
                }).fixedAmount)
                const baseCoefficient = toNumber(reviewer.baseCoefficient)
                const incrementalCoefficient = toNumber(reviewer.incrementalCoefficient)
                const reviewerCount = getReviewerCount(reviewer)
                const reviewerCost = fixedAmount + (
                    baseCoefficient + (incrementalCoefficient * ESTIMATED_SUBMISSIONS_COUNT)
                ) * firstPlacePrize

                return sum + reviewerCost * reviewerCount
            }, 0),
        [
            firstPlacePrize,
            reviewerRows,
        ],
    )

    useEffect(() => {
        let mounted = true

        setIsLoading(true)
        setLoadError(undefined)

        Promise.all([
            fetchScorecards({
                page: 1,
                perPage: 200,
            }),
            fetchWorkflows(),
        ])
            .then(([
                fetchedScorecards,
                fetchedWorkflows,
            ]) => {
                if (!mounted) {
                    return
                }

                setScorecards(fetchedScorecards)
                setWorkflows(fetchedWorkflows)
            })
            .catch((error: unknown) => {
                if (!mounted) {
                    return
                }

                setLoadError(getErrorMessage(error, 'Failed to load reviewer metadata'))
            })
            .finally(() => {
                if (mounted) {
                    setIsLoading(false)
                }
            })

        return () => {
            mounted = false
        }
    }, [])

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

    const sanitizeIntegerValue = useCallback(
        (value: string): string => value.replace(/[^\d]/g, ''),
        [],
    )

    const handleResourceError = useCallback(
        (error: unknown, fallbackMessage: string): void => {
            setLoadError(getErrorMessage(error, fallbackMessage))
        },
        [],
    )

    useEffect(() => {
        const normalizedChallengeId = normalizeText(challengeId)

        reviewerRows.forEach((reviewer, reviewerIndex) => {
            if (!reviewer || reviewer.isMemberReview === false || isPublicOpportunityOpen(reviewer)) {
                return
            }

            const reviewerCount = getReviewerCount(reviewer)
            const maxAdditionalMembers = Math.max(0, reviewerCount - 1)
            const additionalMemberIds = getAdditionalMemberIds(reviewer)

            if (additionalMemberIds.length <= maxAdditionalMembers) {
                return
            }

            const nextAdditionalMemberIds = additionalMemberIds.slice(0, maxAdditionalMembers)
            const keptMemberIds = toUniqueValues([
                normalizeText(reviewer.memberId),
                ...nextAdditionalMemberIds,
            ])
            const removedMemberIds = toUniqueValues(
                additionalMemberIds
                    .slice(maxAdditionalMembers)
                    .filter(memberId => !keptMemberIds.includes(memberId)),
            )

            formContext.setValue(
                `reviewers.${reviewerIndex}.additionalMemberIds` as any,
                nextAdditionalMemberIds.length
                    ? nextAdditionalMemberIds
                    : undefined,
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )

            const roleId = resolveRoleIdForReviewer(reviewer)
            if (!normalizedChallengeId || !roleId || !removedMemberIds.length) {
                return
            }

            Promise.all(removedMemberIds.map(memberId => deleteResource({
                challengeId: normalizedChallengeId,
                memberId,
                roleId,
            })))
                .catch(error => {
                    handleResourceError(error, 'Failed to update reviewer assignments')
                })
        })
    }, [
        challengeId,
        formContext,
        handleResourceError,
        resolveRoleIdForReviewer,
        reviewerRows,
    ])

    const clearReviewerAssignments = useCallback(
        (
            reviewerIndex: number,
            reviewer: Reviewer | undefined,
            fallbackMessage: string,
        ): void => {
            const normalizedChallengeId = normalizeText(challengeId)
            const roleId = resolveRoleIdForReviewer(reviewer)
            const assignedMemberIds = toUniqueValues(getAssignedMemberIds(reviewer))

            formContext.setValue(`reviewers.${reviewerIndex}.memberId` as any, undefined, {
                shouldDirty: true,
                shouldValidate: true,
            })
            formContext.setValue(`reviewers.${reviewerIndex}.additionalMemberIds` as any, undefined, {
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
                .catch(error => {
                    handleResourceError(error, fallbackMessage)
                })
        },
        [
            challengeId,
            formContext,
            handleResourceError,
            resolveRoleIdForReviewer,
        ],
    )

    const handleMemberSelectionChange = useCallback(
        (reviewerIndex: number, memberIndex: number, selectedMemberId: string): void => {
            const reviewer = reviewerRows[reviewerIndex]
            const normalizedChallengeId = normalizeText(challengeId)
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
                .catch(error => {
                    handleResourceError(error, 'Failed to update reviewer assignment')
                })
        },
        [
            challengeId,
            handleResourceError,
            resolveRoleIdForReviewer,
            reviewerRows,
        ],
    )

    const handlePhaseChange = useCallback(
        (reviewerIndex: number, nextPhaseId: string): void => {
            const reviewer = reviewerRows[reviewerIndex]
            const normalizedChallengeId = normalizeText(challengeId)

            if (!reviewer) {
                return
            }

            const nextRoleId = resolveRoleIdForPhase(nextPhaseId)
            if (nextRoleId && reviewer.roleId !== nextRoleId) {
                formContext.setValue(`reviewers.${reviewerIndex}.roleId` as any, nextRoleId, {
                    shouldDirty: true,
                    shouldValidate: true,
                })
            }

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
                .catch(error => {
                    handleResourceError(error, 'Failed to update reviewer role assignment')
                })
        },
        [
            challengeId,
            formContext,
            handleResourceError,
            resolveRoleIdForPhase,
            resolveRoleIdForReviewer,
            reviewerRows,
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

    const handleReviewerTypeChange = useCallback(
        (reviewerIndex: number, value: boolean | string): void => {
            const reviewer = reviewerRows[reviewerIndex]
            const isMemberReview = value === true

            if (!reviewer) {
                return
            }

            if (isMemberReview) {
                formContext.setValue(`reviewers.${reviewerIndex}.aiWorkflowId` as any, undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                })
                formContext.setValue(`reviewers.${reviewerIndex}.memberReviewerCount` as any, Math.max(
                    1,
                    Math.trunc(toNumber(reviewer.memberReviewerCount) || 1),
                ), {
                    shouldDirty: true,
                    shouldValidate: true,
                })
                formContext.setValue(`reviewers.${reviewerIndex}.shouldOpenOpportunity` as any, false, {
                    shouldDirty: true,
                    shouldValidate: true,
                })
                formContext.setValue(`reviewers.${reviewerIndex}.additionalMemberIds` as any, undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                })

                const inferredRoleId = resolveRoleIdForPhase(reviewer.phaseId)
                if (inferredRoleId) {
                    formContext.setValue(`reviewers.${reviewerIndex}.roleId` as any, inferredRoleId, {
                        shouldDirty: true,
                        shouldValidate: true,
                    })
                }

                return
            }

            formContext.setValue(`reviewers.${reviewerIndex}.memberReviewerCount` as any, undefined, {
                shouldDirty: true,
                shouldValidate: true,
            })
            formContext.setValue(`reviewers.${reviewerIndex}.shouldOpenOpportunity` as any, undefined, {
                shouldDirty: true,
                shouldValidate: true,
            })
            clearReviewerAssignments(reviewerIndex, reviewer, 'Failed to remove member reviewer assignment')
        },
        [
            clearReviewerAssignments,
            formContext,
            resolveRoleIdForPhase,
            reviewerRows,
        ],
    )

    const handleAiWorkflowChange = useCallback(
        (reviewerIndex: number, workflowId: string): void => {
            const selectedWorkflow = workflows.find(workflow => workflow.id === workflowId)

            formContext.setValue(
                `reviewers.${reviewerIndex}.scorecardId` as any,
                selectedWorkflow?.scorecardId || undefined,
                {
                    shouldDirty: true,
                    shouldValidate: true,
                },
            )
        },
        [
            formContext,
            workflows,
        ],
    )

    const applyDefaultReviewers = useCallback((): void => {
        if (!defaultReviewers.length) {
            return
        }

        const defaultReviewerRows: Reviewer[] = defaultReviewers
            .map(defaultReviewer => mapDefaultReviewerToReviewer(defaultReviewer, phases))
            .map(defaultReviewer => ({
                ...defaultReviewer,
                roleId: defaultReviewer.roleId || resolveRoleIdForPhase(defaultReviewer.phaseId),
            }))

        formContext.setValue('reviewers', [
            ...reviewerRows,
            ...defaultReviewerRows,
        ], {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        defaultReviewers,
        formContext,
        phases,
        resolveRoleIdForPhase,
        reviewerRows,
    ])

    const addReviewer = useCallback((): void => {
        const defaultReviewer = defaultReviewers[0]
        const reviewerFromDefaults = mapDefaultReviewerToReviewer(
            defaultReviewer,
            phases,
        )

        formContext.setValue('reviewers', [
            ...reviewerRows,
            {
                ...reviewerFromDefaults,
                roleId: reviewerFromDefaults.roleId || resolveRoleIdForPhase(reviewerFromDefaults.phaseId),
            },
        ], {
            shouldDirty: true,
            shouldValidate: true,
        })
    }, [
        defaultReviewers,
        formContext,
        phases,
        resolveRoleIdForPhase,
        reviewerRows,
    ])

    const removeReviewer = useCallback(
        async (reviewerIndex: number): Promise<void> => {
            const reviewer = reviewerRows[reviewerIndex]
            const normalizedChallengeId = normalizeText(challengeId)
            const assignedMemberIds = toUniqueValues(getAssignedMemberIds(reviewer))
            const roleId = resolveRoleIdForReviewer(reviewer)

            if (
                reviewer
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
                } catch (error) {
                    handleResourceError(error, 'Failed to remove reviewer resource')
                }
            }

            formContext.setValue('reviewers', reviewerRows
                .filter((_, index) => index !== reviewerIndex), {
                shouldDirty: true,
                shouldValidate: true,
            })
        },
        [
            challengeId,
            formContext,
            handleResourceError,
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

    const getReviewerTypeChangeHandler = useCallback(
        (reviewerIndex: number): ((value: boolean | string) => void) => (value: boolean | string): void => {
            handleReviewerTypeChange(reviewerIndex, value)
        },
        [handleReviewerTypeChange],
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

    const getWorkflowFieldValueHandler = useCallback(
        (reviewerIndex: number): ((selected: unknown) => string) => (selected: unknown): string => {
            const workflowId = getSelectValue(selected)
            handleAiWorkflowChange(reviewerIndex, workflowId)

            return workflowId
        },
        [handleAiWorkflowChange],
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
            </div>

            <div className={styles.actions}>
                <Button
                    disabled={isLoading}
                    label='Add reviewer'
                    onClick={addReviewer}
                    secondary
                />
                <Button
                    disabled={!defaultReviewers.length}
                    label='Apply default reviewers'
                    onClick={applyDefaultReviewers}
                    secondary
                />
            </div>

            <div className={styles.rows}>
                {reviewerRows.map((reviewer, index) => {
                    const isMemberReview = reviewer?.isMemberReview !== false
                    const shouldOpenOpportunity = isPublicOpportunityOpen(reviewer)
                    const reviewerCount = getReviewerCount(reviewer)
                    const scorecardOptions = getScorecardOptionsForReviewer(reviewer)
                    const reviewerPrefix = `reviewers.${index}`
                    const reviewerIdentity = reviewer.memberId
                        || getAdditionalMemberIds(reviewer)
                            .find(memberId => !!memberId)
                        || reviewer.phaseId
                        || reviewer.aiWorkflowId
                        || index
                    const reviewerKey = `${reviewerPrefix}-${reviewerIdentity}`

                    return (
                        <div
                            className={styles.row}
                            key={reviewerKey}
                        >
                            <div className={styles.grid}>
                                <FormSelectField
                                    label='Phase'
                                    name={`${reviewerPrefix}.phaseId`}
                                    options={phaseOptions}
                                    placeholder='Select phase'
                                    toFieldValue={getPhaseFieldValueHandler(index)}
                                />
                                <FormRadioGroup
                                    label='Reviewer Type'
                                    name={`${reviewerPrefix}.isMemberReview`}
                                    onChange={getReviewerTypeChangeHandler(index)}
                                    options={reviewerTypeOptions}
                                />
                                {isMemberReview
                                    ? (
                                        <FormSelectField
                                            label='Scorecard'
                                            name={`${reviewerPrefix}.scorecardId`}
                                            options={scorecardOptions}
                                            placeholder='Select scorecard'
                                            required
                                        />
                                    )
                                    : undefined}
                                {isMemberReview
                                    ? (
                                        <PublicOpportunityCheckboxField
                                            name={`${reviewerPrefix}.shouldOpenOpportunity`}
                                            onChange={getPublicOpportunityChangeHandler(index)}
                                        />
                                    )
                                    : (
                                        <FormSelectField
                                            label='AI workflow'
                                            name={`${reviewerPrefix}.aiWorkflowId`}
                                            options={workflowOptions}
                                            placeholder='Select AI workflow'
                                            toFieldValue={getWorkflowFieldValueHandler(index)}
                                        />
                                    )}
                                {isMemberReview
                                    ? (
                                        <FormTextField
                                            label='Reviewer Count'
                                            name={`${reviewerPrefix}.memberReviewerCount`}
                                            sanitize={sanitizeIntegerValue}
                                            type='number'
                                        />
                                    )
                                    : undefined}
                            </div>

                            {isMemberReview && !shouldOpenOpportunity
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
                                                            required={memberIndex === 0}
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

export default ReviewersField
