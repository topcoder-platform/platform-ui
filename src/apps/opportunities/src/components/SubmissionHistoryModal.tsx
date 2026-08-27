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
 * Turns a Review API status enum into a compact member-facing label.
 *
 * @param value optional status token.
 * @returns title-cased label, or an em dash.
 * @throws Does not throw.
 */
function formatStatus(value?: string): string {
    if (!value) return '—'
    return value.toLowerCase()
        .split('_')
        .filter(Boolean)
        .map(part => `${part.charAt(0)
            .toUpperCase()}${part.slice(1)}`)
        .join(' ')
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
 * Shows every submission attempt for the selected member without navigating
 * away from Opportunities to Review App.
 *
 * @param props selected submission, challenge context, visibility, and close callback.
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
            <div className={styles.tableWrap}>
                <table>
                    <thead>
                        <tr>
                            <th>Submission ID</th>
                            <th>Status</th>
                            <th>Submission Date</th>
                            {props.isMarathonMatch && <th>Provisional Score</th>}
                            {props.isMarathonMatch && <th>Final Score</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map(submission => {
                            const scores = marathonSubmissionScores(submission)
                            return (
                                <tr key={submission.id}>
                                    <td><span title={submission.id}>{submission.id}</span></td>
                                    <td>{formatStatus(submission.status)}</td>
                                    <td>{formatTimestamp(submission.submittedDate ?? submission.createdAt)}</td>
                                    {props.isMarathonMatch && (
                                        <td>{formatMarathonScore(scores.provisionalScore, 'N/A')}</td>
                                    )}
                                    {props.isMarathonMatch && (
                                        <td>
                                            {formatMarathonFinalScore(
                                                props.showFinalScores ? scores.finalScore : undefined,
                                                '-',
                                            )}
                                        </td>
                                    )}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
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
                        {handle ? `Submission History for ${handle}` : 'Submission History'}
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
        </BaseModal>
    )
}
