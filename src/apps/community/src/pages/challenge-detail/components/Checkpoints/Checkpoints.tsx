import { FC, MouseEvent, useCallback } from 'react'
import DOMPurify from 'dompurify'

import { BackendChallengeCheckpoints } from '../../../../lib'

import styles from './Checkpoints.module.scss'

interface CheckpointsProps {
    checkpoints: BackendChallengeCheckpoints
    onToggleFeedback: (submissionId: string, expanded: boolean) => void
}

/**
 * Renders checkpoint general feedback and per-submission expandable feedback.
 *
 * @param props Checkpoint data and expand/collapse handler.
 * @returns Checkpoint feedback content.
 */
const Checkpoints: FC<CheckpointsProps> = (props: CheckpointsProps) => {
    const handleToggleClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const submissionId = event.currentTarget.dataset.submissionId ?? ''
        const expanded = event.currentTarget.dataset.expanded === 'true'

        props.onToggleFeedback(submissionId, !expanded)
    }, [props])

    return (
        <section className={styles.container}>
            <h2 className={styles.title}>Checkpoint Winners & General Feedback</h2>
            <p className={styles.subtitle}>Check forums for general feedback</p>

            <div
                className={styles.generalFeedback}
                dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(props.checkpoints.generalFeedback ?? ''),
                }}
            />

            <div className={styles.items}>
                {(props.checkpoints.checkpointResults ?? []).map(result => {
                    const expanded = result.expanded === true

                    return (
                        <article className={styles.item} key={result.submissionId}>
                            <button
                                className={styles.toggle}
                                data-expanded={expanded}
                                data-submission-id={result.submissionId}
                                onClick={handleToggleClick}
                                type='button'
                            >
                                <span className={styles.toggleTitle}>
                                    Feedback #
                                    {result.submissionId}
                                </span>
                                <span className={styles.toggleIcon}>{expanded ? 'Hide' : 'Show'}</span>
                            </button>
                            {expanded && (
                                <div
                                    className={styles.feedback}
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(result.feedback ?? '<span>Empty Feedback</span>'),
                                    }}
                                />
                            )}
                        </article>
                    )
                })}
            </div>
        </section>
    )
}

export default Checkpoints
