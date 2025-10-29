import { FC, useMemo } from 'react'
import moment from 'moment'

import { CheckIcon, MinusCircleIcon } from '@heroicons/react/outline'
import { useWindowSize, WindowSize } from '~/libs/shared'

import {
    AiWorkflowRun,
    AiWorkflowRunsResponse,
    AiWorkflowRunStatus,
    useFetchAiWorkflowsRuns,
    useRolePermissions,
    UseRolePermissionsResult,
} from '../../hooks'
import { IconAiReview } from '../../assets/icons'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { BackendSubmission } from '../../models'

import styles from './AiReviewsTable.module.scss'
import { IconOutline, Tooltip } from '~/libs/ui'
import { run } from 'node:test'

interface AiReviewsTableProps {
    submission: Pick<BackendSubmission, 'id'|'virusScan'>
    reviewers: { aiWorkflowId: string }[]
}

const aiRunInProgress = (aiRun: Pick<AiWorkflowRun, 'status'>) =>
    [
        AiWorkflowRunStatus.INIT,
        AiWorkflowRunStatus.QUEUED,
        AiWorkflowRunStatus.DISPATCHED,
        AiWorkflowRunStatus.IN_PROGRESS,
    ].includes(aiRun.status)

const aiRunFailed = (aiRun: Pick<AiWorkflowRun, 'status'>) =>
    [
        AiWorkflowRunStatus.FAILURE,
        AiWorkflowRunStatus.CANCELLED,
    ].includes(aiRun.status)

const AiReviewsTable: FC<AiReviewsTableProps> = props => {
    const aiWorkflowIds = useMemo(() => props.reviewers.map(r => r.aiWorkflowId), [props.reviewers])
    const { runs, isLoading }: AiWorkflowRunsResponse = useFetchAiWorkflowsRuns(props.submission.id, aiWorkflowIds)

    const windowSize: WindowSize = useWindowSize()
    const isTablet = useMemo(
        () => (windowSize.width ?? 0) <= 984,
        [windowSize.width],
    )
    const { isAdmin }: UseRolePermissionsResult = useRolePermissions()

    const aiRuns = useMemo(() => [
        ...runs,
        {
            id: '-1',
            completedAt: (props.submission as BackendSubmission).submittedDate,
            status: AiWorkflowRunStatus.SUCCESS,
            score: props.submission.virusScan === true ? 100 : 0,
            workflow: {
                name: 'Virus Scan',
                description: '',
            }
        } as AiWorkflowRun
    ].filter(r => isAdmin || !aiRunFailed(r)), [runs, props.submission])

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
                                        <a href={`/scorecard/${run.workflow.scorecard.id}`}>{run.score}</a>
                                    ) : run.score
                                ) : '-'}
                            </div>
                        </div>

                        <div className={styles.mobileRow}>
                            <div className={styles.label}>Result</div>
                            <div className={`${styles.value} ${styles.resultCol}`}>
                                {run.status === 'SUCCESS' && (
                                    <div className={styles.result}>
                                        {run.score >= (run.workflow.scorecard?.minimumPassingScore ?? 0) ? (
                                            <>
                                                <CheckIcon className='icon icon-xl passed' />
                                                {' '}
                                                Passed
                                            </>
                                        ) : (
                                            <>
                                                <MinusCircleIcon className='icon icon-xl' />
                                                {' '}
                                                Failed
                                            </>
                                        )}
                                    </div>
                                )}
                                {aiRunInProgress(run) && (
                                    <div className={styles.result}>
                                        <span className='icon pending'>
                                            <IconOutline.MinusIcon className='icon-sm' />
                                        </span>
                                        {' '}
                                        To be filled
                                    </div>
                                )}
                                {aiRunFailed(run) && (
                                    <div className={styles.result}>
                                        <span className='icon'>
                                            <IconOutline.XCircleIcon className='icon-xl' />
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

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

                {aiRuns.map(run => (
                    <tr key={run.id}>
                        <td>
                            <div className={styles.aiReviewer}>
                                <span className={styles.icon}>
                                    <IconAiReview />
                                </span>
                                <span className={styles.workflowName} title={run.workflow.name}>
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
                                run.workflow.scorecard ? (
                                    <a href={`/scorecard/${run.workflow.scorecard.id}`}>{run.score}</a>
                                ) : run.score
                            ) : '-'}
                        </td>
                        <td className={styles.resultCol}>
                            {run.status === 'SUCCESS' && (
                                <div className={styles.result}>
                                    {run.score >= (run.workflow.scorecard?.minimumPassingScore ?? 0)
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
                            {aiRunInProgress(run) && (
                                <div className={styles.result}>
                                    <span className='icon pending'>
                                        <IconOutline.MinusIcon className='icon-sm' />
                                    </span>
                                    {' '}
                                    To be filled
                                </div>
                            )}
                            {aiRunFailed(run) && (
                                <div className={styles.result}>
                                    <span className='icon'>
                                        <IconOutline.XCircleIcon className='icon-xl' />
                                    </span>
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
