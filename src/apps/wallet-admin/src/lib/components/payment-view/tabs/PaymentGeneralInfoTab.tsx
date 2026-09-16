import { FC } from 'react'

import { Winning } from '../../../models/WinningDetail'
import { formatCurrencyAmount } from '../payment-view.utils'
import styles from '../PaymentView.module.scss'

interface PaymentGeneralInfoTabProps {
    readonly createDate: string
    readonly description: string
    readonly descriptionLink?: string
    readonly payment: Winning
}

/**
 * Shows winning metadata and the amount/status of each historical installment.
 * @param props Formatted winning and its description/date presentation values.
 * @returns General Info content, with a breakdown for multi-installment payments.
 * @throws RangeError if a stored installment contains an invalid currency code.
 */
const PaymentGeneralInfoTab: FC<PaymentGeneralInfoTabProps> = (props: PaymentGeneralInfoTabProps) => (
    <div className={styles.tabPanelContent}>
        <div className={styles.infoItemFull}>
            <span className={styles.label}>Description</span>
            {props.descriptionLink
                ? (
                    <a
                        className={styles.linkValue}
                        href={props.descriptionLink}
                        target='_blank'
                        rel='noreferrer'
                    >
                        {props.description}
                    </a>
                )
                : <p className={styles.value}>{props.description}</p>}
        </div>
        <div className={styles.detailsGrid}>
            <div className={styles.infoItem}>
                <span className={styles.label}>Payment Status</span>
                <p className={styles.value}>{props.payment.status}</p>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.label}>Create Date</span>
                <p className={styles.value}>{props.createDate}</p>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.label}>Payment Type</span>
                <p className={styles.value}>{props.payment.type}</p>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.label}>Release Date</span>
                <p className={styles.value}>{props.payment.releaseDateObj.toLocaleDateString('en-GB')}</p>
            </div>
            <div className={styles.infoItem}>
                <span className={styles.label}>Payment ID</span>
                <p className={styles.value}>{props.payment.id}</p>
            </div>
            {props.payment.datePaid !== '-' && (
                <div className={styles.infoItem}>
                    <span className={styles.label}>Date Paid</span>
                    <p className={styles.value}>{props.payment.datePaid}</p>
                </div>
            )}
        </div>
        {props.payment.details.length > 1 && (
            <div className={styles.infoItemFull}>
                <span className={styles.label}>Installments</span>
                {props.payment.details.map(installment => (
                    <p key={installment.id} className={styles.value}>
                        Installment
                        {' '}
                        {installment.installmentNumber}
                        {': '}
                        {formatCurrencyAmount(Number(installment.grossAmount), installment.currency)}
                        {' — '}
                        {installment.status.replaceAll('_', ' ')
                            .toLowerCase()}
                    </p>
                ))}
            </div>
        )}
    </div>
)

export default PaymentGeneralInfoTab
