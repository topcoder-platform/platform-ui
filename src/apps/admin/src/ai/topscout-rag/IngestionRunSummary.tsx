/**
 * Outcome of the last ingestion run: counts, status, and per-challenge
 * failures. Also renders the two non-success terminal states — a hard error,
 * and a run that outlived the poll window but is still going server-side.
 */
import { FC, useCallback, useMemo, useState } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'
import { BulkIngestionFailure, BulkIngestionResult } from '~/libs/shared'

import styles from './IngestionRunSummary.module.scss'

export type RunStatus = 'completed' | 'failed' | 'timed-out'

export interface IngestionRun {
    status: RunStatus
    /** Present when status is 'completed'. */
    result?: BulkIngestionResult
    /** Present when status is 'failed' or 'timed-out'. */
    message?: string
    finishedAt: Date
}

interface IngestionRunSummaryProps {
    run: IngestionRun
}

const STATUS_LABEL: Record<RunStatus, string> = {
    completed: 'COMPLETED',
    failed: 'FAILED',
    'timed-out': 'STILL RUNNING',
}

/** "2 minutes ago" without pulling in a date library for one string. */
function relativeTime(from: Date): string {
    const seconds = Math.max(0, Math.round((Date.now() - from.getTime()) / 1000))
    if (seconds < 60) {
        return 'just now'
    }

    const minutes = Math.round(seconds / 60)
    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
    }

    const hours = Math.round(minutes / 60)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
}

export const IngestionRunSummary: FC<IngestionRunSummaryProps> = props => {
    const [showFailures, setShowFailures] = useState(false)
    const run: IngestionRun = props.run
    const failures: BulkIngestionFailure[] = run.result?.failures ?? []

    const toggleFailures = useCallback(() => {
        setShowFailures(previous => !previous)
    }, [])

    const counts = useMemo(() => {
        if (!run.result) {
            return []
        }

        return [
            { label: 'Processed', value: run.result.processed },
            { label: 'Succeeded', tone: styles.succeeded, value: run.result.succeeded },
            { label: 'Failed', tone: styles.failed, value: run.result.failed },
            { label: 'Skipped', tone: styles.skipped, value: run.result.skipped },
            { label: 'Chunks', tone: styles.chunks, value: run.result.chunks },
        ]
    }, [run.result])

    return (
        <div className={styles.summary}>
            <div className={styles.header}>
                <span className={styles.headerText}>
                    Last run &middot;
                    {' '}
                    {run.status === 'completed' ? 'completed' : 'ended'}
                    {' '}
                    {relativeTime(run.finishedAt)}
                    {run.result?.dryRun ? ' · dry run' : ''}
                </span>
                <span
                    className={classNames(styles.statusPill, styles[`status-${run.status}`])}
                >
                    {run.status === 'completed' && <IconOutline.CheckIcon className='icon-xs' />}
                    {STATUS_LABEL[run.status]}
                </span>
            </div>

            {counts.length > 0 && (
                <div className={styles.counts}>
                    {counts.map(count => (
                        <div className={styles.count} key={count.label}>
                            <span className={styles.countLabel}>{count.label}</span>
                            <span className={classNames(styles.countValue, count.tone)}>
                                {count.value}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {run.message && (
                <p className={classNames(styles.message, run.status === 'failed' && styles.messageError)}>
                    {run.message}
                </p>
            )}

            {failures.length > 0 && (
                <div className={styles.failures}>
                    <button type='button' className={styles.failuresToggle} onClick={toggleFailures}>
                        <IconOutline.ChevronRightIcon
                            className={classNames('icon-xs', showFailures && styles.chevronOpen)}
                        />
                        {`View failures (${failures.length})`}
                    </button>
                    {showFailures && (
                        <ul className={styles.failureList}>
                            {failures.map(failure => (
                                <li key={failure.challengeId || failure.name}>
                                    <span className={styles.failureName}>
                                        {failure.name || failure.challengeId}
                                    </span>
                                    <span className={styles.failureError}>{failure.error}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

export default IngestionRunSummary
