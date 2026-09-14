/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { ChallengeSubmissionAiWorkflowRun } from '../models'
import { getChallengeSubmissionAiWorkflowRuns } from '../services'
import { submissionAiReviewAppUrl } from '../utils'

import styles from './SubmissionAiReviewDetails.module.scss'

interface SubmissionAiReviewDetailsProps {
    challengeId: string
    id: string
    submissionId: string
}

interface WorkflowRunResult {
    kind: 'failed' | 'passed' | 'pending' | 'status'
    label: string
}

const PENDING_STATUSES = new Set(['INIT', 'QUEUED', 'DISPATCHED', 'IN_PROGRESS'])
const TERMINAL_STATUSES = new Set(['CANCELLED', 'COMPLETED', 'FAILED', 'FAILURE', 'SUCCESS', 'TIMEOUT'])
const WORKFLOW_RUN_REFRESH_INTERVAL_MS = 10_000

/**
 * Normalizes an optional Review API workflow status for comparisons and display.
 *
 * @param run workflow run returned by Review API.
 * @returns trimmed uppercase status, or an empty string when omitted.
 * @throws Does not throw.
 */
function workflowRunStatus(run: ChallengeSubmissionAiWorkflowRun): string {
    return (run.status ?? '').trim()
        .toUpperCase()
}

/**
 * Converts one Review API workflow run into its member-facing result.
 *
 * Successful runs use the configured minimum passing score, matching the legacy
 * submission-management experience. Other lifecycle values remain explicit.
 *
 * @param run workflow run returned by Review API.
 * @returns uppercase result label and visual kind.
 * @throws Does not throw.
 */
export function submissionAiWorkflowRunResult(
    run: ChallengeSubmissionAiWorkflowRun,
): WorkflowRunResult {
    const status = workflowRunStatus(run)
    if (PENDING_STATUSES.has(status)) return { kind: 'pending', label: 'PENDING' }
    if (status === 'SUCCESS') {
        const score = Number(run.score)
        const minimumPassingScore = Number(run.workflow?.scorecard?.minimumPassingScore ?? 0)
        const passed = Number.isFinite(score)
            && Number.isFinite(minimumPassingScore)
            && score >= minimumPassingScore
        return { kind: passed ? 'passed' : 'failed', label: passed ? 'PASSED' : 'FAILED' }
    }

    if (status === 'FAILED' || status === 'FAILURE' || status === 'TIMEOUT') {
        return { kind: 'failed', label: 'FAILED' }
    }

    return { kind: 'status', label: status.replace(/_/g, ' ') || 'UNKNOWN' }
}

/**
 * Formats a workflow completion timestamp for the Opportunities locale.
 *
 * @param value ISO timestamp returned by Review API.
 * @returns localized date/time or a dash when missing/invalid.
 * @throws Does not throw.
 */
function workflowReviewDate(value: string | undefined): string {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleString('en-US', {
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Determines whether an unfinished workflow run should keep the details fresh.
 *
 * @param runs latest workflow records, when loaded.
 * @returns polling interval while any run is non-terminal, otherwise zero.
 * @throws Does not throw.
 */
function workflowRunRefreshInterval(
    runs: ChallengeSubmissionAiWorkflowRun[] | undefined,
): number {
    return !runs?.length || runs.some(run => !TERMINAL_STATUSES.has(workflowRunStatus(run)))
        ? WORKFLOW_RUN_REFRESH_INTERVAL_MS
        : 0
}

/**
 * Displays workflow-run details for an expanded member submission row.
 *
 * The component owns its authenticated request so one failed submission renders
 * an inline retry state without producing a page-wide toast.
 *
 * @param props challenge/submission identifiers and the controlled panel id.
 * @returns workflow details table or a compact request state.
 * @throws Does not throw; request failures are rendered inline.
 */
export const SubmissionAiReviewDetails: FC<SubmissionAiReviewDetailsProps> = props => {
    const response: SWRResponse<ChallengeSubmissionAiWorkflowRun[], Error> = useSWR(
        ['opportunities:submission-ai-workflow-runs', props.submissionId],
        () => getChallengeSubmissionAiWorkflowRuns(props.submissionId),
        {
            refreshInterval: workflowRunRefreshInterval,
            revalidateOnFocus: false,
            shouldRetryOnError: false,
        },
    )

    /** Retries only this submission's workflow-run request. */
    const retry = (): void => {
        response.mutate()
    }

    if (response.error && response.data === undefined) {
        return (
            <div className={styles.requestState} id={props.id} role='alert'>
                <span>AI review details are unavailable.</span>
                <button onClick={retry} type='button'>Try again</button>
            </div>
        )
    }

    if (!response.data) {
        return <p className={styles.requestState} id={props.id} role='status'>Loading AI review details…</p>
    }

    if (!response.data.length) {
        return <p className={styles.requestState} id={props.id}>No AI review details are available yet.</p>
    }

    return (
        <div className={styles.tableWrap} id={props.id}>
            <table aria-label={`AI review details for submission ${props.submissionId}`}>
                <thead>
                    <tr>
                        <th>AI Reviewer</th>
                        <th>Review Date</th>
                        <th>Score</th>
                        <th>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {response.data.map(run => {
                        const successful = workflowRunStatus(run) === 'SUCCESS'
                        const workflowId = run.workflowId ?? run.workflow?.id
                        const result = submissionAiWorkflowRunResult(run)
                        const score = successful && run.score !== null && run.score !== undefined
                            ? String(run.score)
                            : '-'
                        return (
                            <tr key={run.id}>
                                <td data-mobile-label='AI Reviewer'>
                                    {run.workflow?.name ?? 'AI review workflow'}
                                </td>
                                <td data-mobile-label='Review Date'>
                                    {successful ? workflowReviewDate(run.completedAt) : '-'}
                                </td>
                                <td data-mobile-label='Score'>
                                    {successful && workflowId ? (
                                        <a
                                            href={submissionAiReviewAppUrl(
                                                props.challengeId,
                                                props.submissionId,
                                                workflowId,
                                            )}
                                            rel='noreferrer'
                                            target='_blank'
                                        >
                                            {score}
                                        </a>
                                    ) : score}
                                </td>
                                <td data-mobile-label='Result'>
                                    <span className={`${styles.result} ${styles[result.kind]}`}>
                                        {result.label}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
