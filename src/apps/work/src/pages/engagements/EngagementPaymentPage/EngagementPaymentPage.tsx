/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    Button,
    IconSolid,
} from '~/libs/ui'

import {
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

function isAssignedStatus(status: string): boolean {
    const normalized = status
        .trim()
        .toUpperCase()

    return normalized === 'ASSIGNED'
}

export const EngagementPaymentPage: FC = () => {
    const params: Readonly<{ engagementId?: string; projectId?: string }> = useParams<'engagementId' | 'projectId'>()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId || ''

    const [historyMember, setHistoryMember] = useState<Assignment | undefined>()
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

    const breadCrumb = useMemo(
        () => [
            {
                index: 1,
                label: 'Engagements',
            },
            {
                index: 2,
                label: 'Assignments',
            },
        ],
        [],
    )

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

    if (engagementResult.isLoading || projectResult.isLoading) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements`}
                breadCrumb={breadCrumb}
                pageTitle={pageTitle}
            >
                <LoadingSpinner />
            </PageWrapper>
        )
    }

    if (engagementResult.error) {
        return (
            <PageWrapper
                backUrl={`/projects/${projectId}/engagements`}
                breadCrumb={breadCrumb}
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
            backUrl={`/projects/${projectId}/engagements`}
            breadCrumb={breadCrumb}
            pageTitle={pageTitle}
        >
            <div className={styles.container}>
                <div className={styles.headerActions}>
                    <Link to={`/projects/${projectId}/engagements`}>
                        <Button
                            label='Back to engagements list'
                            secondary
                        />
                    </Link>
                </div>

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
                                            <div className={styles.memberHandle}>{assignment.memberHandle || '-'}</div>
                                            <span className={styles.status}>{normalizedStatus || '-'}</span>
                                        </div>

                                        <div className={styles.metaGrid}>
                                            <div>
                                                <span className={styles.label}>Terms Accepted</span>
                                                <span className={styles.value}>
                                                    {assignment.termsAccepted
                                                        ? <IconSolid.CheckIcon className={styles.acceptedIcon} />
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Agreed Rate</span>
                                                <span className={styles.value}>{formatCurrency(assignment.agreementRate)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Start Date</span>
                                                <span className={styles.value}>{formatDate(assignment.startDate)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>End Date</span>
                                                <span className={styles.value}>{formatDate(assignment.endDate)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.actions}>
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
                                                            primary
                                                            size='sm'
                                                        />
                                                        <Button
                                                            label='Terminate'
                                                            onClick={() => setTerminateMember(assignment)}
                                                            secondary
                                                            size='sm'
                                                        />
                                                    </>
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
                isSubmitting={isSubmittingPayment}
                member={paymentMember}
                onCancel={() => setPaymentMember(undefined)}
                onConfirm={handlePaymentSubmit}
                open={!!paymentMember}
            />

            <TerminateAssignmentModal
                isProcessing={isTerminating}
                memberHandle={terminateMember?.memberHandle}
                onCancel={() => setTerminateMember(undefined)}
                onConfirm={handleTerminateConfirm}
                open={!!terminateMember}
            />
        </PageWrapper>
    )
}

export default EngagementPaymentPage
