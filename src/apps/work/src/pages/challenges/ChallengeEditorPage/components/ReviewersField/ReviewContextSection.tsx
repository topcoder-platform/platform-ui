/* eslint-disable max-len */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'

import { useFetchChallengeReviewContext } from '../../../../../lib/hooks'

import { normalizeReviewerText } from './reviewers-field.utils'
import styles from './ReviewConfigurationSummary.module.scss'

interface ReviewContextSectionProps {
    challengeId?: string
}

export const ReviewContextSection: FC<ReviewContextSectionProps> = props => {
    const reviewContextResult = useFetchChallengeReviewContext(props.challengeId)
    const reviewContextRequirements = useMemo(() => {
        const requirements = reviewContextResult.context?.context?.requirements

        if (!Array.isArray(requirements)) {
            return []
        }

        return [...requirements].sort((a, b) => a.id.localeCompare(b.id))
    }, [reviewContextResult.context])
    const reviewContextLoading = reviewContextResult.isLoading
    const reviewContextError = reviewContextResult.error
    const hasReviewContextRequirements = reviewContextRequirements.length > 0
    const [expandedReviewContextIds, setExpandedReviewContextIds] = useState<string[]>([])

    useEffect(() => {
        if (reviewContextLoading || reviewContextError) {
            return
        }

        setExpandedReviewContextIds(
            reviewContextRequirements.length > 0
                ? [reviewContextRequirements[0].id]
                : [],
        )
    }, [reviewContextError, reviewContextLoading, reviewContextRequirements])

    const handleToggleRequirement = useCallback((requirementId: string): void => {
        setExpandedReviewContextIds(prev => {
            if (prev.includes(requirementId)) {
                return prev.filter(id => id !== requirementId)
            }

            return [...prev, requirementId]
        })
    }, [])

    const handleRetryReviewContext = useCallback(async (): Promise<void> => {
        if (!reviewContextResult.mutate) {
            return
        }

        await reviewContextResult.mutate()
    }, [reviewContextResult])

    if (!props.challengeId) {
        return <></>
    }

    return (
        <section className={classNames(styles.card, styles.reviewContextSection)}>
            <div className={styles.cardHeader}>
                <span aria-hidden='true' className={styles.headerIcon}>📋</span>
                <h5 className={styles.cardTitle}>
                    Review Context Requirements
                    {' '}
                    (
                    {reviewContextRequirements.length}
                    )
                </h5>
            </div>
            <div className={styles.cardBody}>
                {reviewContextLoading
                    ? (
                        <div className={styles.emptyState}>
                            Loading review context requirements...
                        </div>
                    )
                    : reviewContextError
                        ? (
                            <div className={styles.reviewContextErrorState}>
                                <div className={styles.errorMessage}>
                                    {reviewContextError}
                                </div>
                                <button
                                    type='button'
                                    className={styles.retryButton}
                                    onClick={handleRetryReviewContext}
                                >
                                    Retry
                                </button>
                            </div>
                        )
                        : hasReviewContextRequirements
                            ? (
                                <div className={styles.reviewContextList}>
                                    {reviewContextRequirements.map(requirement => {
                                        const priority = normalizeReviewerText(requirement.priority) || 'medium'
                                        const priorityClass = priority === 'high'
                                            ? styles.priorityHigh
                                            : priority === 'low'
                                                ? styles.priorityLow
                                                : styles.priorityMedium
                                        const isExpanded = expandedReviewContextIds.includes(requirement.id)

                                        return (
                                            <div
                                                className={styles.reviewContextCard}
                                                key={requirement.id}
                                            >
                                                <button
                                                    type='button'
                                                    className={styles.reviewContextCardHeader}
                                                    onClick={function (): void {
                                                        handleToggleRequirement(requirement.id)
                                                    }}
                                                    aria-expanded={isExpanded}
                                                >
                                                    <span className={styles.reviewContextCardToggle}>
                                                        {isExpanded ? '▼' : '▶'}
                                                    </span>
                                                    <span className={styles.requirementId}>
                                                        [
                                                        {requirement.id}
                                                        ]
                                                    </span>
                                                    <span className={classNames(
                                                        styles.priorityBadge,
                                                        priorityClass,
                                                    )}
                                                    >
                                                        {priority.toUpperCase()}
                                                    </span>
                                                    <span className={styles.reviewContextTitle}>
                                                        {requirement.title}
                                                    </span>
                                                </button>
                                                <div
                                                    className={styles.reviewContextCardBody}
                                                    hidden={!isExpanded}
                                                >
                                                    <p className={styles.reviewContextDescription}>
                                                        {requirement.description}
                                                    </p>
                                                    {Array.isArray(requirement.constraints)
                                                        && requirement.constraints.length > 0
                                                        ? (
                                                            <ul className={styles.reviewContextConstraints}>
                                                                {[...requirement.constraints]
                                                                    .sort((a, b) => a.id.localeCompare(b.id))
                                                                    .map(constraint => (
                                                                        <li
                                                                            className={styles.reviewContextConstraintItem}
                                                                            key={constraint.id}
                                                                        >
                                                                            <span className={styles.constraintId}>
                                                                                [
                                                                                {constraint.id}
                                                                                ]
                                                                            </span>
                                                                            <span className={styles.constraintText}>
                                                                                {constraint.text}
                                                                            </span>
                                                                        </li>
                                                                    ))}
                                                            </ul>
                                                        )
                                                        : undefined}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                            : (
                                <div className={styles.emptyState}>
                                    No review context requirements defined.
                                </div>
                            )}
            </div>
        </section>
    )
}
