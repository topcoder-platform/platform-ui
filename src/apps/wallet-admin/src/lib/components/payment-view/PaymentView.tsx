/* eslint-disable unicorn/no-null */
/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import React from 'react'

import { Button, Collapsible } from '~/libs/ui'

import { Winning } from '../../models/WinningDetail'

import styles from './PaymentView.module.scss'

interface PaymentViewProps {
    payment: Winning
    auditLines?: {
        date: string
        userName: string
        action: string
    }[]
}

const PaymentView: React.FC<PaymentViewProps> = (props: PaymentViewProps) => {
    const [view, setView] = React.useState<'details' | 'audit'>('details')

    const handleToggleView = (): void => {
        setView(view === 'details' ? 'audit' : 'details')
    }

    return (
        <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
                {view === 'details' && (
                    <>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Handle</span>
                            <p className={styles.value}>{props.payment.handle}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.label}>Type</span>
                            <p className={styles.value}>{props.payment.type}</p>
                        </div>

                        <div className={styles.infoItem}>
                            <span className={styles.label}>Description</span>
                            <p className={styles.value}>{props.payment.description}</p>
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
                            {props.auditLines && props.auditLines.map(line => (
                                <Collapsible
                                    header={(
                                        <h3>
                                            {
                                                new Date(line.date)
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
                                                {line.userName}
                                            </p>
                                            <p>
                                                <strong>Action:</strong>
                                                {' '}
                                                {line.action}
                                            </p>
                                        </div>
                                    </div>
                                </Collapsible>
                            ))}
                            {(props.auditLines === undefined || props.auditLines.length === 0)
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
