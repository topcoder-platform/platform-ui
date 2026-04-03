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
} from '../../../../../lib/services'
import {
    calculateEstimatedReviewerCost,
    getFirstPlacePrizeValue,
} from '../../../../../lib/utils/prize.utils'

import {
    isAiReviewer,
    normalizeReviewerText,
} from './reviewers-field.utils'
import styles from './ReviewConfigurationSummary.module.scss'

const ITERATIVE_REVIEW_ROLE_NAMES = [
    'Iterative Reviewer',
    'Iterative Review',
]

interface ReviewConfigurationSummaryProps {
    challengeId?: string
    phases?: ChallengePhase[]
    prizeSets?: PrizeSet[]
    reviewers?: Reviewer[]
    typeId?: string
}

/**
 * Normalizes summary lookup keys so phase and role names can be matched reliably.
 *
 * @param value raw phase, role, or id text.
 * @returns lowercase text without separators for map lookups.
 */
function normalizeSummaryKey(value: unknown): string {
    return normalizeReviewerText(value)
        .toLowerCase()
        .replace(/[-_\s]/g, '')
}

/**
 * Resolves the configured reviewer count, defaulting to one reviewer when absent.
 *
 * @param reviewer reviewer row from the challenge form payload.
 * @returns a positive integer reviewer count.
 */
function getReviewerCount(reviewer?: Reviewer): number {
    return Math.max(1, Math.trunc(Number(reviewer?.memberReviewerCount || 1) || 1))
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

/**
 * Maps challenge review phases to the resource role name used for reviewer assignments.
 *
 * @param phaseName challenge phase display name.
 * @returns the matching reviewer resource role name.
 */
function getRoleNameForPhaseName(phaseName: string | undefined): string {
    const normalizedPhaseName = normalizeSummaryKey(phaseName)

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
 * Builds a fallback assigned-member label directly from reviewer fields.
 *
 * @param reviewer reviewer row from the challenge payload.
 * @returns a comma-separated fallback member label when resource assignments are unavailable.
 */
function getFallbackAssignedMembers(reviewer: Reviewer): string {
    return [
        normalizeReviewerText(reviewer.handle),
        normalizeReviewerText(reviewer.memberId),
        ...((reviewer.additionalMemberIds || [])
            .map(memberId => normalizeReviewerText(memberId))
            .filter(Boolean)),
    ]
        .filter(Boolean)
        .join(', ')
}

/**
 * Resolves the assigned resource members for a reviewer row in read-only mode.
 *
 * @param reviewer reviewer row from the challenge payload.
 * @param phaseNameById map of phase ids to phase names.
 * @param resources loaded challenge resources.
 * @param resourceRoles loaded resource role definitions.
 * @returns a comma-separated handle list when assignments can be resolved.
 */
function getAssignedMembersForReviewer(
    reviewer: Reviewer,
    phaseNameById: Map<string, string>,
    resources: Resource[],
    resourceRoles: ResourceRole[],
): string {
    const explicitRoleId = normalizeReviewerText(reviewer.roleId)
    const normalizedPhaseId = normalizeReviewerText(reviewer.phaseId)
    const phaseName = phaseNameById.get(normalizedPhaseId)
    const roleNames = normalizeSummaryKey(phaseName) === 'iterativereview'
        ? ITERATIVE_REVIEW_ROLE_NAMES
        : [getRoleNameForPhaseName(phaseName)]
    const resolvedRoleId = explicitRoleId || roleNames
        .map(roleName => resourceRoles.find(
            role => normalizeSummaryKey(role.name) === normalizeSummaryKey(roleName),
        )?.id)
        .find((roleId): roleId is string => !!roleId)
    const assignedMembers = resolvedRoleId
        ? resources
            .filter(resource => resource.roleId === resolvedRoleId)
            .slice(0, getReviewerCount(reviewer))
            .map(resource => normalizeReviewerText(resource.memberHandle) || normalizeReviewerText(resource.memberId))
            .filter(Boolean)
        : []

    if (assignedMembers.length) {
        return assignedMembers.join(', ')
    }

    return getFallbackAssignedMembers(reviewer) || '-'
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
    const workflowId = normalizeReviewerText(workflow.workflowId)
    const workflowDetails = workflow.workflow || availableWorkflowMap.get(workflowId)
    const scorecardName = normalizeReviewerText(workflow.workflow?.scorecard?.name)
    const scorecardId = normalizeReviewerText(workflow.workflow?.scorecard?.id)
        || normalizeReviewerText(workflowDetails?.scorecardId)

    return scorecardName || scorecardNameById.get(scorecardId) || scorecardId || '-'
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
 * @returns a deterministic table row key.
 */
function getHumanReviewerRowKey(reviewer: Reviewer): string {
    return [
        normalizeReviewerText(reviewer.phaseId),
        normalizeReviewerText(reviewer.scorecardId),
        normalizeReviewerText(reviewer.memberId),
        normalizeReviewerText(reviewer.handle),
        String(getReviewerCount(reviewer)),
        reviewer.shouldOpenOpportunity ? 'open' : 'closed',
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
    const scorecardNameById = useMemo(
        () => new Map(scorecards.map(scorecard => [
            scorecard.id,
            scorecard.name,
        ])),
        [scorecards],
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
    const workflowsToDisplay = hasConfiguredAiWorkflows
        ? aiConfiguration?.workflows || []
        : mapLegacyAiReviewersToWorkflows(aiReviewers, workflowMap)
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

        fetchScorecards({
            perPage: 200,
            typeId: props.typeId,
        })
            .then(fetchedScorecards => {
                if (mounted) {
                    setScorecards(fetchedScorecards)
                    setScorecardError(undefined)
                }
            })
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
    }, [props.typeId])

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
                        <h5>Human Review</h5>
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
                                                        key={getHumanReviewerRowKey(reviewer)}
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
                                                        <td>Regular Review</td>
                                                        <td>{getReviewerCount(reviewer)}</td>
                                                        <td>
                                                            <span className={classNames(
                                                                styles.badge,
                                                                reviewer.shouldOpenOpportunity
                                                                    ? styles.badgeYes
                                                                    : styles.badgeNo,
                                                            )}
                                                            >
                                                                {reviewer.shouldOpenOpportunity ? 'Yes' : 'No'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {getAssignedMembersForReviewer(
                                                                reviewer,
                                                                phaseNameById,
                                                                resources,
                                                                resourceRoles,
                                                            )}
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
                        <h5>AI Review</h5>
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
                                                        {aiConfiguration.autoFinalize ? 'On' : 'Off'}
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
                                                {workflowsToDisplay.map(workflow => (
                                                    <tr
                                                        key={getAiWorkflowRowKey(workflow)}
                                                    >
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
                                                            {getWorkflowScorecardLabel(
                                                                workflow,
                                                                workflowMap,
                                                                scorecardNameById,
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className={classNames(
                                                                styles.badge,
                                                                workflow.isGating
                                                                    ? styles.badgeWarning
                                                                    : styles.badgeNeutral,
                                                            )}
                                                            >
                                                                {workflow.isGating ? 'GATE' : 'Review'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
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
                    <section className={styles.flowCard}>
                        <h5 className={styles.flowTitle}>Review Flow</h5>

                        <div className={styles.flowRow}>
                            <div className={styles.flowStep}>
                                <strong>Submission</strong>
                                <span>Received</span>
                            </div>

                            {(hasConfiguredAiWorkflows || humanReviewers.length)
                                ? <div className={styles.flowArrow}>-&gt;</div>
                                : undefined}

                            {hasConfiguredAiWorkflows
                                ? (
                                    <div className={styles.flowStep}>
                                        <strong>{isAiOnlyMode ? 'AI Review' : 'AI Gate'}</strong>
                                        <span>
                                            score &gt;=
                                            {' '}
                                            {aiConfiguration?.minPassingThreshold || 75}
                                            %
                                        </span>
                                        {isAiGatingMode
                                            ? <span>pass / lock</span>
                                            : undefined}
                                    </div>
                                )
                                : undefined}

                            {hasConfiguredAiWorkflows && isAiGatingMode && humanReviewers.length
                                ? <div className={styles.flowArrow}>-&gt;</div>
                                : undefined}

                            {!hasConfiguredAiWorkflows && humanReviewers.length
                                ? (
                                    <div className={styles.flowStep}>
                                        <strong>Human Review</strong>
                                        <span>
                                            {totalHumanReviewerCount}
                                            {' '}
                                            reviewers
                                        </span>
                                    </div>
                                )
                                : undefined}

                            {hasConfiguredAiWorkflows && isAiGatingMode && humanReviewers.length
                                ? (
                                    <div className={styles.flowStep}>
                                        <strong>Human Review</strong>
                                        <span>
                                            {totalHumanReviewerCount}
                                            {' '}
                                            reviewers
                                        </span>
                                    </div>
                                )
                                : undefined}
                        </div>

                        {hasConfiguredAiWorkflows && isAiGatingMode
                            ? (
                                <div className={styles.failureRow}>
                                    <div className={styles.failureArrow}>
                                        <span>
                                            &lt;
                                            {' '}
                                            {aiConfiguration?.minPassingThreshold || 75}
                                            %
                                        </span>
                                        <span>v</span>
                                    </div>
                                    <div className={styles.flowStep}>
                                        <strong>Locked</strong>
                                        <span>No human review needed</span>
                                    </div>
                                </div>
                            )
                            : undefined}
                    </section>
                )
                : undefined}

            {humanReviewers.length
                ? (
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
                )
                : undefined}
        </div>
    )
}

export default ReviewConfigurationSummary
