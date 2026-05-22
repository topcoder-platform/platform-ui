import { FC, ReactNode } from 'react'

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
        <div className={styles.auditTableWrap}>
            <table className={styles.auditTable}>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Note</th>
                    </tr>
                </thead>
                <tbody>
                    {props.auditLines.map(line => (
                        <tr key={line.id}>
                            <td>{formatAuditTimestamp(line.createdAt)}</td>
                            <td>{line.userId}</td>
                            <td>{props.formatAction(line.action)}</td>
                            <td>{line.note || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default PaymentAuditHistoryTab
