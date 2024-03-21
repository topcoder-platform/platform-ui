/* eslint-disable unicorn/no-null */
/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import React from 'react'

import { Button, Collapsible } from '~/libs/ui'
import { TOPCODER_URL } from '~/config/environments/default.env'

import { WinningsAudit } from '../../models/WinningsAudit'
import { Winning } from '../../models/WinningDetail'
import { fetchAuditLogs, getMemberHandle } from '../../services/wallet'

import styles from './PaymentView.module.scss'

interface PaymentViewProps {
    payment: Winning
}

const PaymentView: React.FC<PaymentViewProps> = (props: PaymentViewProps) => {
    const [view, setView] = React.useState<'details' | 'audit'>('details')
    const [auditLines, setAuditLines] = React.useState<WinningsAudit[]>([])

    const handleToggleView = (): void => {
        setView(view === 'details' ? 'audit' : 'details')
    }

    React.useEffect(() => {
        if (view === 'audit') {
            fetchAuditLogs(props.payment.id)
                .then(auditLogs => {
                    const userIds = auditLogs.map(log => log.userId)
                    getMemberHandle(userIds)
                        .then((handles: Map<number, string>) => {
                            auditLogs.forEach((log: WinningsAudit) => {
                                log.userId = handles.get(parseInt(log.userId, 10)) ?? log.userId
                            })
                        })
                        .catch(() => {
                            console.error('Error fetching member handles')
                        })
                        .finally(() => {
                            setAuditLines(auditLogs)
                        })
                })
                .catch(() => {
                    setAuditLines([])
                })
        }
    }, [props.payment.id, view])

    const formatAction = (action: string): React.ReactNode => {
        const fromIndex = action.indexOf('from')
        const toIndex = action.indexOf('to')

        if (fromIndex !== -1 && toIndex !== -1) {
            const beforeFrom = action.substring(0, fromIndex)
            const fromValue = action.substring(fromIndex + 5, toIndex)
            const toValue = action.substring(toIndex + 3)
            return (
                <>
                    {beforeFrom}
                    from
                    {' '}
                    <strong>{fromValue}</strong>
                    {' '}
                    to
                    {' '}
                    <strong>{toValue}</strong>
                </>
            )
        }

        return action
    }

    const getLink = (externalId: string): string => `${TOPCODER_URL}/challenges/${externalId}`

    return (
        <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
                {view === 'details' && (
                    <>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Description</span>
                            <a href={getLink(props.payment.externalId)} target='_blank' rel='noreferrer'>
                                {props.payment.description}
                            </a>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Payment ID</span>
                            <p className={styles.value}>{props.payment.id}</p>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Handle</span>
                            <p className={styles.value}>{props.payment.handle}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.label}>Type</span>
                            <p className={styles.value}>{props.payment.type}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.label}>Net Payment</span>
                            <p className={styles.value}>{props.payment.netPaymentNumber.toLocaleString(undefined, { currency: 'USD', style: 'currency' })}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.label}>Payment Status</span>
                            <p className={styles.value}>{props.payment.status}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.label}>Release Date</span>
                            <p className={styles.value}>{props.payment.releaseDateObj.toLocaleDateString()}</p>
                        </div>

                        {props.payment.datePaid !== '-' && (
                            (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>Date Paid</span>
                                    <p className={styles.value}>{props.payment.datePaid}</p>
                                </div>
                            ))}

                        <div className={styles.infoItem}>
                            <Button
                                onClick={handleToggleView}
                                label='View Audit'
                            />
                        </div>
                    </>
                )}

                {view === 'audit' && (
                    <>
                        <div className={styles.auditSection}>
                            {auditLines && auditLines.length > 0 && auditLines.map(line => (
                                <Collapsible
                                    key={line.id}
                                    header={(
                                        <h3>
                                            {
                                                new Date(line.createdAt)
                                                    .toLocaleString()
                                            }
                                        </h3>
                                    )}
                                    containerClass={styles.container}
                                    contentClass={styles.content}
                                >
                                    <div className={styles.auditItem}>
                                        <div>
                                            <p>
                                                <strong>User:</strong>
                                                {' '}
                                                {line.userId}
                                            </p>
                                            <p>
                                                <strong>Action:</strong>
                                                {' '}
                                                {formatAction(line.action)}
                                            </p>
                                            <p>
                                                <strong>Note:</strong>
                                                {' '}
                                                {line.note}
                                            </p>
                                        </div>
                                    </div>
                                </Collapsible>
                            ))}
                            {(auditLines === undefined || auditLines.length === 0)
                                && (
                                    <div className={styles.auditItem}>
                                        <p>No audit data available</p>
                                    </div>
                                )}
                        </div>
                        <div className={styles.infoItem}>
                            <Button
                                onClick={handleToggleView}
                                label='Back to Details'
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PaymentView
