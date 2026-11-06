/* eslint-disable react/jsx-no-bind */
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Button, LoadingCircles } from '~/libs/ui'

import { TrolleyLogReleasePair } from '../../../lib/models/TrolleyLogReleasePair'
import { fetchTrolleyLogs } from '../../../lib/services/wallet'

import styles from './TrolleyLogs.module.scss'

interface PeriodOption {
    days?: number
    label: string
}

export const PERIOD_OPTIONS: ReadonlyArray<PeriodOption> = [
    { days: 7, label: 'Last 7 days' },
    { days: 30, label: 'Last 30 days' },
    { days: 90, label: 'Last 90 days' },
    { label: 'Since October 2025' },
]

/**
 * Payouts moved to Trolley in October 2025; this view only covers releases from then on.
 * The API applies the same cutoff, this keeps the view correct against an older API.
 */
export const TROLLEY_LOGS_START = new Date('2025-10-01T00:00:00Z')

function isPostTrolley(pair: TrolleyLogReleasePair): boolean {
    // release1 is the older release of the pair
    return new Date(pair.release1CreatedAt)
        .getTime() >= TROLLEY_LOGS_START.getTime()
}

const DEFAULT_PERIOD_INDEX = 1

const currencyFormatter = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
})

function formatAmount(amount: string): string {
    const value = Number(amount)
    return Number.isNaN(value) ? amount : currencyFormatter.format(value)
}

function formatDateTime(value: string): string {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}

interface ReleaseCellProps {
    amount: string
    createdAt: string
    id: string
    status: string | null
    trolleyPaymentId: string | null
}

const ReleaseCell: FC<ReleaseCellProps> = (props: ReleaseCellProps) => (
    <div className={styles.release}>
        <span className={styles.mono}>{props.id}</span>
        <span>
            <span className={styles.status}>{props.status ?? 'Unknown'}</span>
            {' · '}
            {formatAmount(props.amount)}
        </span>
        <span className={styles.muted}>{formatDateTime(props.createdAt)}</span>
        <span className={classNames(styles.mono, styles.muted)}>
            {props.trolleyPaymentId ?? 'No Trolley payment'}
        </span>
    </div>
)

const TrolleyLogsTab: FC = () => {
    const [periodIndex, setPeriodIndex] = useState<number>(DEFAULT_PERIOD_INDEX)
    const [pairs, setPairs] = useState<TrolleyLogReleasePair[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>()
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    const loadPairs = useCallback(async (): Promise<void> => {
        setIsLoading(true)
        setError(undefined)

        try {
            const result = await fetchTrolleyLogs(PERIOD_OPTIONS[periodIndex].days)
            setPairs(result.filter(isPostTrolley))
            setExpandedRows(new Set())
        } catch {
            setPairs([])
            setError('Failed to load Trolley logs. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [periodIndex])

    useEffect(() => {
        loadPairs()
    }, [loadPairs])

    const totalSharedAmount = useMemo(
        () => pairs.reduce((sum, d) => sum + (Number(d.sharedAmount) || 0), 0),
        [pairs],
    )

    function toggleRow(key: string): void {
        setExpandedRows(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }

            return next
        })
    }

    function renderContent(): JSX.Element {
        if (isLoading) {
            return (
                <div className={styles.centered}>
                    <LoadingCircles />
                </div>
            )
        }

        if (error) {
            return <div className={classNames(styles.centered, styles.error)}>{error}</div>
        }

        if (pairs.length === 0) {
            return (
                <div className={styles.centered}>
                    No release pairs found for this period.
                </div>
            )
        }

        return (
            <>
                <p className={styles.summary}>
                    <strong>{pairs.length}</strong>
                    {` pair${pairs.length === 1 ? '' : 's'} of releases totalling `}
                    <strong>{currencyFormatter.format(totalSharedAmount)}</strong>
                </p>
                <div className={styles.tableContainer}>
                    <table>
                        <thead>
                            <tr>
                                <th className='body-ultra-small-bold'>Member</th>
                                <th className='body-ultra-small-bold'>Shared payments</th>
                                <th className='body-ultra-small-bold'>Shared amount</th>
                                <th className='body-ultra-small-bold'>First release</th>
                                <th className='body-ultra-small-bold'>Second release</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pairs.map(d => {
                                const rowKey = `${d.release1Id}_${d.release2Id}`
                                const isExpanded = expandedRows.has(rowKey)

                                return (
                                    <tr key={rowKey}>
                                        <td className='body-small-bold'>
                                            {d.handle ?? '-'}
                                            <div className={classNames(styles.muted, 'body-small')}>{d.userId}</div>
                                        </td>
                                        <td className='body-small'>
                                            <button
                                                type='button'
                                                className={styles.linkButton}
                                                aria-expanded={isExpanded}
                                                onClick={() => toggleRow(rowKey)}
                                            >
                                                {`${d.sharedPayments} payment${d.sharedPayments === 1 ? '' : 's'}`}
                                            </button>
                                            {isExpanded && (
                                                <ul className={styles.winnings}>
                                                    {d.sharedWinnings.map(w => (
                                                        <li key={w.winningId}>
                                                            {w.title ?? w.winningId}
                                                            {' – '}
                                                            {formatAmount(w.amount)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </td>
                                        <td className='body-small-bold'>{formatAmount(d.sharedAmount)}</td>
                                        <td className='body-small'>
                                            <ReleaseCell
                                                id={d.release1Id}
                                                status={d.release1Status}
                                                amount={d.release1Amount}
                                                createdAt={d.release1CreatedAt}
                                                trolleyPaymentId={d.trolleyPayment1Id}
                                            />
                                        </td>
                                        <td className='body-small'>
                                            <ReleaseCell
                                                id={d.release2Id}
                                                status={d.release2Status}
                                                amount={d.release2Amount}
                                                createdAt={d.release2CreatedAt}
                                                trolleyPaymentId={d.trolleyPayment2Id}
                                            />
                                        </td>
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
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Trolley Logs</h3>
                <p className={styles.muted}>
                    Failed and returned releases are excluded from the below list.
                    Check each pair in Trolley before taking action.
                </p>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.periodButtons} role='group' aria-label='Period'>
                    {PERIOD_OPTIONS.map((option, index) => (
                        <button
                            key={option.label}
                            type='button'
                            aria-pressed={index === periodIndex}
                            className={classNames(
                                styles.periodButton,
                                index === periodIndex && styles.periodButtonActive,
                            )}
                            onClick={() => setPeriodIndex(index)}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <Button
                    secondary
                    size='md'
                    label='Refresh'
                    disabled={isLoading}
                    onClick={loadPairs}
                />
            </div>
            {renderContent()}
        </div>
    )
}

export default TrolleyLogsTab
