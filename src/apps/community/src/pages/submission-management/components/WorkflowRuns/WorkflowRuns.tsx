import { FC, useMemo } from 'react'
import moment from 'moment'

import styles from './WorkflowRuns.module.scss'

const TABLE_DATE_FORMAT = 'MMM DD YYYY, HH:mm A'

interface WorkflowInfo {
    id?: string
    name?: string
    scorecard?: {
        minimumPassingScore?: number
    }
}

interface WorkflowRun {
    completedAt?: string
    createdAt?: string
    score?: number
    status?: string
    workflow?: WorkflowInfo
}

interface WorkflowRunsProps {
    challengeId: string
    workflowRuns?: WorkflowRun[] | Record<string, WorkflowRun>
}

function toRuns(
    workflowRuns: WorkflowRunsProps['workflowRuns'],
): WorkflowRun[] {
    if (!workflowRuns) {
        return []
    }

    return Array.isArray(workflowRuns)
        ? workflowRuns
        : Object.values(workflowRuns)
}

function getRunStatusText(run: WorkflowRun): string {
    const status = (run.status || '').toUpperCase()

    if (status === 'IN_PROGRESS' || status === 'QUEUED') {
        return 'PENDING'
    }

    if (status === 'FAILED' || status === 'FAILURE' || status === 'CANCELLED') {
        return 'FAILED'
    }

    if (status === 'SUCCESS' || status === 'COMPLETED') {
        const minimumPassingScore = run.workflow?.scorecard?.minimumPassingScore || 0
        const score = run.score || 0
        return score >= minimumPassingScore
            ? 'PASSED'
            : 'FAILED'
    }

    return status || 'UNKNOWN'
}

function getRunKey(
    challengeId: string,
    run: WorkflowRun,
): string {
    return [
        challengeId,
        run.workflow?.id || run.workflow?.name || 'workflow',
        run.createdAt || run.completedAt || 'date',
        run.status || 'status',
    ].join('-')
}

/**
 * Displays workflow run statuses associated with a submission.
 *
 * @param props Workflow runs grouped by submission.
 * @returns Workflow runs table.
 */
const WorkflowRuns: FC<WorkflowRunsProps> = (props: WorkflowRunsProps) => {
    const runs = useMemo(() => toRuns(props.workflowRuns)
        .sort((runA, runB) => {
            const timeA = +(new Date(runA.createdAt || runA.completedAt || 0))
            const timeB = +(new Date(runB.createdAt || runB.completedAt || 0))
            return timeB - timeA
        }), [props.workflowRuns])

    if (!runs.length) {
        return <></>
    }

    return (
        <div className={styles.wrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Workflow</th>
                        <th>Created Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {runs.map(run => (
                        <tr key={getRunKey(props.challengeId, run)}>
                            <td>{run.workflow?.name || 'AI Reviewer'}</td>
                            <td>
                                {(run.createdAt || run.completedAt)
                                    ? moment(run.createdAt || run.completedAt)
                                        .local()
                                        .format(TABLE_DATE_FORMAT)
                                    : '-'}
                            </td>
                            <td>{getRunStatusText(run)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export type {
    WorkflowRun,
}
export { WorkflowRuns }
export default WorkflowRuns
