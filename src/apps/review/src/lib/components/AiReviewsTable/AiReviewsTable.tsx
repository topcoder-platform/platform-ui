import { FC, MouseEvent as ReactMouseEvent, useMemo } from 'react'
import { Link } from 'react-router-dom'
import moment from 'moment'

import { useWindowSize, WindowSize } from '~/libs/shared'
import { Tooltip } from '~/libs/ui'

import {
    AiWorkflowRun,
    AiWorkflowRunsResponse,
    AiWorkflowRunStatusEnum,
    useFetchAiWorkflowsRuns,
} from '../../hooks'
import { IconAiReview } from '../../assets/icons'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { BackendSubmission } from '../../models'

import { AiWorkflowRunStatus } from './AiWorkflowRunStatus'
import styles from './AiReviewsTable.module.scss'

interface AiReviewsTableProps {
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
    reviewers: { aiWorkflowId: string }[]
}

const stopPropagation = (ev: ReactMouseEvent<HTMLDivElement, MouseEvent>): void => {
    ev.stopPropagation()
}

const AiReviewsTable: FC<AiReviewsTableProps> = props => {
    const { runs, isLoading }: AiWorkflowRunsResponse = useFetchAiWorkflowsRuns(props.submission.id)

    const windowSize: WindowSize = useWindowSize()
    const isTablet = useMemo(
        () => (windowSize.width ?? 0) <= 984,
        [windowSize.width],
    )

    const aiRuns = useMemo(() => [
        ...runs,
        {
            completedAt: (props.submission as BackendSubmission).submittedDate,
            id: '-1',
            score: props.submission.virusScan === true ? 100 : 0,
            status: AiWorkflowRunStatusEnum.SUCCESS,
            workflow: {
                description: '',
                name: 'Virus Scan',
                scorecard: {
                    minimumPassingScore: 1,
                },
            },
        } as AiWorkflowRun,
    ], [runs, props.submission])

    if (isTablet) {
        return (
            <div className={styles.wrap}>
                {!runs.length && isLoading && (
                    <div className={styles.mobileLoading}>Loading...</div>
                )}

                {aiRuns.map(run => (
                    <div key={run.id} className={styles.mobileCard}>
                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Reviewer</div>
                            <div className={styles.value}>
                                <span className={styles.icon}>
                                    <IconAiReview />
                                </span>
                                <span className={styles.workflowName} title={run.workflow.name}>
                                    {run.workflow.name}
                                </span>
                            </div>
                        </div>

                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Review Date</div>
                            <div className={styles.value}>
                                {run.status === 'SUCCESS'
                                    ? moment(run.completedAt)
                                        .local()
                                        .format(TABLE_DATE_FORMAT)
                                    : '-'}
                            </div>
                        </div>

                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Score</div>
                            <div className={styles.value}>
                                {run.status === 'SUCCESS' ? (
                                    run.workflow.scorecard ? (
                                        <Link
                                            to={`../reviews/${props.submission.id}?workflowId=${run.workflow.id}`}
                                        >
                                            {run.score}
                                        </Link>
                                    ) : run.score
                                ) : '-'}
                            </div>
                        </div>

                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Result</div>
                            <div className={`${styles.value} ${styles.resultCol}`}>
                                <AiWorkflowRunStatus run={run} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className={styles.wrap} onClick={stopPropagation}>
            <table className={styles.reviewsTable}>
                <thead>
                    <tr>
                        <th>AI Reviewer</th>
                        <th>Review Date</th>
                        <th className={styles.scoreCol}>Score</th>
                        <th>Result</th>
                    </tr>
                </thead>

                <tbody>
                    {!runs.length && isLoading && (
                        <tr>
                            <td colSpan={4}>Loading...</td>
                        </tr>
                    )}

                    {aiRuns.map(run => (
                        <tr key={run.id}>
                            <td>
                                <div className={styles.aiReviewer}>
                                    <span className={styles.icon}>
                                        <IconAiReview />
                                    </span>
                                    <span className={styles.workflowName}>
                                        <Tooltip content={run.workflow.name} triggerOn='hover'>
                                            {run.workflow.name}
                                        </Tooltip>
                                    </span>
                                </div>
                            </td>
                            <td>
                                {run.status === 'SUCCESS' && (
                                    moment(run.completedAt)
                                        .local()
                                        .format(TABLE_DATE_FORMAT)
                                )}
                            </td>
                            <td className={styles.scoreCol}>
                                {run.status === 'SUCCESS' ? (
                                    run.workflow.id ? (
                                        <Link
                                            to={`../reviews/${props.submission.id}?workflowId=${run.workflow.id}`}
                                        >
                                            {run.score}
                                        </Link>
                                    ) : run.score
                                ) : '-'}
                            </td>
                            <td className={styles.resultCol}>
                                <AiWorkflowRunStatus run={run} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default AiReviewsTable
