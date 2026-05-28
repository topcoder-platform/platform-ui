import { FC } from 'react'

import { PaymentEngagementDetails } from '../../../models/WinningDetail'
import {
    formatOptionalDate,
    formatOptionalText,
    formatPaymentCycle,
    getEngagementHoursPerDay,
    renderOptionalLinkedText,
} from '../payment-view.utils'
import styles from '../PaymentView.module.scss'

interface PaymentEngagementDetailsTabProps {
    readonly engagementDetails?: PaymentEngagementDetails
    readonly errorMessage?: string
    readonly isLoading: boolean
    readonly projectLink?: string
}

const PaymentEngagementDetailsTab: FC<PaymentEngagementDetailsTabProps> = (
    props: PaymentEngagementDetailsTabProps,
) => {
    if (props.isLoading) {
        return <p className={styles.helperText}>Loading engagement details...</p>
    }

    if (props.errorMessage) {
        return <p className={styles.helperText}>{props.errorMessage}</p>
    }

    if (!props.engagementDetails) {
        return (
            <p className={styles.helperText}>
                Engagement details are unavailable for this payment.
            </p>
        )
    }

    const hoursPerDay = getEngagementHoursPerDay(props.engagementDetails)

    return (
        <div className={styles.tabPanelContent}>
            <div className={styles.detailsGrid}>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Project Name</span>
                    {props.projectLink && props.engagementDetails.projectName
                        ? (
                            <a
                                className={styles.linkValue}
                                href={props.projectLink}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {props.engagementDetails.projectName}
                            </a>
                        )
                        : (
                            <p className={styles.value}>
                                {formatOptionalText(props.engagementDetails.projectName)}
                            </p>
                        )}
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Rate per Hour</span>
                    <p className={styles.value}>
                        {props.engagementDetails.ratePerHour
                            ? Number(props.engagementDetails.ratePerHour)
                                .toLocaleString(undefined, {
                                    currency: 'USD',
                                    style: 'currency',
                                })
                            : '-'}
                    </p>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Duration</span>
                    <p className={styles.value}>
                        {props.engagementDetails.durationMonths
                            ? `${props.engagementDetails.durationMonths} month${
                                props.engagementDetails.durationMonths === 1 ? '' : 's'
                            }`
                            : '-'}
                    </p>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Standard Hours per Day</span>
                    <p className={styles.value}>
                        {formatOptionalText(hoursPerDay)}
                    </p>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Billing Start Date</span>
                    <p className={styles.value}>
                        {formatOptionalDate(props.engagementDetails.billingStartDate)}
                    </p>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Payment Cycle</span>
                    <p className={styles.value}>
                        {formatPaymentCycle(props.engagementDetails)}
                    </p>
                </div>
            </div>
            <div className={styles.infoItemFull}>
                <span className={styles.label}>Other Remarks</span>
                <p className={styles.remarksValue}>
                    {renderOptionalLinkedText(props.engagementDetails.otherRemarks)}
                </p>
            </div>
        </div>
    )
}

export default PaymentEngagementDetailsTab
