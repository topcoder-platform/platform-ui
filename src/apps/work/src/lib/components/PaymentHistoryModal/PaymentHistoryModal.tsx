import { FC } from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import {
    useFetchAssignmentPayments,
} from '../../hooks'
import {
    formatCurrency,
    getPaymentAmount,
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
                                const paymentStatus = getPaymentStatus(payment)
                                const paymentHoursWorked = getPaymentHoursWorked(payment)
                                const paymentRemarks = getPaymentRemarks(payment)
                                const paymentCreator = getPaymentCreatorLabel(payment)
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
                                            <strong>{formatCurrency(getPaymentAmount(payment))}</strong>
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
                                            <div className={styles.paymentCreator}>
                                                <span className={styles.paymentCreatorLabel}>
                                                    Payment Creator:
                                                </span>
                                                <span>{paymentCreator || '-'}</span>
                                            </div>
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
