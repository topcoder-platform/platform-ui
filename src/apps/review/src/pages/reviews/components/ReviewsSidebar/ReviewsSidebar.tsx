/* eslint-disable complexity */
import { FC, useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { ReviewsContextModel } from '~/apps/review/src/lib/models'
import { AiWorkflowRunStatus } from '~/apps/review/src/lib/components/AiReviewsTable'
import { IconAiReview, IconPhaseReview } from '~/apps/review/src/lib/assets/icons'
import { IconOutline, IconSolid, Tooltip } from '~/libs/ui'
import { AiScoreFormulaTooltip } from '~/apps/review/src/lib/components/AiScoreFormulaTooltip'
import { formatScore } from '~/apps/review/src/lib/components/AiScoreFormulaTooltip/AiScoreFormulaTooltip'
import {
    normalizeDecisionStatus,
} from '~/apps/review/src/lib/components/CollapsibleAiReviewsRow/CollapsibleAiReviewsRow'
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
        aiReviewConfig,
        aiReviewDecisionsBySubmissionId,
    }: ReviewsContextModel = useReviewsContext()
    const isReviewActive = !workflowRun

    const toggleOpen = useCallback(() => {
        setIsMobileOpen(wasOpen => !wasOpen)
    }, [])

    const close = useCallback(() => {
        setIsMobileOpen(false)
    }, [])

    const runUrl = useCallback((runWorkflowId: string) => (
        `../reviews/${submissionId}?workflowId=${runWorkflowId}&reviewId=${reviewId}`
    ), [reviewId, submissionId])

    const hasAiReviewConfig = Boolean(aiReviewConfig?.workflows?.length)

    const currentDecision = submissionId
        ? aiReviewDecisionsBySubmissionId?.[submissionId]
        : undefined

    const hasScore
    = currentDecision?.totalScore !== null
    && currentDecision?.totalScore !== undefined

    const overallStatus = normalizeDecisionStatus(currentDecision?.status)
    const overallScore = currentDecision?.totalScore

    return (
        <div className={classNames(props.className, styles.wrap)}>
            {((workflow && workflowRun) || reviewId) && (
                <div className={styles.mobileTrigger} onClick={toggleOpen}>
                    <div className={classNames(styles.runEntry, styles.active)}>
                        <span className={styles.workflowNameWrap}>
                            {reviewId ? <IconPhaseReview /> : <IconAiReview />}
                            <span className={styles.workflowName}>
                                {(workflow && workflowRun) ? workflow.name : 'Review'}
                            </span>
                        </span>

                        {reviewStatus ? (
                            <AiWorkflowRunStatus
                                status={reviewStatus.status}
                                score={reviewStatus.score}
                                showScore
                                hideLabel
                            />
                        ) : (
                            <AiWorkflowRunStatus
                                run={workflowRun}
                                showScore
                                hideLabel
                            />
                        )}
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
                        {workflowRuns.map(run => {
                            const isGating = aiReviewConfig?.workflows?.find(
                                w => w.workflowId === run.workflow.id,
                            )?.isGating

                            return (

                                <li
                                    className={
                                        classNames(
                                            styles.runEntry,
                                            workflowId === run.workflow.id && styles.active,
                                        )
                                    }
                                    key={run.id}
                                >
                                    <Tooltip
                                        content={run.workflow.name}
                                        triggerOn='hover'
                                        disableWrap
                                    >
                                        <Link
                                            to={runUrl(run.workflow.id)}
                                            onClick={close}
                                        />
                                        <span className={styles.workflowNameWrap}>
                                            <IconAiReview />
                                            <span className={styles.workflowName}>{run.workflow.name}</span>
                                            {isGating && (
                                                <IconOutline.LightningBoltIcon
                                                    className={classNames('icon-lg', styles.gatingIcon)}
                                                />
                                            )}
                                        </span>
                                    </Tooltip>
                                    <AiWorkflowRunStatus
                                        run={run}
                                        showScore
                                        hideLabel
                                    />
                                </li>
                            )
                        })}
                        {hasAiReviewConfig && (
                            <li
                                className={classNames(
                                    styles.runEntry,
                                    styles.overallRow,
                                )}
                            >
                                <span className={styles.workflowNameWrap}>
                                    <IconAiReview />
                                    <span className={styles.overallScore}>Overall Score</span>
                                </span>

                                {hasScore ? (
                                    <AiWorkflowRunStatus
                                        status={overallStatus}
                                        score={overallScore ?? undefined}
                                        showScore
                                        hideLabel
                                    />
                                ) : (
                                    <AiWorkflowRunStatus
                                        status='pending'
                                        showScore={false}
                                        hideLabel={false}
                                    />
                                )}
                            </li>
                        )}

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
                {hasAiReviewConfig
                && (
                    <div className={styles.legend}>
                        <div className={styles.legendLabel}>
                            Score Info
                        </div>
                        <div className={styles.scoreInfoRow}>
                            <span>Min Passing Score</span>
                            <span>{formatScore(aiReviewConfig?.minPassingThreshold)}</span>
                        </div>

                        <div className={styles.scoreInfoRow}>
                            <span>AI Score Formula</span>
                            <Tooltip
                                content={<AiScoreFormulaTooltip aiReviewConfig={aiReviewConfig} />}
                                triggerOn='hover'
                            >
                                <span className={styles.infoIcon}>
                                    <IconOutline.InformationCircleIcon className='icon-lg' />
                                </span>
                            </Tooltip>
                        </div>
                    </div>
                )}

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
                        <li>
                            <StatusLabel
                                icon={(
                                    <IconOutline.LightningBoltIcon
                                        className={classNames('icon-lg', styles.gatingIcon)}
                                    />
                                )}
                                label='Gating Indicator'
                                status='pending'
                                isAiIcon
                            />
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default ReviewsSidebar
