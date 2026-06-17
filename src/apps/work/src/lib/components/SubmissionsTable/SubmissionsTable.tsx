import {
    FC,
    MouseEvent,
    ReactElement,
} from 'react'
import classNames from 'classnames'

import {
    IconOutline,
    IconSolid,
    LoadingSpinner,
} from '~/libs/ui'

import { COMMUNITY_APP_URL, REVIEW_APP_URL } from '../../constants'
import { ReactComponent as IconDownloadArtifacts } from '../../assets/icons/IconDownloadArtifacts.svg'
import { ReactComponent as IconRunnerLogs } from '../../assets/icons/IconRunnerLogs.svg'
import { ReactComponent as IconSquareDownload } from '../../assets/icons/IconSquareDownload.svg'
import { Submission } from '../../models'
import {
    formatDateTime,
    getRatingLevel,
    getSubmissionExampleScore,
    getSubmissionFinalScore,
    getSubmissionInitialScore,
    getSubmissionProvisionalScore,
    getSubmissionSystemScore,
    getSubmissionTestProgress,
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
    canViewRunnerLogs?: boolean
    challengeId: string
    isLoading?: boolean
    isLoadingMembers?: boolean
    onDownloadSubmission: (submissionId: string) => void
    onOpenArtifacts: (submissionId: string) => void
    onOpenRunnerLogs?: (submissionId: string) => void
    onSort: (fieldName: SubmissionSortBy) => void
    sortBy: SubmissionSortBy
    sortOrder: SortOrder
    showMarathonMatchTestProgress?: boolean
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
]

const MARATHON_MATCH_TEST_COLUMNS: ColumnConfig[] = [
    {
        label: 'Current tests process',
    },
    {
        label: 'Test status',
    },
    {
        label: 'Test progress',
    },
]

const TRAILING_COLUMNS: ColumnConfig[] = [
    {
        fieldName: 'submissionId',
        label: 'Submission ID (UUID)',
        sortable: true,
    },
    {
        label: 'Actions',
    },
]

/**
 * Builds the table columns for standard and marathon submission rows.
 * @param showMarathonMatchTestProgress Whether marathon test-progress metadata should be displayed.
 * @returns Column config used by the table header and empty/loading colspans.
 * Used by `SubmissionsTable` to insert marathon-only progress columns before actions.
 */
function getColumns(showMarathonMatchTestProgress: boolean): ColumnConfig[] {
    return showMarathonMatchTestProgress
        ? [
            ...BASE_COLUMNS,
            ...MARATHON_MATCH_TEST_COLUMNS,
            ...TRAILING_COLUMNS,
        ]
        : [
            ...BASE_COLUMNS,
            ...TRAILING_COLUMNS,
        ]
}

function getCreatedAt(submission: Submission): string {
    return submission.createdAt
        || submission.created
        || submission.submissionTime
        || ''
}

function formatScore(value?: number, emptyValue: string = 'N/A'): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return emptyValue
    }

    return value.toFixed(2)
}

/**
 * Converts normalized marathon test process metadata into a table display label.
 * @param process Current marathon test process from review summation metadata.
 * @returns Human-readable process label, or an empty string when absent.
 * Used by `SubmissionsTable` for the Current tests process column.
 */
function formatTestProcess(process?: string): string {
    if (process === 'example') {
        return 'Example'
    }

    if (process === 'provisional') {
        return 'Provisional'
    }

    if (process === 'system') {
        return 'System'
    }

    return ''
}

/**
 * Selects the marathon score shown in the left side of the score column.
 * @param submission Submission row with review summation data.
 * @param process Current marathon test process from progress metadata.
 * @returns Example score when Example is current; otherwise the provisional score.
 * Used by `SubmissionsTable` for marathon score display.
 */
function getMarathonInitialScore(
    submission: Submission,
    process?: string,
): number | undefined {
    if (process === 'example') {
        const exampleScore = getSubmissionExampleScore(submission)

        if (exampleScore !== undefined) {
            return exampleScore
        }
    }

    return getSubmissionProvisionalScore(submission)
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
 * Renders the marathon test status icon for a submission row.
 * @param status Normalized test status from review summation metadata.
 * @returns Status icon element or `undefined` when no status is available.
 * Used by `SubmissionsTable` to keep empty status cells blank.
 */
function renderTestStatusIcon(status: string | undefined): ReactElement | undefined {
    if (status === 'IN PROGRESS') {
        return (
            <span
                aria-label='Test status: IN PROGRESS'
                className={classNames(styles.testStatusIcon, styles.testStatusInProgress)}
                role='img'
                title='IN PROGRESS'
            >
                <IconOutline.ClockIcon aria-hidden='true' />
            </span>
        )
    }

    if (status === 'SUCCESS') {
        return (
            <span
                aria-label='Test status: SUCCESS'
                className={classNames(styles.testStatusIcon, styles.testStatusSuccess)}
                role='img'
                title='SUCCESS'
            >
                <IconSolid.CheckCircleIcon aria-hidden='true' />
            </span>
        )
    }

    if (status === 'FAILED') {
        return (
            <span
                aria-label='Test status: FAILED'
                className={classNames(styles.testStatusIcon, styles.testStatusFailed)}
                role='img'
                title='FAILED'
            >
                <IconOutline.XCircleIcon aria-hidden='true' />
            </span>
        )
    }

    return undefined
}

export const SubmissionsTable: FC<SubmissionsTableProps> = (
    props: SubmissionsTableProps,
) => {
    const columns = getColumns(!!props.showMarathonMatchTestProgress)

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

    function handleRunnerLogsClick(event: MouseEvent<HTMLButtonElement>): void {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId || !props.onOpenRunnerLogs) {
            return
        }

        props.onOpenRunnerLogs(submissionId)
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
                        const testProgress = props.showMarathonMatchTestProgress
                            ? getSubmissionTestProgress(submission)
                            : undefined
                        const initialScoreValue = props.showMarathonMatchTestProgress
                            ? getMarathonInitialScore(submission, testProgress?.process)
                            : getSubmissionInitialScore(submission)
                        const finalScoreValue = props.showMarathonMatchTestProgress
                            ? getSubmissionSystemScore(submission)
                            : getSubmissionFinalScore(submission)
                        const emptyScoreValue = props.showMarathonMatchTestProgress
                            ? '-'
                            : 'N/A'
                        const initialScore = formatScore(initialScoreValue, emptyScoreValue)
                        const finalScore = formatScore(finalScoreValue, emptyScoreValue)
                        const reviewTab = submission.type === 'CHECKPOINT_SUBMISSION'
                            ? 'checkpoint-submission'
                            : 'submission'
                        const memberProfileUrl = submission.memberHandle
                            ? `${COMMUNITY_APP_URL}/members/${encodeURIComponent(submission.memberHandle)}`
                            : ''
                        const reviewLink = `${REVIEW_APP_URL}/active-challenges/${props.challengeId}`
                            + `/challenge-details?tab=${reviewTab}`

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

                                {props.showMarathonMatchTestProgress
                                    ? (
                                        <>
                                            <td>
                                                <span>{formatTestProcess(testProgress?.process)}</span>
                                            </td>

                                            <td className={styles.testStatusCell}>
                                                {renderTestStatusIcon(testProgress?.status)}
                                            </td>

                                            <td>
                                                <span>{testProgress?.progressPercent || ''}</span>
                                            </td>
                                        </>
                                    )
                                    : undefined}

                                <td>
                                    <span title={submission.id}>{submission.id}</span>
                                </td>

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

                                        {props.canViewRunnerLogs
                                            ? (
                                                <button
                                                    data-submission-id={submission.id}
                                                    aria-label='View runner logs'
                                                    className={styles.iconButton}
                                                    disabled={!props.onOpenRunnerLogs}
                                                    onClick={handleRunnerLogsClick}
                                                    type='button'
                                                >
                                                    <IconRunnerLogs />
                                                </button>
                                            )
                                            : undefined}

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
