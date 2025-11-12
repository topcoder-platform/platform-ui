import { FC, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { ReviewsContextModel } from '~/apps/review/src/lib/models'
import { AiWorkflowRunStatus } from '~/apps/review/src/lib/components/AiReviewsTable'
import { IconAiReview, IconPhaseReview } from '~/apps/review/src/lib/assets/icons'
import { IconOutline, IconSolid } from '~/libs/ui'
import StatusLabel from '~/apps/review/src/lib/components/AiReviewsTable/StatusLabel'

import { useReviewsContext } from '../../ReviewsContext'

import styles from './ReviewsSidebar.module.scss'

interface ReviewsSidebarProps {
    className?: string
}

const ReviewsSidebar: FC<ReviewsSidebarProps> = props => {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const {
        workflow,
        workflowRun,
        workflowRuns,
        workflowId,
        submissionId,
        reviewId,
        reviewStatus,
    }: ReviewsContextModel = useReviewsContext()
    const isReviewActive = !workflowRun

    const toggleOpen = useCallback(() => {
        setIsMobileOpen(wasOpen => !wasOpen)
    }, [])

    const close = useCallback(() => {
        setIsMobileOpen(false)
    }, [])

    return (
        <div className={classNames(props.className, styles.wrap)}>
            {workflow && workflowRun && (
                <div className={styles.mobileTrigger} onClick={toggleOpen}>
                    <div className={classNames(styles.runEntry, styles.active)}>
                        <span className={styles.workflowNameWrap}>
                            <IconAiReview />
                            <span className={styles.workflowName}>{workflow.name}</span>
                        </span>
                        <AiWorkflowRunStatus run={workflowRun} showScore hideLabel />
                        <div className={styles.mobileMenuIcon}>
                            <IconOutline.MenuIcon className='icon-xl' />
                        </div>
                    </div>
                </div>
            )}

            <div className={classNames(styles.contentsWrap, isMobileOpen && styles.open)}>
                <div className={styles.mobileCloseicon} onClick={toggleOpen}>
                    <IconSolid.XIcon className='icon-xxl' />
                </div>
                <div className={styles.runsWrap}>
                    <ul>
                        {workflowRuns.map(run => (
                            <li
                                className={
                                    classNames(
                                        styles.runEntry,
                                        workflowId === run.workflow.id && styles.active,
                                    )
                                }
                                key={run.id}
                            >
                                <Link
                                    to={`../reviews/${submissionId}?workflowId=${run.workflow.id}&reviewId=${reviewId}`}
                                    onClick={close}
                                />
                                <span className={styles.workflowNameWrap}>
                                    <IconAiReview />
                                    <span className={styles.workflowName}>{run.workflow.name}</span>
                                </span>
                                <AiWorkflowRunStatus run={run} showScore hideLabel />
                            </li>
                        ))}

                        {submissionId && reviewId && (
                            <li
                                className={classNames(
                                    styles.runEntry,
                                    isReviewActive && styles.active,
                                )}
                            >
                                <Link
                                    to={`../reviews/${submissionId}?reviewId=${reviewId}`}
                                    onClick={close}
                                />
                                <span className={styles.workflowNameWrap}>
                                    <IconPhaseReview />
                                    <span className={styles.workflowName}>Review</span>
                                </span>
                                {reviewStatus && (
                                    <AiWorkflowRunStatus
                                        status={reviewStatus.status}
                                        score={reviewStatus.score}
                                        showScore
                                        hideLabel
                                    />
                                )}
                            </li>
                        )}
                    </ul>
                </div>

                <div className={styles.legend}>
                    <div className={styles.legendLabel}>
                        Legend
                    </div>
                    <ul>
                        <li>
                            <StatusLabel
                                icon={<IconOutline.CheckIcon className='icon-xl' />}
                                label='Passed'
                                status='passed'
                            />
                        </li>
                        <li>
                            <StatusLabel
                                icon={<IconOutline.MinusCircleIcon className='icon-xl' />}
                                label='Failed'
                                status='failed'
                            />
                        </li>
                        <li>
                            <StatusLabel
                                icon={<IconOutline.MinusIcon className='icon-md' />}
                                label='To be filled'
                                status='pending'
                            />
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default ReviewsSidebar
