/* eslint-disable react/jsx-no-bind */
import React from 'react'

import { Button } from '~/libs/ui'
import { TOPCODER_URL } from '~/config/environments/default.env'

import { PayoutAudit } from '../../models/PayoutAudit'
import { WinningsAudit } from '../../models/WinningsAudit'
import { Winning, WinningPaymentDetails } from '../../models/WinningDetail'
import {
    fetchAuditLogs,
    fetchChallengePaymentSummary,
    fetchPayoutAuditLogs,
    fetchWinningPaymentDetails,
    getMemberHandle,
} from '../../services/wallet'

import {
    buildWorkAppChallengeUrl,
    buildWorkManagerAssignmentUrl,
    buildWorkManagerProjectUrl,
    getPaymentDetailsSummaryConfig,
    isChallengePaymentType,
    resolvePaymentAgreementSummary,
    resolvePaymentApproverHandle,
    resolveTaskCreatorHandle,
} from './payment-view.utils'
import PaymentAgreementBanner from './PaymentAgreementBanner'
import PaymentAuditHistoryTab from './tabs/PaymentAuditHistoryTab'
import PaymentDetailsSummaryRow from './PaymentDetailsSummaryRow'
import PaymentDetailsTabs, { PaymentDetailsTabOption } from './PaymentDetailsTabs'
import PaymentEngagementDetailsTab from './tabs/PaymentEngagementDetailsTab'
import PaymentExternalTransactionTab from './tabs/PaymentExternalTransactionTab'
import PaymentGeneralInfoTab from './tabs/PaymentGeneralInfoTab'
import PaymentTaskDetailsTab from './tabs/PaymentTaskDetailsTab'
import PaymentWorkLogTab from './tabs/PaymentWorkLogTab'
import styles from './PaymentView.module.scss'

interface PaymentViewProps {
    isPoints?: boolean
    onClose?: () => void
    payment: Winning
}

type PaymentDetailsTabId
    = 'general'
    | 'engagement'
    | 'work-log'
    | 'task-details'
    | 'audit'
    | 'external-transaction'

const PaymentView: React.FC<PaymentViewProps> = (props: PaymentViewProps) => {
    const [activeTab, setActiveTab] = React.useState<PaymentDetailsTabId>('general')
    const [auditLines, setAuditLines] = React.useState<WinningsAudit[]>([])
    const [externalTransactionAudit, setExternalTransactionAudit] = React.useState<PayoutAudit[]>()
    const [isAuditLoading, setIsAuditLoading] = React.useState<boolean>(false)
    const [isExternalTransactionLoading, setIsExternalTransactionLoading] = React.useState<boolean>(false)
    const [paymentDetails, setPaymentDetails] = React.useState<WinningPaymentDetails>()
    const [isPaymentDetailsLoading, setIsPaymentDetailsLoading] = React.useState<boolean>(false)
    const [paymentDetailsError, setPaymentDetailsError] = React.useState<string>()
    const [challengeCreatorHandle, setChallengeCreatorHandle] = React.useState<string>()
    const [challengeBudgetApproverHandle, setChallengeBudgetApproverHandle] = React.useState<string>()
    const [challengePaymentApproverHandle, setChallengePaymentApproverHandle] = React.useState<string>()

    const isEngagementPayment = props.payment.type.toLowerCase() === 'engagement payment'
    const isTaskPayment = props.payment.type.toLowerCase() === 'task payment'
    const isChallengePayment = isChallengePaymentType(props.payment.type)
    const shouldFetchChallengeSummary = isChallengePayment || isTaskPayment
    const shouldFetchPaymentDetails = isEngagementPayment || isTaskPayment
    const summaryConfig = getPaymentDetailsSummaryConfig(props.payment.type)

    const agreementSummary = isEngagementPayment
        ? resolvePaymentAgreementSummary(props.payment, paymentDetails)
        : undefined

    const isPaidPayment = props.payment.status.toUpperCase() === 'PAID'

    const tabs = React.useMemo((): PaymentDetailsTabOption[] => {
        const auditTabs: PaymentDetailsTabOption[] = [
            { id: 'audit', label: 'Audit History' },
            ...(isPaidPayment
                ? [{ id: 'external-transaction' as const, label: 'External Transaction' }]
                : []),
        ]

        if (isEngagementPayment) {
            return [
                { id: 'general', label: 'General Info' },
                { id: 'engagement', label: 'Engagement Details' },
                { id: 'work-log', label: 'Work Log' },
                ...auditTabs,
            ]
        }

        if (isTaskPayment) {
            return [
                { id: 'general', label: 'General Info' },
                { id: 'task-details', label: 'Task Details' },
                ...auditTabs,
            ]
        }

        return [
            { id: 'general', label: 'General Info' },
            ...auditTabs,
        ]
    }, [isEngagementPayment, isPaidPayment, isTaskPayment])

    React.useEffect(() => {
        if (!shouldFetchPaymentDetails) {
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
                    setPaymentDetailsError(
                        isTaskPayment
                            ? 'Unable to load task details.'
                            : 'Unable to load engagement details.',
                    )
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
    }, [isTaskPayment, props.payment, shouldFetchPaymentDetails])

    React.useEffect(() => {
        if (!shouldFetchChallengeSummary || !props.payment.externalId) {
            setChallengeCreatorHandle(undefined)
            setChallengeBudgetApproverHandle(undefined)
            setChallengePaymentApproverHandle(undefined)
            return undefined
        }

        let ignore = false

        fetchChallengePaymentSummary(props.payment.externalId)
            .then(summary => {
                if (!ignore) {
                    if (isChallengePayment) {
                        setChallengeCreatorHandle(summary.creatorHandle)
                    }

                    setChallengeBudgetApproverHandle(summary.budgetApproverHandle)
                    setChallengePaymentApproverHandle(summary.paymentApproverHandle)
                }
            })
            .catch(() => {
                if (!ignore) {
                    setChallengeCreatorHandle(undefined)
                    setChallengeBudgetApproverHandle(undefined)
                    setChallengePaymentApproverHandle(undefined)
                }
            })

        return () => {
            ignore = true
        }
    }, [
        isChallengePayment,
        props.payment.externalId,
        shouldFetchChallengeSummary,
    ])

    React.useEffect(() => {
        if (activeTab === 'external-transaction') {
            let ignore = false
            setIsExternalTransactionLoading(true)

            fetchPayoutAuditLogs(props.payment.id)
                .then(payoutAudit => {
                    if (!ignore) {
                        setExternalTransactionAudit(payoutAudit)
                    }
                })
                .catch(() => {
                    if (!ignore) {
                        setExternalTransactionAudit(undefined)
                    }
                })
                .finally(() => {
                    if (!ignore) {
                        setIsExternalTransactionLoading(false)
                    }
                })

            return () => {
                ignore = true
            }
        }

        if (activeTab !== 'audit') {
            return undefined
        }

        let ignore = false
        setIsAuditLoading(true)

        fetchAuditLogs(props.payment.id)
            .then(auditLogs => {
                const userIds = auditLogs.map(log => log.userId)

                return getMemberHandle(userIds)
                    .then((handles: Map<number, string>) => {
                        auditLogs.forEach((log: WinningsAudit) => {
                            log.userId = handles.get(parseInt(log.userId, 10)) ?? log.userId
                        })

                        return auditLogs
                    })
                    .catch(() => auditLogs)
            })
            .then(auditLogs => {
                if (!ignore) {
                    setAuditLines(auditLogs)
                }
            })
            .catch(() => {
                if (!ignore) {
                    setAuditLines([])
                }
            })
            .finally(() => {
                if (!ignore) {
                    setIsAuditLoading(false)
                }
            })

        return () => {
            ignore = true
        }
    }, [activeTab, props.payment.id])

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

    const taskCreatorHandle = resolveTaskCreatorHandle(paymentDetails)

    const budgetApproverHandle = shouldFetchChallengeSummary
        ? challengeBudgetApproverHandle
        : undefined

    const paymentApproverHandle = resolvePaymentApproverHandle(
        paymentDetails,
        challengePaymentApproverHandle,
        isTaskPayment,
    )

    const renderTabContent = (): React.ReactNode => {
        if (activeTab === 'general') {
            return (
                <PaymentGeneralInfoTab
                    createDate={props.payment.createDate}
                    description={props.payment.description}
                    descriptionLink={descriptionLink}
                    payment={props.payment}
                />
            )
        }

        if (activeTab === 'engagement') {
            return (
                <PaymentEngagementDetailsTab
                    engagementDetails={paymentDetails?.engagementDetails}
                    errorMessage={paymentDetailsError}
                    isLoading={isPaymentDetailsLoading}
                    projectLink={buildWorkManagerProjectUrl(paymentDetails?.engagementDetails)}
                />
            )
        }

        if (activeTab === 'work-log') {
            return (
                <PaymentWorkLogTab
                    errorMessage={paymentDetailsError}
                    isLoading={isPaymentDetailsLoading}
                    paymentCreatorHandle={paymentDetails?.paymentCreatorHandle}
                    workLog={paymentDetails?.workLog}
                />
            )
        }

        if (activeTab === 'task-details') {
            return (
                <PaymentTaskDetailsTab
                    challengePaymentApproverHandle={challengePaymentApproverHandle}
                    errorMessage={paymentDetailsError}
                    isLoading={isPaymentDetailsLoading}
                    payment={props.payment}
                    paymentDetails={paymentDetails}
                    projectLink={buildWorkManagerProjectUrl(paymentDetails?.taskDetails)}
                />
            )
        }

        if (activeTab === 'external-transaction') {
            return (
                <PaymentExternalTransactionTab
                    isLoading={isExternalTransactionLoading}
                    payoutAudits={externalTransactionAudit}
                />
            )
        }

        return (
            <PaymentAuditHistoryTab
                auditLines={auditLines}
                formatAction={formatAction}
                isLoading={isAuditLoading}
            />
        )
    }

    return (
        <div className={styles.formContainer}>
            <PaymentDetailsSummaryRow
                approverLabel={summaryConfig.approverLabel}
                budgetApproverHandle={budgetApproverHandle}
                columns={summaryConfig.columns}
                creatorLabel={summaryConfig.creatorLabel}
                handle={props.payment.handle}
                isPoints={props.isPoints}
                paymentAmount={props.payment.grossAmountNumber}
                paymentApproverHandle={paymentApproverHandle}
                paymentCreatorHandle={
                    isTaskPayment
                        ? taskCreatorHandle
                        : isChallengePayment
                            ? challengeCreatorHandle
                            : paymentDetails?.paymentCreatorHandle
                }
                secondaryApproverLabel={summaryConfig.secondaryApproverLabel}
            />
            {agreementSummary && (
                <PaymentAgreementBanner summary={agreementSummary} />
            )}
            <PaymentDetailsTabs
                activeTabId={activeTab}
                onTabChange={tabId => setActiveTab(tabId as PaymentDetailsTabId)}
                tabs={tabs}
            />
            <div className={styles.tabPanel} role='tabpanel'>
                {renderTabContent()}
            </div>
            {props.onClose && (
                <div className={styles.footer}>
                    <Button
                        secondary
                        label='Close'
                        size='lg'
                        onClick={props.onClose}
                    />
                </div>
            )}
        </div>
    )
}

export default PaymentView
