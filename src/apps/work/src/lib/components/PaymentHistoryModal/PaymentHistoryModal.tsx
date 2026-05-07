import { FC } from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import {
    BILLING_ACCOUNT_MEMBER_PAYMENT_DETAILS_ENABLED,
} from '../../constants'
import {
    useFetchAssignmentPayments,
} from '../../hooks'
import {
    formatCurrency,
    getPaymentAmount,
    getPaymentBillingAccountId,
    getPaymentBillingAccountName,
    getPaymentChallengeFee,
    getPaymentCreatorLabel,
    getPaymentHoursWorked,
    getPaymentRemarks,
    getPaymentStatus,
    renderPaymentLinkedText,
} from '../../utils/payment.utils'

import styles from './PaymentHistoryModal.module.scss'

interface PaymentHistoryModalProps {
    assignmentId: number | string | undefined
    memberHandle?: string
    onClose: () => void
    open: boolean
}

function formatDate(value?: string): string {
    if (!value) {
        return '-'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

/**
 * Renders billing account ID and name rows for a payment history entry.
 *
 * @param billingAccountId billing account id resolved from the payment detail.
 * @param billingAccountName billing account name resolved from the payment detail.
 * @returns billing account metadata rows, or `undefined` when no billing account
 * data is available.
 *
 * @remarks Used inside each payment history row after finance payment details
 * have been hydrated with billing account names.
 *
 * @throws This helper does not raise exceptions.
 */
const renderPaymentBillingAccountDetails = (
    billingAccountId: string,
    billingAccountName: string,
): JSX.Element | undefined => {
    if (!billingAccountId && !billingAccountName) {
        return undefined
    }

    return (
        <>
            <div className={styles.metaRow}>
                <span className={styles.metaLabel}>
                    BA ID:
                </span>
                <span>{billingAccountId || '-'}</span>
            </div>
            <div className={styles.metaRow}>
                <span className={styles.metaLabel}>
                    BA Name:
                </span>
                <span>{billingAccountName || '-'}</span>
            </div>
        </>
    )
}

const PaymentHistoryModal: FC<PaymentHistoryModalProps> = (
    props: PaymentHistoryModalProps,
) => {
    const paymentsResult = useFetchAssignmentPayments(props.assignmentId)

    return (
        <BaseModal
            open={props.open}
            onClose={props.onClose}
            title='Payment History'
            size='lg'
            buttons={(
                <Button
                    label='Close'
                    onClick={props.onClose}
                    secondary
                />
            )}
        >
            <div className={styles.content}>
                <div className={styles.subtitle}>{props.memberHandle || '-'}</div>

                {paymentsResult.isLoading
                    ? <div className={styles.placeholder}>Loading payment history...</div>
                    : undefined}

                {!paymentsResult.isLoading && paymentsResult.error
                    ? <div className={styles.error}>{paymentsResult.error.message}</div>
                    : undefined}

                {!paymentsResult.isLoading
                && !paymentsResult.error
                && paymentsResult.payments.length === 0
                    ? <div className={styles.placeholder}>No payments yet.</div>
                    : undefined}

                {!paymentsResult.isLoading
                && !paymentsResult.error
                && paymentsResult.payments.length > 0
                    ? (
                        <ul className={styles.list}>
                            {paymentsResult.payments.map((payment, index) => {
                                const paymentAmount = getPaymentAmount(payment)
                                const paymentChallengeFee = BILLING_ACCOUNT_MEMBER_PAYMENT_DETAILS_ENABLED
                                    ? getPaymentChallengeFee(payment)
                                    : undefined
                                const paymentStatus = getPaymentStatus(payment)
                                const paymentHoursWorked = getPaymentHoursWorked(payment)
                                const paymentRemarks = getPaymentRemarks(payment)
                                const paymentCreator = getPaymentCreatorLabel(payment)
                                const paymentBillingAccountId = getPaymentBillingAccountId(payment)
                                const paymentBillingAccountName = getPaymentBillingAccountName(payment)
                                const normalizedPaymentStatus = paymentStatus
                                    .trim()
                                    .toLowerCase()
                                const showPaymentStatus = paymentStatus
                                    && normalizedPaymentStatus !== 'unknown'

                                return (
                                    <li
                                        key={payment.id || `${props.assignmentId || 'assignment'}-${index}`}
                                        className={styles.item}
                                    >
                                        <div className={styles.itemHeader}>
                                            <div className={styles.amountBlock}>
                                                <span className={styles.amount}>
                                                    {formatCurrency(paymentAmount)}
                                                </span>
                                                {paymentChallengeFee !== undefined
                                                    ? (
                                                        <div className={styles.metaRow}>
                                                            <span className={styles.metaLabel}>
                                                                Fee:
                                                            </span>
                                                            <span>{formatCurrency(paymentChallengeFee)}</span>
                                                        </div>
                                                    )
                                                    : undefined}
                                            </div>
                                            {showPaymentStatus
                                                ? <span className={styles.status}>{paymentStatus}</span>
                                                : undefined}
                                        </div>
                                        <div className={styles.itemBody}>
                                            <div>{payment.title || payment.description || 'Payment'}</div>
                                            {paymentRemarks
                                                ? (
                                                    <div className={styles.remarks}>
                                                        {renderPaymentLinkedText(paymentRemarks)}
                                                    </div>
                                                )
                                                : <div className={styles.remarks}>No remarks</div>}
                                            {paymentHoursWorked
                                                ? (
                                                    <div className={styles.hoursWorked}>
                                                        Hours Worked:
                                                        {' '}
                                                        {paymentHoursWorked}
                                                    </div>
                                                )
                                                : undefined}
                                            <div className={styles.metaRow}>
                                                <span className={styles.metaLabel}>
                                                    Payment Creator:
                                                </span>
                                                <span>{paymentCreator || '-'}</span>
                                            </div>
                                            {renderPaymentBillingAccountDetails(
                                                paymentBillingAccountId,
                                                paymentBillingAccountName,
                                            )}
                                            <div className={styles.date}>
                                                {formatDate(payment.createdAt || payment.updatedAt)}
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )
                    : undefined}
            </div>
        </BaseModal>
    )
}

export default PaymentHistoryModal
