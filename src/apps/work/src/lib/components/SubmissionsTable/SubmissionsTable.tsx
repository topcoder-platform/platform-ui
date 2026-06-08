import {
    FC,
    MouseEvent,
} from 'react'
import classNames from 'classnames'

import { LoadingSpinner } from '~/libs/ui'

import { COMMUNITY_APP_URL, REVIEW_APP_URL } from '../../constants'
import { ReactComponent as IconDownloadArtifacts } from '../../assets/icons/IconDownloadArtifacts.svg'
import { ReactComponent as IconSquareDownload } from '../../assets/icons/IconSquareDownload.svg'
import {
    ReviewSummation,
    Submission,
} from '../../models'
import {
    formatDateTime,
    getRatingLevel,
    getReviewSummationMarathonTestType,
    getSubmissionFinalScore,
    getSubmissionInitialScore,
    getSubmissionMarathonTestSummations,
    type MarathonMatchTestType,
    type MarathonMatchTestTypeFilter,
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
    marathonMatchTestType?: MarathonMatchTestTypeFilter
    onDownloadSubmission: (submissionId: string) => void
    onOpenArtifacts: (submissionId: string) => void
    onSort: (fieldName: SubmissionSortBy) => void
    showMarathonMatchTestProcess?: boolean
    sortBy: SubmissionSortBy
    sortOrder: SortOrder
    submissionDownloadLoading?: Record<string, boolean>
    submissions: Submission[]
}

const SUBMISSION_COLUMNS: ColumnConfig[] = [
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

const MARATHON_MATCH_TEST_COLUMNS: ColumnConfig[] = [
    {
        label: 'Test Status',
    },
    {
        label: 'Test Progress',
    },
]

const ACTION_COLUMN: ColumnConfig = {
    label: 'Actions',
}

const TEST_TYPE_LABELS: Record<MarathonMatchTestType, string> = {
    provisional: 'Provisional',
    system: 'System',
}

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

/**
 * Converts an optional value to trimmed display text.
 *
 * @param value raw value from submission or review metadata.
 * @returns trimmed string, or an empty string for nullish values.
 */
function normalizeText(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    return String(value)
        .trim()
}

/**
 * Converts a numeric metadata value to a finite number.
 *
 * @param value raw metadata value that may already be a number or a numeric string.
 * @returns finite number when parseable, otherwise `undefined`.
 */
function toOptionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value)
        if (Number.isFinite(parsedValue)) {
            return parsedValue
        }
    }

    return undefined
}

/**
 * Formats a runner status token for table display.
 *
 * @param status raw status from review summation metadata.
 * @returns title-cased display text, or `N/A` when absent.
 */
function formatStatusText(status: string | undefined): string {
    const normalizedStatus = normalizeText(status)
    if (!normalizedStatus) {
        return 'N/A'
    }

    return normalizedStatus
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, value => value.toUpperCase())
}

/**
 * Formats a Marathon Match progress value as a percentage.
 *
 * @param value progress from review summation metadata, using either 0..1 or percent units.
 * @returns rounded percentage text, or `N/A` when absent.
 */
function formatProgressValue(value: number | undefined): string {
    if (value === undefined) {
        return 'N/A'
    }

    const percentage = value <= 1
        ? value * 100
        : value

    return `${Math.round(percentage)}%`
}

/**
 * Builds the submissions table columns for standard or Marathon Match views.
 *
 * @param showMarathonMatchTestProcess whether test status/progress columns are enabled.
 * @returns column configuration used to render headers and loading colspans.
 */
function getMarathonMatchColumns(showMarathonMatchTestProcess: boolean): ColumnConfig[] {
    const baseColumns = SUBMISSION_COLUMNS.slice(0, -1)

    return showMarathonMatchTestProcess
        ? [
            ...baseColumns,
            ...MARATHON_MATCH_TEST_COLUMNS,
            ACTION_COLUMN,
        ]
        : SUBMISSION_COLUMNS
}

/**
 * Resolves a review summation's Marathon Match test status.
 *
 * @param reviewSummation review summation for a provisional or system test process.
 * @returns formatted status text derived from metadata, pass/fail flags, or score presence.
 */
function getTestProcessStatus(reviewSummation: ReviewSummation): string {
    const metadata = reviewSummation.metadata
    const detailStatus = metadata?.testProgressDetails?.status
    const status = metadata?.testStatus || detailStatus

    if (status) {
        return formatStatusText(status)
    }

    if (reviewSummation.isPassing === true) {
        return 'Passed'
    }

    if (reviewSummation.isPassing === false) {
        return 'Failed'
    }

    if (typeof reviewSummation.aggregateScore === 'number') {
        return 'Completed'
    }

    return 'N/A'
}

/**
 * Resolves a review summation's Marathon Match test progress.
 *
 * @param reviewSummation review summation for a provisional or system test process.
 * @returns formatted progress percentage derived from metadata.
 */
function getTestProcessProgress(reviewSummation: ReviewSummation): string {
    const metadata = reviewSummation.metadata
    const progress = toOptionalNumber(metadata?.testProgress)
        ?? toOptionalNumber(metadata?.testProgressDetails?.progress)

    return formatProgressValue(progress)
}

/**
 * Builds a stable React key for a rendered Marathon Match test process line.
 *
 * @param reviewSummation review summation being rendered.
 * @returns summation id when present, otherwise a phase/submission fallback key.
 */
function getTestProcessKey(reviewSummation: ReviewSummation): string {
    return reviewSummation.id
        || `${getReviewSummationMarathonTestType(reviewSummation) || 'test'}`
            + `-${reviewSummation.submissionId || 'summation'}`
}

export const SubmissionsTable: FC<SubmissionsTableProps> = (
    props: SubmissionsTableProps,
) => {
    const columns = getMarathonMatchColumns(!!props.showMarathonMatchTestProcess)
    const marathonMatchTestType = props.marathonMatchTestType || 'all'

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
                        const reviewTab = submission.type === 'CHECKPOINT_SUBMISSION'
                            ? 'checkpoint-submission'
                            : 'submission'
                        const memberProfileUrl = submission.memberHandle
                            ? `${COMMUNITY_APP_URL}/members/${encodeURIComponent(submission.memberHandle)}`
                            : ''
                        const reviewLink = `${REVIEW_APP_URL}/active-challenges/${props.challengeId}`
                            + `/challenge-details?tab=${reviewTab}`
                        const marathonMatchTestSummations = getSubmissionMarathonTestSummations(
                            submission,
                            marathonMatchTestType,
                        )

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

                                {props.showMarathonMatchTestProcess
                                    ? (
                                        <td>
                                            {marathonMatchTestSummations.length > 0
                                                ? (
                                                    <div className={styles.testProcessList}>
                                                        {marathonMatchTestSummations.map(reviewSummation => {
                                                            const testType = getReviewSummationMarathonTestType(
                                                                reviewSummation,
                                                            )
                                                            const label = testType
                                                                ? TEST_TYPE_LABELS[testType]
                                                                : 'Test'

                                                            return (
                                                                <div
                                                                    className={styles.testProcessItem}
                                                                    key={getTestProcessKey(reviewSummation)}
                                                                >
                                                                    <span className={styles.testProcessLabel}>
                                                                        {label}
                                                                        :
                                                                    </span>
                                                                    {' '}
                                                                    {getTestProcessStatus(reviewSummation)}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                                : <span>N/A</span>}
                                        </td>
                                    )
                                    : undefined}

                                {props.showMarathonMatchTestProcess
                                    ? (
                                        <td>
                                            {marathonMatchTestSummations.length > 0
                                                ? (
                                                    <div className={styles.testProcessList}>
                                                        {marathonMatchTestSummations.map(reviewSummation => {
                                                            const testType = getReviewSummationMarathonTestType(
                                                                reviewSummation,
                                                            )
                                                            const label = testType
                                                                ? TEST_TYPE_LABELS[testType]
                                                                : 'Test'

                                                            return (
                                                                <div
                                                                    className={styles.testProcessItem}
                                                                    key={getTestProcessKey(reviewSummation)}
                                                                >
                                                                    <span className={styles.testProcessLabel}>
                                                                        {label}
                                                                        :
                                                                    </span>
                                                                    {' '}
                                                                    {getTestProcessProgress(reviewSummation)}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                                : <span>N/A</span>}
                                        </td>
                                    )
                                    : undefined}

                                <td>
                                    <div className={styles.actions}>
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
