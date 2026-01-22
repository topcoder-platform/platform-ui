import { FC } from 'react'
import classNames from 'classnames'

import { Button, IconOutline, IconSolid, LoadingSpinner } from '~/libs/ui'

import type { Feedback } from '../../lib/models'
import { formatDate } from '../../lib/utils'

import styles from './FeedbackList.module.scss'

interface FeedbackListProps {
    feedback: Feedback[]
    loading?: boolean
    error?: string
    onRetry?: () => void
}

const FeedbackList: FC<FeedbackListProps> = (props: FeedbackListProps) => {
    const feedback = props.feedback
    const loading = props.loading ?? false
    const error = props.error
    const onRetry = props.onRetry

    const hasFeedback = feedback.length > 0

    const renderRating = (rating?: number): JSX.Element | undefined => {
        if (!rating) {
            return undefined
        }

        const roundedRating = Math.round(rating)

        return (
            <div className={styles.rating}>
                <div className={styles.ratingStars}>
                    {Array.from({ length: 5 }, (_, index) => {
                        const starValue = index + 1
                        return (
                            <IconSolid.StarIcon
                                key={`star-${starValue}`}
                                className={classNames(
                                    styles.ratingStar,
                                    starValue <= roundedRating
                                        ? styles.ratingStarFilled
                                        : styles.ratingStarEmpty,
                                )}
                            />
                        )
                    })}
                </div>
                <span className={styles.ratingValue}>{rating}</span>
            </div>
        )
    }

    if (loading) {
        return (
            <div className={styles.loadingState}>
                <LoadingSpinner className={styles.loadingSpinner} inline />
                <span>Loading feedback...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className={styles.errorState}>
                <IconOutline.ExclamationIcon className={styles.errorIcon} />
                <div>
                    <p className={styles.errorText}>{error}</p>
                    {onRetry && (
                        <Button label='Retry' onClick={onRetry} primary />
                    )}
                </div>
            </div>
        )
    }

    if (!hasFeedback) {
        return (
            <div className={styles.emptyState}>
                <IconOutline.ChatAltIcon className={styles.emptyIcon} />
                <div>No feedback yet</div>
            </div>
        )
    }

    return (
        <div className={styles.feedbackList}>
            {feedback.map(item => {
                const authorLabel = item.givenByHandle
                    ? `Topcoder PM: ${item.givenByHandle}`
                    : `Customer: ${item.givenByEmail ?? 'Unknown'}`

                return (
                    <div key={item.id} className={styles.feedbackItem}>
                        <p className={styles.feedbackText}>{item.feedbackText}</p>
                        <div className={styles.feedbackMeta}>
                            <div className={styles.authorInfo}>{authorLabel}</div>
                            <div className={styles.metaRow}>
                                {renderRating(item.rating)}
                                <span className={styles.feedbackDate}>
                                    {formatDate(item.createdAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default FeedbackList
