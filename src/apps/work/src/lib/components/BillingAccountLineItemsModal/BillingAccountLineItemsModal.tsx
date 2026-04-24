import {
    FC,
    MouseEvent,
    useCallback,
    useMemo,
    useState,
} from 'react'

import {
    Button,
    IconOutline,
    IconSolid,
} from '~/libs/ui'

import { rootRoute } from '../../../config/routes.config'
import {
    BillingAccountDetails,
    BillingAccountLineItem,
    combineBillingAccountLineItems,
} from '../../services/billing-accounts.service'

import styles from './BillingAccountLineItemsModal.module.scss'

type SortField = 'amount' | 'status' | 'date'
type SortOrder = 'asc' | 'desc'

const EXTERNAL_TYPE_LABELS: Record<BillingAccountLineItem['externalType'], string> = {
    CHALLENGE: 'Challenge',
    ENGAGEMENT: 'Engagement',
}

export interface BillingAccountLineItemsModalProps {
    billingAccountDetails: BillingAccountDetails
    onClose: () => void
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: 'currency',
    })
        .format(amount)
}

function formatDate(dateString: string): string {
    const isoDateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/)

    if (isoDateMatch) {
        return isoDateMatch[1]
    }

    const date = new Date(dateString)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getUTCDate())
        .padStart(2, '0')
    return `${year}-${month}-${day}`
}

function compareByAmount(a: BillingAccountLineItem, b: BillingAccountLineItem): number {
    return a.amount - b.amount
}

function compareByStatus(a: BillingAccountLineItem, b: BillingAccountLineItem): number {
    return a.status.localeCompare(b.status)
}

function compareByDate(a: BillingAccountLineItem, b: BillingAccountLineItem): number {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
}

function sortLineItems(
    items: BillingAccountLineItem[],
    sortBy: SortField,
    sortOrder: SortOrder,
): BillingAccountLineItem[] {
    return [...items].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
            case 'amount':
                comparison = compareByAmount(a, b)
                break
            case 'status':
                comparison = compareByStatus(a, b)
                break
            case 'date':
                comparison = compareByDate(a, b)
                break
            default:
                comparison = 0
        }

        return sortOrder === 'asc' ? comparison : -comparison
    })
}

function buildChallengeUrl(externalId: string): string {
    const basePath = rootRoute.replace(/\/$/, '')
    return `${basePath}/challenges/${encodeURIComponent(externalId)}`
}

export const BillingAccountLineItemsModal: FC<BillingAccountLineItemsModalProps> = (
    props: BillingAccountLineItemsModalProps,
) => {
    const [sortBy, setSortBy] = useState<SortField>('date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const lineItems = useMemo<BillingAccountLineItem[]>(
        () => combineBillingAccountLineItems(props.billingAccountDetails),
        [props.billingAccountDetails],
    )

    const sortedLineItems = useMemo<BillingAccountLineItem[]>(
        () => sortLineItems(lineItems, sortBy, sortOrder),
        [lineItems, sortBy, sortOrder],
    )

    const handleContainerClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            event.stopPropagation()
        },
        [],
    )

    const handleSortAmount = useCallback((): void => {
        if (sortBy === 'amount') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('amount')
            setSortOrder('desc')
        }
    }, [sortBy])

    const handleSortStatus = useCallback((): void => {
        if (sortBy === 'status') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('status')
            setSortOrder('desc')
        }
    }, [sortBy])

    const handleSortDate = useCallback((): void => {
        if (sortBy === 'date') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('date')
            setSortOrder('desc')
        }
    }, [sortBy])

    const renderSortIcon = useCallback((field: SortField): JSX.Element | undefined => {
        if (field !== sortBy) {
            return undefined
        }

        return sortOrder === 'asc'
            ? <IconSolid.ChevronUpIcon className={styles.sortIcon} />
            : <IconSolid.ChevronDownIcon className={styles.sortIcon} />
    }, [sortBy, sortOrder])

    return (
        <div
            className={styles.overlay}
            onClick={props.onClose}
            role='presentation'
        >
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Billing Account Details</h4>
                    <button
                        aria-label='Close'
                        className={styles.closeButton}
                        onClick={props.onClose}
                        type='button'
                    >
                        <IconOutline.XIcon className={styles.closeIcon} />
                    </button>
                </header>

                <div className={styles.summary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Locked</span>
                        <span className={styles.summaryValue}>
                            {formatCurrency(props.billingAccountDetails.lockedBudget)}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Consumed</span>
                        <span className={styles.summaryValue}>
                            {formatCurrency(props.billingAccountDetails.consumedBudget)}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>Remaining</span>
                        <span className={styles.summaryValue}>
                            {formatCurrency(props.billingAccountDetails.totalBudgetRemaining)}
                        </span>
                    </div>
                </div>

                <div className={styles.body}>
                    {sortedLineItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            No line items found for this billing account.
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortAmount}
                                            type='button'
                                        >
                                            Amount
                                            {renderSortIcon('amount')}
                                        </button>
                                    </th>
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortStatus}
                                            type='button'
                                        >
                                            Status
                                            {renderSortIcon('status')}
                                        </button>
                                    </th>
                                    <th>Type</th>
                                    <th>Name</th>
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortDate}
                                            type='button'
                                        >
                                            Date
                                            {renderSortIcon('date')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLineItems.map(item => {
                                    const displayName = item.externalName || '-'
                                    const challengeUrl = item.externalType === 'CHALLENGE' && item.externalId
                                        ? buildChallengeUrl(item.externalId)
                                        : undefined

                                    return (
                                        <tr key={item.id}>
                                            <td>{formatCurrency(item.amount)}</td>
                                            <td>
                                                <span
                                                    className={
                                                        item.status === 'locked'
                                                            ? styles.statusLocked
                                                            : styles.statusConsumed
                                                    }
                                                >
                                                    {item.status === 'locked' ? (
                                                        <IconOutline.LockClosedIcon className={styles.statusIcon} />
                                                    ) : (
                                                        <IconSolid.CheckCircleIcon className={styles.statusIcon} />
                                                    )}
                                                    {item.status === 'locked' ? 'Locked' : 'Consumed'}
                                                </span>
                                            </td>
                                            <td>{EXTERNAL_TYPE_LABELS[item.externalType]}</td>
                                            <td className={styles.nameCell}>
                                                {challengeUrl ? (
                                                    <a
                                                        className={styles.challengeLink}
                                                        href={challengeUrl}
                                                        rel='noreferrer noopener'
                                                        target='_blank'
                                                    >
                                                        {displayName}
                                                    </a>
                                                ) : displayName}
                                            </td>
                                            <td>{formatDate(item.date)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <footer className={styles.footer}>
                    <Button
                        label='Close'
                        onClick={props.onClose}
                        secondary
                        size='lg'
                    />
                </footer>
            </div>
        </div>
    )
}

export default BillingAccountLineItemsModal
