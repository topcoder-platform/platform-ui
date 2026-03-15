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
    BackendSubmission,
    ChallengeDetailContextModel,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'

import { AiWorkflowRunStatus } from './AiWorkflowRunStatus'
import styles from './AiReviewsTable.module.scss'

interface AiReviewsTableProps {
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
    aiReviewers?: { aiWorkflowId: string }[]
}

interface AiReviewerRow {
    id: string
    isGating?: boolean
    minScore?: number
    reviewDate?: string
    run?: Pick<AiWorkflowRun, 'id'|'score'|'status'|'workflow'>
    score?: number
    status?: 'failed' | 'failed-score' | 'passed' | 'pending'
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
): 'failed' | 'failed-score' | 'passed' | 'pending' {
    if (!runStatus) {
        return 'pending'
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
                    : fromDecision.runStatus, fromDecision.runScore, minScore)
                : undefined

            return {
                id: workflowId,
                isGating: fromDecision?.isGating ?? configured?.isGating,
                minScore,
                reviewDate: run?.completedAt,
                run,
                score: fromDecision?.runScore ?? run?.score,
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

    const { isAdmin }: UseRolePermissionsResult = useRolePermissions()
    const { mutate }: FullConfiguration = useSWRConfig()
    const [, setRerunningRunId] = useState<string | undefined>(undefined)

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
            ? `Gating Reviewers failed: ${failedGatingReviewers.join(', ')}.`
            : ''

        return `${failedReviewersText} This submission is automatically failed regardless of Overall Score. `
            + 'Improve your submission and resubmit.'
    }, [currentDecision?.submissionLocked, failedGatingReviewers])

    if (isTablet) {
        return (
            <div className={styles.wrap}>
                {currentDecision?.submissionLocked && lockMessage && (
                    <div className={styles.lockedBanner}>
                        <div className={styles.lockedTitle}>
                            <IconOutline.LockClosedIcon className='icon-lg' />
                            Submission Locked - Your submission will not be reviewed in the Review Phase.
                        </div>
                        <div className={styles.lockedMessage}>{lockMessage}</div>
                    </div>
                )}

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
                                            className={classNames('icon-lg', styles.gatingIcon)}
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
                                {typeof row.score === 'number' ? (
                                    row.workflowId ? (
                                        <Link
                                            to={`../reviews/${props.submission.id}?workflowId=${row.workflowId}`}
                                        >
                                            {formatScore(row.score)}
                                        </Link>
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
                            Submission Locked - Your submission will not be reviewed in the Review Phase.
                        </div>
                        <div className={styles.lockedMessage}>{lockMessage}</div>
                    </div>
                </div>
            )}

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
                                {typeof row.score === 'number' ? (
                                    row.workflowId ? (
                                        <Link
                                            to={`../reviews/${props.submission.id}?workflowId=${row.workflowId}`}
                                        >
                                            {formatScore(row.score)}
                                        </Link>
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
