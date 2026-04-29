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
import { useFetchEngagements } from '../../hooks/useFetchEngagements'
import type { Engagement } from '../../models'
import {
    BillingAccountDetails,
    BillingAccountLineItem,
    combineBillingAccountLineItems,
} from '../../services/billing-accounts.service'
import { calculatePaymentChallengeFee } from '../../utils/payment.utils'
import {
    calculateMemberPaymentAmount,
    getCopilotMemberPaymentsBudgetInfo,
} from '../../utils/project-billing-account.utils'

import styles from './BillingAccountLineItemsModal.module.scss'

type SortField = 'amount' | 'status' | 'date'
type SortOrder = 'asc' | 'desc'

interface BillingAccountModalLineItem extends BillingAccountLineItem {
    challengeFeeAmount?: number
    displayAmount?: number
}

const ENGAGEMENT_ASSIGNMENT_FILTERS = {
    includePrivate: true,
}

const EXTERNAL_TYPE_LABELS: Record<BillingAccountLineItem['externalType'], string> = {
    CHALLENGE: 'Challenge',
    ENGAGEMENT: 'Engagement',
}

export interface BillingAccountLineItemsModalProps {
    billingAccountDetails: BillingAccountDetails
    onClose: () => void
    projectId?: number | string
    showMemberPaymentsRemaining?: boolean
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

/**
 * Resolves the amount used when sorting modal line items.
 *
 * @param item Line item already mapped for the current caller role.
 * @returns Display amount, or zero when a copilot-safe amount cannot be calculated.
 * @remarks Used only by the billing-account details modal amount sort.
 */
function getSortableAmount(item: BillingAccountModalLineItem): number {
    return item.displayAmount ?? 0
}

function compareByAmount(a: BillingAccountModalLineItem, b: BillingAccountModalLineItem): number {
    return getSortableAmount(a) - getSortableAmount(b)
}

function compareByStatus(a: BillingAccountModalLineItem, b: BillingAccountModalLineItem): number {
    return a.status.localeCompare(b.status)
}

function compareByDate(a: BillingAccountModalLineItem, b: BillingAccountModalLineItem): number {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
}

function sortLineItems(
    items: BillingAccountModalLineItem[],
    sortBy: SortField,
    sortOrder: SortOrder,
): BillingAccountModalLineItem[] {
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

/**
 * Normalizes optional route identifiers before using them in work-app links.
 *
 * @param value Raw route identifier from project or billing-account row data.
 * @returns Trimmed string id, or `undefined` when the value is blank.
 * @remarks Used only by billing-account line-item links to avoid invalid route segments.
 */
function normalizeRouteId(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

/**
 * Builds an absolute work-app path with the configured root route prefix.
 *
 * @param path Path below the work-app root. It must start with `/`.
 * @returns Work-app URL path safe for direct anchors.
 * @remarks The work app runs at `/work` on non-work subdomains and `/` on the
 * work subdomain.
 */
function buildWorkUrl(path: string): string {
    const basePath = rootRoute.replace(/\/$/, '')
    return `${basePath}${path}`
}

/**
 * Builds the work-app challenge detail URL for a billing-account row.
 *
 * @param externalId Challenge id from the billing-account line item.
 * @returns Work-app challenge URL path.
 * @remarks Used by the billing-account details modal name column.
 */
function buildChallengeUrl(externalId: string): string {
    return buildWorkUrl(`/challenges/${encodeURIComponent(externalId)}`)
}

/**
 * Builds the work-app engagement editor URL for a billing-account row.
 *
 * @param projectId Project id that scopes the engagement route.
 * @param engagementId Engagement id resolved from the line item assignment id.
 * @returns Work-app engagement URL path.
 * @remarks Engagement budget entries are keyed by assignment id, so callers
 * resolve the engagement id before using this helper.
 */
function buildEngagementUrl(projectId: string, engagementId: string): string {
    return buildWorkUrl(
        `/projects/${encodeURIComponent(projectId)}/engagements/${encodeURIComponent(engagementId)}`,
    )
}

/**
 * Formats the role-specific line-item amount for the Member Payments column.
 *
 * @param item Line item already mapped for the current caller role.
 * @returns Formatted currency or `-` when a copilot-safe amount is unavailable.
 * @remarks Copilot rows use member payment amounts without exposing markup.
 * Manager/admin challenge rows use the challenge subtotal returned by the
 * billing-account API, while engagement rows still derive the payment amount
 * from the billing ledger total.
 */
function formatLineItemAmount(item: BillingAccountModalLineItem): string {
    return item.displayAmount === undefined
        ? '-'
        : formatCurrency(item.displayAmount)
}

/**
 * Formats the line-item challenge fee for the manager/admin fee column.
 *
 * @param item Line item already mapped for the current caller role.
 * @returns Formatted currency, or `-` when the fee cannot be calculated.
 * @remarks Copilot rows do not receive fee values because markup is hidden for
 * that role.
 */
function formatLineItemChallengeFee(item: BillingAccountModalLineItem): string {
    return item.challengeFeeAmount === undefined
        ? '-'
        : formatCurrency(item.challengeFeeAmount)
}

/**
 * Resolves the member-payment amount that should be visible in the row.
 *
 * @param item Raw locked or consumed billing-account line item.
 * @param billingAccountDetails Billing account detail payload containing markup when available.
 * @param showMemberPaymentsRemaining Whether the caller needs the copilot-safe view.
 * @returns Member payment amount, or `undefined` for copilot rows when it cannot
 * be safely calculated.
 * @remarks Challenge budget rows already expose the member-payment subtotal
 * for manager/admin users. Engagement budget rows store the billing ledger
 * total, so they still need markup removed before display. Copilot rows prefer
 * API-provided member-payment amounts and fall back to the legacy markup math
 * only when that safe field is missing.
 */
function getLineItemMemberPaymentAmount(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    showMemberPaymentsRemaining: boolean | undefined,
): number | undefined {
    if (item.memberPaymentAmount !== undefined) {
        return item.memberPaymentAmount
    }

    if (!showMemberPaymentsRemaining && item.externalType === 'CHALLENGE') {
        return item.amount
    }

    const memberPaymentAmount = calculateMemberPaymentAmount(
        item.amount,
        billingAccountDetails.markup,
    )

    return memberPaymentAmount !== undefined || showMemberPaymentsRemaining
        ? memberPaymentAmount
        : item.amount
}

/**
 * Builds the modal row model with the amount that should be visible to the caller.
 *
 * @param item Raw locked or consumed billing-account line item.
 * @param billingAccountDetails Billing account detail payload containing hidden markup when available.
 * @param showMemberPaymentsRemaining Whether the caller needs the copilot-safe view.
 * @returns A line item with `displayAmount` set to the visible member-payment
 * amount and, for non-copilots, `challengeFeeAmount` set to the billing markup fee.
 * @remarks Copilot rows prefer the API-provided member payment amount because
 * their response intentionally omits markup. Manager/admin challenge rows use
 * the raw challenge subtotal and calculate the fee from markup; engagement rows
 * derive member payments from the raw ledger amount and billing-account markup.
 */
function getDisplayLineItem(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    showMemberPaymentsRemaining: boolean | undefined,
): BillingAccountModalLineItem {
    const displayAmount = getLineItemMemberPaymentAmount(
        item,
        billingAccountDetails,
        showMemberPaymentsRemaining,
    )
    const challengeFeeAmount = showMemberPaymentsRemaining
        ? undefined
        : calculatePaymentChallengeFee(displayAmount, billingAccountDetails.markup)

    return {
        ...item,
        challengeFeeAmount: challengeFeeAmount !== undefined && challengeFeeAmount >= 0
            ? challengeFeeAmount
            : undefined,
        displayAmount,
    }
}

/**
 * Builds a lookup from engagement assignment ids to their parent engagement ids.
 *
 * @param engagements Engagements fetched for the current project.
 * @returns Map keyed by assignment id with engagement id values.
 * @remarks Billing-account engagement rows store assignment ids, while the
 * work-app engagement route needs the parent engagement id.
 */
function buildEngagementIdsByAssignmentId(engagements: Engagement[]): Map<string, string> {
    return engagements.reduce((assignmentMap, engagement) => {
        const engagementId = normalizeRouteId(engagement.id)

        if (!engagementId) {
            return assignmentMap
        }

        engagement.assignments.forEach(assignment => {
            const assignmentId = normalizeRouteId(assignment.id)

            if (assignmentId) {
                assignmentMap.set(assignmentId, engagementId)
            }
        })

        return assignmentMap
    }, new Map<string, string>())
}

/**
 * Resolves the link target for a modal line item name.
 *
 * @param item Line item rendered in the billing-account details modal.
 * @param projectId Project id used for project-scoped engagement routes.
 * @param engagementIdsByAssignmentId Lookup from engagement assignment ids to engagement ids.
 * @returns Work-app URL path, or `undefined` when the row cannot be linked safely.
 * @remarks Challenge rows link directly by external id. Engagement rows first
 * use an explicit `engagementId` when provided, then fall back to the assignment
 * lookup because current billing-account rows are assignment-keyed.
 */
function getLineItemUrl(
    item: BillingAccountModalLineItem,
    projectId: string | undefined,
    engagementIdsByAssignmentId: Map<string, string>,
): string | undefined {
    const externalId = normalizeRouteId(item.externalId)

    if (item.externalType === 'CHALLENGE' && externalId) {
        return buildChallengeUrl(externalId)
    }

    if (item.externalType !== 'ENGAGEMENT' || !projectId) {
        return undefined
    }

    const engagementId = normalizeRouteId(item.engagementId)
        || (externalId ? engagementIdsByAssignmentId.get(externalId) : undefined)

    return engagementId
        ? buildEngagementUrl(projectId, engagementId)
        : undefined
}

export const BillingAccountLineItemsModal: FC<BillingAccountLineItemsModalProps> = (
    props: BillingAccountLineItemsModalProps,
) => {
    const [sortBy, setSortBy] = useState<SortField>('date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    const lineItems = useMemo<BillingAccountModalLineItem[]>(
        () => combineBillingAccountLineItems(props.billingAccountDetails)
            .map(item => getDisplayLineItem(
                item,
                props.billingAccountDetails,
                props.showMemberPaymentsRemaining,
            )),
        [props.billingAccountDetails, props.showMemberPaymentsRemaining],
    )
    const normalizedProjectId = useMemo(
        () => normalizeRouteId(props.projectId),
        [props.projectId],
    )
    const hasEngagementLineItems = useMemo(
        () => lineItems.some(item => item.externalType === 'ENGAGEMENT' && !!item.externalId),
        [lineItems],
    )
    const showChallengeFeeColumn = !props.showMemberPaymentsRemaining
    const engagementResult = useFetchEngagements(
        normalizedProjectId,
        ENGAGEMENT_ASSIGNMENT_FILTERS,
        {
            enabled: !!normalizedProjectId && hasEngagementLineItems,
        },
    )
    const engagementIdsByAssignmentId = useMemo(
        () => buildEngagementIdsByAssignmentId(engagementResult.engagements),
        [engagementResult.engagements],
    )

    const sortedLineItems = useMemo<BillingAccountModalLineItem[]>(
        () => sortLineItems(lineItems, sortBy, sortOrder),
        [lineItems, sortBy, sortOrder],
    )
    const copilotBudgetInfo = useMemo(() => (
        props.showMemberPaymentsRemaining
            ? getCopilotMemberPaymentsBudgetInfo(props.billingAccountDetails)
            : undefined
    ), [props.billingAccountDetails, props.showMemberPaymentsRemaining])
    const copilotBudgetStatusClass = copilotBudgetInfo
        ? styles[`budget${copilotBudgetInfo.status.charAt(0)
            .toUpperCase()}${copilotBudgetInfo.status.slice(1)}`]
        : ''
    const tableClassName = showChallengeFeeColumn
        ? styles.table
        : `${styles.table} ${styles.tableWithoutFee}`

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

                {props.showMemberPaymentsRemaining ? (
                    <div className={styles.summary}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Remaining member payments</span>
                            <span
                                className={[
                                    styles.summaryValue,
                                    styles.budgetValue,
                                    copilotBudgetStatusClass,
                                ].join(' ')}
                            >
                                {copilotBudgetInfo
                                    ? formatCurrency(copilotBudgetInfo.memberPaymentsRemaining)
                                    : '-'}
                            </span>
                        </div>
                    </div>
                ) : (
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
                )}

                <div className={styles.body}>
                    {sortedLineItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            No line items found for this billing account.
                        </div>
                    ) : (
                        <table className={tableClassName}>
                            <thead>
                                <tr>
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortAmount}
                                            type='button'
                                        >
                                            Member Payments
                                            {renderSortIcon('amount')}
                                        </button>
                                    </th>
                                    {showChallengeFeeColumn ? (
                                        <th>Challenge Fee</th>
                                    ) : undefined}
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
                                    const lineItemUrl = getLineItemUrl(
                                        item,
                                        normalizedProjectId,
                                        engagementIdsByAssignmentId,
                                    )

                                    return (
                                        <tr key={item.id}>
                                            <td>{formatLineItemAmount(item)}</td>
                                            {showChallengeFeeColumn ? (
                                                <td>{formatLineItemChallengeFee(item)}</td>
                                            ) : undefined}
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
                                                {lineItemUrl ? (
                                                    <a
                                                        className={styles.resourceLink}
                                                        href={lineItemUrl}
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
