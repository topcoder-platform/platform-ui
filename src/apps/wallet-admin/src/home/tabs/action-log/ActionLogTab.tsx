/* eslint-disable react/jsx-no-bind */
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Button, LoadingCircles } from '~/libs/ui'

import {
    ActionLogEntry,
    ActionLogRow,
    ActionLogType,
    MemberContact,
} from '../../../lib/models/ActionLogEntry'
import { fetchActionLog, getMemberContacts } from '../../../lib/services/wallet'

import styles from './ActionLog.module.scss'

interface PeriodOption {
    days: number
    label: string
}

export const PERIOD_OPTIONS: ReadonlyArray<PeriodOption> = [
    { days: 7, label: 'Last 7 days' },
    { days: 30, label: 'Last 30 days' },
    { days: 90, label: 'Last 3 months' },
]

const DEFAULT_PERIOD_INDEX = 2

export const ACTION_TYPE_LABELS: Record<ActionLogType, string> = {
    AMOUNT_CHANGE: 'Amount',
    DESCRIPTION_CHANGE: 'Description',
    OTHER: 'Other',
    RELEASE_DATE_CHANGE: 'Release date',
    STATUS_CHANGE: 'Status',
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
    currency: 'USD',
    style: 'currency',
})

function formatAmount(amount: string | null): string {
    if (amount === null) {
        return '-'
    }

    const value = Number(amount)
    return Number.isNaN(value) ? amount : currencyFormatter.format(value)
}

function formatDateTime(value: string): string {
    const date = new Date(value)
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })
}

function formatStatus(status: string | null): string {
    return status ? status.replace(/_/g, ' ')
        .toLowerCase() : 'Unknown'
}

function toFullName(member: MemberContact | undefined): string | undefined {
    const name = [member?.firstName, member?.lastName]
        .map(part => part?.trim())
        .filter(Boolean)
        .join(' ')

    return name || undefined
}

function toRow(entry: ActionLogEntry, members: Map<string, MemberContact>): ActionLogRow {
    const admin = members.get(entry.adminUserId)

    return {
        ...entry,
        adminEmail: admin?.email,
        adminHandle: admin?.handle,
        adminName: toFullName(admin),
        winnerHandle: members.get(entry.winnerId)?.handle,
    }
}

/**
 * Adds admin and member details to the entries. The log is still shown, with
 * user IDs only, when the member lookup fails.
 */
async function withMemberDetails(entries: ActionLogEntry[]): Promise<ActionLogRow[]> {
    let members = new Map<string, MemberContact>()

    if (entries.length) {
        try {
            members = await getMemberContacts([
                ...entries.map(entry => entry.adminUserId),
                ...entries.map(entry => entry.winnerId),
            ])
        } catch {
            // fall back to user IDs
        }
    }

    return entries.map(entry => toRow(entry, members))
}

function matchesSearch(entry: ActionLogRow, search: string): boolean {
    if (!search) {
        return true
    }

    return [
        entry.adminHandle,
        entry.adminEmail,
        entry.adminName,
        entry.winnerHandle,
        entry.title,
        entry.externalId,
        entry.action,
        entry.note,
    ].some(value => value?.toLowerCase()
        .includes(search))
}

const ActionLogTab: FC = () => {
    const [periodIndex, setPeriodIndex] = useState<number>(DEFAULT_PERIOD_INDEX)
    const [entries, setEntries] = useState<ActionLogRow[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>()
    const [search, setSearch] = useState<string>('')

    const loadEntries = useCallback(async (): Promise<void> => {
        setIsLoading(true)
        setError(undefined)

        try {
            const actions = await fetchActionLog(PERIOD_OPTIONS[periodIndex].days)
            setEntries(await withMemberDetails(actions))
        } catch {
            setEntries([])
            setError('Failed to load the action log. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [periodIndex])

    useEffect(() => {
        loadEntries()
    }, [loadEntries])

    const filteredEntries = useMemo(() => {
        const normalizedSearch = search.trim()
            .toLowerCase()
        return entries.filter(entry => matchesSearch(entry, normalizedSearch))
    }, [entries, search])

    const paymentCount = useMemo(
        () => new Set(filteredEntries.map(entry => entry.winningId)).size,
        [filteredEntries],
    )

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

        if (filteredEntries.length === 0) {
            return (
                <div className={styles.centered}>
                    {entries.length === 0
                        ? 'No manual payment actions found for this period.'
                        : 'No actions match your search.'}
                </div>
            )
        }

        return (
            <>
                <p className={styles.summary}>
                    <strong>{filteredEntries.length}</strong>
                    {` action${filteredEntries.length === 1 ? '' : 's'} on `}
                    <strong>{paymentCount}</strong>
                    {` payment${paymentCount === 1 ? '' : 's'}`}
                </p>
                <div className={styles.tableContainer}>
                    <table>
                        <thead>
                            <tr>
                                <th className='body-ultra-small-bold'>Date</th>
                                <th className='body-ultra-small-bold'>Admin</th>
                                <th className='body-ultra-small-bold'>Action</th>
                                <th className='body-ultra-small-bold'>Payment</th>
                                <th className='body-ultra-small-bold'>Current state</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map(entry => (
                                <tr key={entry.auditId}>
                                    <td className='body-small'>{formatDateTime(entry.actionedAt)}</td>
                                    <td className='body-small'>
                                        <div className={styles.stack}>
                                            <span className='body-small-bold'>
                                                {entry.adminHandle ?? entry.adminUserId}
                                            </span>
                                            {entry.adminName && <span>{entry.adminName}</span>}
                                            {entry.adminEmail && (
                                                <span className={classNames(styles.muted, styles.wrap)}>
                                                    {entry.adminEmail}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className='body-small'>
                                        <div className={styles.stack}>
                                            <span className={styles.badge}>
                                                {ACTION_TYPE_LABELS[entry.actionType] ?? entry.actionType}
                                            </span>
                                            <span className={styles.wrap}>{entry.action}</span>
                                            {entry.note && (
                                                <span className={classNames(styles.muted, styles.wrap)}>
                                                    {`Note: ${entry.note}`}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className='body-small'>
                                        <div className={styles.stack}>
                                            <span className={styles.wrap}>{entry.title ?? entry.winningId}</span>
                                            <span>
                                                {'Member: '}
                                                <span className='body-small-bold'>
                                                    {entry.winnerHandle ?? entry.winnerId}
                                                </span>
                                            </span>
                                            {entry.externalId && (
                                                <span className={classNames(styles.mono, styles.muted)}>
                                                    {entry.externalId}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className='body-small'>
                                        <div className={styles.stack}>
                                            <span className={styles.status}>
                                                {formatStatus(entry.paymentStatus)}
                                            </span>
                                            <span>{formatAmount(entry.totalAmount)}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Action Log</h3>
                <p className={styles.muted}>
                    Payment changes made manually in Wallet Admin. The current state column
                    shows the payment as it is now, not at the time of the action.
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
                <div className={styles.toolbarActions}>
                    <input
                        type='search'
                        className={styles.search}
                        aria-label='Search actions'
                        placeholder='Search admin, member or payment'
                        value={search}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)}
                    />
                    <Button
                        secondary
                        size='md'
                        label='Refresh'
                        disabled={isLoading}
                        onClick={loadEntries}
                    />
                </div>
            </div>
            {renderContent()}
        </div>
    )
}

export default ActionLogTab
