import { FC } from 'react'
import classNames from 'classnames'

import { formatCurrencyAmount, formatOptionalText } from './payment-view.utils'
import styles from './PaymentView.module.scss'

interface PaymentDetailsSummaryRowProps {
    readonly approverLabel?: string
    readonly budgetApproverHandle?: string
    readonly columns?: 2 | 4 | 5
    readonly creatorLabel?: string
    readonly handle: string
    readonly paymentAmount: number
    readonly paymentApproverHandle?: string
    readonly paymentCreatorHandle?: string
    readonly secondaryApproverLabel?: string
    readonly isPoints?: boolean
}

const DEFAULT_CREATOR_LABEL = 'Payment Creator'
const DEFAULT_APPROVER_LABEL = 'Payment Approver'

const PaymentDetailsSummaryRow: FC<PaymentDetailsSummaryRowProps> = (
    props: PaymentDetailsSummaryRowProps,
) => {
    const columns = props.columns ?? 4
    const usesCompactSummary = columns === 2
    const usesBudgetApproverColumn = columns === 5
    const usesBudgetApproverLabel = props.approverLabel === 'Budget Approver'

    if (usesCompactSummary) {
        return (
            <div className={classNames(styles.summaryRow, styles.summaryRowTwo)}>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>Handle</span>
                    <span className={styles.summaryValue}>{props.handle}</span>
                </div>
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>{props.isPoints ? 'Points' : 'Payment'}</span>
                    <span className={styles.summaryValue}>
                        {props.isPoints
                            ? String(props.paymentAmount)
                            : formatCurrencyAmount(props.paymentAmount)}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div
            className={classNames(styles.summaryRow, {
                [styles.summaryRowFive]: usesBudgetApproverColumn,
            })}
        >
            <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Handle</span>
                <span className={styles.summaryValue}>{props.handle}</span>
            </div>
            <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{props.isPoints ? 'Points' : 'Payment'}</span>
                <span className={styles.summaryValue}>
                    {props.isPoints
                        ? String(props.paymentAmount)
                        : formatCurrencyAmount(props.paymentAmount)}
                </span>
            </div>
            <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>
                    {props.creatorLabel ?? DEFAULT_CREATOR_LABEL}
                </span>
                <span className={styles.summaryValue}>
                    {formatOptionalText(props.paymentCreatorHandle)}
                </span>
            </div>
            <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>
                    {props.approverLabel ?? DEFAULT_APPROVER_LABEL}
                </span>
                <span className={styles.summaryValue}>
                    {formatOptionalText(
                        usesBudgetApproverColumn || usesBudgetApproverLabel
                            ? props.budgetApproverHandle
                            : props.paymentApproverHandle,
                    )}
                </span>
            </div>
            {usesBudgetApproverColumn && (
                <div className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>
                        {props.secondaryApproverLabel ?? DEFAULT_APPROVER_LABEL}
                    </span>
                    <span className={styles.summaryValue}>
                        {formatOptionalText(props.paymentApproverHandle)}
                    </span>
                </div>
            )}
        </div>
    )
}

export default PaymentDetailsSummaryRow
