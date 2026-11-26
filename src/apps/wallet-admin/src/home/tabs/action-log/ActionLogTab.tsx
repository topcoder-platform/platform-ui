/* eslint-disable react/jsx-no-bind */
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Button, LoadingCircles } from '~/libs/ui'

import {
    ActionLogEntry,
    ActionLogFilters,
    ActionLogPaymentSource,
    ActionLogRow,
    ActionLogType,
    MemberContact,
} from '../../../lib/models/ActionLogEntry'
import {
    fetchActionLog,
    fetchActionLogAdminIds,
    fetchPaymentActionRoleMemberIds,
    getMemberContacts,
} from '../../../lib/services/wallet'
import FilterBar, { Filter } from '../../../lib/components/filter-bar/FilterBar'

import styles from './ActionLog.module.scss'

/** Longest date range the finance API accepts, in days. */
export const MAX_RANGE_DAYS = 90

const DAY_MS = 24 * 60 * 60 * 1000
const ALL_ADMINS = 'all'

export const PAYMENT_SOURCE_OPTIONS: ReadonlyArray<{ label: string, value: ActionLogPaymentSource }> = [
    { label: 'Topcoder', value: 'TOPCODER' },
    { label: 'TaaS', value: 'TAAS' },
    { label: 'Topgear', value: 'TOPGEAR' },
]

/** Topcoder payment types, as listed in the Payments tab. */
export const PAYMENT_TYPE_OPTIONS: ReadonlyArray<{ label: string, value: string }> = [
    { label: 'Task Payment', value: 'TASK_PAYMENT' },
    { label: 'Contest Payment', value: 'CONTEST_PAYMENT' },
    { label: 'Contest Checkpoint Payment', value: 'CONTEST_CHECKPOINT_PAYMENT' },
    { label: 'Copilot Payment', value: 'COPILOT_PAYMENT' },
    { label: 'Review Board Payment', value: 'REVIEW_BOARD_PAYMENT' },
    { label: 'Engagement Payment', value: 'ENGAGEMENT_PAYMENT' },
]

interface FilterValues {
    paymentSource: ActionLogPaymentSource
    categories: string[]
    adminUserId: string
    /** yyyy-mm-dd, local time */
    dateFrom: string
    /** yyyy-mm-dd, local time */
    dateTo: string
}

interface AdminOption {
    label: string
    value: string
}

function formatIsoDateOnly(date: Date): string {
    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getDate())
        .padStart(2, '0')

    return `${y}-${mo}-${day}`
}

function parseIsoDateOnly(value: string, endOfDay: boolean): Date | undefined {
    const [y, m, d] = value.split('-')
        .map(part => parseInt(part, 10))
    if (!y || !m || !d) {
        return undefined
    }

    return endOfDay
        ? new Date(y, m - 1, d, 23, 59, 59, 999)
        : new Date(y, m - 1, d)
}

/** Topcoder payments, any type and admin, over the last 90 days including today. */
function getDefaultFilters(): FilterValues {
    const dateTo = new Date()
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - (MAX_RANGE_DAYS - 1))

    return {
        adminUserId: ALL_ADMINS,
        categories: [],
        dateFrom: formatIsoDateOnly(dateFrom),
        dateTo: formatIsoDateOnly(dateTo),
        paymentSource: 'TOPCODER',
    }
}

/**
 * @returns the API filters, or an error message when the date range is not
 *   valid.
 */
function toQueryFilters(values: FilterValues): ActionLogFilters | string {
    const dateFrom = parseIsoDateOnly(values.dateFrom, false)
    const dateTo = parseIsoDateOnly(values.dateTo, true)

    if (!dateFrom || !dateTo) {
        return 'Select both a from and a to date.'
    }

    if (dateFrom.getTime() > dateTo.getTime()) {
        return 'The from date must be on or before the to date.'
    }

    // compare calendar days so daylight saving changes do not count
    const startDay = Date.UTC(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())
    const endDay = Date.UTC(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate())
    if ((endDay - startDay) / DAY_MS + 1 > MAX_RANGE_DAYS) {
        return `Select a date range of at most ${MAX_RANGE_DAYS} days.`
    }

    return {
        adminUserId: values.adminUserId === ALL_ADMINS ? undefined : values.adminUserId,
        categories: values.paymentSource === 'TOPCODER' ? values.categories : [],
        dateFrom,
        dateTo,
        paymentSource: values.paymentSource,
    }
}

function areFiltersEqual(a: FilterValues, b: FilterValues): boolean {
    return a.paymentSource === b.paymentSource
        && a.adminUserId === b.adminUserId
        && a.dateFrom === b.dateFrom
        && a.dateTo === b.dateTo
        && a.categories.length === b.categories.length
        && a.categories.every(category => b.categories.includes(category))
}

/**
 * Lists everyone who can action payments: members holding a payment role,
 * plus admins with past actions who may have lost the role since. Either
 * source may fail on its own; the other one is still listed.
 */
async function loadAdminOptions(): Promise<AdminOption[]> {
    const results = await Promise.allSettled([
        fetchPaymentActionRoleMemberIds(),
        fetchActionLogAdminIds(),
    ])
    const userIds = [...new Set(results.flatMap(result => (
        result.status === 'fulfilled' ? result.value : []
    )))]

    if (!userIds.length) {
        return []
    }

    let members = new Map<string, MemberContact>()
    try {
        members = await getMemberContacts(userIds)
    } catch {
        // fall back to user IDs
    }

    return userIds
        .map(userId => ({ label: members.get(userId)?.handle ?? userId, value: userId }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }))
}

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
    const [defaultFilters] = useState<FilterValues>(getDefaultFilters)
    const [filters, setFilters] = useState<FilterValues>(defaultFilters)
    const [adminOptions, setAdminOptions] = useState<AdminOption[]>([])
    const [entries, setEntries] = useState<ActionLogRow[]>([])
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | undefined>()
    const [search, setSearch] = useState<string>('')

    const queryFilters = useMemo(() => toQueryFilters(filters), [filters])

    const loadEntries = useCallback(async (): Promise<void> => {
        if (typeof queryFilters === 'string') {
            setEntries([])
            setError(queryFilters)
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        setError(undefined)

        try {
            const actions = await fetchActionLog(queryFilters)
            setEntries(await withMemberDetails(actions))
        } catch {
            setEntries([])
            setError('Failed to load the action log. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [queryFilters])

    useEffect(() => {
        loadEntries()
    }, [loadEntries])

    useEffect(() => {
        let isMounted = true

        loadAdminOptions()
            .then(options => {
                if (isMounted) {
                    setAdminOptions(options)
                }
            })

        return () => {
            isMounted = false
        }
    }, [])

    const filterBarFilters = useMemo((): Filter[] => {
        const out: Filter[] = [
            {
                key: 'paymentSource',
                label: 'Payment Category',
                options: [...PAYMENT_SOURCE_OPTIONS],
                type: 'dropdown',
            },
        ]

        if (filters.paymentSource === 'TOPCODER') {
            out.push({
                displayValueInTrigger: true,
                key: 'categories',
                label: 'Payment Type',
                options: [...PAYMENT_TYPE_OPTIONS],
                type: 'multi_dropdown',
            })
        }

        out.push(
            {
                key: 'adminUserId',
                label: 'Actioned By',
                options: [{ label: 'All', value: ALL_ADMINS }, ...adminOptions],
                type: 'dropdown',
            },
            { key: 'dateFrom', label: 'Date from', type: 'date' },
            { key: 'dateTo', label: 'Date to', type: 'date' },
        )

        return out
    }, [adminOptions, filters.paymentSource])

    const filterBarValues = useMemo((): Record<string, string | string[]> => ({
        adminUserId: filters.adminUserId,
        categories: filters.categories,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        paymentSource: filters.paymentSource,
    }), [filters])

    const handleFilterChange = useCallback((key: string, value: string[]): void => {
        setFilters(prev => {
            switch (key) {
                case 'paymentSource':
                    return {
                        ...prev,
                        categories: [],
                        paymentSource: (value[0] as ActionLogPaymentSource) || defaultFilters.paymentSource,
                    }
                case 'categories':
                    return { ...prev, categories: value }
                case 'adminUserId':
                    return { ...prev, adminUserId: value[0] || ALL_ADMINS }
                case 'dateFrom':
                    return { ...prev, dateFrom: value[0] ?? '' }
                case 'dateTo':
                    return { ...prev, dateTo: value[0] ?? '' }
                default:
                    return prev
            }
        })
    }, [defaultFilters])

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
                        ? 'No manual payment actions match the selected filters.'
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
                    {`Payment changes made manually in Wallet Admin, up to ${MAX_RANGE_DAYS} days at a time.`}
                    {' The current state column shows the payment as it is now, not at the time of the action.'}
                </p>
            </div>
            <div className={styles.filters}>
                <FilterBar
                    filters={filterBarFilters}
                    selectedValueOverrides={filterBarValues}
                    hasActiveFilters={!areFiltersEqual(filters, defaultFilters)}
                    onFilterChange={handleFilterChange}
                    onResetFilters={() => setFilters(defaultFilters)}
                />
            </div>
            <div className={styles.toolbar}>
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
