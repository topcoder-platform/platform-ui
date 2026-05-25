import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { WinningsAudit } from '../../../models/WinningsAudit'
import { formatAuditTimestamp } from '../payment-view.utils'
import styles from '../PaymentView.module.scss'

interface PaymentAuditHistoryTabProps {
    readonly auditLines: WinningsAudit[]
    readonly formatAction: (action: string) => ReactNode
    readonly isLoading: boolean
}

const PaymentAuditHistoryTab: FC<PaymentAuditHistoryTabProps> = (
    props: PaymentAuditHistoryTabProps,
) => {
    if (props.isLoading) {
        return <p className={styles.helperText}>Loading audit history...</p>
    }

    if (props.auditLines.length === 0) {
        return <p className={styles.helperText}>No audit data available</p>
    }

    return (
        <div className={styles.auditTableWrap} role='table'>
            <div className={styles.auditGridHeader} role='row'>
                <div className={styles.auditGridHeadCell} role='columnheader'>Date</div>
                <div className={styles.auditGridHeadCell} role='columnheader'>User</div>
                <div className={styles.auditGridHeadCell} role='columnheader'>Action</div>
                <div className={styles.auditGridHeadCell} role='columnheader'>Note</div>
            </div>
            {props.auditLines.map((line, index) => (
                <div
                    key={line.id}
                    role='row'
                    className={classNames(
                        styles.auditGridRow,
                        index % 2 === 0 ? styles.auditGridRowOdd : styles.auditGridRowEven,
                    )}
                >
                    <div className={styles.auditGridCell} role='cell'>
                        {formatAuditTimestamp(line.createdAt)}
                    </div>
                    <div className={styles.auditGridCell} role='cell'>
                        {line.userId}
                    </div>
                    <div
                        className={classNames(styles.auditGridCell, styles.auditGridActionCell)}
                        role='cell'
                    >
                        {props.formatAction(line.action)}
                    </div>
                    <div className={styles.auditGridCell} role='cell'>
                        {line.note || '-'}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default PaymentAuditHistoryTab
