import {
    FC,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import {
    useFetchResourceRoles,
    useFetchResources,
} from '../../../../../lib/hooks'
import {
    AiReviewConfig,
    AiReviewConfigWorkflow,
    ChallengePhase,
    PrizeSet,
    Resource,
    ResourceRole,
    Reviewer,
    Scorecard,
    Workflow,
} from '../../../../../lib/models'
import {
    fetchAiReviewConfigByChallenge,
    fetchScorecards,
    fetchWorkflows,
    searchProfilesByUserIds,
} from '../../../../../lib/services'
import { REVIEW_APP_URL } from '../../../../../lib/constants'
import {
    MAX_MANUAL_REVIEWER_COUNT,
} from '../../../../../lib/constants/challenge-editor.constants'
import {
    calculateEstimatedReviewerCost,
    getFirstPlacePrizeValue,
} from '../../../../../lib/utils/prize.utils'

import {
    buildAssignedResourcesByReviewer,
} from './reviewerAssignments.utils'
import {
    isAiReviewer,
    normalizeReviewerText,
} from './reviewers-field.utils'
import styles from './ReviewConfigurationSummary.module.scss'

const REVIEW_TYPE_LABELS: Record<string, string> = {
    COMPONENT_DEV_REVIEW: 'Component Dev Review',
    ITERATIVE_REVIEW: 'Iterative Review',
    REGULAR_REVIEW: 'Regular Review',
    SCENARIOS_REVIEW: 'Scenarios Review',
    SPEC_REVIEW: 'Spec Review',
}

interface ReviewConfigurationSummaryProps {
    challengeId?: string
    phases?: ChallengePhase[]
    prizeSets?: PrizeSet[]
    reviewers?: Reviewer[]
    typeId?: string
}

/**
 * Resolves the configured reviewer count, defaulting to one reviewer when absent.
 *
 * @param reviewer reviewer row from the challenge form payload.
 * @returns a positive integer reviewer count.
 */
function getReviewerCount(reviewer?: Reviewer): number {
    return Math.min(
        MAX_MANUAL_REVIEWER_COUNT,
        Math.max(1, Math.trunc(Number(reviewer?.memberReviewerCount || 1) || 1)),
    )
}

/**
 * Resolves the display label for a reviewer's configured review type.
 *
 * @param reviewer reviewer row from the challenge payload.
 * @returns a human-readable review type label.
 */
function getReviewTypeLabel(reviewer: Reviewer): string {
    const normalizedType = normalizeReviewerText(reviewer.type)

    return REVIEW_TYPE_LABELS[normalizedType] || 'Regular Review'
}

/**
 * Resolves a phase id from either legacy or current challenge phase payload shapes.
 *
 * @param phase phase row from the challenge timeline.
 * @returns the normalized phase identifier when present.
 */
function getPhaseId(phase?: ChallengePhase): string {
    return normalizeReviewerText(phase?.phaseId) || normalizeReviewerText(phase?.id)
}

interface AssignedMemberDisplayValue {
    memberHandle?: string
    memberId?: string
}

function buildFallbackAssignedMembersByReviewer(reviewers: Reviewer[]): AssignedMemberDisplayValue[][] {
    return reviewers.map(reviewer => ([
        {
            memberHandle: normalizeReviewerText(reviewer.handle) || undefined,
            memberId: normalizeReviewerText(reviewer.memberId) || undefined,
        },
        ...((reviewer.additionalMemberIds || [])
            .map(memberId => ({
                memberHandle: undefined,
                memberId: normalizeReviewerText(memberId) || undefined,
            }))),
    ])
        .filter(assignedMember => !!assignedMember.memberHandle || !!assignedMember.memberId))
}

function formatAssignedMembers(
    assignedMembers: AssignedMemberDisplayValue[],
    memberHandlesByUserId: Record<string, string>,
): string {
    return assignedMembers
        .map(assignedMember => {
            const normalizedMemberHandle = normalizeReviewerText(assignedMember.memberHandle)
            if (normalizedMemberHandle) {
                return normalizedMemberHandle
            }

            const normalizedMemberId = normalizeReviewerText(assignedMember.memberId)
            if (!normalizedMemberId) {
                return ''
            }

            return memberHandlesByUserId[normalizedMemberId.toLowerCase()] || normalizedMemberId
        })
        .filter(Boolean)
        .join(', ')
}

/**
 * Resolves the display label for a human reviewer scorecard.
 *
 * @param scorecardId scorecard identifier stored on the reviewer row.
 * @param scorecardNameById lookup table of fetched scorecard names.
 * @returns a human-readable scorecard label.
 */
function getScorecardLabel(
    scorecardId: string | undefined,
    scorecardNameById: Map<string, string>,
): string {
    const normalizedScorecardId = normalizeReviewerText(scorecardId)

    if (!normalizedScorecardId) {
        return 'Not selected'
    }

    return scorecardNameById.get(normalizedScorecardId) || normalizedScorecardId
}

/**
 * Resolves the scorecard identifier for an AI workflow row.
 *
 * @param workflow AI workflow row from the saved config or reviewer fallback.
 * @param availableWorkflowMap lookup of workflow metadata from the review API.
 * @returns the normalized scorecard identifier when one is linked.
 */
function getWorkflowScorecardId(
    workflow: AiReviewConfigWorkflow,
    availableWorkflowMap: Map<string, Workflow>,
): string | undefined {
    const workflowId = normalizeReviewerText(workflow.workflowId)
    const workflowDetails = workflow.workflow || availableWorkflowMap.get(workflowId)

    return normalizeReviewerText(workflow.workflow?.scorecard?.id)
        || normalizeReviewerText(workflowDetails?.scorecardId)
        || undefined
}

/**
 * Resolves the display name for an AI workflow row.
 *
 * @param workflow AI workflow row from the saved config or reviewer fallback.
 * @param availableWorkflowMap lookup of workflow metadata from the review API.
 * @returns a workflow display label.
 */
function getWorkflowDisplayName(
    workflow: AiReviewConfigWorkflow,
    availableWorkflowMap: Map<string, Workflow>,
): string {
    const workflowId = normalizeReviewerText(workflow.workflowId)
    const workflowDetails = workflow.workflow || availableWorkflowMap.get(workflowId)

    return normalizeReviewerText(workflowDetails?.name) || workflowId || 'Unknown workflow'
}

/**
 * Resolves the scorecard label for an AI workflow row.
 *
 * @param workflow AI workflow row from the saved config or reviewer fallback.
 * @param availableWorkflowMap lookup of workflow metadata from the review API.
 * @param scorecardNameById lookup of fetched scorecard names.
 * @returns a scorecard display label.
 */
function getWorkflowScorecardLabel(
    workflow: AiReviewConfigWorkflow,
    availableWorkflowMap: Map<string, Workflow>,
    scorecardNameById: Map<string, string>,
): string {
    const scorecardName = normalizeReviewerText(workflow.workflow?.scorecard?.name)
    const scorecardId = getWorkflowScorecardId(workflow, availableWorkflowMap)
    const fetchedScorecardName = scorecardId
        ? scorecardNameById.get(scorecardId)
        : undefined

    return scorecardName || fetchedScorecardName || scorecardId || '-'
}

/**
 * Resolves the review-app scorecard URL for an AI workflow row when available.
 *
 * @param workflow AI workflow row from the saved config or reviewer fallback.
 * @param availableWorkflowMap lookup of workflow metadata from the review API.
 * @returns a review-app scorecard URL or `undefined` when no scorecard is linked.
 */
function getWorkflowScorecardUrl(
    workflow: AiReviewConfigWorkflow,
    availableWorkflowMap: Map<string, Workflow>,
): string | undefined {
    const scorecardId = getWorkflowScorecardId(workflow, availableWorkflowMap)

    if (!scorecardId || !REVIEW_APP_URL) {
        return undefined
    }

    return `${REVIEW_APP_URL}/scorecard/${encodeURIComponent(scorecardId)}`
}

/**
 * Collects the scorecard ids whose names must be loaded for the read-only summary.
 *
 * @param reviewers configured human reviewers from the challenge.
 * @param workflows AI workflows displayed in the summary.
 * @param availableWorkflowMap lookup of workflow metadata from the review API.
 * @returns unique scorecard ids that still need catalog lookup.
 */
function getReferencedScorecardIds(
    reviewers: Reviewer[],
    workflows: AiReviewConfigWorkflow[],
    availableWorkflowMap: Map<string, Workflow>,
): string[] {
    const scorecardIds = new Set<string>()

    reviewers.forEach(reviewer => {
        const scorecardId = normalizeReviewerText(reviewer.scorecardId)

        if (scorecardId) {
            scorecardIds.add(scorecardId)
        }
    })

    workflows.forEach(workflow => {
        if (normalizeReviewerText(workflow.workflow?.scorecard?.name)) {
            return
        }

        const scorecardId = getWorkflowScorecardId(workflow, availableWorkflowMap)

        if (scorecardId) {
            scorecardIds.add(scorecardId)
        }
    })

    return Array.from(scorecardIds)
}

/**
 * Builds the scorecard-name lookup used by the human and AI review summary tables.
 *
 * @param scorecards fetched scorecard catalog rows.
 * @param workflows AI workflows displayed in the summary.
 * @returns a normalized lookup of scorecard ids to display names.
 */
function buildScorecardNameMap(
    scorecards: Scorecard[],
    workflows: AiReviewConfigWorkflow[],
): Map<string, string> {
    const scorecardNameById = new Map<string, string>()

    scorecards.forEach(scorecard => {
        const scorecardId = normalizeReviewerText(scorecard.id)
        const scorecardName = normalizeReviewerText(scorecard.name)

        if (scorecardId && scorecardName) {
            scorecardNameById.set(scorecardId, scorecardName)
        }
    })

    workflows.forEach(workflow => {
        const scorecardId = normalizeReviewerText(workflow.workflow?.scorecard?.id)
        const scorecardName = normalizeReviewerText(workflow.workflow?.scorecard?.name)

        if (scorecardId && scorecardName && !scorecardNameById.has(scorecardId)) {
            scorecardNameById.set(scorecardId, scorecardName)
        }
    })

    return scorecardNameById
}

/**
 * Derives legacy AI workflow rows when a challenge still only stores AI reviewers on the challenge.
 *
 * @param aiReviewers AI reviewer rows assigned to the challenge.
 * @param availableWorkflowMap lookup of workflow metadata from the review API.
 * @returns workflow rows suitable for summary display.
 */
function mapLegacyAiReviewersToWorkflows(
    aiReviewers: Reviewer[],
    availableWorkflowMap: Map<string, Workflow>,
): AiReviewConfigWorkflow[] {
    return aiReviewers.map(reviewer => {
        const workflowId = normalizeReviewerText(reviewer.aiWorkflowId)
        const workflowDetails = availableWorkflowMap.get(workflowId)

        return {
            isGating: false,
            weightPercent: 0,
            workflow: workflowDetails
                ? {
                    id: workflowDetails.id,
                    name: workflowDetails.name,
                    scorecardId: workflowDetails.scorecardId,
                }
                : undefined,
            workflowId,
        }
    })
}

/**
 * Builds a stable row key for the human-review summary table.
 *
 * @param reviewer human reviewer row from the challenge payload.
 * @param index row index from the rendered human-review table.
 * @returns a deterministic table row key.
 */
function getHumanReviewerRowKey(reviewer: Reviewer, index: number): string {
    return [
        normalizeReviewerText(reviewer.phaseId),
        normalizeReviewerText(reviewer.scorecardId),
        normalizeReviewerText(reviewer.memberId),
        normalizeReviewerText(reviewer.handle),
        String(getReviewerCount(reviewer)),
        reviewer.shouldOpenOpportunity ? 'open' : 'closed',
        String(index),
    ]
        .filter(Boolean)
        .join(':')
}

/**
 * Builds a stable row key for the AI workflow summary table.
 *
 * @param workflow AI workflow row from the saved config or legacy reviewers.
 * @returns a deterministic table row key.
 */
function getAiWorkflowRowKey(workflow: AiReviewConfigWorkflow): string {
    return [
        normalizeReviewerText(workflow.id),
        normalizeReviewerText(workflow.workflowId),
        String(Number(workflow.weightPercent || 0)),
        workflow.isGating ? 'gate' : 'review',
    ]
        .filter(Boolean)
        .join(':')
}

/**
 * Renders the read-only human and AI review overview for challenge view mode.
 *
 * @param props challenge review metadata sourced from the editor form.
 * @returns a static summary that matches the legacy work-manager review overview.
 */
// eslint-disable-next-line complexity
export const ReviewConfigurationSummary: FC<ReviewConfigurationSummaryProps> = (
    props: ReviewConfigurationSummaryProps,
) => {
    const resourceRolesResult: ReturnType<typeof useFetchResourceRoles> = useFetchResourceRoles()
    const resourcesResult: ReturnType<typeof useFetchResources> = useFetchResources(props.challengeId)
    const resourceRoles: ResourceRole[] = resourceRolesResult.resourceRoles
    const resourceRolesError: Error | undefined = resourceRolesResult.error
    const resources: Resource[] = resourcesResult.resources
    const resourcesError: Error | undefined = resourcesResult.error

    const [aiConfiguration, setAiConfiguration] = useState<AiReviewConfig | undefined>()
    const [aiConfigError, setAiConfigError] = useState<string | undefined>()
    const [memberHandlesByUserId, setMemberHandlesByUserId] = useState<Record<string, string>>({})
    const [scorecardError, setScorecardError] = useState<string | undefined>()
    const [scorecards, setScorecards] = useState<Scorecard[]>([])
    const [workflowError, setWorkflowError] = useState<string | undefined>()
    const [workflows, setWorkflows] = useState<Workflow[]>([])

    const reviewerRows = useMemo(
        () => (Array.isArray(props.reviewers)
            ? props.reviewers
            : []),
        [props.reviewers],
    )
    const humanReviewers = useMemo(
        () => reviewerRows.filter(reviewer => !isAiReviewer(reviewer)),
        [reviewerRows],
    )
    const aiReviewers = useMemo(
        () => reviewerRows.filter(isAiReviewer),
        [reviewerRows],
    )
    const phaseNameById = useMemo(
        () => new Map((props.phases || [])
            .map(phase => {
                const phaseId = getPhaseId(phase)
                const phaseName = normalizeReviewerText(phase.name)

                return phaseId && phaseName
                    ? [
                        phaseId,
                        phaseName,
                    ]
                    : undefined
            })
            .filter((entry): entry is [string, string] => !!entry)),
        [props.phases],
    )
    const workflowMap = useMemo(
        () => new Map(workflows.map(workflow => [
            workflow.id,
            workflow,
        ])),
        [workflows],
    )
    const totalHumanReviewerCount = useMemo(
        () => humanReviewers.reduce((sum, reviewer) => sum + getReviewerCount(reviewer), 0),
        [humanReviewers],
    )
    const assignedResourcesByReviewer = useMemo(
        () => buildAssignedResourcesByReviewer({
            getReviewerCount,
            phaseNameById,
            resourceRoles,
            resources,
            reviewers: humanReviewers,
        }),
        [
            humanReviewers,
            phaseNameById,
            resourceRoles,
            resources,
        ],
    )
    const fallbackAssignedMembersByReviewer = useMemo(
        () => buildFallbackAssignedMembersByReviewer(humanReviewers),
        [humanReviewers],
    )
    const assignedMembersByReviewer = useMemo(
        () => humanReviewers.map((reviewer, reviewerIndex) => {
            const assignedMembers = (assignedResourcesByReviewer[reviewerIndex] || [])
                .map(resource => ({
                    memberHandle: normalizeReviewerText(resource.memberHandle) || undefined,
                    memberId: normalizeReviewerText(resource.memberId) || undefined,
                }))
                .filter(assignedMember => !!assignedMember.memberHandle || !!assignedMember.memberId)

            if (assignedMembers.length) {
                return formatAssignedMembers(assignedMembers, memberHandlesByUserId)
            }

            return formatAssignedMembers(
                fallbackAssignedMembersByReviewer[reviewerIndex] || [],
                memberHandlesByUserId,
            ) || '-'
        }),
        [
            assignedResourcesByReviewer,
            fallbackAssignedMembersByReviewer,
            humanReviewers,
            memberHandlesByUserId,
        ],
    )
    const estimatedReviewCost = useMemo(
        () => calculateEstimatedReviewerCost(
            getFirstPlacePrizeValue(props.prizeSets),
            humanReviewers,
        ),
        [humanReviewers, props.prizeSets],
    )
    const hasConfiguredAiWorkflows = (aiConfiguration?.workflows.length || 0) > 0
    const hasAiConfiguration = hasConfiguredAiWorkflows || aiReviewers.length > 0
    const isAiOnlyMode = aiConfiguration?.mode === 'AI_ONLY'
    const isAiGatingMode = aiConfiguration?.mode === 'AI_GATING'
    const hasAiGateWorkflow = useMemo(
        () => (aiConfiguration?.workflows || []).some(workflow => workflow.isGating),
        [aiConfiguration?.workflows],
    )
    const shouldShowLockedFailurePath = hasConfiguredAiWorkflows && isAiGatingMode
    const workflowsToDisplay = useMemo(
        () => (hasConfiguredAiWorkflows
            ? aiConfiguration?.workflows || []
            : mapLegacyAiReviewersToWorkflows(aiReviewers, workflowMap)),
        [
            aiConfiguration?.workflows,
            aiReviewers,
            hasConfiguredAiWorkflows,
            workflowMap,
        ],
    )
    const referencedScorecardIds = useMemo(
        () => getReferencedScorecardIds(humanReviewers, workflowsToDisplay, workflowMap),
        [
            humanReviewers,
            workflowMap,
            workflowsToDisplay,
        ],
    )
    const scorecardNameById = useMemo(
        () => buildScorecardNameMap(scorecards, workflowsToDisplay),
        [
            scorecards,
            workflowsToDisplay,
        ],
    )
    const errorMessages = useMemo(
        () => [
            resourceRolesError?.message,
            resourcesError?.message,
            aiConfigError,
            scorecardError,
            workflowError,
        ]
            .filter((message): message is string => !!message),
        [
            aiConfigError,
            resourceRolesError?.message,
            resourcesError?.message,
            scorecardError,
            workflowError,
        ],
    )

    useEffect(() => {
        let mounted = true
        const unresolvedUserIds = Array.from(new Set([
            ...assignedResourcesByReviewer.flatMap(assignedResources => assignedResources
                .map(resource => {
                    const memberId = normalizeReviewerText(resource.memberId)
                    const memberHandle = normalizeReviewerText(resource.memberHandle)

                    return memberId && !memberHandle && !memberHandlesByUserId[memberId.toLowerCase()]
                        ? memberId
                        : ''
                })),
            ...fallbackAssignedMembersByReviewer.flatMap(assignedMembers => assignedMembers
                .map(assignedMember => {
                    const memberId = normalizeReviewerText(assignedMember.memberId)
                    const memberHandle = normalizeReviewerText(assignedMember.memberHandle)

                    return memberId && !memberHandle && !memberHandlesByUserId[memberId.toLowerCase()]
                        ? memberId
                        : ''
                })),
        ]
            .filter(Boolean)))

        if (!unresolvedUserIds.length) {
            return () => {
                mounted = false
            }
        }

        searchProfilesByUserIds(unresolvedUserIds)
            .then(users => {
                if (!mounted || !users.length) {
                    return
                }

                setMemberHandlesByUserId(currentHandlesByUserId => {
                    const nextHandlesByUserId = {
                        ...currentHandlesByUserId,
                    }

                    users.forEach(user => {
                        const userId = normalizeReviewerText(user.userId)
                        const handle = normalizeReviewerText(user.handle)

                        if (userId && handle) {
                            nextHandlesByUserId[userId.toLowerCase()] = handle
                        }
                    })

                    return nextHandlesByUserId
                })
            })
            .catch(() => undefined)

        return () => {
            mounted = false
        }
    }, [
        assignedResourcesByReviewer,
        fallbackAssignedMembersByReviewer,
        memberHandlesByUserId,
    ])

    useEffect(() => {
        let mounted = true

        if (!referencedScorecardIds.length) {
            setScorecards([])
            setScorecardError(undefined)

            return () => {
                mounted = false
            }
        }

        const loadReferencedScorecards = async (): Promise<void> => {
            const loadedScorecards = new Map<string, Scorecard>()
            const missingScorecardIds = new Set(referencedScorecardIds)
            const normalizedTypeId = normalizeReviewerText(props.typeId) || undefined
            const perPage = 200

            const storeFetchedScorecards = (fetchedScorecards: Scorecard[]): void => {
                fetchedScorecards.forEach(scorecard => {
                    const scorecardId = normalizeReviewerText(scorecard.id)

                    if (!scorecardId) {
                        return
                    }

                    loadedScorecards.set(scorecardId, scorecard)
                    missingScorecardIds.delete(scorecardId)
                })
            }

            const fetchScorecardPage = async (
                page: number,
                typeId?: string,
            ): Promise<boolean> => {
                const fetchedScorecards = await fetchScorecards({
                    page,
                    perPage,
                    ...(typeId
                        ? {
                            typeId,
                        }
                        : {}),
                })

                if (!mounted) {
                    return true
                }

                storeFetchedScorecards(fetchedScorecards)

                if (!missingScorecardIds.size) {
                    return true
                }

                if (fetchedScorecards.length < perPage) {
                    return false
                }

                return fetchScorecardPage(page + 1, typeId)
            }

            if (normalizedTypeId) {
                await fetchScorecardPage(1, normalizedTypeId)
            }

            if (mounted && missingScorecardIds.size) {
                await fetchScorecardPage(1)
            }

            if (!mounted) {
                return
            }

            setScorecards(Array.from(loadedScorecards.values()))
            setScorecardError(undefined)
        }

        loadReferencedScorecards()
            .catch(error => {
                if (mounted) {
                    setScorecardError(error instanceof Error
                        ? error.message
                        : 'Failed to load reviewer scorecards')
                }
            })

        return () => {
            mounted = false
        }
    }, [props.typeId, referencedScorecardIds])

    useEffect(() => {
        let mounted = true

        fetchWorkflows()
            .then(fetchedWorkflows => {
                if (mounted) {
                    setWorkflows(fetchedWorkflows)
                    setWorkflowError(undefined)
                }
            })
            .catch(error => {
                if (mounted) {
                    setWorkflowError(error instanceof Error
                        ? error.message
                        : 'Failed to load AI workflows')
                }
            })

        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        let mounted = true

        if (!normalizeReviewerText(props.challengeId)) {
            setAiConfiguration(undefined)
            setAiConfigError(undefined)
            return undefined
        }

        fetchAiReviewConfigByChallenge(props.challengeId as string)
            .then(config => {
                if (mounted) {
                    setAiConfiguration(config)
                    setAiConfigError(undefined)
                }
            })
            .catch(error => {
                if (mounted) {
                    setAiConfigError(error instanceof Error
                        ? error.message
                        : 'Failed to load AI review configuration')
                }
            })

        return () => {
            mounted = false
        }
    }, [props.challengeId])

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>Review Configuration Summary</h4>

            {errorMessages.length
                ? (
                    <div className={styles.errorList}>
                        {errorMessages.map(message => (
                            <div className={styles.errorMessage} key={message}>{message}</div>
                        ))}
                    </div>
                )
                : undefined}

            <div className={styles.overviewGrid}>
                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span aria-hidden='true' className={styles.headerIcon}>👥</span>
                        <h5 className={styles.cardTitle}>Human Review</h5>
                    </div>
                    <div className={styles.cardBody}>
                        {humanReviewers.length
                            ? (
                                <>
                                    <div className={styles.detailRow}>
                                        <span className={styles.detailLabel}>Reviewers:</span>
                                        <span className={styles.detailValue}>{totalHumanReviewerCount}</span>
                                    </div>

                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Phase</th>
                                                    <th>Scorecard</th>
                                                    <th>Review Type</th>
                                                    <th>Count</th>
                                                    <th>Public Opportunity</th>
                                                    <th>Assigned Members</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {humanReviewers.map((reviewer, index) => (
                                                    <tr
                                                        key={getHumanReviewerRowKey(reviewer, index)}
                                                    >
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            {phaseNameById.get(
                                                                normalizeReviewerText(reviewer.phaseId),
                                                            ) || '-'}
                                                        </td>
                                                        <td>
                                                            {getScorecardLabel(
                                                                reviewer.scorecardId,
                                                                scorecardNameById,
                                                            )}
                                                        </td>
                                                        <td>{getReviewTypeLabel(reviewer)}</td>
                                                        <td>{getReviewerCount(reviewer)}</td>
                                                        <td>
                                                            <span className={classNames(
                                                                styles.badge,
                                                                reviewer.shouldOpenOpportunity
                                                                    ? styles.badgeYes
                                                                    : styles.badgeNo,
                                                            )}
                                                            >
                                                                {reviewer.shouldOpenOpportunity
                                                                    ? '✅ Yes'
                                                                    : '❌ No'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {assignedMembersByReviewer[index] || '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )
                            : <div className={styles.emptyState}>No human reviewers configured.</div>}
                    </div>
                </section>

                <section className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span aria-hidden='true' className={styles.headerIcon}>🤖</span>
                        <h5 className={styles.cardTitle}>AI Review</h5>
                    </div>
                    <div className={styles.cardBody}>
                        {hasAiConfiguration
                            ? (
                                <>
                                    {aiConfiguration
                                        ? (
                                            <>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Mode:</span>
                                                    <span className={styles.detailValue}>{aiConfiguration.mode}</span>
                                                </div>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Threshold:</span>
                                                    <span className={styles.detailValue}>
                                                        {aiConfiguration.minPassingThreshold}
                                                        %
                                                    </span>
                                                </div>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Auto-Finalize:</span>
                                                    <span className={styles.detailValue}>
                                                        {aiConfiguration.autoFinalize ? '✅ On' : '❌ Off'}
                                                    </span>
                                                </div>
                                            </>
                                        )
                                        : undefined}

                                    <div className={styles.sectionLabel}>Workflows</div>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Weight</th>
                                                    <th>Scorecard</th>
                                                    <th>Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {workflowsToDisplay.map(workflow => {
                                                    const scorecardLabel = getWorkflowScorecardLabel(
                                                        workflow,
                                                        workflowMap,
                                                        scorecardNameById,
                                                    )
                                                    const scorecardUrl = getWorkflowScorecardUrl(
                                                        workflow,
                                                        workflowMap,
                                                    )

                                                    return (
                                                        <tr key={getAiWorkflowRowKey(workflow)}>
                                                            <td>{getWorkflowDisplayName(workflow, workflowMap)}</td>
                                                            <td>
                                                                {hasConfiguredAiWorkflows
                                                                    ? (
                                                                        <>
                                                                            {Number(workflow.weightPercent || 0)}
                                                                            %
                                                                        </>
                                                                    )
                                                                    : '-'}
                                                            </td>
                                                            <td>
                                                                {scorecardUrl
                                                                    ? (
                                                                        <a
                                                                            className={styles.scorecardLink}
                                                                            href={scorecardUrl}
                                                                            rel='noreferrer'
                                                                            target='_blank'
                                                                        >
                                                                            {scorecardLabel}
                                                                        </a>
                                                                    )
                                                                    : scorecardLabel}
                                                            </td>
                                                            <td className={styles.typeCell}>
                                                                <span className={workflow.isGating
                                                                    ? styles.typeBadge
                                                                    : styles.reviewIcon}
                                                                >
                                                                    {workflow.isGating ? '⚡ GATE' : '📝'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )
                            : <div className={styles.emptyState}>No AI review configured.</div>}
                    </div>
                </section>
            </div>

            {(humanReviewers.length || hasConfiguredAiWorkflows)
                ? (
                    <section className={styles.flowSection}>
                        <h5 className={styles.flowTitle}>Review Flow</h5>

                        <div className={classNames(
                            styles.flowCanvas,
                            {
                                [styles.flowCanvasGated]: shouldShowLockedFailurePath,
                            },
                        )}
                        >
                            <div className={classNames(
                                styles.flowDiagram,
                                {
                                    [styles.withAIGating]: isAiGatingMode && hasAiGateWorkflow,
                                    [styles.withAIOnly]: isAiOnlyMode,
                                    [styles.withAI]: hasConfiguredAiWorkflows && isAiGatingMode && !hasAiGateWorkflow,
                                    [styles.humanOnly]: !hasAiConfiguration,
                                },
                            )}
                            >
                                <div className={classNames(styles.flowStep, styles.submissionStep)}>
                                    <span aria-hidden='true' className={styles.flowBoxIcon}>📥</span>
                                    <strong className={styles.flowBoxTitle}>Submission</strong>
                                    <span className={styles.flowDescription}>Received</span>
                                </div>

                                {(hasConfiguredAiWorkflows || humanReviewers.length)
                                    ? <div className={classNames(styles.flowArrow, styles.entryArrow)}>→</div>
                                    : undefined}

                                {hasConfiguredAiWorkflows
                                    ? (
                                        <div className={classNames(styles.flowStep, styles.aiGateStep)}>
                                            <span
                                                aria-hidden='true'
                                                className={styles.flowBoxIcon}
                                            >
                                                🤖
                                            </span>
                                            <strong className={styles.flowBoxTitle}>
                                                {isAiOnlyMode ? 'AI Review' : 'AI Gate'}
                                            </strong>
                                            <span className={styles.flowDescription}>
                                                score &gt;=
                                                {' '}
                                                {aiConfiguration?.minPassingThreshold ?? 75}
                                                %
                                            </span>
                                            {isAiGatingMode
                                                ? <span className={styles.flowDescription}>pass / lock</span>
                                                : undefined}
                                        </div>
                                    )
                                    : undefined}

                                {hasConfiguredAiWorkflows && isAiGatingMode && humanReviewers.length
                                    ? <div className={classNames(styles.flowArrow, styles.humanArrow)}>→</div>
                                    : undefined}

                                {!hasConfiguredAiWorkflows && humanReviewers.length
                                    ? (
                                        <div className={classNames(styles.flowStep, styles.humanReviewStep)}>
                                            <span aria-hidden='true' className={styles.flowBoxIcon}>👥</span>
                                            <strong className={styles.flowBoxTitle}>Human Review</strong>
                                            <span className={styles.flowDescription}>
                                                {totalHumanReviewerCount}
                                                {' '}
                                                reviewers
                                            </span>
                                        </div>
                                    )
                                    : undefined}

                                {hasConfiguredAiWorkflows && isAiGatingMode && humanReviewers.length
                                    ? (
                                        <div className={classNames(styles.flowStep, styles.humanReviewStep)}>
                                            <span aria-hidden='true' className={styles.flowBoxIcon}>👥</span>
                                            <strong className={styles.flowBoxTitle}>Human Review</strong>
                                            <span className={styles.flowDescription}>
                                                {totalHumanReviewerCount}
                                                {' '}
                                                reviewers
                                            </span>
                                        </div>
                                    )
                                    : undefined}
                            </div>

                            {shouldShowLockedFailurePath
                                ? (
                                    <div className={styles.failureRow}>
                                        <div className={classNames(styles.failureBranch, styles.lockedBranch)}>
                                            <div className={styles.failureArrow}>
                                                <span>↓</span>
                                                <span className={styles.failLabel}>
                                                    &lt;
                                                    {' '}
                                                    {aiConfiguration?.minPassingThreshold ?? 75}
                                                    %
                                                </span>
                                                <span>↓</span>
                                            </div>
                                            <div className={classNames(styles.flowStep, styles.lockedStep)}>
                                                <span aria-hidden='true' className={styles.flowBoxIcon}>🔒</span>
                                                <strong className={styles.flowBoxTitle}>Locked</strong>
                                                <span className={styles.flowDescription}>No human</span>
                                                <span className={styles.flowDescription}>review needed</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                                : undefined}
                        </div>
                    </section>
                )
                : undefined}

            {humanReviewers.length
                ? (
                    <div className={styles.costSection}>
                        <div className={styles.costBar}>
                            <span>Estimated Review Cost:</span>
                            <strong>
                                $
                                {estimatedReviewCost.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                    minimumFractionDigits: 2,
                                })}
                            </strong>
                        </div>
                    </div>
                )
                : undefined}
        </div>
    )
}

export default ReviewConfigurationSummary
