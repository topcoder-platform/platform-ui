import { FC, Fragment, MouseEvent, useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'
import moment from 'moment'

import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { copyTextToClipboard } from '~/libs/shared'
import { BaseModal, IconOutline, Tooltip } from '~/libs/ui'

import { SubmissionInfo } from '../../models'
import { TABLE_DATE_FORMAT } from '../../../config/index.config'
import { AiReviewsTable } from '../AiReviewsTable'

import styles from './SubmissionHistoryModal.module.scss'

interface RestrictionResult {
    restricted: boolean
    message?: string
}

export interface SubmissionHistoryModalProps {
    open: boolean
    onClose: () => void
    submissions: SubmissionInfo[]
    downloadSubmission: (submissionId: string) => void
    isDownloading: IsRemovingType
    getRestriction?: (submission: SubmissionInfo) => RestrictionResult
    /**
     * Optional lookup to resolve additional submission metadata (e.g., date, virus scan)
     * when the provided submission entry is missing those fields.
     */
    getSubmissionMeta?: (submissionId: string) => SubmissionInfo | undefined
    aiReviewers?: { aiWorkflowId: string }[]
}

function getTimestamp(submission: SubmissionInfo): number {
    const value = submission.submittedDate
    if (value instanceof Date) {
        return value.getTime()
    }

    if (typeof value === 'string') {
        const parsed = new Date(value)
        const time = parsed.getTime()
        if (!Number.isNaN(time)) {
            return time
        }
    }

    const fallback = submission.submittedDateString
    if (fallback) {
        const parsed = new Date(fallback)
        const time = parsed.getTime()
        if (!Number.isNaN(time)) {
            return time
        }
    }

    return 0
}

function formatSubmissionDate(
    submission: SubmissionInfo,
    fallback?: SubmissionInfo,
): string {
    const primary = submission.submittedDateString?.trim()
    if (primary) {
        return primary
    }

    const secondary = fallback?.submittedDateString?.trim()
    if (secondary) {
        return secondary
    }

    const primaryTimestamp = getTimestamp(submission)
    if (primaryTimestamp) {
        return moment(primaryTimestamp)
            .local()
            .format(TABLE_DATE_FORMAT)
    }

    if (fallback) {
        const fallbackTimestamp = getTimestamp(fallback)
        if (fallbackTimestamp) {
            return moment(fallbackTimestamp)
                .local()
                .format(TABLE_DATE_FORMAT)
        }
    }

    return '—'
}

export const SubmissionHistoryModal: FC<SubmissionHistoryModalProps> = (props: SubmissionHistoryModalProps) => {
    const sortedSubmissions = useMemo<SubmissionInfo[]>(
        () => props.submissions
            .slice()
            .sort((a, b) => getTimestamp(b) - getTimestamp(a)),
        [props.submissions],
    )

    const aiReviewers = useMemo(() => props.aiReviewers ?? [], [props.aiReviewers])
    const aiReviewersCount = useMemo(() => (aiReviewers.length ?? 0) + 1, [aiReviewers])

    const [toggledRows, setToggledRows] = useState(new Set<string>())

    const resolvedMemberInfo = useMemo(() => {
        for (const submission of sortedSubmissions) {
            if (submission.userInfo?.memberHandle) {
                return submission.userInfo
            }

            const fallback = submission.id
                ? props.getSubmissionMeta?.(submission.id)
                : undefined

            if (fallback?.userInfo?.memberHandle) {
                return fallback.userInfo
            }
        }

        const first = sortedSubmissions[0]
        if (!first) {
            return undefined
        }

        return first.userInfo ?? (first.id ? props.getSubmissionMeta?.(first.id)?.userInfo : undefined)
    }, [props.getSubmissionMeta, sortedSubmissions])

    const modalTitle = useMemo(() => {
        const handle = resolvedMemberInfo?.memberHandle
        if (!handle) {
            return 'Submission History'
        }

        return (
            <>
                Submission History for
                {' '}
                <span
                    className={styles.titleHandle}
                    style={resolvedMemberInfo?.handleColor ? { color: resolvedMemberInfo.handleColor } : undefined}
                >
                    {handle}
                </span>
            </>
        )
    }, [resolvedMemberInfo])

    const handleCopy = useCallback(async (submissionId: string): Promise<void> => {
        if (!submissionId) return
        await copyTextToClipboard(submissionId)
        toast.success('Submission ID copied to clipboard', {
            toastId: `submission-history-copy-${submissionId}`,
        })
    }, [])

    const handleDownloadButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId) {
            return
        }

        if (event.currentTarget.dataset.restricted === 'true') {
            return
        }

        props.downloadSubmission(submissionId)
    }, [props.downloadSubmission])

    const handleCopyButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId) {
            return
        }

        handleCopy(submissionId)
            .catch(() => undefined)
    }, [handleCopy])

    const toggleRow = useCallback((rowId: string) => {
        setToggledRows(previous => {
            const next = new Set(previous)
            if (next.has(rowId)) {
                next.delete(rowId)
            } else {
                next.add(rowId)
            }

            return next
        })
    }, [])

    const renderHistoryRow = useCallback((submission: SubmissionInfo): JSX.Element => {
        const fallbackMeta = props.getSubmissionMeta?.(submission.id) ?? undefined
        const resolvedVirusScan = submission.virusScan ?? fallbackMeta?.virusScan
        const isFileSubmission = submission.isFileSubmission ?? fallbackMeta?.isFileSubmission
        const normalizedVirusScan = isFileSubmission === false ? undefined : resolvedVirusScan
        const failedScan = normalizedVirusScan === false
        const restriction = props.getRestriction
            ? props.getRestriction(submission)
            : { restricted: false }
        const isRestricted = restriction.restricted || failedScan
        const restrictionMessage = failedScan
            ? 'Submission failed virus scan'
            : restriction.message
        const isBusy = Boolean(props.isDownloading[submission.id])
        const submittedDisplay = formatSubmissionDate(submission, fallbackMeta)

        const downloadButton = (
            <button
                type='button'
                onClick={handleDownloadButtonClick}
                className={styles.submissionLink}
                data-submission-id={submission.id}
                data-restricted={String(isRestricted)}
                disabled={isRestricted || isBusy}
            >
                {submission.id}
            </button>
        )

        const renderedDownloadButton = isRestricted && restrictionMessage ? (
            <Tooltip content={restrictionMessage} triggerOn='click-hover'>
                <span className={styles.tooltipTrigger}>
                    {downloadButton}
                </span>
            </Tooltip>
        ) : (
            downloadButton
        )

        const copyButton = (
            <button
                type='button'
                className={styles.copyButton}
                aria-label='Copy submission ID'
                title='Copy submission ID'
                data-submission-id={submission.id}
                onClick={handleCopyButtonClick}
                disabled={!submission.id}
            >
                <IconOutline.DocumentDuplicateIcon />
            </button>
        )

        function toggle(): void {
            toggleRow(submission.id)
        }

        return (
            <Fragment key={submission.id}>
                <tr key={submission.id}>
                    <td className={styles.cellSubmission}>
                        <span className={styles.submissionCell}>
                            {renderedDownloadButton}
                            {copyButton}
                        </span>
                    </td>
                    <td className={styles.cellDate}>
                        {submittedDisplay}
                    </td>
                    <td className={styles.aiReviewers}>
                        {isFileSubmission === false ? (
                            <span>N/A</span>
                        ) : (
                            <span className={styles.reviewersDropown} onClick={toggle}>
                                {aiReviewersCount}
                                {' '}
                                AI Reviewer
                                {aiReviewersCount === 1 ? '' : 's'}
                                <IconOutline.ChevronDownIcon className='icon-xl' />
                            </span>
                        )}
                    </td>
                </tr>
                {toggledRows.has(submission.id) && (
                    <tr>
                        <td className={styles.aiReviewersTableRow} colSpan={4}>
                            <div className={styles.aiReviewersTable}>
                                <AiReviewsTable
                                    reviewers={aiReviewers}
                                    submission={submission}
                                />
                            </div>
                        </td>
                    </tr>
                )}
            </Fragment>
        )
    }, [
        handleCopy,
        props.downloadSubmission,
        props.getRestriction,
        props.getSubmissionMeta,
        props.isDownloading,
        toggledRows,
    ])

    return (
        <BaseModal
            open={props.open}
            onClose={props.onClose}
            title={modalTitle}
            size='lg'
            classNames={{ modal: styles.modal }}
        >
            {sortedSubmissions.length === 0 ? (
                <p className={styles.emptyState}>No previous submissions.</p>
            ) : (
                <div className={classNames('enhanced-table', styles.tableWrapper)}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.cellSubmission}>Submission ID</th>
                                <th className={styles.cellDate}>Submitted</th>
                                <th className={styles.cellVirusScan}>Reviewer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedSubmissions.map(renderHistoryRow)}
                        </tbody>
                    </table>
                </div>
            )}
        </BaseModal>
    )
}

export default SubmissionHistoryModal
