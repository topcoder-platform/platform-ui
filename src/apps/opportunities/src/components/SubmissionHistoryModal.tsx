/* eslint-disable react/jsx-no-bind */
import { FC, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { BaseModal, IconOutline, LoadingSpinner } from '~/libs/ui'

import {
    ChallengeReviewSummation,
    ChallengeSubmission,
} from '../models'
import { getChallengeSubmissionHistory } from '../services'
import {
    attachMarathonReviewSummations,
    formatMarathonFinalScore,
    formatMarathonScore,
    marathonSubmissionScores,
} from '../utils/marathon-match.utils'

import styles from './SubmissionHistoryModal.module.scss'

interface SubmissionHistoryModalProps {
    challengeId: string
    isMarathonMatch?: boolean
    onClose: () => void
    onOpenArtifacts?: (submissionId: string) => void
    open: boolean
    reviewSummations?: ChallengeReviewSummation[]
    showFinalScores?: boolean
    submission?: ChallengeSubmission
}

/**
 * Formats a Review API timestamp for the submission history table.
 *
 * @param value optional ISO timestamp.
 * @returns localized timestamp, or an em dash for invalid input.
 * @throws Does not throw.
 */
function formatTimestamp(value?: string): string {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('en-US', {
        day: 'numeric',
        hour: '2-digit',
        hour12: false,
        minute: '2-digit',
        month: 'long',
        year: 'numeric',
    })
        .format(date)
}

/**
 * Resolves the selected submission owner accepted by the Review API filter.
 *
 * @param submission selected latest submission.
 * @returns member ID, or undefined when the API omitted ownership.
 * @throws Does not throw.
 */
function submissionMemberId(submission?: ChallengeSubmission): string | undefined {
    return submission?.memberId ?? submission?.registrant?.userId
}

/**
 * Resolves the selected member handle for the modal heading.
 *
 * @param submission selected latest submission.
 * @returns best available handle, or undefined.
 * @throws Does not throw.
 */
function submissionHandle(submission?: ChallengeSubmission): string | undefined {
    return submission?.submitterHandle
        ?? submission?.memberHandle
        ?? submission?.registrant?.memberHandle
        ?? submission?.registrant?.handle
        ?? submission?.createdBy
}

/**
 * Resolves the proportional column widths for the submission history table.
 *
 * The table is laid out with `table-layout: fixed`, which otherwise splits the
 * modal evenly between the columns. Marathon Match scores are rendered at full
 * precision, so an even split leaves the score columns too narrow and their
 * values run into the next column. Weighting the columns gives the scores the
 * room they need while the Submission ID keeps its ellipsis and Artifacts stays
 * compact.
 *
 * @param isMarathonMatch whether the Provisional Score column is rendered.
 * @param showArtifacts whether the Artifacts column is rendered.
 * @returns one CSS percentage per rendered column, in column order, summing to 100%.
 * @throws Does not throw.
 */
function columnWidths(isMarathonMatch: boolean, showArtifacts: boolean): string[] {
    const weights = [
        24, // Submission ID
        18, // Submission Date
        ...(isMarathonMatch ? [22] : []), // Provisional Score
        22, // Final Score
        ...(showArtifacts ? [14] : []), // Artifacts
    ]
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    return weights.map(weight => `${((weight / total) * 100).toFixed(2)}%`)
}

/**
 * Shows the selected member's server-authorized submission history without
 * navigating away from Opportunities to Review App. Review API may limit an
 * ordinary viewer to the latest attempt.
 *
 * @param props selected submission, challenge context, visibility, and authorized artifact/close callbacks.
 * @returns modal with history rows or a loading, error, or empty state.
 * @throws Does not throw; request failures render a retryable modal state.
 */
export const SubmissionHistoryModal: FC<SubmissionHistoryModalProps> = props => {
    const memberId = submissionMemberId(props.submission)
    const response: SWRResponse<ChallengeSubmission[], Error> = useSWR(
        props.open && memberId
            ? [
                'opportunities:submission-history',
                props.challengeId,
                memberId,
                props.submission?.type ?? '',
            ]
            : undefined,
        () => getChallengeSubmissionHistory(
            props.challengeId,
            memberId as string,
            props.submission?.type,
        ),
        { revalidateOnFocus: false },
    )
    const submissions = useMemo(
        () => (props.isMarathonMatch
            ? attachMarathonReviewSummations(
                response.data ?? [],
                props.reviewSummations ?? [],
            )
            : response.data ?? []),
        [props.isMarathonMatch, props.reviewSummations, response.data],
    )
    const handle = submissionHandle(props.submission)

    let content
    if (!memberId) {
        content = <p className={styles.message}>Submission history is unavailable for this entry.</p>
    } else if (response.isValidating && !response.data) {
        content = <div className={styles.loading}><LoadingSpinner /></div>
    } else if (response.error) {
        content = (
            <div className={styles.message} role='alert'>
                <p>Unable to load submission history.</p>
                <button onClick={() => response.mutate()} type='button'>Try again</button>
            </div>
        )
    } else if (!submissions.length) {
        content = <p className={styles.message}>No submission history is available.</p>
    } else {
        content = (
            <>
                <p className={styles.latestSubmission}>
                    <span>Latest Submission:</span>
                    {' '}
                    <strong title={submissions[0].id}>{submissions[0].id}</strong>
                </p>
                <div className={styles.tableWrap}>
                    <table>
                        <colgroup>
                            {columnWidths(!!props.isMarathonMatch, !!props.onOpenArtifacts)
                                .map((width, index) => (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <col key={`column-${index}`} style={{ width }} />
                                ))}
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Submission ID</th>
                                <th>Submission Date</th>
                                {props.isMarathonMatch && <th>Provisional Score</th>}
                                <th>Final Score</th>
                                {props.onOpenArtifacts && <th>Artifacts</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map(submission => {
                                const scores = marathonSubmissionScores(submission)
                                return (
                                    <tr key={submission.id}>
                                        <td data-mobile-label='Submission' data-mobile-order='1'>
                                            <span title={submission.id}>{submission.id}</span>
                                        </td>
                                        <td data-mobile-label='Time' data-mobile-order='4'>
                                            {formatTimestamp(submission.submittedDate ?? submission.createdAt)}
                                        </td>
                                        {props.isMarathonMatch && (
                                            <td data-mobile-label='Provisional Score' data-mobile-order='3'>
                                                {formatMarathonScore(scores.provisionalScore, 'N/A')}
                                            </td>
                                        )}
                                        <td data-mobile-label='Final Score' data-mobile-order='2'>
                                            {props.isMarathonMatch
                                                ? formatMarathonFinalScore(
                                                    props.showFinalScores ? scores.finalScore : undefined,
                                                    '-',
                                                )
                                                : formatMarathonScore(scores.finalScore, 'N/A')}
                                        </td>
                                        {props.onOpenArtifacts && (
                                            <td data-mobile-label='Artifacts' data-mobile-order='5'>
                                                <button
                                                    aria-label={`Download submission artifacts ${submission.id}`}
                                                    onClick={() => props.onOpenArtifacts?.(submission.id)}
                                                    type='button'
                                                >
                                                    Artifacts
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </>
        )
    }

    return (
        <BaseModal
            ariaLabelledby='submission-history-title'
            bodyClassName={styles.modalBody}
            center
            classNames={{ modal: styles.modal }}
            onClose={props.onClose}
            open={props.open}
            showCloseIcon={false}
            size='lg'
            spacer={false}
            title={(
                <div className={styles.modalHeading}>
                    <h2 id='submission-history-title'>
                        Submission History
                        {handle && <span className={styles.handleSuffix}>{` for ${handle}`}</span>}
                    </h2>
                    <button
                        aria-label='Close submission history'
                        onClick={props.onClose}
                        type='button'
                    >
                        <IconOutline.XIcon aria-hidden='true' />
                    </button>
                </div>
            )}
        >
            {content}
            <div className={styles.mobileFooter}>
                <button onClick={props.onClose} type='button'>Close</button>
            </div>
        </BaseModal>
    )
}
