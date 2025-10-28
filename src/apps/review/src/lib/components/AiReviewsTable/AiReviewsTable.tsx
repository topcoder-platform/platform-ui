import { FC, useMemo } from 'react'
import moment from 'moment'

import { CheckIcon, MinusCircleIcon } from '@heroicons/react/outline'

import { AiWorkflowRunsResponse, useFetchAiWorkflowsRuns } from '../../hooks'
import { IconAiReview } from '../../assets/icons'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'

import styles from './AiReviewsTable.module.scss'

interface AiReviewsTableProps {
    submissionId: string
    reviewers: { aiWorkflowId: string }[]
}

const AiReviewsTable: FC<AiReviewsTableProps> = props => {
    const aiWorkflowIds = useMemo(() => props.reviewers.map(r => r.aiWorkflowId), [props.reviewers])
    const { runs, isLoading }: AiWorkflowRunsResponse = useFetchAiWorkflowsRuns(props.submissionId, aiWorkflowIds)

    return (
        <div className={styles.wrap}>
            <table className={styles.reviewsTable}>
                <tr>
                    <th>AI Reviewer</th>
                    <th>Review Date</th>
                    <th>Score</th>
                    <th>Result</th>
                </tr>

                {!runs.length && isLoading && (
                    <tr>
                        <td colSpan={4}>Loading...</td>
                    </tr>
                )}

                {runs.map(run => (
                    <tr key={run.id}>
                        <td>
                            <div className={styles.aiReviewer}>
                                <span className={styles.icon}>
                                    <IconAiReview />
                                </span>
                                <span className={styles.workflowName} title={run.workflow.name}>
                                    {run.workflow.name}
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
                            {run.status === 'SUCCESS' && run.score}
                        </td>
                        <td className={styles.resultCol}>
                            {run.status === 'SUCCESS' && (
                                <div className={styles.result}>
                                    {run.score >= run.workflow.scorecard.minimumPassingScore
                                        ? (
                                            <>
                                                <CheckIcon className='icon icon-xl passed' />
                                                {' '}
                                                Passed
                                            </>
                                        )
                                        : (
                                            <>
                                                <MinusCircleIcon className='icon icon-xl' />
                                                {' '}
                                                Passed
                                            </>
                                        )}
                                </div>
                            )}
                        </td>
                    </tr>
                ))}
            </table>
        </div>
    )
}

export default AiReviewsTable
