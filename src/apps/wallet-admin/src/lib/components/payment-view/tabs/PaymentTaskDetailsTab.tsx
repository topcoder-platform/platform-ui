import { FC } from 'react'

import { Winning, WinningPaymentDetails } from '../../../models/WinningDetail'
import {
    formatOptionalText,
    resolveTaskCreatorHandle,
    stripHtml,
} from '../payment-view.utils'
import styles from '../PaymentView.module.scss'

interface PaymentTaskDetailsTabProps {
    readonly errorMessage?: string
    readonly isLoading: boolean
    readonly payment: Winning
    readonly paymentDetails?: WinningPaymentDetails
    readonly projectLink?: string
}

const PaymentTaskDetailsTab: FC<PaymentTaskDetailsTabProps> = (
    props: PaymentTaskDetailsTabProps,
) => {
    if (props.isLoading) {
        return <p className={styles.helperText}>Loading task details...</p>
    }

    if (props.errorMessage) {
        return <p className={styles.helperText}>{props.errorMessage}</p>
    }

    const taskDescription = props.paymentDetails?.taskDetails?.taskDescription
        ?? props.payment.description
    const taskCreatorHandle = resolveTaskCreatorHandle(props.paymentDetails)

    return (
        <div className={styles.tabPanelContent}>
            <div className={styles.infoItemFull}>
                <span className={styles.label}>Task Creator</span>
                <p className={styles.value}>
                    {formatOptionalText(taskCreatorHandle)}
                </p>
            </div>
            <div className={styles.infoItemFull}>
                <span className={styles.label}>Project Name</span>
                {props.projectLink && props.paymentDetails?.taskDetails?.projectName
                    ? (
                        <a
                            className={styles.linkValue}
                            href={props.projectLink}
                            target='_blank'
                            rel='noreferrer'
                        >
                            {props.paymentDetails.taskDetails.projectName}
                        </a>
                    )
                    : (
                        <p className={styles.value}>
                            {formatOptionalText(props.paymentDetails?.taskDetails?.projectName)}
                        </p>
                    )}
            </div>
            <div className={styles.infoItemFull}>
                <span className={styles.label}>Task Description</span>
                <p className={styles.remarksValue}>
                    {taskDescription
                        ? stripHtml(taskDescription)
                        : '-'}
                </p>
            </div>
            <div className={styles.infoItemFull}>
                <span className={styles.label}>Payment Approver</span>
                <p className={styles.value}>
                    {formatOptionalText(props.paymentDetails?.taskDetails?.paymentApproverHandle)}
                </p>
            </div>
        </div>
    )
}

export default PaymentTaskDetailsTab
