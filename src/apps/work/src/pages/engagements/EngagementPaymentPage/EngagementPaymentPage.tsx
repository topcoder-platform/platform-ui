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
    useFetchProjectBillingAccount,
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
    getAssignmentPaymentCycle,
    getAssignmentStandardHoursPerDay,
    getCountableEngagementAssignments,
    normalizeAssignmentStatus,
    sanitizePositiveNumericInput,
    serializeTentativeAssignmentDate,
    showErrorToast,
    showSuccessToast,
    toPositiveInteger,
    toPositiveNumber,
    toPositiveNumberWithMaxDecimalPlaces,
} from '../../../lib/utils'
import {
    getProjectBillingAccountEngagementPaymentErrorMessage,
    getProjectBillingAccountEngagementPaymentIssue,
} from '../../../lib/utils/project-billing-account.utils'
import { formatCurrency } from '../../../lib/utils/payment.utils'
import { ReactComponent as IconComment } from '../../../lib/assets/icons/icon-comment.svg'

import styles from './EngagementPaymentPage.module.scss'

const BILLING_ACCOUNT_DETAILS_LOADING_PAYMENT_MESSAGE = 'Billing account details are still loading. Please try again.'

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

function formatPaymentCycle(value: unknown): string {
    const normalizedCycle = String(value || 'WEEKLY')
        .trim()
        .toUpperCase()

    if (normalizedCycle === 'FORTNIGHTLY') {
        return 'Fortnightly'
    }

    if (normalizedCycle === 'MONTHLY') {
        return 'Monthly'
    }

    return 'Weekly'
}

function toWeeklyHours(standardHoursPerDay: unknown): number | undefined {
    const parsedValue = Number(standardHoursPerDay)

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return undefined
    }

    return Number((parsedValue * 5).toFixed(2))
}

function isAssignedStatus(status: string): boolean {
    return status
        .trim()
        .toUpperCase() === 'ASSIGNED'
}

function getAssignmentStatusPillClass(status: string): string {
    const normalizedStatus = String(status || '')
        .trim()
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
    appendPayloadStringField(payload, 'paymentCycle', assignment.paymentCycle)
    appendPayloadStringField(payload, 'ratePerHour', assignment.ratePerHour)
    appendPayloadNumberField(payload, 'standardHoursPerDay', assignment.standardHoursPerDay)
    appendPayloadNumberField(payload, 'standardHoursPerWeek', assignment.standardHoursPerWeek)
    appendPayloadStringField(payload, 'startDate', assignment.startDate)

    return payload
}

interface EditAssignmentPayload {
    agreementRate: string
    durationMonths?: number
    otherRemarks?: string
    paymentCycle: string
    ratePerHour: string
    startDate: string
    standardHoursPerDay: number
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
        assignmentDetails: getCountableEngagementAssignments(assignments)
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
    paymentCycle?: string
    ratePerHour?: string
    startDate?: string
    standardHoursPerDay?: string
}

export const EditAssignmentModal: FC<EditAssignmentModalProps> = (
    props: EditAssignmentModalProps,
) => {
    const [durationMonths, setDurationMonths] = useState<string>(
        props.assignment?.durationMonths !== undefined && props.assignment?.durationMonths !== null
            ? String(props.assignment.durationMonths)
            : '',
    )
    const [errors, setErrors] = useState<EditAssignmentErrors>({})
    const [otherRemarks, setOtherRemarks] = useState<string>(props.assignment?.otherRemarks || '')
    const [paymentCycle, setPaymentCycle] = useState<string>(getAssignmentPaymentCycle(props.assignment || {}))
    const [ratePerHour, setRatePerHour] = useState<string>(props.assignment?.ratePerHour || '')
    const [startDate, setStartDate] = useState<Date | undefined>(
        deserializeTentativeAssignmentDate(props.assignment?.startDate),
    )
    const [standardHoursPerDay, setStandardHoursPerDay] = useState<string>(
        getAssignmentStandardHoursPerDay(props.assignment || {}) !== undefined
            ? String(getAssignmentStandardHoursPerDay(props.assignment || {}))
            : '',
    )

    const weeklyHours = useMemo(
        () => {
            if (!standardHoursPerDay) {
                return ''
            }

            const parsedStandardHoursPerDay = toPositiveNumberWithMaxDecimalPlaces(
                standardHoursPerDay,
                2,
            )

            if (parsedStandardHoursPerDay === undefined) {
                return ''
            }

            return String(Number((parsedStandardHoursPerDay * 5).toFixed(2)))
        },
        [standardHoursPerDay],
    )
    const agreementRate = useMemo(
        () => calculateAssignmentRatePerWeek(ratePerHour, weeklyHours),
        [ratePerHour, weeklyHours],
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
        setPaymentCycle(getAssignmentPaymentCycle(props.assignment || {}))
        setRatePerHour(props.assignment?.ratePerHour || '')
        setStartDate(deserializeTentativeAssignmentDate(props.assignment?.startDate))
        setStandardHoursPerDay(
            getAssignmentStandardHoursPerDay(props.assignment || {}) !== undefined
                ? String(getAssignmentStandardHoursPerDay(props.assignment || {}))
                : '',
        )
    }, [props.assignment])

    const handleCancel = useCallback((): void => {
        resetState()
        props.onCancel()
    }, [props, resetState])

    useEffect(() => {
        if (!props.open) {
            return
        }

        resetState()
    }, [props.open, resetState])

    const handleConfirm = useCallback(async (): Promise<void> => {
        const nextErrors: EditAssignmentErrors = {}
        const hasDurationValue = durationMonths.trim() !== ''
        const parsedDurationMonths = hasDurationValue
            ? toPositiveInteger(durationMonths)
            : undefined
        const parsedRatePerHour = toPositiveNumber(ratePerHour)
        const parsedStandardHoursPerDay = toPositiveNumberWithMaxDecimalPlaces(
            standardHoursPerDay,
            2,
        )
        const normalizedPaymentCycle = String(paymentCycle || 'WEEKLY')
            .trim()
            .toUpperCase()

        if (!startDate) {
            nextErrors.startDate = 'Billing start date is required.'
        }

        if (hasDurationValue && parsedDurationMonths === undefined) {
            nextErrors.durationMonths = 'Duration must be a positive whole number.'
        }

        if (parsedRatePerHour === undefined) {
            nextErrors.ratePerHour = 'Rate per hour must be a positive number.'
        }

        if (parsedStandardHoursPerDay === undefined) {
            nextErrors.standardHoursPerDay = 'Standard hours per day must be a '
                + 'positive number with up to 2 decimal places.'
        }

        if (!['WEEKLY', 'FORTNIGHTLY', 'MONTHLY'].includes(normalizedPaymentCycle)) {
            nextErrors.paymentCycle = 'Payment cycle must be Weekly, Fortnightly, or Monthly.'
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }

        if (
            !startDate
            || parsedRatePerHour === undefined
            || parsedStandardHoursPerDay === undefined
        ) {
            return
        }

        const parsedStandardHoursPerWeek = toWeeklyHours(parsedStandardHoursPerDay)

        if (parsedStandardHoursPerWeek === undefined) {
            return
        }

        await props.onConfirm({
            agreementRate,
            durationMonths: parsedDurationMonths,
            otherRemarks: otherRemarks.trim() || undefined,
            paymentCycle: normalizedPaymentCycle,
            ratePerHour: parsedRatePerHour.toString(),
            standardHoursPerDay: parsedStandardHoursPerDay,
            standardHoursPerWeek: parsedStandardHoursPerWeek,
            startDate: serializeTentativeAssignmentDate(startDate),
        })

        resetState()
    }, [
        agreementRate,
        durationMonths,
        otherRemarks,
        paymentCycle,
        props,
        ratePerHour,
        resetState,
        standardHoursPerDay,
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
                            Standard hours per day *
                        </label>
                        <input
                            id='edit-assignment-hours'
                            className={styles.modalInput}
                            inputMode='decimal'
                            onChange={event => {
                                setStandardHoursPerDay(
                                    sanitizePositiveNumericInput(event.target.value, 2),
                                )
                                setErrors(previous => ({
                                    ...previous,
                                    standardHoursPerDay: undefined,
                                }))
                            }}
                            pattern='[0-9.]*'
                            type='text'
                            value={standardHoursPerDay}
                        />
                        {errors.standardHoursPerDay
                            ? <p className={styles.modalError}>{errors.standardHoursPerDay}</p>
                            : undefined}
                    </div>

                    <div className={styles.modalFieldRow}>
                        <label className={styles.modalLabel} htmlFor='edit-assignment-payment-cycle'>
                            Payment cycle *
                        </label>
                        <select
                            id='edit-assignment-payment-cycle'
                            className={styles.modalInput}
                            onChange={event => {
                                setPaymentCycle(event.target.value)
                                setErrors(previous => ({
                                    ...previous,
                                    paymentCycle: undefined,
                                }))
                            }}
                            value={paymentCycle}
                        >
                            <option value='WEEKLY'>Weekly</option>
                            <option value='FORTNIGHTLY'>Fortnightly</option>
                            <option value='MONTHLY'>Monthly</option>
                        </select>
                        {errors.paymentCycle
                            ? <p className={styles.modalError}>{errors.paymentCycle}</p>
                            : undefined}
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
    const [remarksAssignment, setRemarksAssignment] = useState<Assignment | undefined>()
    const [terminateMember, setTerminateMember] = useState<Assignment | undefined>()
    const assignmentCardRefs = useRef<Record<string, HTMLElement | null>>({})
    const hasScrolledToHighlightedAssignment = useRef<boolean>(false)

    const engagementResult = useFetchEngagement(engagementId)
    const projectResult = useFetchProject(projectId)
    const projectBillingAccountResult = useFetchProjectBillingAccount(projectId)

    const assignments = useMemo(() => {
        if (!Array.isArray(engagementResult.engagement?.assignments)) {
            return []
        }

        return engagementResult.engagement?.assignments || []
    }, [engagementResult.engagement?.assignments])

    const pageTitle = engagementResult.engagement?.title
        ? `${engagementResult.engagement.title} Assignees`
        : 'Assignees'
    const billingAccountPaymentIssue = getProjectBillingAccountEngagementPaymentIssue(
        projectBillingAccountResult.billingAccount,
    )
    const billingAccountPaymentErrorMessage = billingAccountPaymentIssue
        ? getProjectBillingAccountEngagementPaymentErrorMessage(billingAccountPaymentIssue)
        : undefined
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

        if (projectBillingAccountResult.isLoading) {
            showErrorToast(BILLING_ACCOUNT_DETAILS_LOADING_PAYMENT_MESSAGE)
            return
        }

        if (billingAccountPaymentErrorMessage) {
            showErrorToast(billingAccountPaymentErrorMessage)
            return
        }

        const billingAccountId = projectBillingAccountResult.billingAccount?.id
            || projectResult.project?.billingAccountId

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
    }, [
        billingAccountPaymentErrorMessage,
        paymentMember,
        projectBillingAccountResult.billingAccount?.id,
        projectBillingAccountResult.isLoading,
        projectResult.project?.billingAccountId,
    ])

    const handlePayClick = useCallback((assignment: Assignment): void => {
        if (projectBillingAccountResult.isLoading) {
            showErrorToast(BILLING_ACCOUNT_DETAILS_LOADING_PAYMENT_MESSAGE)
            return
        }

        if (billingAccountPaymentErrorMessage) {
            showErrorToast(billingAccountPaymentErrorMessage)
            return
        }

        setPaymentMember(assignment)
    }, [billingAccountPaymentErrorMessage, projectBillingAccountResult.isLoading])

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
                                const remarksText = toTrimmedText(assignment.otherRemarks)

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
                                                <span className={styles.label}>Other Remarks</span>
                                                <span className={styles.value}>
                                                    {remarksText
                                                        ? (
                                                            <button
                                                                aria-label={`View other remarks for ${assignment.memberHandle || 'member'}`}
                                                                aria-haspopup='dialog'
                                                                className={styles.remarksButton}
                                                                onClick={() => setRemarksAssignment(assignment)}
                                                                title='View other remarks'
                                                                type='button'
                                                            >
                                                                <IconComment
                                                                    aria-hidden='true'
                                                                    className={styles.remarksIcon}
                                                                />
                                                            </button>
                                                        )
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>
                                                    Billing Start Date
                                                    <span aria-hidden='true' className={styles.required}>*</span>
                                                </span>
                                                <span className={styles.value}>{formatDate(assignment.startDate)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Duration</span>
                                                <span className={styles.value}>{formatDurationMonths(assignment.durationMonths)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>
                                                    Rate Per Hour
                                                    <span aria-hidden='true' className={styles.required}>*</span>
                                                </span>
                                                <span className={styles.value}>{formatCurrency(assignment.ratePerHour)}</span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>
                                                    Standard Hours Per Day
                                                    <span aria-hidden='true' className={styles.required}>*</span>
                                                </span>
                                                <span className={styles.value}>
                                                    {getAssignmentStandardHoursPerDay(assignment) || '-'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={styles.label}>Payment Cycle</span>
                                                <span className={styles.value}>{formatPaymentCycle(assignment.paymentCycle)}</span>
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
                                                                onClick={() => handlePayClick(assignment)}
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
                billingAccountId={projectBillingAccountResult.billingAccount?.id
                    || projectResult.project?.billingAccountId}
                billingAccountMarkup={projectBillingAccountResult.billingAccount?.markup}
                engagementName={engagementResult.engagement?.title}
                isSubmitting={isSubmittingPayment}
                member={paymentMember}
                onCancel={() => setPaymentMember(undefined)}
                onConfirm={handlePaymentSubmit}
                open={!!paymentMember}
                projectName={projectResult.project?.name}
            />

            <BaseModal
                buttons={(
                    <div className={styles.modalActions}>
                        <Button
                            label='Close'
                            onClick={() => setRemarksAssignment(undefined)}
                            secondary
                        />
                    </div>
                )}
                onClose={() => setRemarksAssignment(undefined)}
                open={!!remarksAssignment}
                title='Other Remarks'
            >
                <div className={styles.modalContent}>
                    <div className={styles.modalSubtitle}>{remarksAssignment?.memberHandle || '-'}</div>
                    <p className={styles.remarksContent}>
                        {toTrimmedText(remarksAssignment?.otherRemarks)}
                    </p>
                </div>
            </BaseModal>

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
