import { FC } from 'react'

import {
    BaseModal,
    Button,
} from '~/libs/ui'

import {
    useFetchAssignmentPayments,
} from '../../hooks'
import {
    getPaymentAmount,
    getPaymentStatus,
} from '../../utils'
import {
    formatCurrency,
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
                            {paymentsResult.payments.map((payment, index) => (
                                <li
                                    key={payment.id || `${props.assignmentId || 'assignment'}-${index}`}
                                    className={styles.item}
                                >
                                    <div className={styles.itemHeader}>
                                        <strong>{formatCurrency(getPaymentAmount(payment))}</strong>
                                        <span className={styles.status}>{getPaymentStatus(payment)}</span>
                                    </div>
                                    <div className={styles.itemBody}>
                                        <div>{payment.title || payment.description || 'Payment'}</div>
                                        <div className={styles.remarks}>
                                            {payment.attributes?.remarks || 'No remarks'}
                                        </div>
                                        <div className={styles.date}>
                                            {formatDate(payment.createdAt || payment.updatedAt)}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )
                    : undefined}
            </div>
        </BaseModal>
    )
}

export default PaymentHistoryModal
