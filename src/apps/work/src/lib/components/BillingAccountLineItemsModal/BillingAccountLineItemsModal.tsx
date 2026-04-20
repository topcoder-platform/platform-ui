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

import {
    BillingAccountDetails,
    BillingAccountLineItem,
    combineBillingAccountLineItems,
} from '../../services'

import styles from './BillingAccountLineItemsModal.module.scss'

type SortField = 'amount' | 'type' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export interface BillingAccountLineItemsModalProps {
    billingAccountDetails: BillingAccountDetails
    onClose: () => void
    workBaseUrl?: string
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
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getDate())
        .padStart(2, '0')
    return `${year}-${month}-${day}`
}

function compareByAmount(a: BillingAccountLineItem, b: BillingAccountLineItem): number {
    return a.amount - b.amount
}

function compareByType(a: BillingAccountLineItem, b: BillingAccountLineItem): number {
    return a.type.localeCompare(b.type)
}

function compareByCreatedAt(a: BillingAccountLineItem, b: BillingAccountLineItem): number {
    const dateA = new Date(a.createdAt)
    const dateB = new Date(b.createdAt)
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
            case 'type':
                comparison = compareByType(a, b)
                break
            case 'createdAt':
                comparison = compareByCreatedAt(a, b)
                break
            default:
                comparison = 0
        }

        return sortOrder === 'asc' ? comparison : -comparison
    })
}

function buildChallengeUrl(workBaseUrl: string, challengeId: string): string {
    const baseUrl = workBaseUrl.replace(/\/$/, '')
    return `${baseUrl}/challenges/${encodeURIComponent(challengeId)}`
}

export const BillingAccountLineItemsModal: FC<BillingAccountLineItemsModalProps> = (
    props: BillingAccountLineItemsModalProps,
) => {
    const [sortBy, setSortBy] = useState<SortField>('createdAt')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const lineItems = useMemo<BillingAccountLineItem[]>(
        () => combineBillingAccountLineItems(props.billingAccountDetails),
        [props.billingAccountDetails],
    )

    const sortedLineItems = useMemo<BillingAccountLineItem[]>(
        () => sortLineItems(lineItems, sortBy, sortOrder),
        [lineItems, sortBy, sortOrder],
    )

    const workBaseUrl = props.workBaseUrl || window.location.origin

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

    const handleSortType = useCallback((): void => {
        if (sortBy === 'type') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('type')
            setSortOrder('desc')
        }
    }, [sortBy])

    const handleSortCreatedAt = useCallback((): void => {
        if (sortBy === 'createdAt') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('createdAt')
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
                                            onClick={handleSortType}
                                            type='button'
                                        >
                                            Status
                                            {renderSortIcon('type')}
                                        </button>
                                    </th>
                                    <th>Challenge ID</th>
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortCreatedAt}
                                            type='button'
                                        >
                                            Date
                                            {renderSortIcon('createdAt')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLineItems.map(item => (
                                    <tr key={item.id}>
                                        <td>{formatCurrency(item.amount)}</td>
                                        <td>
                                            <span
                                                className={
                                                    item.type === 'locked'
                                                        ? styles.statusLocked
                                                        : styles.statusConsumed
                                                }
                                            >
                                                {item.type === 'locked' ? (
                                                    <IconOutline.LockClosedIcon className={styles.statusIcon} />
                                                ) : (
                                                    <IconSolid.CheckCircleIcon className={styles.statusIcon} />
                                                )}
                                                {item.type === 'locked' ? 'Locked' : 'Consumed'}
                                            </span>
                                        </td>
                                        <td>
                                            <a
                                                className={styles.challengeLink}
                                                href={buildChallengeUrl(workBaseUrl, item.challengeId)}
                                                rel='noreferrer noopener'
                                                target='_blank'
                                            >
                                                {item.challengeId}
                                            </a>
                                        </td>
                                        <td>{formatDate(item.createdAt)}</td>
                                    </tr>
                                ))}
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
