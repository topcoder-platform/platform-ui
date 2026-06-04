/* eslint-disable complexity */
/* eslint-disable max-len */
import { FC, MouseEvent as ReactMouseEvent, useCallback, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useSWRConfig } from 'swr'
import { FullConfiguration } from 'swr/dist/types'
import classNames from 'classnames'
import moment from 'moment'

import { handleError } from '~/libs/shared/lib/utils/handle-error'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Tooltip } from '~/libs/ui'

import {
    aiRunFailed,
    aiRunInProgress,
    AiWorkflowRun,
    AiWorkflowRunsResponse,
    AiWorkflowRunStatusEnum,
    getAiWorkflowRunsCacheKey,
    retriggerAiWorkflowRun,
    useFetchAiWorkflowsRuns,
    useRolePermissions,
    UseRolePermissionsResult,
} from '../../hooks'
import { IconAiReview } from '../../assets/icons'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import {
    AiReviewConfigWorkflow,
    AiReviewDecision,
    AiReviewDecisionBreakdownWorkflow,
    AiReviewDecisionEscalation,
    BackendResource,
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'

import { AiWorkflowRunStatus } from './AiWorkflowRunStatus'
import styles from './AiReviewsTable.module.scss'

interface AiReviewsTableProps {
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
    aiReviewers?: { aiWorkflowId: string }[]
    /** Enable editing mode for manager score overrides */
    editMode?: boolean
    /** Current edited scores by workflowId */
    editedScores?: Record<string, string>
    /** Callback when a score is changed */
    onScoreChange?: (workflowId: string, value: string) => void
}

interface AiReviewerRow {
    id: string
    isGating?: boolean
    managerScore?: number | null
    minScore?: number
    reviewDate?: string
    run?: Pick<AiWorkflowRun, 'id'|'score'|'status'|'workflow'>
    score?: number
    status?: 'failed' | 'failed-score' | 'passed' | 'pending' | 'cancelled'
    title: string
    weight?: number
    workflowId?: string
}

const stopPropagation = (ev: ReactMouseEvent<HTMLDivElement, MouseEvent>): void => {
    ev.stopPropagation()
}

function normalizeStatus(
    runStatus?: string | null,
    score?: number | null,
    minScore?: number,
): 'failed' | 'failed-score' | 'passed' | 'pending' | 'cancelled' {
    if (!runStatus) {
        return 'pending'
    }

    if (runStatus === AiWorkflowRunStatusEnum.CANCELLED) {
        return 'cancelled'
    }

    if (aiRunInProgress({ status: runStatus as AiWorkflowRunStatusEnum })) {
        return 'pending'
    }

    if (aiRunFailed({ status: runStatus as AiWorkflowRunStatusEnum })) {
        return 'failed'
    }

    if (typeof score !== 'number') {
        return 'pending'
    }

    return score >= (minScore ?? 0) ? 'passed' : 'failed-score'
}

function formatScore(value?: number | null): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }

    return value.toFixed(2)
}

function formatWeight(value?: number): string {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '-'
    }

    return `${value.toFixed(0)}%`
}

function getConfiguredWorkflowName(workflow?: AiReviewConfigWorkflow['workflow']): string | undefined {
    const configuredName = workflow?.name?.trim()
    return configuredName || undefined
}

function getDecisionBySubmission(
    decisions: Record<string, AiReviewDecision>,
    submissionId: string,
): AiReviewDecision | undefined {
    return decisions[submissionId]
}

/**
 * Resolves a memberId to a display handle using the resourceMemberIdMapping.
 * Falls back to the raw id string if no match is found.
 */
function resolveHandle(
    memberId: string | null | undefined,
    resourceMemberIdMapping: Record<string, BackendResource>,
): string {
    if (!memberId) return ''
    return resourceMemberIdMapping[memberId]?.memberHandle ?? memberId
}

/**
 * Builds a list of human-readable note strings from escalations and lock/unlock reason.
 *
 * @param escalations            - List of escalation objects from the AI review decision
 * @param reason                 - The reason string from the decision
 * @param showAuthor             - When true, appends "(by <handle>)" to each note.
 *                                 Pass false for reviewer role so author identity is hidden.
 *                                 Defaults to true.
 * @param resourceMemberIdMapping - Map of memberId → BackendResource used to resolve handles.
 * @param submissionLocked       - When true, labels the reason as "Locked Reason";
 *                                 otherwise labels it as "Unlock Reason".
 */
function buildDecisionNotes(
    escalations?: AiReviewDecisionEscalation[],
    reason?: string | null,
    showAuthor: boolean = true,
    resourceMemberIdMapping: Record<string, BackendResource> = {},
    submissionLocked: boolean = false,
): string[] {
    const parts: string[] = []

    escalations?.forEach(esc => {
        if (esc.escalationNotes) {
            const handle = resolveHandle(esc.createdBy, resourceMemberIdMapping)
            const by = showAuthor && handle ? ` (by ${handle})` : ''
            parts.push(`Escalation Note${by}: ${esc.escalationNotes}`)
        }

        if (esc.approverNotes) {
            const handle = resolveHandle(esc.updatedBy, resourceMemberIdMapping)
            const by = showAuthor && handle ? ` (by ${handle})` : ''
            const prefix = esc.status === 'APPROVED'
                ? 'Approval Note'
                : esc.status === 'REJECTED'
                    ? 'Rejection Note'
                    : 'Approver Note'
            parts.push(`${prefix}${by}: ${esc.approverNotes}`)
        }
    })

    if (reason) {
        const reasonLabel: string = submissionLocked ? 'Locked Reason' : 'Unlock Reason'
        parts.push(`${reasonLabel}: ${reason}`)
    }

    return parts
}

// eslint-disable-next-line complexity
const AiReviewsTable: FC<AiReviewsTableProps> = props => {
    const { runs, isLoading }: AiWorkflowRunsResponse = useFetchAiWorkflowsRuns(props.submission.id)
    const challengeDetailContext: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const aiReviewConfig: ChallengeDetailContextModel['aiReviewConfig'] = challengeDetailContext.aiReviewConfig
    const aiReviewDecisionsBySubmissionId: ChallengeDetailContextModel['aiReviewDecisionsBySubmissionId']
        = challengeDetailContext.aiReviewDecisionsBySubmissionId
    const isLoadingAiReviewConfig: ChallengeDetailContextModel['isLoadingAiReviewConfig']
        = challengeDetailContext.isLoadingAiReviewConfig
    const isLoadingAiReviewDecisions: ChallengeDetailContextModel['isLoadingAiReviewDecisions']
        = challengeDetailContext.isLoadingAiReviewDecisions
    const resourceMemberIdMapping: ChallengeDetailContextModel['resourceMemberIdMapping']
        = challengeDetailContext.resourceMemberIdMapping

    const windowSize: WindowSize = useWindowSize()
    const isTablet = useMemo(
        () => (windowSize.width ?? 0) <= 984,
        [windowSize.width],
    )

    const currentDecision = useMemo<AiReviewDecision | undefined>(
        () => getDecisionBySubmission(aiReviewDecisionsBySubmissionId, props.submission.id),
        [aiReviewDecisionsBySubmissionId, props.submission.id],
    )

    const configuredWorkflows = useMemo<AiReviewConfigWorkflow[]>(
        () => aiReviewConfig?.workflows ?? [],
        [aiReviewConfig],
    )

    const hasConfig = useMemo<boolean>(
        () => configuredWorkflows.length > 0,
        [configuredWorkflows.length],
    )

    const decisionWorkflowRows = useMemo<AiReviewDecisionBreakdownWorkflow[]>(
        () => currentDecision?.breakdown?.workflows ?? [],
        [currentDecision],
    )

    const runsByWorkflowId = useMemo(
        () => new Map<string, AiWorkflowRun>(
            runs
                .filter(run => Boolean(run.workflow?.id))
                .map(run => [run.workflow.id, run]),
        ),
        [runs],
    )

    const reviewerRows = useMemo<AiReviewerRow[]>(() => {
        const configuredIds = configuredWorkflows.map(workflow => workflow.workflowId)
        const reviewerIds = (props.aiReviewers ?? []).map(reviewer => reviewer.aiWorkflowId)
        const decisionIds = decisionWorkflowRows.map(workflow => workflow.workflowId)
        const runsIds = runs.map(run => run.workflow?.id)
            .filter((id): id is string => Boolean(id))

        const orderedWorkflowIds = hasConfig
            ? [...configuredIds, ...decisionIds, ...runsIds]
            : [...reviewerIds, ...decisionIds, ...runsIds]

        const uniqueWorkflowIds = Array.from(new Set(orderedWorkflowIds.filter(Boolean)))

        const rows: AiReviewerRow[] = uniqueWorkflowIds.map(workflowId => {
            const configured = configuredWorkflows.find(item => item.workflowId === workflowId)
            const fromDecision = decisionWorkflowRows.find(item => item.workflowId === workflowId)
            const run = runsByWorkflowId.get(workflowId)
            const minScore = fromDecision?.minimumPassingScore
                ?? configured?.workflow?.scorecard?.minimumPassingScore

            const status = fromDecision
                ? normalizeStatus(run && aiRunInProgress(run)
                    ? undefined
                    : fromDecision.runStatus, fromDecision.managerScore ?? fromDecision.runScore, minScore)
                : undefined

            return {
                id: workflowId,
                isGating: fromDecision?.isGating ?? configured?.isGating,
                managerScore: fromDecision?.managerScore ?? (run?.initialScore ? run.score : undefined),
                minScore,
                reviewDate: run?.completedAt,
                run,
                score: fromDecision?.managerScore ?? fromDecision?.runScore ?? run?.score,
                status,
                title: getConfiguredWorkflowName(configured?.workflow) ?? run?.workflow?.name ?? 'AI Review',
                weight: fromDecision?.weightPercent ?? configured?.weightPercent,
                workflowId,
            }
        })

        const hasVirusScan = rows.some(row => row.title.toLowerCase() === 'virus scan')

        if (!hasVirusScan) {
            rows.push({
                id: 'virus-scan-fallback',
                minScore: hasConfig ? 100 : undefined,
                reviewDate: (props.submission as BackendSubmission).submittedDate,
                run: {
                    id: '-1',
                    score: props.submission.virusScan === true ? 100 : 0,
                    status: AiWorkflowRunStatusEnum.SUCCESS,
                    workflow: {
                        description: '',
                        name: 'Virus Scan',
                        scorecard: {
                            minimumPassingScore: 100,
                        },
                    } as AiWorkflowRun['workflow'],
                },
                score: props.submission.virusScan === undefined
                    ? undefined
                    : (props.submission.virusScan ? 100 : 0),
                status: props.submission.virusScan === undefined ? 'pending' : (
                    props.submission.virusScan ? 'passed' : 'failed-score'
                ),
                title: 'Virus Scan',
                weight: hasConfig ? 0 : undefined,
            })
        }

        return rows
    }, [
        configuredWorkflows,
        decisionWorkflowRows,
        hasConfig,
        props.aiReviewers,
        props.submission,
        runs,
        runsByWorkflowId,
    ])

    const loading = isLoading || isLoadingAiReviewConfig || isLoadingAiReviewDecisions

    const rolePermissions: UseRolePermissionsResult = useRolePermissions()
    const { isAdmin, hasSubmitterRole, hasCopilotRole, isProjectManager }: UseRolePermissionsResult = rolePermissions
    const { mutate }: FullConfiguration = useSWRConfig()
    const [, setRerunningRunId] = useState<string | undefined>(undefined)

    /**
     * Only Copilot, Project Manager, and Admin can see WHO performed the action.
     * Reviewers can see the note TEXT but NOT the author "(by handle)".
     * Submitters cannot see notes at all.
     */
    const canSeeAuthor = isAdmin || hasCopilotRole || isProjectManager

    const handleRerun = useCallback(async (runId?: string): Promise<void> => {
        if (!runId || runId === '-1') return

        setRerunningRunId(runId)
        try {
            await retriggerAiWorkflowRun(runId)
            await mutate(getAiWorkflowRunsCacheKey(props.submission.id))
            toast.success('Workflow re-run triggered successfully.')
        } catch (error) {
            handleError(error as Error)
            toast.error('Failed to trigger workflow re-run.')
        } finally {
            setRerunningRunId(undefined)
        }
    }, [mutate, props.submission.id])

    const failedGatingReviewers = useMemo(
        () => reviewerRows
            .filter(row => row.isGating && (row.status === 'failed' || row.status === 'failed-score'))
            .map(row => row.title),
        [reviewerRows],
    )

    const lockMessage = useMemo(() => {
        if (!currentDecision?.submissionLocked) {
            return undefined
        }

        const failedReviewersText = failedGatingReviewers.length
            ? `This submission failed regardless of Overall Score because it failed one or more of the AI Gating Reviews.
                Gating Reviewers failed: ${failedGatingReviewers.join(', ')}.`
            : `This submission is failed because ${hasSubmitterRole ? 'your' : 'the'}
                Overall Score is below minimum threshold.`

        const roleBasedText = hasSubmitterRole
            ? 'Improve your submission and resubmit.'
            : ''

        return `${failedReviewersText} ${roleBasedText}`
    }, [currentDecision?.submissionLocked, failedGatingReviewers, hasSubmitterRole])

    const lockedBannerTitle = useMemo(() => {
        if (!currentDecision?.submissionLocked) {
            return ''
        }

        if (hasSubmitterRole) {
            return 'Submission Locked - Your submission won\'t be reviewed during the Review Phase.'
        }

        return 'Submission Locked - This submission won\'t be reviewed during the Review Phase.'
    }, [currentDecision?.submissionLocked, hasSubmitterRole])

    /**
     * Builds the notes list shown in the banner.
     *
     * - Submitters              → NO notes shown at all (empty array)
     * - Reviewers               → note text only, NO "(by handle)"  (canSeeAuthor = false)
     * - Copilot / PM / Admin    → note text WITH "(by handle)"       (canSeeAuthor = true)
     */
    const decisionNotes = useMemo((): string[] => {
        if (!currentDecision || hasSubmitterRole) return []

        return buildDecisionNotes(
            currentDecision.escalations,
            currentDecision.reason,
            canSeeAuthor,
            resourceMemberIdMapping,
            currentDecision.submissionLocked,
        )
    }, [canSeeAuthor, currentDecision, hasSubmitterRole, resourceMemberIdMapping])

    const hasDecisionNotes = decisionNotes.length > 0

    const notesPanel = (
        <>
            {/* Unlocked submission: show blue notes banner */}
            {currentDecision?.status === 'HUMAN_OVERRIDE'
                && !currentDecision?.submissionLocked
                && hasDecisionNotes && (
                <div className={styles.notesBanner}>
                    <IconOutline.InformationCircleIcon className='icon-xl' />
                    <div>
                        <div className={styles.notesTitle}>Submission Unlocked</div>
                        {decisionNotes.map((note, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <div key={i} className={styles.notesMessage}>{note}</div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked submission with escalation/approval notes: show yellow notes banner */}
            {currentDecision?.submissionLocked && hasDecisionNotes && (
                <div className={styles.escalationNotesBanner}>
                    <IconOutline.InformationCircleIcon className='icon-xl' />
                    <div>
                        <div className={styles.notesTitle}>Review Activity Notes</div>
                        {decisionNotes.map((note, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <div key={i} className={styles.notesMessage}>{note}</div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )

    if (isTablet) {
        return (
            <div className={styles.wrap}>
                {currentDecision?.submissionLocked && lockMessage && (
                    <div className={styles.lockedBanner}>
                        <div className={styles.lockedTitle}>
                            <IconOutline.LockClosedIcon className='icon-lg' />
                            {lockedBannerTitle}
                        </div>
                        <div className={styles.lockedMessage}>{lockMessage}</div>
                    </div>
                )}

                {notesPanel}

                {!reviewerRows.length && loading && (
                    <div className={styles.mobileLoading}>Loading...</div>
                )}

                {reviewerRows.map(row => (
                    <div
                        key={row.id}
                        className={classNames(styles.mobileCard, row.status && styles[`row-${row.status}`])}
                    >
                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Reviewer</div>
                            <div className={styles.value}>
                                <span className={styles.icon}>
                                    <IconAiReview />
                                </span>
                                <span className={styles.workflowName} title={row.title}>
                                    {row.title}
                                </span>
                                {row.isGating && (
                                    <Tooltip
                                        content='Must pass independently to avoid automatic failure.'
                                        triggerOn='hover'
                                    >
                                        <IconOutline.LightningBoltIcon
                                            className={classNames('icon-lg', styles.gatingMarker)}
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </div>

                        {hasConfig && (
                            <>
                                <div className={styles.mobileRow}>
                                    <div className={styles.label}>Weight</div>
                                    <div className={styles.value}>{formatWeight(row.weight)}</div>
                                </div>
                                <div className={styles.mobileRow}>
                                    <div className={styles.label}>Min Score</div>
                                    <div className={styles.value}>{formatScore(row.minScore)}</div>
                                </div>
                            </>
                        )}

                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Review Date</div>
                            <div className={styles.value}>
                                {row.reviewDate
                                    ? moment(row.reviewDate)
                                        .local()
                                        .format(TABLE_DATE_FORMAT)
                                    : '-'}
                            </div>
                        </div>

                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Score</div>
                            <div className={styles.value}>
                                {row.workflowId && props.editMode && props.onScoreChange ? (
                                    <div className={styles.scoreWithOverride}>
                                        <span className={styles.originalScore}>
                                            {typeof row.score === 'number' ? formatScore(row.score) : '-'}
                                        </span>
                                        <input
                                            type='number'
                                            step='0.01'
                                            className={styles.overrideInput}
                                            value={props.editedScores?.[row.workflowId] ?? ''}
                                            onChange={function onChange(
                                                e: React.ChangeEvent<HTMLInputElement>,
                                            ) {
                                                if (props.onScoreChange && row.workflowId) {
                                                    props.onScoreChange(row.workflowId, e.target.value)
                                                }
                                            }}
                                            placeholder='Override'
                                        />
                                    </div>
                                ) : typeof row.score === 'number' ? (
                                    row.workflowId ? (
                                        <>
                                            <Link
                                                to={`../reviews/${props.submission.id}?workflowId=${row.workflowId}`}
                                            >
                                                {formatScore(row.score)}
                                            </Link>
                                            {row.managerScore !== null && row.managerScore !== undefined && (
                                                <span className={styles.overriddenScore}>
                                                    <span className={styles.overrideLabel}>(override)</span>
                                                </span>
                                            )}
                                        </>
                                    ) : formatScore(row.score)
                                ) : '-'}
                            </div>
                        </div>

                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Result</div>
                            <div className={`${styles.value} ${styles.resultCol}`}>
                                <AiWorkflowRunStatus
                                    run={row.run}
                                    status={row.status}
                                    action={
                                        row.run?.id
                                        && row.run?.id !== '-1'
                                        && isAdmin
                                        && row.status !== 'pending'
                                        && (
                                            <Tooltip content='Re-run the workflow'>
                                                <IconOutline.RefreshIcon
                                                    className={classNames('icon-lg', styles.reRunIcon)}
                                                    onClick={function onClick() { handleRerun(row.run!.id) }}
                                                />
                                            </Tooltip>
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className={styles.wrap} onClick={stopPropagation}>
            {currentDecision?.submissionLocked && lockMessage && (
                <div className={styles.lockedBanner}>
                    <IconOutline.LockClosedIcon className='icon-xl' />
                    <div>
                        <div className={styles.lockedTitle}>
                            {lockedBannerTitle}
                        </div>
                        <div className={styles.lockedMessage}>{lockMessage}</div>
                    </div>
                </div>
            )}

            {notesPanel}

            <table className={styles.reviewsTable}>
                <thead>
                    <tr>
                        <th>AI Reviewer</th>
                        {hasConfig && <th>Weight</th>}
                        {hasConfig && <th>Min Score</th>}
                        <th>Review Date</th>
                        <th className={styles.scoreCol}>Score</th>
                        <th>Result</th>
                    </tr>
                </thead>

                <tbody>
                    {!reviewerRows.length && loading && (
                        <tr>
                            <td colSpan={hasConfig ? 6 : 4}>Loading...</td>
                        </tr>
                    )}

                    {reviewerRows.map(row => (
                        <tr key={row.id} className={row.status ? styles[`row-${row.status}`] : ''}>
                            <td>
                                <div className={styles.aiReviewer}>
                                    <span className={styles.icon}>
                                        <IconAiReview />
                                    </span>
                                    <span className={styles.workflowName}>
                                        <Tooltip content={row.title} triggerOn='hover'>
                                            {row.title}
                                        </Tooltip>
                                    </span>
                                    {row.isGating && (
                                        <Tooltip
                                            content='Must pass independently to avoid automatic failure.'
                                            triggerOn='hover'
                                        >
                                            <IconOutline.LightningBoltIcon
                                                className={classNames('icon-lg', styles.gatingMarker)}
                                            />
                                        </Tooltip>
                                    )}
                                </div>
                            </td>
                            {hasConfig && <td>{formatWeight(row.weight)}</td>}
                            {hasConfig && <td>{formatScore(row.minScore)}</td>}
                            <td>
                                {row.reviewDate && (
                                    moment(row.reviewDate)
                                        .local()
                                        .format(TABLE_DATE_FORMAT)
                                )}
                            </td>
                            <td className={styles.scoreCol}>
                                {row.workflowId && props.editMode && props.onScoreChange ? (
                                    <div className={styles.scoreWithOverride}>
                                        <span className={styles.originalScore}>
                                            {typeof row.score === 'number' ? formatScore(row.score) : '-'}
                                        </span>
                                        <input
                                            type='number'
                                            step='0.01'
                                            className={styles.overrideInput}
                                            value={props.editedScores?.[row.workflowId] ?? ''}
                                            onChange={function onChange(
                                                e: React.ChangeEvent<HTMLInputElement>,
                                            ) {
                                                if (props.onScoreChange && row.workflowId) {
                                                    props.onScoreChange(row.workflowId, e.target.value)
                                                }
                                            }}
                                            placeholder='Override'
                                        />
                                    </div>
                                ) : typeof row.score === 'number' ? (
                                    row.workflowId ? (
                                        <>
                                            <Link
                                                to={`../reviews/${props.submission.id}?workflowId=${row.workflowId}`}
                                            >
                                                {formatScore(row.score)}
                                            </Link>
                                            {row.managerScore !== null && row.managerScore !== undefined && (
                                                <span className={styles.overriddenScore}>
                                                    <span className={styles.overrideLabel}>(override)</span>
                                                </span>
                                            )}
                                        </>
                                    ) : formatScore(row.score)
                                ) : '-'}
                            </td>
                            <td className={styles.resultCol}>
                                <AiWorkflowRunStatus
                                    status={row.status}
                                    run={row.run}
                                    action={
                                        row.run?.id
                                        && row.run?.id !== '-1'
                                        && isAdmin
                                        && row.status !== 'pending'
                                        && (
                                            <Tooltip content='Re-run the workflow'>
                                                <IconOutline.RefreshIcon
                                                    className={classNames('icon-lg', styles.reRunIcon)}
                                                    onClick={function onClick() { handleRerun(row.run!.id) }}
                                                />
                                            </Tooltip>
                                        )
                                    }
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default AiReviewsTable
