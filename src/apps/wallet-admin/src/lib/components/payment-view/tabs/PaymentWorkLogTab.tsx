import { FC } from 'react'

import { PaymentWorkLog } from '../../../models/WinningDetail'
import { formatOptionalText, renderOptionalLinkedText } from '../payment-view.utils'

import styles from '../PaymentView.module.scss'

interface PaymentWorkLogTabProps {
    readonly errorMessage?: string
    readonly isLoading: boolean
    readonly workLog?: PaymentWorkLog
}

const PaymentWorkLogTab: FC<PaymentWorkLogTabProps> = (props: PaymentWorkLogTabProps) => {
    if (props.isLoading) {
        return <p className={styles.helperText}>Loading work log...</p>
    }

    if (props.errorMessage) {
        return <p className={styles.helperText}>{props.errorMessage}</p>
    }

    return (
        <div className={styles.tabPanelContent}>
            <div className={styles.detailsGrid}>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Hours Worked</span>
                    <p className={styles.value}>
                        {formatOptionalText(props.workLog?.hoursWorked)}
                    </p>
                </div>
                <div className={styles.infoItemFull}>
                    <span className={styles.label}>Remarks</span>
                    <p className={styles.remarksValue}>
                        {renderOptionalLinkedText(props.workLog?.remarks)}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default PaymentWorkLogTab
