/* eslint-disable react/no-array-index-key */
/* eslint-disable unicorn/no-null */
/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable complexity */
/* eslint-disable ordered-imports/ordered-imports */
import React from 'react'

import { Button, Collapsible } from '~/libs/ui'
import { TOPCODER_URL } from '~/config/environments/default.env'

import { WinningsAudit } from '../../models/WinningsAudit'
import { Winning, WinningPaymentDetails } from '../../models/WinningDetail'
import { PayoutAudit } from '../../models/PayoutAudit'
import {
    fetchAuditLogs,
    fetchPayoutAuditLogs,
    fetchWinningPaymentDetails,
    getMemberHandle,
} from '../../services/wallet'
import {
    buildWorkAppChallengeUrl,
    buildWorkManagerAssignmentUrl,
    buildWorkManagerProjectUrl,
    formatOptionalDate,
    formatOptionalText,
    renderOptionalLinkedText,
} from './payment-view.utils'

import styles from './PaymentView.module.scss'

interface PaymentViewProps {
    isPoints?: boolean
    payment: Winning
}

const PaymentView: React.FC<PaymentViewProps> = (props: PaymentViewProps) => {
    const [view, setView] = React.useState<'details' | 'audit' | 'external_transaction'>('details')
    const [auditLines, setAuditLines] = React.useState<WinningsAudit[]>([])
    const [externalTransactionAudit, setExternalTransactionAudit] = React.useState<PayoutAudit[]>([])
    const [paymentDetails, setPaymentDetails] = React.useState<WinningPaymentDetails>()
    const [isPaymentDetailsLoading, setIsPaymentDetailsLoading] = React.useState<boolean>(false)
    const [paymentDetailsError, setPaymentDetailsError] = React.useState<string>()

    const isEngagementPayment = props.payment.type.toLowerCase() === 'engagement payment'
    const isTaskPayment = props.payment.type.toLowerCase() === 'task payment'
    const hasEngagementDetails = Boolean(paymentDetails?.engagementDetails)

    const handleToggleView = (newView: 'audit' | 'details' | 'external_transaction'): void => {
        setView(newView)
    }

    React.useEffect(() => {
        if (!isEngagementPayment && !isTaskPayment) {
            setPaymentDetails(undefined)
            setIsPaymentDetailsLoading(false)
            setPaymentDetailsError(undefined)
            return undefined
        }

        let ignore = false

        setIsPaymentDetailsLoading(true)
        setPaymentDetailsError(undefined)

        fetchWinningPaymentDetails(props.payment)
            .then(details => {
                if (!ignore) {
                    setPaymentDetails(details)
                }
            })
            .catch(() => {
                if (!ignore) {
                    setPaymentDetails(undefined)
                    setPaymentDetailsError(isTaskPayment ? 'Unable to load task details.' : 'Unable to load engagement details.')
                }
            })
            .finally(() => {
                if (!ignore) {
                    setIsPaymentDetailsLoading(false)
                }
            })

        return () => {
            ignore = true
        }
    }, [isEngagementPayment, isTaskPayment, props.payment])

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
                        .catch(() => undefined)
                        .finally(() => {
                            setAuditLines(auditLogs)
                        })
                })
                .catch(() => {
                    setAuditLines([])
                })
        } else if (view === 'external_transaction') {
            fetchPayoutAuditLogs(props.payment.id)
                .then(payoutAudit => {
                    setExternalTransactionAudit(payoutAudit)
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

    const descriptionLink = isEngagementPayment
        ? buildWorkManagerAssignmentUrl(paymentDetails?.engagementDetails)
        : isTaskPayment
            ? buildWorkAppChallengeUrl(paymentDetails?.taskDetails?.projectId, props.payment.externalId)
            : `${TOPCODER_URL}/challenges/${props.payment.externalId}`
    const projectLink = buildWorkManagerProjectUrl(paymentDetails?.engagementDetails)

    return (
        <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
                {view === 'details' && (
                    <>
                        <div className={styles.infoItem}>
                            <span className={styles.label}>Description</span>
                            {descriptionLink
                                ? (
                                    <a href={descriptionLink} target='_blank' rel='noreferrer'>
                                        {props.payment.description}
                                    </a>
                                )
                                : <p className={styles.value}>{props.payment.description}</p>}
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
                            <span className={styles.label}>{props.isPoints ? 'Points' : 'Payment'}</span>
                            <p className={styles.value}>
                                {props.isPoints ? `${props.payment.grossAmountNumber}` : props.payment.grossAmountNumber.toLocaleString(undefined, {
                                    currency: 'USD',
                                    style: 'currency',
                                })}
                            </p>
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
                            <div className={styles.infoItem}>
                                <span className={styles.label}>Date Paid</span>
                                <p className={styles.value}>{props.payment.datePaid}</p>
                            </div>
                        )}

                        {isEngagementPayment && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Engagement Details</h3>
                                {isPaymentDetailsLoading
                                    ? <p className={styles.helperText}>Loading engagement details...</p>
                                    : undefined}
                                {!isPaymentDetailsLoading && paymentDetailsError
                                    ? <p className={styles.helperText}>{paymentDetailsError}</p>
                                    : undefined}
                                {!isPaymentDetailsLoading && !paymentDetailsError && !hasEngagementDetails
                                    ? (
                                        <p className={styles.helperText}>
                                            Engagement details are unavailable for this payment.
                                        </p>
                                    )
                                    : undefined}
                                {!isPaymentDetailsLoading && !paymentDetailsError && hasEngagementDetails && (
                                    <div className={styles.sectionGrid}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Project Name</span>
                                            {projectLink && paymentDetails?.engagementDetails?.projectName
                                                ? (
                                                    <a
                                                        className={styles.value}
                                                        href={projectLink}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                    >
                                                        {paymentDetails.engagementDetails.projectName}
                                                    </a>
                                                )
                                                : (
                                                    <p className={styles.value}>
                                                        {formatOptionalText(paymentDetails?.engagementDetails?.projectName)}
                                                    </p>
                                                )}
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Billing Start Date</span>
                                            <p className={styles.value}>
                                                {formatOptionalDate(paymentDetails?.engagementDetails?.billingStartDate)}
                                            </p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Duration</span>
                                            <p className={styles.value}>
                                                {paymentDetails?.engagementDetails?.durationMonths
                                                    ? `${paymentDetails.engagementDetails.durationMonths} month${paymentDetails.engagementDetails.durationMonths === 1 ? '' : 's'}`
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Rate per Hour</span>
                                            <p className={styles.value}>
                                                {paymentDetails?.engagementDetails?.ratePerHour
                                                    ? Number(paymentDetails.engagementDetails.ratePerHour)
                                                        .toLocaleString(undefined, {
                                                            currency: 'USD',
                                                            style: 'currency',
                                                        })
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Standard Hours per Week</span>
                                            <p className={styles.value}>
                                                {formatOptionalText(paymentDetails?.engagementDetails?.standardHoursPerWeek)}
                                            </p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Other Remarks</span>
                                            <p className={styles.remarksValue}>
                                                {renderOptionalLinkedText(paymentDetails?.engagementDetails?.otherRemarks)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {isEngagementPayment && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Work Log / Manager Inputs</h3>
                                {isPaymentDetailsLoading
                                    ? <p className={styles.helperText}>Loading work log...</p>
                                    : (
                                        <div className={styles.sectionGrid}>
                                            <div className={styles.infoItem}>
                                                <span className={styles.label}>Hours Worked</span>
                                                <p className={styles.value}>
                                                    {formatOptionalText(paymentDetails?.workLog?.hoursWorked)}
                                                </p>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.label}>Remarks</span>
                                                <p className={styles.remarksValue}>
                                                    {renderOptionalLinkedText(paymentDetails?.workLog?.remarks)}
                                                </p>
                                            </div>
                                            <div className={styles.infoItem}>
                                                <span className={styles.label}>Payment Creator</span>
                                                <p className={styles.value}>
                                                    {formatOptionalText(paymentDetails?.paymentCreatorHandle)}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                            </div>
                        )}

                        {isTaskPayment && (
                            <div className={styles.section}>
                                <h3 className={styles.sectionTitle}>Task Details</h3>
                                {isPaymentDetailsLoading
                                    ? <p className={styles.helperText}>Loading task details...</p>
                                    : undefined}
                                {!isPaymentDetailsLoading && paymentDetailsError
                                    ? <p className={styles.helperText}>{paymentDetailsError}</p>
                                    : undefined}
                                {!isPaymentDetailsLoading && !paymentDetailsError && (
                                    <div className={styles.sectionGrid}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Task Creator</span>
                                            <p className={styles.value}>
                                                {formatOptionalText(paymentDetails?.taskDetails?.paymentCreatorHandle)}
                                            </p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Task Description</span>
                                            <p className={styles.remarksValue}>
                                                {props.payment.description
                                                    ? props.payment.description.substring(0, 500)
                                                    : '-'}
                                            </p>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Project Name</span>
                                            {buildWorkManagerProjectUrl(paymentDetails?.taskDetails) && paymentDetails?.taskDetails?.projectName
                                                ? (
                                                    <a
                                                        className={styles.value}
                                                        href={buildWorkManagerProjectUrl(paymentDetails.taskDetails)}
                                                        target='_blank'
                                                        rel='noreferrer'
                                                    >
                                                        {paymentDetails.taskDetails.projectName}
                                                    </a>
                                                )
                                                : (
                                                    <p className={styles.value}>
                                                        {formatOptionalText(paymentDetails?.taskDetails?.projectName)}
                                                    </p>
                                                )}
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>Payment Approver</span>
                                            <p className={styles.value}>
                                                {formatOptionalText(paymentDetails?.taskDetails?.paymentApproverHandle)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={styles.infoItem}>
                            <Button onClick={() => handleToggleView('audit')} label='View Audit' />
                            {props.payment.status.toUpperCase() === 'PAID' && (
                                <Button
                                    onClick={() => handleToggleView('external_transaction')}
                                    label='External Transaction Details'
                                />
                            )}
                        </div>
                    </>
                )}

                {view === 'audit' && (
                    <>
                        <div className={styles.auditSection}>
                            {auditLines
                                && auditLines.length > 0
                                && auditLines.map(line => (
                                    <Collapsible
                                        key={line.id}
                                        header={
                                            (
                                                <h3>
                                                    {
                                                        new Date(line.createdAt)
                                                            .toLocaleString()
                                                    }
                                                </h3>
                                            )
                                        }
                                        containerClass={styles.container}
                                        contentClass={styles.content}
                                    >
                                        <div className={styles.auditItem}>
                                            <div>
                                                <p>
                                                    <strong>User:</strong>
                                                    {line.userId}
                                                </p>
                                                <p>
                                                    <strong>Action:</strong>
                                                    {formatAction(line.action)}
                                                </p>
                                                <p>
                                                    <strong>Note:</strong>
                                                    {line.note}
                                                </p>
                                            </div>
                                        </div>
                                    </Collapsible>
                                ))}
                            {(auditLines === undefined || auditLines.length === 0) && (
                                <div className={styles.auditItem}>
                                    <p>No audit data available</p>
                                </div>
                            )}
                        </div>
                        <div className={styles.infoItem}>
                            <Button onClick={() => handleToggleView('details')} label='Back to Details' />
                        </div>
                    </>
                )}

                {view === 'external_transaction' && (
                    <>
                        <div className={styles.auditSection}>
                            {externalTransactionAudit
                                && externalTransactionAudit.length > 0
                                && externalTransactionAudit.map((externalTransaction: PayoutAudit, index: number) => (
                                    <>
                                        <Collapsible
                                            key={`internal-record${index}`}
                                            header={<h3>Internal Record</h3>}
                                            containerClass={styles.container}
                                            contentClass={styles.content}
                                        >
                                            <div className={styles.auditItem}>
                                                <div>
                                                    <p>
                                                        <strong>Provider Used:</strong>
                                                        {' '}
                                                        {externalTransaction.paymentMethodUsed}
                                                    </p>
                                                    <p>
                                                        <strong>Status:</strong>
                                                        {externalTransaction.status}
                                                    </p>
                                                    <p>
                                                        <strong>Processed At:</strong>
                                                        {externalTransaction.createdAt}
                                                    </p>
                                                    <p>
                                                        <strong>Total Amount Processed:</strong>
                                                        {' '}
                                                        {externalTransaction.totalNetAmount}
                                                    </p>
                                                </div>
                                            </div>
                                        </Collapsible>
                                        <Collapsible
                                            key={`external-record${index}`}
                                            header={<h3>External Record</h3>}
                                            containerClass={styles.container}
                                            contentClass={styles.content}
                                        >
                                            <div className={styles.auditItem}>
                                                <div>
                                                    <pre>
                                                        {JSON.stringify(
                                                            externalTransaction.externalTransactionDetails,
                                                            undefined,
                                                            2,
                                                        )}
                                                    </pre>
                                                </div>
                                            </div>
                                        </Collapsible>
                                    </>
                                ))}
                            {externalTransactionAudit === undefined && (
                                <div className={styles.auditItem}>
                                    <p>No external transaction data is available</p>
                                </div>
                            )}
                        </div>
                        <div className={styles.infoItem}>
                            <Button onClick={() => handleToggleView('details')} label='Back to Details' />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PaymentView
