/* eslint-disable no-use-before-define */
import { FC, useCallback, useEffect, useMemo, useState } from 'react'

import {
    Contract,
    DashboardSummary,
    Invoice,
} from '../../lib/models'
import { getDashboardSummary, getOverdueInvoices } from '../../lib/services'
import { getProcurementApiErrorMessage } from '../../lib/utils/api.utils'
import {
    formatBusinessDate,
    formatDaysLeft,
    formatMoney,
    formatStatusLabel,
} from '../../lib/utils/format.utils'

import styles from './ProcurementDashboardPage.module.scss'

interface SummaryCard {
    label: string
    meta?: string
    value: string
}

/**
 * Procurement dashboard with summary cards and urgent operational tables.
 */
export const ProcurementDashboardPage: FC = () => {
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([])
    const [summary, setSummary] = useState<DashboardSummary | undefined>()

    const summaryCards: SummaryCard[] = useMemo(
        () => buildSummaryCards(summary),
        [summary],
    )

    const loadDashboard = useCallback(async (): Promise<void> => {
        setErrorMessage('')
        setIsLoading(true)

        try {
            const [nextSummary, nextOverdueInvoices]: [DashboardSummary, Invoice[]] = await Promise.all([
                getDashboardSummary(),
                getOverdueInvoices(),
            ])

            setSummary(nextSummary)
            setOverdueInvoices(nextOverdueInvoices)
        } catch (error) {
            setErrorMessage(getProcurementApiErrorMessage(error))
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadDashboard()
    }, [loadDashboard])

    if (isLoading) {
        return <div className={styles.state}>Loading procurement dashboard...</div>
    }

    if (errorMessage) {
        return (
            <div className={styles.state} role='alert'>
                {errorMessage}
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <section className={styles.summaryGrid} aria-label='Procurement summary'>
                {summaryCards.map((card: SummaryCard) => (
                    <article className={styles.summaryCard} key={card.label}>
                        <span className={styles.cardLabel}>{card.label}</span>
                        <strong>{card.value}</strong>
                        {!!card.meta && <span className={styles.cardMeta}>{card.meta}</span>}
                    </article>
                ))}
            </section>

            <div className={styles.tableGrid}>
                <section className={styles.panel} aria-labelledby='expiring-contracts-title'>
                    <header className={styles.panelHeader}>
                        <h2 id='expiring-contracts-title'>Expiring contracts</h2>
                    </header>
                    <ExpiringContractsTable contracts={summary?.expiringContracts || []} />
                </section>

                <section className={styles.panel} aria-labelledby='overdue-invoices-title'>
                    <header className={styles.panelHeader}>
                        <h2 id='overdue-invoices-title'>Overdue invoices</h2>
                    </header>
                    <OverdueInvoicesTable invoices={overdueInvoices} />
                </section>
            </div>
        </div>
    )
}

/**
 * Builds dashboard summary card data from the dashboard response.
 *
 * @param summary Dashboard summary response.
 * @returns Card view models.
 */
function buildSummaryCards(summary?: DashboardSummary): SummaryCard[] {
    if (!summary) {
        return []
    }

    return [
        {
            label: 'Vendors',
            value: String(summary.vendorCount),
        },
        {
            label: 'Active contracts',
            value: String(summary.activeContractCount),
        },
        {
            label: 'Pending invoices',
            meta: formatMoney(summary.pendingInvoiceTotal),
            value: String(summary.pendingInvoiceCount),
        },
        {
            label: 'Overdue invoices',
            meta: formatMoney(summary.overdueInvoiceTotal),
            value: String(summary.overdueInvoiceCount),
        },
        {
            label: 'Expiring contracts',
            value: String(summary.expiringContractCount),
        },
        {
            label: 'Active renewals',
            value: String(summary.activeRenewalCount),
        },
    ]
}

/**
 * Renders the dashboard expiring-contract preview table.
 *
 * @param props Table props.
 * @returns Expiring contracts table.
 */
const ExpiringContractsTable: FC<{ contracts: Contract[] }> = props => (
    <div className={styles.tableWrap}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Contract</th>
                    <th>Vendor</th>
                    <th>End date</th>
                    <th>Lifecycle</th>
                    <th>Days left</th>
                </tr>
            </thead>
            <tbody>
                {props.contracts.length === 0 && (
                    <tr>
                        <td colSpan={5}>No expiring contracts.</td>
                    </tr>
                )}
                {props.contracts.map((contract: Contract) => (
                    <tr key={contract.id}>
                        <td>
                            <strong>{contract.contractNumber}</strong>
                            <span>{contract.title}</span>
                        </td>
                        <td>{contract.vendor.name}</td>
                        <td>{formatBusinessDate(contract.endDate)}</td>
                        <td>{formatStatusLabel(contract.lifecycle)}</td>
                        <td>{formatDaysLeft(contract.endDate)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

/**
 * Renders the dashboard overdue-invoice table.
 *
 * @param props Table props.
 * @returns Overdue invoices table.
 */
const OverdueInvoicesTable: FC<{ invoices: Invoice[] }> = props => (
    <div className={styles.tableWrap}>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Invoice</th>
                    <th>Vendor</th>
                    <th>Due date</th>
                    <th>Amount</th>
                    <th>State</th>
                </tr>
            </thead>
            <tbody>
                {props.invoices.length === 0 && (
                    <tr>
                        <td colSpan={5}>No overdue invoices.</td>
                    </tr>
                )}
                {props.invoices.map((invoice: Invoice) => (
                    <tr key={invoice.id}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.vendor.name}</td>
                        <td>{formatBusinessDate(invoice.dueDate)}</td>
                        <td>{formatMoney(invoice.amount)}</td>
                        <td>{formatStatusLabel(invoice.paymentState)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)
