import { FC } from 'react'

import { Winning } from '../../../models/WinningDetail'

import styles from '../PaymentView.module.scss'

interface PaymentGeneralInfoTabProps {
    readonly createDate: string
    readonly description: string
    readonly descriptionLink?: string
    readonly payment: Winning
}

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
    </div>
)

export default PaymentGeneralInfoTab
