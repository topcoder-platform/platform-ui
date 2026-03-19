/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    Button,
} from '~/libs/ui'

import {
    CompleteAssignmentModal,
    ErrorMessage,
    LoadingSpinner,
    PaymentFormData,
    PaymentFormModal,
    PaymentHistoryModal,
    TerminateAssignmentModal,
} from '../../../lib/components'
import {
    useFetchEngagement,
    useFetchProject,
} from '../../../lib/hooks'
import {
    Assignment,
} from '../../../lib/models'
import {
    createMemberPayment,
    updateEngagementAssignmentStatus,
} from '../../../lib/services'
import {
    showErrorToast,
    showSuccessToast,
} from '../../../lib/utils'
import {
    formatCurrency,
    normalizeAssignmentStatus,
} from '../../../lib/utils/payment.utils'

import styles from './EngagementPaymentPage.module.scss'

function formatDate(value?: string): string {
    if (!value) {
        return '-'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return value
    }

    return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatRemarks(value?: string): string {
    const remarks = String(value || '')
        .trim()

    return remarks || '-'
}

function isAssignedStatus(status: string): boolean {
    const normalized = status
        .trim()
        .toUpperCase()

    return normalized === 'ASSIGNED'
}

function getAssignmentStatusPillClass(status: string): string {
    const normalizedStatus = status.trim()
        .toLowerCase()

    if (normalizedStatus === 'active') {
        return styles.statusGreen
    }

    if (normalizedStatus === 'assigned' || normalizedStatus === 'pending assignment') {
        return styles.statusYellow
    }

    if (normalizedStatus === 'completed' || normalizedStatus === 'closed') {
        return styles.statusBlue
    }

    if (normalizedStatus === 'terminated' || normalizedStatus === 'cancelled') {
        return styles.statusRed
    }

    return styles.statusGray
}

interface AssignmentsLocationState {
    backUrl?: string
}

export const EngagementPaymentPage: FC = () => {
    const params: Readonly<{ engagementId?: string; projectId?: string }> = useParams<'engagementId' | 'projectId'>()
    const location = useLocation()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId || ''

    const [historyMember, setHistoryMember] = useState<Assignment | undefined>()
    const [completeMember, setCompleteMember] = useState<Assignment | undefined>()
    const [isCompleting, setIsCompleting] = useState<boolean>(false)
    const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false)
    const [isTerminating, setIsTerminating] = useState<boolean>(false)
    const [paymentMember, setPaymentMember] = useState<Assignment | undefined>()
    const [terminateMember, setTerminateMember] = useState<Assignment | undefined>()

    const engagementResult = useFetchEngagement(engagementId)
    const projectResult = useFetchProject(projectId)

    const assignments = useMemo(() => {
        if (!Array.isArray(engagementResult.engagement?.assignments)) {
            return []
        }

        return engagementResult.engagement?.assignments || []
    }, [engagementResult.engagement?.assignments])

    const pageTitle = engagementResult.engagement?.title
        ? `${engagementResult.engagement.title} Assignees`
        : 'Assignees'
    const backUrl = useMemo(() => {
        const locationState = location.state as AssignmentsLocationState | null
        const stateBackUrl = String(locationState?.backUrl || '')
            .trim()

        if (stateBackUrl) {
            return stateBackUrl
        }

        return projectId
            ? `/projects/${projectId}/engagements`
            : '/engagements'
    }, [location.state, projectId])

    const handlePaymentSubmit = useCallback(async (
        data: PaymentFormData,
    ): Promise<void> => {
        if (!paymentMember) {
            return
        }

        const billingAccountId = projectResult.project?.billingAccountId

        if (!billingAccountId) {
            showErrorToast('Billing account is required to create payment')
            return
        }

        if (!paymentMember.memberId) {
            showErrorToast('Member ID is required to create payment')
            return
        }

        setIsSubmittingPayment(true)

        try {
            await createMemberPayment(
                paymentMember.id,
                paymentMember.memberId,
                paymentMember.memberHandle,
                data.title,
                data.remarks || '',
                paymentMember.agreementRate,
                data.amount,
                billingAccountId,
            )
            showSuccessToast('Payment created successfully')
            setPaymentMember(undefined)
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to create payment'
            showErrorToast(message)
        } finally {
            setIsSubmittingPayment(false)
        }
    }, [paymentMember, projectResult.project?.billingAccountId])

    const handleTerminateConfirm = useCallback(async (reason: string): Promise<void> => {
        if (!terminateMember) {
            return
        }

        setIsTerminating(true)

        try {
            await updateEngagementAssignmentStatus(
                engagementId,
                terminateMember.id,
                'TERMINATED',
                reason,
            )
            await engagementResult.mutate()
            setTerminateMember(undefined)
            showSuccessToast('Assignment terminated successfully')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to terminate assignment'
            showErrorToast(message)
        } finally {
            setIsTerminating(false)
        }
    }, [engagementId, engagementResult, terminateMember])

    const handleCompleteConfirm = useCallback(async (): Promise<void> => {
        if (!completeMember) {
            return
        }

        setIsCompleting(true)

        try {
            await updateEngagementAssignmentStatus(
                engagementId,
                completeMember.id,
                'COMPLETED',
            )
            await engagementResult.mutate()
            setCompleteMember(undefined)
            showSuccessToast('Assignment completed successfully')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to complete assignment'
            showErrorToast(message)
        } finally {
            setIsCompleting(false)
        }
    }, [completeMember, engagementId, engagementResult])

    if (engagementResult.isLoading || projectResult.isLoading) {
        return (
            <PageWrapper
                backUrl={backUrl}
                breadCrumb={[]}
                pageTitle={pageTitle}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementResult.error) {
        return (
            <PageWrapper
                backUrl={backUrl}
                breadCrumb={[]}
                pageTitle={pageTitle}
            >
                <ErrorMessage
                    message={engagementResult.error.message}
                    onRetry={() => {
                        engagementResult.mutate()
                            .catch(() => undefined)
                    }}
                />
            </PageWrapper>
        )
    }

    return (
        <PageWrapper
            backUrl={backUrl}
            breadCrumb={[]}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                {assignments.length === 0
                    ? <div className={styles.empty}>No assigned members found.</div>
                    : (
                        <div className={styles.list}>
                            {assignments.map(assignment => {
                                const normalizedStatus = normalizeAssignmentStatus(String(assignment.status || ''))
                                const assignedStatus = isAssignedStatus(String(assignment.status || ''))

                                return (
                                    <article key={String(assignment.id)} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.memberHeader}>
                                                <div className={styles.memberHandle}>{assignment.memberHandle || '-'}</div>
                                                <span
                                                    className={classNames(
                                                        styles.statusPill,
                                                        getAssignmentStatusPillClass(normalizedStatus),
                                                    )}
                                                >
                                                    {normalizedStatus || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={styles.metaGrid}>
                                            <div>
                                                <span className={styles.label}>Remarks</span>
                                                <span className={styles.value}>{formatRemarks(assignment.otherRemarks)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Agreed Rate</span>
                                                <span className={styles.value}>{formatCurrency(assignment.agreementRate)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Tentative Start</span>
                                                <span className={styles.value}>{formatDate(assignment.startDate)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Tentative End</span>
                                                <span className={styles.value}>{formatDate(assignment.endDate)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.actions}>
                                            <div className={styles.leftActions}>
                                                <Link
                                                    to={`/projects/${projectId}/engagements/${engagementId}/assignments/${assignment.id}/feedback`}
                                                >
                                                    <Button
                                                        label='Feedback'
                                                        secondary
                                                        size='sm'
                                                    />
                                                </Link>
                                                <Link
                                                    to={`/projects/${projectId}/engagements/${engagementId}/assignments/${assignment.id}/experience`}
                                                >
                                                    <Button
                                                        label='Experience'
                                                        secondary
                                                        size='sm'
                                                    />
                                                </Link>
                                                {assignedStatus
                                                    ? (
                                                        <>
                                                            <Button
                                                                label='Show Payment History'
                                                                onClick={() => setHistoryMember(assignment)}
                                                                secondary
                                                                size='sm'
                                                            />
                                                            <Button
                                                                label='Pay'
                                                                onClick={() => setPaymentMember(assignment)}
                                                                variant='linkblue'
                                                                primary
                                                                size='sm'
                                                            />
                                                        </>
                                                    )
                                                    : undefined}
                                            </div>
                                            {assignedStatus
                                                ? (
                                                    <div className={styles.rightActions}>
                                                        <Button
                                                            className={styles.completeButton}
                                                            label='Complete'
                                                            onClick={() => setCompleteMember(assignment)}
                                                            primary
                                                            size='sm'
                                                        />
                                                        <Button
                                                            label='Terminate'
                                                            onClick={() => setTerminateMember(assignment)}
                                                            variant='danger'
                                                            primary
                                                            size='sm'
                                                        />
                                                    </div>
                                                )
                                                : undefined}
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
            </div>

            <PaymentHistoryModal
                assignmentId={historyMember?.id}
                memberHandle={historyMember?.memberHandle}
                onClose={() => setHistoryMember(undefined)}
                open={!!historyMember}
            />

            <PaymentFormModal
                billingAccountId={projectResult.project?.billingAccountId}
                engagementName={engagementResult.engagement?.title}
                isSubmitting={isSubmittingPayment}
                member={paymentMember}
                onCancel={() => setPaymentMember(undefined)}
                onConfirm={handlePaymentSubmit}
                open={!!paymentMember}
                projectName={projectResult.project?.name}
            />

            <TerminateAssignmentModal
                isProcessing={isTerminating}
                memberHandle={terminateMember?.memberHandle}
                onCancel={() => setTerminateMember(undefined)}
                onConfirm={handleTerminateConfirm}
                open={!!terminateMember}
            />

            <CompleteAssignmentModal
                isProcessing={isCompleting}
                memberHandle={completeMember?.memberHandle}
                onCancel={() => setCompleteMember(undefined)}
                onConfirm={handleCompleteConfirm}
                open={!!completeMember}
            />
        </PageWrapper>
    )
}

export default EngagementPaymentPage
