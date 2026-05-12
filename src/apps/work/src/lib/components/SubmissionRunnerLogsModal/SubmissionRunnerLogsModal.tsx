import {
    FC,
    MouseEvent,
    useCallback,
    useMemo,
} from 'react'

import {
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'

import { useFetchSubmissionRunnerLogs } from '../../hooks'
import {
    MarathonMatchRunnerLogEvent,
    MarathonMatchRunnerLogs,
} from '../../models'

import styles from './SubmissionRunnerLogsModal.module.scss'

export interface SubmissionRunnerLogsModalProps {
    onClose: () => void
    submissionId: string
}

/**
 * Formats a CloudWatch event timestamp for display beside a log message.
 * @param timestamp CloudWatch event timestamp in milliseconds.
 * @returns ISO timestamp text, or an empty string when the timestamp is missing or invalid.
 * Used by `formatRunnerLogsText` to preserve event ordering with readable dates.
 */
function formatEventTimestamp(timestamp: number | undefined): string {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
        return ''
    }

    return new Date(timestamp)
        .toISOString()
}

/**
 * Formats marathon match runner log events into a single textarea value.
 * @param runnerLogs Runner-log API response containing CloudWatch events and warnings.
 * @returns Monospace log text for display in the modal.
 * Used by `SubmissionRunnerLogsModal` after log data has loaded.
 */
function formatRunnerLogsText(
    runnerLogs: MarathonMatchRunnerLogs | undefined,
): string {
    if (!runnerLogs) {
        return ''
    }

    if (runnerLogs.warning) {
        return runnerLogs.warning
    }

    if (!runnerLogs.events.length) {
        return 'No runner logs found.'
    }

    return runnerLogs.events
        .map((event: MarathonMatchRunnerLogEvent) => {
            const timestamp = formatEventTimestamp(event.timestamp)
            const message = event.message || ''

            return timestamp
                ? `[${timestamp}] ${message}`
                : message
        })
        .join('\n')
}

/**
 * Renders a modal containing ECS runner logs for a marathon match submission.
 * @param props Submission id to fetch plus a close handler for the overlay.
 * @returns A modal dialog with loading, error, or read-only log text states.
 * @throws Does not throw; API failures are shown inside the modal body.
 * Used by `SubmissionsSection` when a manager or copilot opens the runner-log action.
 */
export const SubmissionRunnerLogsModal: FC<SubmissionRunnerLogsModalProps> = (
    props: SubmissionRunnerLogsModalProps,
) => {
    const runnerLogsResult = useFetchSubmissionRunnerLogs(props.submissionId)
    const logsText = useMemo(
        () => formatRunnerLogsText(runnerLogsResult.runnerLogs),
        [runnerLogsResult.runnerLogs],
    )

    const handleContainerClick = useCallback((event: MouseEvent<HTMLDivElement>): void => {
        event.stopPropagation()
    }, [])

    return (
        <div className={styles.overlay} onClick={props.onClose} role='presentation'>
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Runner Logs</h4>
                    <button
                        aria-label='Close'
                        className={styles.closeButton}
                        onClick={props.onClose}
                        type='button'
                    >
                        <IconOutline.XIcon className={styles.closeIcon} />
                    </button>
                    <span className={styles.submissionId} title={props.submissionId}>
                        {props.submissionId}
                    </span>
                </header>

                <div className={styles.body}>
                    {runnerLogsResult.isLoading
                        ? (
                            <div className={styles.loadingWrap}>
                                <LoadingSpinner inline />
                            </div>
                        )
                        : undefined}

                    {!runnerLogsResult.isLoading && runnerLogsResult.isError
                        ? (
                            <p className={styles.message}>
                                Unable to load runner logs.
                            </p>
                        )
                        : undefined}

                    {!runnerLogsResult.isLoading && !runnerLogsResult.isError
                        ? (
                            <textarea
                                aria-label='Runner logs'
                                className={styles.logsTextarea}
                                readOnly
                                spellCheck={false}
                                value={logsText}
                            />
                        )
                        : undefined}
                </div>
            </div>
        </div>
    )
}

export default SubmissionRunnerLogsModal
