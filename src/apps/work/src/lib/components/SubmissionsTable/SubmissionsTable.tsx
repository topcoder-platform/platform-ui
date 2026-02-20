import {
    FC,
    MouseEvent,
} from 'react'
import classNames from 'classnames'

import { LoadingSpinner } from '~/libs/ui'

import { COMMUNITY_APP_URL, REVIEW_APP_URL } from '../../constants'
import { ReactComponent as IconDownloadArtifacts } from '../../assets/icons/IconDownloadArtifacts.svg'
import { ReactComponent as IconReviewRatingList } from '../../assets/icons/IconReviewRatingList.svg'
import { ReactComponent as IconSquareDownload } from '../../assets/icons/IconSquareDownload.svg'
import { Submission } from '../../models'
import {
    formatDateTime,
    getRatingLevel,
    getSubmissionFinalScore,
    getSubmissionInitialScore,
} from '../../utils'

import styles from './SubmissionsTable.module.scss'

export type SubmissionSortBy =
    | 'createdAt'
    | 'email'
    | 'finalScore'
    | 'initialScore'
    | 'memberHandle'
    | 'submissionId'

type SortOrder = 'asc' | 'desc'

interface ColumnConfig {
    fieldName?: SubmissionSortBy
    label: string
    sortable?: boolean
}

interface SubmissionsTableProps {
    canDownloadSubmissions: boolean
    challengeId: string
    isLoading?: boolean
    isLoadingMembers?: boolean
    onDownloadSubmission: (submissionId: string) => void
    onOpenHistory: (submission: Submission) => void
    onOpenArtifacts: (submissionId: string) => void
    onSort: (fieldName: SubmissionSortBy) => void
    sortBy: SubmissionSortBy
    sortOrder: SortOrder
    submissionDownloadLoading?: Record<string, boolean>
    submissions: Submission[]
}

const BASE_COLUMNS: ColumnConfig[] = [
    {
        fieldName: 'memberHandle',
        label: 'Username',
        sortable: true,
    },
    {
        fieldName: 'email',
        label: 'Email',
        sortable: true,
    },
    {
        fieldName: 'createdAt',
        label: 'Submission Date',
        sortable: true,
    },
    {
        fieldName: 'finalScore',
        label: 'Initial / Final Score',
        sortable: true,
    },
    {
        fieldName: 'submissionId',
        label: 'Submission ID (UUID)',
        sortable: true,
    },
    {
        label: 'Actions',
    },
]

function getCreatedAt(submission: Submission): string {
    return submission.createdAt
        || submission.created
        || submission.submissionTime
        || ''
}

function formatScore(value?: number): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 'N/A'
    }

    return value.toFixed(2)
}

function getSortIndicator(
    fieldName: SubmissionSortBy | undefined,
    currentSortBy: SubmissionSortBy,
    currentSortOrder: SortOrder,
): string {
    if (!fieldName || fieldName !== currentSortBy) {
        return ''
    }

    return currentSortOrder === 'asc'
        ? ' \u2191'
        : ' \u2193'
}

function getHandleDisplay(
    submission: Submission,
    isLoadingMembers: boolean,
): string {
    if (submission.memberHandle) {
        return submission.memberHandle
    }

    if (submission.createdBy) {
        return submission.createdBy
    }

    return isLoadingMembers
        ? 'Loading...'
        : '-'
}

function getEmailDisplay(
    submission: Submission,
    isLoadingMembers: boolean,
): string {
    if (submission.email) {
        return submission.email
    }

    return isLoadingMembers
        ? 'Loading...'
        : '-'
}

export const SubmissionsTable: FC<SubmissionsTableProps> = (
    props: SubmissionsTableProps,
) => {
    const columns = BASE_COLUMNS

    function handleSortButtonClick(event: MouseEvent<HTMLButtonElement>): void {
        const sortBy = event.currentTarget.dataset.fieldName as SubmissionSortBy | undefined
        if (!sortBy) {
            return
        }

        props.onSort(sortBy)
    }

    function handleSubmissionDownloadClick(event: MouseEvent<HTMLButtonElement>): void {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId) {
            return
        }

        props.onDownloadSubmission(submissionId)
    }

    function handleSubmissionArtifactsClick(event: MouseEvent<HTMLButtonElement>): void {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId) {
            return
        }

        props.onOpenArtifacts(submissionId)
    }

    function handleSubmissionHistoryClick(event: MouseEvent<HTMLButtonElement>): void {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId) {
            return
        }

        const submission = props.submissions.find(item => item.id === submissionId)
        if (!submission) {
            return
        }

        props.onOpenHistory(submission)
    }

    return (
        <div className={styles.container}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th key={column.label}>
                                {column.sortable && column.fieldName
                                    ? (
                                        <button
                                            type='button'
                                            className={styles.sortButton}
                                            data-field-name={column.fieldName}
                                            onClick={handleSortButtonClick}
                                        >
                                            {column.label}
                                            {getSortIndicator(column.fieldName, props.sortBy, props.sortOrder)}
                                        </button>
                                    )
                                    : <span>{column.label}</span>}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {props.isLoading
                        ? (
                            <tr>
                                <td className={styles.loadingRow} colSpan={columns.length}>
                                    <LoadingSpinner inline />
                                </td>
                            </tr>
                        )
                        : undefined}

                    {!props.isLoading && props.submissions.length === 0
                        ? (
                            <tr>
                                <td className={styles.emptyRow} colSpan={columns.length}>
                                    No submissions received
                                </td>
                            </tr>
                        )
                        : undefined}

                    {!props.isLoading && props.submissions.map(submission => {
                        const rating = submission.rating || 0
                        const ratingLevel = getRatingLevel(rating)
                        const handleDisplay = getHandleDisplay(submission, !!props.isLoadingMembers)
                        const emailDisplay = getEmailDisplay(submission, !!props.isLoadingMembers)
                        const submissionDate = formatDateTime(getCreatedAt(submission))
                        const initialScore = formatScore(getSubmissionInitialScore(submission))
                        const finalScore = formatScore(getSubmissionFinalScore(submission))
                        const memberProfileUrl = submission.memberHandle
                            ? `${COMMUNITY_APP_URL}/members/${encodeURIComponent(submission.memberHandle)}`
                            : ''
                        const reviewLink = `${REVIEW_APP_URL}/${props.challengeId}/submissions/${submission.id}`

                        return (
                            <tr key={submission.id}>
                                <td>
                                    {submission.memberHandle
                                        ? (
                                            <a
                                                className={classNames(styles.handleLink, styles[ratingLevel])}
                                                href={memberProfileUrl}
                                                rel='noreferrer'
                                                target='_blank'
                                            >
                                                {handleDisplay}
                                            </a>
                                        )
                                        : (
                                            <span className={classNames(styles.handleLink, styles[ratingLevel])}>
                                                {handleDisplay}
                                            </span>
                                        )}
                                </td>

                                <td>
                                    <span title={emailDisplay}>{emailDisplay}</span>
                                </td>

                                <td>
                                    <span title={submissionDate}>{submissionDate}</span>
                                </td>

                                <td>
                                    <a
                                        className={styles.scoreLink}
                                        href={reviewLink}
                                        rel='noreferrer'
                                        target='_blank'
                                    >
                                        {initialScore}
                                        {' / '}
                                        {finalScore}
                                    </a>
                                </td>

                                <td>
                                    <span title={submission.id}>{submission.id}</span>
                                </td>

                                <td>
                                    <div className={styles.actions}>
                                        <button
                                            aria-label='View submission history'
                                            className={styles.historyButton}
                                            data-submission-id={submission.id}
                                            onClick={handleSubmissionHistoryClick}
                                            type='button'
                                        >
                                            View history
                                        </button>

                                        <button
                                            data-submission-id={submission.id}
                                            aria-label='Download submission'
                                            className={styles.iconButton}
                                            disabled={
                                                !props.canDownloadSubmissions
                                                || props.submissionDownloadLoading?.[submission.id] === true
                                            }
                                            onClick={handleSubmissionDownloadClick}
                                            type='button'
                                        >
                                            <IconSquareDownload />
                                        </button>

                                        <button
                                            data-submission-id={submission.id}
                                            aria-label='Download submission artifacts'
                                            className={styles.iconButton}
                                            disabled={!props.canDownloadSubmissions}
                                            onClick={handleSubmissionArtifactsClick}
                                            type='button'
                                        >
                                            <IconDownloadArtifacts />
                                        </button>

                                        <a
                                            aria-label='View ratings'
                                            className={styles.iconButton}
                                            href={reviewLink}
                                            rel='noreferrer'
                                            target='_blank'
                                        >
                                            <IconReviewRatingList />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default SubmissionsTable
