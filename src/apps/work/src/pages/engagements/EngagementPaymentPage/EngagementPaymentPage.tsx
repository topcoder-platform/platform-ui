/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */

import {
    FC,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import {
    Link,
    useLocation,
    useParams,
    useSearchParams,
} from 'react-router-dom'
import classNames from 'classnames'

import { PageWrapper } from '~/apps/review/src/lib'
import {
    BaseModal,
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
    StartDateTimeInput,
} from '../../../lib/components/form'
import {
    useFetchEngagement,
    useFetchProject,
} from '../../../lib/hooks'
import {
    Assignment,
} from '../../../lib/models'
import {
    createMemberPayment,
    partiallyUpdateEngagement,
    updateEngagementAssignmentStatus,
} from '../../../lib/services'
import {
    calculateAssignmentRatePerWeek,
    deserializeTentativeAssignmentDate,
    normalizeAssignmentStatus,
    sanitizePositiveNumericInput,
    serializeTentativeAssignmentDate,
    showErrorToast,
    showSuccessToast,
    toPositiveInteger,
    toPositiveNumber,
    toPositiveNumberWithMaxDecimalPlaces,
} from '../../../lib/utils'
import { formatCurrency } from '../../../lib/utils/payment.utils'

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

function formatDurationMonths(value?: number | string): string {
    if (value === undefined || value === null || value === '') {
        return '-'
    }

    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return String(value)
    }

    return `${parsedValue} month${parsedValue === 1 ? '' : 's'}`
}

function formatRemarks(value?: string): string {
    const remarks = String(value || '')
        .trim()

    return remarks || '-'
}

function toTrimmedText(value: unknown): string {
    if (value === undefined || value === null) {
        return ''
    }

    return String(value)
        .trim()
}

function toOptionalTrimmedText(value: unknown): string | undefined {
    const normalizedValue = toTrimmedText(value)

    return normalizedValue || undefined
}

function toOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue)) {
        return undefined
    }

    return parsedValue
}

function isAssignedStatus(status: string): boolean {
    return status
        .trim()
        .toUpperCase() === 'ASSIGNED'
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

function appendPayloadStringField(
    payload: Record<string, unknown>,
    key: string,
    value: unknown,
): void {
    const normalizedValue = toOptionalTrimmedText(value)

    if (!normalizedValue) {
        return
    }

    payload[key] = normalizedValue
}

function appendPayloadNumberField(
    payload: Record<string, unknown>,
    key: string,
    value: unknown,
): void {
    const normalizedValue = toOptionalNumber(value)

    if (normalizedValue === undefined) {
        return
    }

    payload[key] = normalizedValue
}

function buildAssignmentIdentityPayload(
    assignment: Assignment,
): Record<string, unknown> | undefined {
    const memberId = toOptionalTrimmedText(assignment.memberId)
    const memberHandle = toOptionalTrimmedText(assignment.memberHandle)

    if (!memberId && !memberHandle) {
        return undefined
    }

    const payload: Record<string, unknown> = {}

    if (memberHandle) {
        payload.memberHandle = memberHandle
    }

    if (memberId) {
        payload.memberId = memberId
    }

    return payload
}

function buildAssignmentDetailsPayloadEntry(
    assignment: Assignment,
): Record<string, unknown> | undefined {
    const payload = buildAssignmentIdentityPayload(assignment)

    if (!payload) {
        return undefined
    }

    appendPayloadStringField(payload, 'agreementRate', assignment.agreementRate)
    appendPayloadNumberField(payload, 'durationMonths', assignment.durationMonths)
    appendPayloadStringField(payload, 'otherRemarks', assignment.otherRemarks)
    appendPayloadStringField(payload, 'ratePerHour', assignment.ratePerHour)
    appendPayloadNumberField(payload, 'standardHoursPerWeek', assignment.standardHoursPerWeek)
    appendPayloadStringField(payload, 'startDate', assignment.startDate)

    return payload
}

interface EditAssignmentPayload {
    agreementRate: string
    durationMonths?: number
    otherRemarks?: string
    ratePerHour: string
    startDate: string
    standardHoursPerWeek: number
}

function buildAssignmentDetailsUpdatePayload(
    assignments: Assignment[],
    assignmentId: number | string,
    updatedDetails: EditAssignmentPayload,
): {
    assignmentDetails: Record<string, unknown>[]
} {
    const assignmentIdText = String(assignmentId)

    return {
        assignmentDetails: assignments
            .map(assignment => {
                const baseEntry = buildAssignmentDetailsPayloadEntry(assignment)

                if (!baseEntry) {
                    return undefined
                }

                if (String(assignment.id) !== assignmentIdText) {
                    return baseEntry
                }

                return {
                    ...baseEntry,
                    ...updatedDetails,
                }
            })
            .filter((assignmentDetail): assignmentDetail is Record<string, unknown> => !!assignmentDetail),
    }
}

interface AssignmentsLocationState {
    backUrl?: string
}

interface EditAssignmentModalProps {
    assignment: Assignment | undefined
    isSubmitting?: boolean
    onCancel: () => void
    onConfirm: (data: EditAssignmentPayload) => Promise<void> | void
    open: boolean
}

interface EditAssignmentErrors {
    durationMonths?: string
    ratePerHour?: string
    startDate?: string
    standardHoursPerWeek?: string
}

const EditAssignmentModal: FC<EditAssignmentModalProps> = (
    props: EditAssignmentModalProps,
) => {
    const [durationMonths, setDurationMonths] = useState<string>(
        props.assignment?.durationMonths !== undefined && props.assignment?.durationMonths !== null
            ? String(props.assignment.durationMonths)
            : '',
    )
    const [errors, setErrors] = useState<EditAssignmentErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>(props.assignment?.otherRemarks || '')
    const [ratePerHour, setRatePerHour] = useState<string>(props.assignment?.ratePerHour || '')
    const [startDate, setStartDate] = useState<Date | undefined>(
        deserializeTentativeAssignmentDate(props.assignment?.startDate),
    )
    const [standardHoursPerWeek, setStandardHoursPerWeek] = useState<string>(
        props.assignment?.standardHoursPerWeek !== undefined && props.assignment?.standardHoursPerWeek !== null
            ? String(props.assignment.standardHoursPerWeek)
            : '',
    )

    const agreementRate = useMemo(
        () => calculateAssignmentRatePerWeek(ratePerHour, standardHoursPerWeek),
        [ratePerHour, standardHoursPerWeek],
    )
    const isSubmitting = props.isSubmitting === true

    const resetState = useCallback((): void => {
        setDurationMonths(
            props.assignment?.durationMonths !== undefined && props.assignment?.durationMonths !== null
                ? String(props.assignment.durationMonths)
                : '',
        )
        setErrors({})
        setOtherRemarks(props.assignment?.otherRemarks || '')
        setRatePerHour(props.assignment?.ratePerHour || '')
        setStartDate(deserializeTentativeAssignmentDate(props.assignment?.startDate))
        setStandardHoursPerWeek(
            props.assignment?.standardHoursPerWeek !== undefined && props.assignment?.standardHoursPerWeek !== null
                ? String(props.assignment.standardHoursPerWeek)
                : '',
        )
    }, [props.assignment])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    const handleConfirm = useCallback(async (): Promise<void> => {
        const nextErrors: EditAssignmentErrors = {}
        const hasDurationValue = durationMonths.trim() !== ''
        const parsedDurationMonths = hasDurationValue
            ? toPositiveInteger(durationMonths)
            : undefined
        const parsedRatePerHour = toPositiveNumber(ratePerHour)
        const parsedStandardHoursPerWeek = toPositiveNumberWithMaxDecimalPlaces(
            standardHoursPerWeek,
            2,
        )

        if (!startDate) {
            nextErrors.startDate = 'Billing start date is required.'
        }

        if (hasDurationValue && parsedDurationMonths === undefined) {
            nextErrors.durationMonths = 'Duration must be a positive whole number.'
        }

        if (parsedRatePerHour === undefined) {
            nextErrors.ratePerHour = 'Rate per hour must be a positive number.'
        }

        if (parsedStandardHoursPerWeek === undefined) {
            nextErrors.standardHoursPerWeek = 'Standard hours per week must be a '
                + 'positive number with up to 2 decimal places.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        if (
            !startDate
            || parsedRatePerHour === undefined
            || parsedStandardHoursPerWeek === undefined
        ) {
            return
        }

        await props.onConfirm({
            agreementRate,
            durationMonths: parsedDurationMonths,
            otherRemarks: otherRemarks.trim() || undefined,
            ratePerHour: parsedRatePerHour.toString(),
            standardHoursPerWeek: parsedStandardHoursPerWeek,
            startDate: serializeTentativeAssignmentDate(startDate),
        })

        resetState()
    }, [
        agreementRate,
        durationMonths,
        otherRemarks,
        props,
        ratePerHour,
        resetState,
        standardHoursPerWeek,
        startDate,
    ])

    return (
        <BaseModal
            open={props.open}
            onClose={handleCancel}
            title='Edit Assignment'
            size='lg'
            buttons={(
                <div className={styles.modalActions}>
                    <Button
                        label='Cancel'
                        onClick={handleCancel}
                        secondary
                    />
                    <Button
                        disabled={isSubmitting}
                        label={isSubmitting ? 'Saving...' : 'Save'}
                        onClick={handleConfirm}
                        primary
                    />
                </div>
            )}
        >
            <div className={styles.modalContent}>
                <div className={styles.modalSubtitle}>{props.assignment?.memberHandle || '-'}</div>

                <div className={styles.modalFieldRow}>
                    <StartDateTimeInput
                        label='Billing start date *'
                        minDate={new Date()}
                        onChange={value => {
                            setStartDate(value || undefined)
                            setErrors(previous => ({
                                ...previous,
                                startDate: undefined,
                            }))
                        }}
                        preventOpenOnFocus
                        showTimeSelect={false}
                        showTimezone={false}
                        value={startDate}
                    />
                    {errors.startDate
                        ? <p className={styles.modalError}>{errors.startDate}</p>
                        : undefined}
                </div>

                <div className={styles.modalGrid}>
                    <div className={styles.modalFieldRow}>
                        <label className={styles.modalLabel} htmlFor='edit-assignment-duration'>
                            Duration (in months)
                        </label>
                        <input
                            id='edit-assignment-duration'
                            className={styles.modalInput}
                            inputMode='decimal'
                            onChange={event => {
                                setDurationMonths(sanitizePositiveNumericInput(event.target.value))
                                setErrors(previous => ({
                                    ...previous,
                                    durationMonths: undefined,
                                }))
                            }}
                            pattern='[0-9.]*'
                            type='text'
                            value={durationMonths}
                        />
                        {errors.durationMonths
                            ? <p className={styles.modalError}>{errors.durationMonths}</p>
                            : undefined}
                    </div>

                    <div className={styles.modalFieldRow}>
                        <label className={styles.modalLabel} htmlFor='edit-assignment-rate'>
                            Rate per hour *
                        </label>
                        <input
                            id='edit-assignment-rate'
                            className={styles.modalInput}
                            inputMode='decimal'
                            onChange={event => {
                                setRatePerHour(sanitizePositiveNumericInput(event.target.value))
                                setErrors(previous => ({
                                    ...previous,
                                    ratePerHour: undefined,
                                }))
                            }}
                            pattern='[0-9.]*'
                            type='text'
                            value={ratePerHour}
                        />
                        {errors.ratePerHour
                            ? <p className={styles.modalError}>{errors.ratePerHour}</p>
                            : undefined}
                    </div>

                    <div className={styles.modalFieldRow}>
                        <label className={styles.modalLabel} htmlFor='edit-assignment-hours'>
                            Standard hours per week *
                        </label>
                        <input
                            id='edit-assignment-hours'
                            className={styles.modalInput}
                            inputMode='decimal'
                            onChange={event => {
                                setStandardHoursPerWeek(
                                    sanitizePositiveNumericInput(event.target.value, 2),
                                )
                                setErrors(previous => ({
                                    ...previous,
                                    standardHoursPerWeek: undefined,
                                }))
                            }}
                            pattern='[0-9.]*'
                            type='text'
                            value={standardHoursPerWeek}
                        />
                        {errors.standardHoursPerWeek
                            ? <p className={styles.modalError}>{errors.standardHoursPerWeek}</p>
                            : undefined}
                    </div>

                    <div className={styles.modalFieldRow}>
                        <label className={styles.modalLabel} htmlFor='edit-assignment-rate-week'>
                            Rate per week
                        </label>
                        <input
                            id='edit-assignment-rate-week'
                            className={`${styles.modalInput} ${styles.modalInputReadOnly}`}
                            readOnly
                            type='text'
                            value={agreementRate}
                        />
                    </div>
                </div>

                <div className={styles.modalFieldRow}>
                    <label className={styles.modalLabel} htmlFor='edit-assignment-remarks'>
                        Other remarks
                    </label>
                    <textarea
                        id='edit-assignment-remarks'
                        className={styles.modalTextarea}
                        onChange={event => setOtherRemarks(event.target.value)}
                        rows={4}
                        value={otherRemarks}
                    />
                </div>
            </div>
        </BaseModal>
    )
}

export const EngagementPaymentPage: FC = () => {
    const params: Readonly<{ engagementId?: string; projectId?: string }> = useParams<'engagementId' | 'projectId'>()
    const location = useLocation()
    const [searchParams] = useSearchParams()

    const projectId = params.projectId || ''
    const engagementId = params.engagementId || ''
    const highlightedAssignmentId = String(searchParams.get('assignmentId') || '')
        .trim()

    const [editingAssignment, setEditingAssignment] = useState<Assignment | undefined>()
    const [historyMember, setHistoryMember] = useState<Assignment | undefined>()
    const [completeMember, setCompleteMember] = useState<Assignment | undefined>()
    const [isCompleting, setIsCompleting] = useState<boolean>(false)
    const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false)
    const [isTerminating, setIsTerminating] = useState<boolean>(false)
    const [isUpdatingAssignment, setIsUpdatingAssignment] = useState<boolean>(false)
    const [paymentMember, setPaymentMember] = useState<Assignment | undefined>()
    const [terminateMember, setTerminateMember] = useState<Assignment | undefined>()
    const assignmentCardRefs = useRef<Record<string, HTMLElement | null>>({})
    const hasScrolledToHighlightedAssignment = useRef<boolean>(false)

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
                data.hoursWorked,
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

    const handleAssignmentSave = useCallback(async (
        payload: EditAssignmentPayload,
    ): Promise<void> => {
        if (!editingAssignment) {
            return
        }

        setIsUpdatingAssignment(true)

        try {
            await partiallyUpdateEngagement(
                engagementId,
                buildAssignmentDetailsUpdatePayload(assignments, editingAssignment.id, payload),
            )
            await engagementResult.mutate()
            setEditingAssignment(undefined)
            showSuccessToast('Assignment updated successfully')
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : 'Failed to update assignment'
            showErrorToast(message)
        } finally {
            setIsUpdatingAssignment(false)
        }
    }, [assignments, editingAssignment, engagementId, engagementResult])

    useEffect(() => {
        hasScrolledToHighlightedAssignment.current = false
    }, [highlightedAssignmentId])

    useEffect(() => {
        if (!highlightedAssignmentId || hasScrolledToHighlightedAssignment.current) {
            return
        }

        const highlightedCard = assignmentCardRefs.current[highlightedAssignmentId]

        if (!highlightedCard) {
            return
        }

        hasScrolledToHighlightedAssignment.current = true
        highlightedCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        })
        highlightedCard.focus({
            preventScroll: true,
        })
    }, [assignments, highlightedAssignmentId])

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
                                const isHighlightedAssignment = String(assignment.id) === highlightedAssignmentId

                                return (
                                    <article
                                        key={String(assignment.id)}
                                        ref={node => {
                                            assignmentCardRefs.current[String(assignment.id)] = node
                                        }}
                                        className={classNames(
                                            styles.card,
                                            isHighlightedAssignment && styles.cardHighlighted,
                                        )}
                                        tabIndex={-1}
                                    >
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
                                                <span className={styles.label}>Billing Start</span>
                                                <span className={styles.value}>{formatDate(assignment.startDate)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Duration</span>
                                                <span className={styles.value}>{formatDurationMonths(assignment.durationMonths)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Rate Per Hour</span>
                                                <span className={styles.value}>{formatCurrency(assignment.ratePerHour)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Hours Per Week</span>
                                                <span className={styles.value}>
                                                    {assignment.standardHoursPerWeek || '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Rate Per Week</span>
                                                <span className={styles.value}>{formatCurrency(assignment.agreementRate)}</span>
                                            </div>
                                        </div>

                                        {assignment.terminationReason
                                            ? (
                                                <div className={styles.terminationReason}>
                                                    <span className={styles.label}>Termination Reason</span>
                                                    <span className={styles.value}>{assignment.terminationReason}</span>
                                                </div>
                                            )
                                            : undefined}

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
                                                <Button
                                                    label='Show Payment History'
                                                    onClick={() => setHistoryMember(assignment)}
                                                    secondary
                                                    size='sm'
                                                />
                                                {assignedStatus
                                                    ? (
                                                        <>
                                                            <Button
                                                                label='Edit'
                                                                onClick={() => setEditingAssignment(assignment)}
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

            <EditAssignmentModal
                assignment={editingAssignment}
                isSubmitting={isUpdatingAssignment}
                onCancel={() => setEditingAssignment(undefined)}
                onConfirm={handleAssignmentSave}
                open={!!editingAssignment}
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
