import { FC } from 'react'

import { ProgressBar } from '~/apps/review/src/lib/components/ProgressBar'
import { IconDeepseekAi, IconPhaseReview, IconPremium } from '~/apps/review/src/lib/assets/icons'
import { ReviewInfo, ScorecardInfo } from '~/apps/review/src/lib/models'
import { AiWorkflow } from '~/apps/review/src/lib/hooks'

import styles from './ReviewScorecardHeader.module.scss'

interface Props {
    reviewInfo?: ReviewInfo
    scorecardInfo?: ScorecardInfo
    workflow?: AiWorkflow
    reviewProgress?: number
}

export const ReviewScorecardHeader: FC<Props> = (props: Props) => {
    const reviewerHandle = props.reviewInfo?.reviewerHandle
    const reviewerColor = props.reviewInfo?.reviewerHandleColor
    const llmModelName = props.workflow?.llm?.name || 'N/A'
    const minimumPassingScore = props.scorecardInfo?.minimumPassingScore ?? 0

    return (
        <div className={styles.wrap}>
            <div className={styles.content}>
                <div className={styles.leftSection}>
                    <div className={styles.iconWrapper}>
                        <div className={styles.scorecardIcon}>
                            <IconPhaseReview className={styles.aiReviewIcon} />
                        </div>
                    </div>
                    <div className={styles.details}>
                        <h2 className={styles.title}>Edit Review Scorecard</h2>
                        <div className={styles.infoSection}>
                            {reviewerHandle && (
                                <div className={styles.infoRow}>
                                    <div className={styles.personIcon}>
                                        <i className='icon-handle' />
                                    </div>
                                    <span className={styles.infoLabel}>Reviewer:</span>
                                    <span className={styles.infoValue} style={{ color: reviewerColor }}>
                                        {reviewerHandle}
                                    </span>
                                </div>
                            )}
                            {props.workflow?.llm && (
                                <div className={styles.infoRow}>
                                    <div className={styles.whaleIcon}>
                                        <IconDeepseekAi />
                                    </div>
                                    <span className={styles.infoLabel}>LLM/AI Model:</span>
                                    <span className={styles.infoValue} style={{ color: '#0D61BF' }}>
                                        {llmModelName}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.rightSection}>
                    <div className={styles.scoreInfo}>
                        <IconPremium className={styles.trophyIcon} />
                        <span className={styles.scoreLabel}>Minimum passing score:</span>
                        <span className={styles.scoreValue}>
                            {minimumPassingScore.toFixed(2)}
                        </span>
                    </div>
                    <div className={styles.progressSection}>
                        <ProgressBar progress={props.reviewProgress} progressWidth='100%' withoutPercentage />
                        <span className={styles.progressText}>
                            {props.reviewProgress}
                            %
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReviewScorecardHeader
