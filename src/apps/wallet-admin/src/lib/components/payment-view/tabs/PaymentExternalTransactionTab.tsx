/* eslint-disable react/no-array-index-key */
import { FC } from 'react'

import { Collapsible } from '~/libs/ui'

import { PayoutAudit } from '../../../models/PayoutAudit'
import styles from '../PaymentView.module.scss'

interface PaymentExternalTransactionTabProps {
    readonly isLoading: boolean
    readonly payoutAudits?: PayoutAudit[]
}

const PaymentExternalTransactionTab: FC<PaymentExternalTransactionTabProps> = (
    props: PaymentExternalTransactionTabProps,
) => {
    if (props.isLoading) {
        return <p className={styles.helperText}>Loading external transaction details...</p>
    }

    if (!props.payoutAudits || props.payoutAudits.length === 0) {
        return <p className={styles.helperText}>No external transaction data is available</p>
    }

    return (
        <div className={styles.tabPanelContent}>
            {props.payoutAudits.map((externalTransaction, index) => (
                <div key={`payout-audit-${index}`} className={styles.externalTransactionGroup}>
                    <Collapsible
                        containerClass={styles.externalTransactionCollapsible}
                        contentClass={styles.externalTransactionContent}
                        header={<h3>Internal Record</h3>}
                    >
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Provider Used</span>
                            <p className={styles.value}>{externalTransaction.paymentMethodUsed}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Status</span>
                            <p className={styles.value}>{externalTransaction.status}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Processed At</span>
                            <p className={styles.value}>{externalTransaction.createdAt}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Total Amount Processed</span>
                            <p className={styles.value}>{externalTransaction.totalNetAmount}</p>
                        </div>
                    </Collapsible>
                    <Collapsible
                        containerClass={styles.externalTransactionCollapsible}
                        contentClass={styles.externalTransactionContent}
                        header={<h3>External Record</h3>}
                    >
                        <pre className={styles.externalTransactionPre}>
                            {JSON.stringify(
                                externalTransaction.externalTransactionDetails,
                                undefined,
                                2,
                            )}
                        </pre>
                    </Collapsible>
                </div>
            ))}
        </div>
    )
}

export default PaymentExternalTransactionTab
