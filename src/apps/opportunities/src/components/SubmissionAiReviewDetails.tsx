/* eslint-disable react/jsx-no-bind */
import { FC } from 'react'
import { orderBy, uniqBy } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { ChallengeSubmissionAiWorkflowRun } from '../models'
import { getChallengeSubmissionAiWorkflowRuns } from '../services'
import { submissionAiReviewAppUrl } from '../utils'
import { formatOpportunityDateTime } from '../utils/opportunity-date.utils'

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
 * Selects the latest attempt of each workflow for this submission's details and polling.
 *
 * Uses the same start/dispatch and completion ordering as Review App, including
 * reruns that have been dispatched but have not started yet. Workflow identity
 * comes from the API id, never its display name; unidentified runs stay separate.
 *
 * @param runs all workflow runs for one submission, in any API order.
 * @returns one latest run per workflow without mutating the input.
 * @throws Does not throw.
 */
function latestSubmissionAiWorkflowRuns(
    runs: ChallengeSubmissionAiWorkflowRun[],
): ChallengeSubmissionAiWorkflowRun[] {
    return uniqBy(
        orderBy(
            runs,
            [
                run => run.startedAt ?? run.lastDispatchedAt ?? '',
                run => run.completedAt ?? '',
            ],
            ['desc', 'desc'],
        ),
        run => run.workflowId ?? run.workflow?.id ?? run.id,
    )
        .reverse()
}

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
 * Timed-out runs retain their TIMEOUT label instead of appearing as FAILED.
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

    if (status === 'FAILED' || status === 'FAILURE') {
        return { kind: 'failed', label: 'FAILED' }
    }

    return { kind: 'status', label: status.replace(/_/g, ' ') || 'UNKNOWN' }
}

/**
 * Formats a workflow completion timestamp in the shared Community date style.
 *
 * @param value ISO timestamp returned by Review API.
 * @returns `17 Sep 2026, 14:39` in the viewer's timezone, or a dash when missing/invalid.
 * @throws Does not throw.
 */
function workflowReviewDate(value: string | undefined): string {
    return formatOpportunityDateTime(value, '-')
}

/**
 * Determines whether a latest workflow attempt should keep the details fresh.
 *
 * @param runs all workflow records for this submission, when loaded.
 * @returns polling interval while any latest run is non-terminal, otherwise zero.
 * @throws Does not throw.
 */
function workflowRunRefreshInterval(
    runs: ChallengeSubmissionAiWorkflowRun[] | undefined,
): number {
    return !runs?.length || latestSubmissionAiWorkflowRuns(runs)
        .some(run => !TERMINAL_STATUSES.has(workflowRunStatus(run)))
        ? WORKFLOW_RUN_REFRESH_INTERVAL_MS
        : 0
}

/**
 * Displays only the latest run per workflow for an expanded member submission row.
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

    const latestRuns = latestSubmissionAiWorkflowRuns(response.data)

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
                    {latestRuns.map(run => {
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
