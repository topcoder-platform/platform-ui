/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, ConfirmModal, InputText, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { downloadBlob } from '~/libs/shared'
import {
    toPaymentTypeCategories,
    toPaymentTypeFilterValues,
} from '~/libs/shared/lib/utils/payment-type-filter.utils'

import { editPayment, exportSearchResults, getMemberHandle, getPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail, WinningsType } from '../../../lib/models/WinningDetail'
import { FilterBar, formatIOSDateString, PaymentView } from '../../../lib'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import { Filter } from '../../../lib/components/filter-bar/FilterBar'
import PaymentEditForm from '../../../lib/components/payment-edit/PaymentEdit'
import PaymentsTable from '../../../lib/components/payments-table/PaymentTable'

import styles from './Payments.module.scss'

type PaymentRoleView = 'admin' | 'paymentApprover' | 'wiproTaasAdmin'
type SelectedPaymentAction = 'approve' | 'reject'

const taskPaymentCategory = 'TASK_PAYMENT'
const engagementPaymentCategory = 'ENGAGEMENT_PAYMENT'
const restrictedRoleDefaultStatus = 'ON_HOLD_ADMIN'
const approverAllowedCategories = [taskPaymentCategory, engagementPaymentCategory]
const taasPaymentCategory = 'TAAS_PAYMENT'
const topgearPaymentCategory = 'TOPGEAR_PAYMENT'
const defaultPageSize = 10
function formatIsoDateOnly(date: Date): string {
    const y = date.getFullYear()
    const mo = String(date.getMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getDate())
        .padStart(2, '0')

    return `${y}-${mo}-${day}`
}

function getApproverDefaultDateRange(): { dateFrom: string, dateTo: string } {
    const dateTo = new Date()
    const dateFrom = new Date()
    dateFrom.setMonth(dateFrom.getMonth() - 3)

    return {
        dateFrom: formatIsoDateOnly(dateFrom),
        dateTo: formatIsoDateOnly(dateTo),
    }
}

type PaymentListingTab = 'topcoder' | 'topgear' | 'taas'

const TOPCODER_PAYMENT_CATEGORIES: ReadonlyArray<string> = [
    'TASK_PAYMENT',
    'CONTEST_PAYMENT',
    'COPILOT_PAYMENT',
    'REVIEW_BOARD_PAYMENT',
    'ENGAGEMENT_PAYMENT',
]

const STATUS_FILTER_OPTIONS: { label: string, value: string }[] = [
    { label: 'Owed', value: 'OWED' },
    { label: 'On Hold (Admin)', value: 'ON_HOLD_ADMIN' },
    { label: 'On Hold (Member)', value: 'ON_HOLD' },
    { label: 'Paid', value: 'PAID' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Returned', value: 'RETURNED' },
]

const ALL_STATUS_FILTER_VALUES: ReadonlyArray<string> = STATUS_FILTER_OPTIONS.map(option => option.value)

const TOPCODER_TYPE_FILTER_OPTIONS: { label: string, value: string }[] = [
    { label: 'Task Payment', value: 'Task' },
    { label: 'Contest Payment', value: 'Contest' },
    { label: 'Copilot Payment', value: 'Copilot' },
    { label: 'Review Board Payment', value: 'Review Board' },
    { label: 'Engagement Payment', value: 'Engagement' },
]

const APPROVER_TYPE_FILTER_OPTIONS: { label: string, value: string }[] = [
    { label: 'Task Payments', value: 'Task' },
    { label: 'Engagement Payments', value: 'Engagement' },
]

function normalizeFilterRecord(filters: Record<string, string[]>): Record<string, string[]> {
    return Object.fromEntries(
        Object.entries(filters)
            .map(([key, values]) => [key, [...values].sort()])
            .filter(([, values]) => values.length > 0),
    )
}

function areFilterRecordsEqual(
    left: Record<string, string[]>,
    right: Record<string, string[]>,
): boolean {
    const normalizedLeft = normalizeFilterRecord(left)
    const normalizedRight = normalizeFilterRecord(right)
    const keys = Array.from(new Set([
        ...Object.keys(normalizedLeft),
        ...Object.keys(normalizedRight),
    ]))

    return keys.every(key => {
        const leftValues = normalizedLeft[key] ?? []
        const rightValues = normalizedRight[key] ?? []
        if (leftValues.length !== rightValues.length) {
            return false
        }

        return leftValues.every((value, index) => value === rightValues[index])
    })
}

function withoutFilterKey(filters: Record<string, string[]>, key: string): Record<string, string[]> {
    const nextFilters = { ...filters }
    delete nextFilters[key]

    return nextFilters
}

interface PaymentsListViewProps {
    profile: UserProfile
    isCollapsed?: boolean
    onToggle?: (isCollapsed: boolean) => void
}

function formatStatus(status: string): string {
    switch (status) {
        case 'ON_HOLD':
            return 'ON_HOLD'
        case 'ON_HOLD_ADMIN':
            return 'On Hold (Admin)'
        case 'OWED':
            return 'Owed'
        case 'PAID':
            return 'Paid'
        case 'CANCELLED':
            return 'Cancel'
        case 'PROCESSING':
            return 'Processing'
        case 'FAILED':
            return 'Failed'
        case 'RETURNED':
            return 'Returned'
        default:
            return status.replaceAll('_', ' ')
    }
}

function isIdVerificationComplete(paymentStatus?: WinningDetail['paymentStatus']): boolean {
    if (!paymentStatus) {
        return false
    }

    const statusWithAliases = paymentStatus as WinningDetail['paymentStatus'] & {
        idVerificationPassed?: boolean
        identityVerificationComplete?: boolean
    }

    return Boolean(
        statusWithAliases.idVerificationComplete
        || statusWithAliases.idVerificationPassed
        || statusWithAliases.identityVerificationComplete,
    )
}

const formatCurrency = (amountStr: string, currency: string): string => {
    let amount: number
    try {
        amount = parseFloat(amountStr)
    } catch (error) {
        return amountStr
    }

    return new Intl.NumberFormat('en-US', {
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: 'currency',
    })
        .format(amount)
}

/**
 * Extracts the assignment identifier captured on a finance winning row.
 *
 * @param payment raw finance winning row from the wallet-admin listing API.
 * @returns the normalized assignment identifier when present.
 * @remarks Wallet-admin reuses this identifier to recover engagement details
 * directly from the engagements API when finance omits them.
 */
function getWinningAssignmentId(payment: WinningDetail): string | undefined {
    const assignmentId = payment.attributes?.assignmentId

    return assignmentId !== undefined && assignmentId !== null
        ? String(assignmentId)
        : undefined
}

/**
 * Converts a raw finance winning row into the wallet-admin view model.
 *
 * @param payment raw finance winning row returned by the payouts API.
 * @param handleMap member-handle lookup keyed by winner identifier.
 * @returns the normalized winning record rendered by the payments table.
 * @remarks The release date and hold status are derived here to keep the
 * component-level mapping callback trivial.
 */
// eslint-disable-next-line complexity
function convertPaymentToWinning(payment: WinningDetail, handleMap: Map<number, string>): Winning {
    const now = new Date()
    const releaseDate = new Date(payment.releaseDate)
    const diffMs = releaseDate.getTime() - now.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    let formattedReleaseDate
    if (diffHours > 0 && diffHours <= 24) {
        const diffMinutes = diffMs / (1000 * 60)
        const hours = Math.floor(diffHours)
        const minutes = Math.round(diffMinutes - hours * 60)
        formattedReleaseDate = `${minutes} minute${minutes !== 1 ? 's' : ''}`
        if (hours > 0) {
            formattedReleaseDate = `In ${hours} hour${hours !== 1 ? 's' : ''} ${formattedReleaseDate}`
        } else if (minutes > 0) {
            formattedReleaseDate = `In ${minutes} minute${minutes !== 1 ? 's' : ''}`
        }
    } else {
        formattedReleaseDate = formatIOSDateString(payment.releaseDate)
    }

    let status = formatStatus(payment.details[0].status)
    if (status === 'Cancel') {
        status = 'Cancelled'
    }

    if (status === 'ON_HOLD') {
        if (!payment.paymentStatus?.payoutSetupComplete) {
            status = 'On Hold (Payment provider)'
        } else if (!payment.paymentStatus?.taxFormSetupComplete) {
            status = 'On Hold (Tax Form)'
        } else if (!isIdVerificationComplete(payment.paymentStatus)) {
            status = 'On Hold (ID Verification)'
        } else {
            status = 'On Hold (Member)'
        }
    }

    return {
        assignmentId: getWinningAssignmentId(payment),
        createDate: formatIOSDateString(payment.createdAt),
        currency: payment.details[0].currency,
        datePaid: payment.details[0].datePaid ? formatIOSDateString(payment.details[0].datePaid) : '-',
        description: payment.description,
        details: payment.details,
        externalId: payment.externalId,
        grossAmount: formatCurrency(payment.details[0].grossAmount, payment.details[0].currency),
        grossAmountNumber: parseFloat(payment.details[0].grossAmount),
        handle: handleMap.get(parseInt(payment.winnerId, 10)) ?? payment.winnerId,
        id: payment.id,
        releaseDate: formattedReleaseDate,
        releaseDateObj: releaseDate,
        status,
        type: payment.category.replaceAll('_', ' ')
            .toLowerCase(),
        winnerId: payment.winnerId,
    }
}

// eslint-disable-next-line complexity
const PaymentsListView: FC<PaymentsListViewProps> = (props: PaymentsListViewProps) => {
    const normalizedRoles = React.useMemo(
        () => new Set((props.profile.roles || []).map(role => role.trim()
            .toLowerCase())),
        [props.profile.roles],
    )
    const hasRole = useCallback(
        (...roles: string[]) => roles.some(role => normalizedRoles.has(role.trim()
            .toLowerCase())),
        [normalizedRoles],
    )
    const isWiproTaasAdmin = hasRole('Wipro TaaS Admin')
    const hasPaymentAdminRole = hasRole('Payment Admin')
    const isPaymentAdmin = hasPaymentAdminRole || isWiproTaasAdmin
    const isPaymentApprover = hasRole('Payment Approver')
    const canToggleRoleView = isPaymentAdmin && isPaymentApprover
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)
    const [isConfirmFormValid, setIsConfirmFormValid] = React.useState<boolean>(false)
    const [winnings, setWinnings] = React.useState<ReadonlyArray<Winning>>([])
    const [selectedPayments, setSelectedPayments] = React.useState<{ [paymentId: string]: Winning }>({})
    const selectedPaymentsCount = Object.keys(selectedPayments).length
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [paymentRoleView, setPaymentRoleView] = React.useState<PaymentRoleView>(
        isPaymentAdmin ? 'admin' : 'paymentApprover',
    )
    const isApproverView = isPaymentApprover && (
        !isPaymentAdmin || paymentRoleView === 'paymentApprover'
    )

    const restrictedCategory = isWiproTaasAdmin && !hasPaymentAdminRole ? taasPaymentCategory : undefined
    const restrictedDefaultStatus = isApproverView ? restrictedRoleDefaultStatus : undefined
    const isRestrictedApproverView = isApproverView
    const [draftFilters, setDraftFilters] = React.useState<Record<string, string[]>>({})
    const [submittedFilters, setSubmittedFilters] = React.useState<Record<string, string[]>>({})
    const [paymentListingTab, setPaymentListingTab] = React.useState<PaymentListingTab>('topcoder')

    const showPaymentListingTabs = !isApproverView
        && !(restrictedCategory && !hasPaymentAdminRole)

    React.useEffect(() => {
        if (restrictedCategory && !hasPaymentAdminRole) {
            setPaymentListingTab('taas')
        }
    }, [restrictedCategory, hasPaymentAdminRole])

    // eslint-disable-next-line complexity
    const appliedFilters = React.useMemo<Record<string, string[]>>(() => {
        const activeFilters = Object.fromEntries(
            Object.entries(submittedFilters)
                .filter(([, v]) => v.length > 0 && !(v.length === 1 && v[0] === 'all')),
        )

        if (restrictedCategory) {
            let statusFilter: Record<string, string[]> = {}
            if (submittedFilters.status?.length) {
                statusFilter = { status: submittedFilters.status }
            }

            return {
                ...activeFilters,
                category: [restrictedCategory],
                ...statusFilter,
            }
        }

        if (isApproverView) {
            let statusFilter: Record<string, string[]> = {}
            if (submittedFilters.status?.length) {
                statusFilter = { status: submittedFilters.status }
            } else if (restrictedDefaultStatus) {
                statusFilter = { status: [restrictedDefaultStatus] }
            }

            const approverDefaultDates = getApproverDefaultDateRange()
            const dateFrom = submittedFilters.dateFrom?.[0] ?? approverDefaultDates.dateFrom
            const dateTo = submittedFilters.dateTo?.[0] ?? approverDefaultDates.dateTo

            const pickedApproverTypes = toPaymentTypeCategories(submittedFilters.category ?? [])
                .filter(c => approverAllowedCategories.includes(c))
            const categories = pickedApproverTypes.length > 0
                ? pickedApproverTypes
                : [...approverAllowedCategories]

            const rest = { ...activeFilters }
            delete rest.category
            delete rest.date
            delete rest.status
            delete rest.dateFrom
            delete rest.dateTo

            return {
                ...rest,
                categories,
                ...statusFilter,
                dateFrom: [dateFrom],
                dateTo: [dateTo],
            }
        }

        const base = { ...activeFilters }
        delete base.category

        const allStatusesCount = STATUS_FILTER_OPTIONS.length
        const statusSelection = submittedFilters.status ?? []
        const statusIsFullSelection = statusSelection.length === 0
            || statusSelection.length === allStatusesCount

        if (statusIsFullSelection) {
            delete base.status
        }

        if (paymentListingTab === 'topgear') {
            return {
                ...base,
                category: [topgearPaymentCategory],
            }
        }

        if (paymentListingTab === 'taas') {
            return {
                ...base,
                category: [taasPaymentCategory],
            }
        }

        const pickedTopcoderTypes = toPaymentTypeCategories(submittedFilters.category ?? [])
            .filter(c => TOPCODER_PAYMENT_CATEGORIES.includes(c))
        const categories = pickedTopcoderTypes.length > 0
            ? pickedTopcoderTypes
            : [...TOPCODER_PAYMENT_CATEGORIES]

        return {
            ...base,
            categories,
        }
    }, [
        submittedFilters,
        restrictedCategory,
        restrictedDefaultStatus,
        isApproverView,
        paymentListingTab,
    ])

    const hasPendingFilterChanges = React.useMemo(
        () => !areFilterRecordsEqual(draftFilters, submittedFilters),
        [draftFilters, submittedFilters],
    )

    const hasActiveFilters = React.useMemo(() => {
        const approverDefaultDates = isApproverView ? getApproverDefaultDateRange() : undefined

        return Object.entries(appliedFilters)
            .some(([key, value]) => {
                if (key === 'category' || key === 'categories') {
                    return false
                }

                if (approverDefaultDates && key === 'dateFrom' && value[0] === approverDefaultDates.dateFrom) {
                    return false
                }

                if (approverDefaultDates && key === 'dateTo' && value[0] === approverDefaultDates.dateTo) {
                    return false
                }

                return value.length > 0
            })
    }, [appliedFilters, isApproverView])
    const selectedValueOverrides = React.useMemo<Record<string, string | string[]>>(() => {
        if (restrictedCategory) {
            return {
                category: restrictedCategory,
                status: draftFilters.status !== undefined
                    ? draftFilters.status
                    : [...ALL_STATUS_FILTER_VALUES],
            }
        }

        if (isApproverView) {
            const approverDefaultDates = getApproverDefaultDateRange()

            return {
                ...(draftFilters.status !== undefined
                    ? { status: draftFilters.status }
                    : { status: [restrictedDefaultStatus ?? 'ON_HOLD_ADMIN'] }),
                ...(draftFilters.category !== undefined
                    ? { category: toPaymentTypeFilterValues(draftFilters.category) }
                    : { category: toPaymentTypeFilterValues([...approverAllowedCategories]) }),
                dateFrom: draftFilters.dateFrom !== undefined
                    ? draftFilters.dateFrom[0]
                    : approverDefaultDates.dateFrom,
                dateTo: draftFilters.dateTo !== undefined
                    ? draftFilters.dateTo[0]
                    : approverDefaultDates.dateTo,
            }
        }

        const overrides: Record<string, string | string[]> = {}

        if (draftFilters.status !== undefined) {
            overrides.status = draftFilters.status
        }

        if (draftFilters.category !== undefined) {
            overrides.category = toPaymentTypeFilterValues(draftFilters.category)
        }

        if (draftFilters.dateFrom?.[0]) {
            overrides.dateFrom = draftFilters.dateFrom[0]
        }

        if (draftFilters.dateTo?.[0]) {
            overrides.dateTo = draftFilters.dateTo[0]
        }

        return overrides
    }, [
        draftFilters.status,
        draftFilters.category,
        draftFilters.dateFrom,
        draftFilters.dateTo,
        restrictedCategory,
        isApproverView,
        restrictedDefaultStatus,
    ])

    const defaultDropdownValues = React.useMemo((): Record<string, string | string[]> => {
        if (restrictedCategory) {
            return {}
        }

        if (isApproverView) {
            const approverDefaultDates = getApproverDefaultDateRange()

            const approverDefaults: Record<string, string | string[]> = {
                category: draftFilters.category !== undefined
                    ? toPaymentTypeFilterValues(draftFilters.category)
                    : toPaymentTypeFilterValues([...approverAllowedCategories]),
                dateFrom: draftFilters.dateFrom !== undefined
                    ? draftFilters.dateFrom[0]
                    : approverDefaultDates.dateFrom,
                dateTo: draftFilters.dateTo !== undefined
                    ? draftFilters.dateTo[0]
                    : approverDefaultDates.dateTo,
                status: draftFilters.status !== undefined
                    ? draftFilters.status
                    : [restrictedDefaultStatus ?? 'ON_HOLD_ADMIN'],
            }
            return approverDefaults
        }

        const topcoderDefaults: Record<string, string | string[]> = {
            category: draftFilters.category !== undefined
                ? toPaymentTypeFilterValues(draftFilters.category)
                : toPaymentTypeFilterValues([...TOPCODER_PAYMENT_CATEGORIES]),
            status: draftFilters.status !== undefined
                ? draftFilters.status
                : [...ALL_STATUS_FILTER_VALUES],
        }
        return topcoderDefaults
    }, [
        draftFilters.category,
        draftFilters.dateFrom,
        draftFilters.dateTo,
        draftFilters.status,
        restrictedCategory,
        restrictedDefaultStatus,
        isApproverView,
    ])
    const [pagination, setPagination] = React.useState<PaginationInfo>({
        currentPage: 1,
        pageSize: defaultPageSize,
        totalItems: 0,
        totalPages: 0,
    })
    const [editState, setEditState] = React.useState<{
        grossAmount?: number;
        description?: string;
        releaseDate?: Date;
        paymentStatus?: string;
        auditNote?: string;
    }>({})
    const [apiErrorMsg, setApiErrorMsg] = React.useState<string>('Member earnings will appear here.')

    const editStateRef = React.useRef(editState)

    useEffect(() => {
        editStateRef.current = editState
    }, [editState])

    const handleValueUpdated = useCallback((updates: {
        auditNote?: string,
        description?: string,
        grossAmount?: number,
        paymentStatus?: string,
        releaseDate?: Date,
    }) => {
        setEditState(prev => ({
            ...prev,
            ...updates,
        }))
    }, [])

    const convertToWinnings = useCallback(
        (payments: WinningDetail[], handleMap: Map<number, string>): ReadonlyArray<Winning> => payments
            .map(payment => convertPaymentToWinning(payment, handleMap)),
        [],
    )

    const fetchWinnings = useCallback(async () => {
        if (isLoading) {
            return
        }

        setIsLoading(true)
        try {
            const payments = await getPayments(
                pagination.pageSize,
                (pagination.currentPage - 1) * pagination.pageSize,
                appliedFilters,
            )
            const winnerIds = payments.winnings.map(winning => winning.winnerId)

            const handleMap = await getMemberHandle(winnerIds)
            const winningsData = convertToWinnings(payments.winnings, handleMap)
            setWinnings(winningsData)
            setPagination(payments.pagination)
        } catch (apiError) {
            if (apiError instanceof AxiosError && apiError?.response?.status === 403) {
                setApiErrorMsg(apiError.response.data.message)
            } else {
                setApiErrorMsg('Failed to fetch winnings. Please try again later.')
            }
        } finally {
            setIsLoading(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedFilters, convertToWinnings, pagination.currentPage, pagination.pageSize])

    const renderConfirmModalContent = React.useMemo(() => {
        if (confirmFlow?.content === undefined) {
            return undefined
        }

        if (typeof confirmFlow?.content === 'function') {
            return confirmFlow?.content()
        }

        return confirmFlow?.content
    }, [confirmFlow])

    // eslint-disable-next-line complexity
    const updatePayment = async (paymentId: string): Promise<void> => {
        const currentEditState = editStateRef.current
        // Send to server only the fields that have changed
        const updateObj = {
            auditNote: currentEditState.auditNote !== undefined ? currentEditState.auditNote : undefined,
            description: currentEditState.description !== undefined ? currentEditState.description : undefined,
            grossAmount: currentEditState.grossAmount !== undefined ? currentEditState.grossAmount : undefined,
            paymentStatus: currentEditState.paymentStatus !== undefined ? currentEditState.paymentStatus : undefined,
            releaseDate: currentEditState.releaseDate !== undefined ? currentEditState.releaseDate : undefined,
        }

        let paymentStatus : 'ON_HOLD_ADMIN' | 'OWED' | 'CANCELLED' | undefined
        if (updateObj.paymentStatus !== undefined) {
            if (updateObj.paymentStatus === 'Owed') {
                paymentStatus = 'OWED'
            } else if (updateObj.paymentStatus === 'On Hold (Admin)') {
                paymentStatus = 'ON_HOLD_ADMIN'
            } else if (updateObj.paymentStatus === 'Cancel') {
                paymentStatus = 'CANCELLED'
            }
        }

        const updates: {
            auditNote?: string
            description?: string
            paymentStatus?: 'ON_HOLD_ADMIN' | 'OWED' | 'CANCELLED'
            releaseDate?: string
            paymentAmount?: number
            winningsId: string
        } = {
            auditNote: updateObj.auditNote,
            winningsId: paymentId,
        }

        if (updateObj.description) updates.description = updateObj.description
        if (paymentStatus) updates.paymentStatus = paymentStatus
        if (paymentStatus !== 'CANCELLED') {
            if (updateObj.releaseDate !== undefined) updates.releaseDate = updateObj.releaseDate.toISOString()
            if (updateObj.grossAmount !== undefined) updates.paymentAmount = updateObj.grossAmount
        }

        toast.success('Updating payment', { position: toast.POSITION.BOTTOM_RIGHT })
        try {
            const updateMessage = await editPayment(updates)
            toast.success(updateMessage, { position: toast.POSITION.BOTTOM_RIGHT })
        } catch (err:any) {
            if (err?.message) {
                toast.error(err?.message, { position: toast.POSITION.BOTTOM_RIGHT })
            } else {
                toast.error('Failed to update payment', { position: toast.POSITION.BOTTOM_RIGHT })
            }

            return
        }

        setEditState({})

        await fetchWinnings()
    }

    useEffect(() => {
        fetchWinnings()
    }, [fetchWinnings])

    const onPaymentEditCallback = useCallback((payment: Winning) => {
        setConfirmFlow({
            action: 'Save',
            callback: async () => {
                updatePayment(payment.id)
            },
            content: (
                <PaymentEditForm
                    payment={payment}
                    canSave={setIsConfirmFormValid}
                    onValueUpdated={handleValueUpdated}
                />
            ),
            title: 'Edit Payment',
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleValueUpdated, editState, fetchWinnings])

    const isEditingAllowed = (): boolean => (
        props.profile.roles.includes('Payment Admin')
        || props.profile.roles.includes('Payment BA Admin')
        || props.profile.roles.includes('Payment Editor')
        || props.profile.roles.includes('Wipro TaaS Admin')
    )

    const [selectedPaymentAction, setSelectedPaymentAction] = React.useState<SelectedPaymentAction | undefined>(undefined)
    const [bulkAuditNote, setBulkAuditNote] = React.useState('')

    /**
    * Switches the payments page between the full admin view and scoped approver views.
    * The role-scoped category is derived from the selected role view, so shared filters stay reusable
     * and hidden type restrictions do not leak across view changes.
     */
    const onRoleViewChange = useCallback((nextView: PaymentRoleView) => {
        if (nextView === paymentRoleView) {
            return
        }

        setPaymentRoleView(nextView)
        setPaymentListingTab('topcoder')
        setBulkAuditNote('')
        setSelectedPaymentAction(undefined)
        setSelectedPayments({})
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
        }))
        setDraftFilters(prev => withoutFilterKey(
            withoutFilterKey(withoutFilterKey(withoutFilterKey(prev, 'category'), 'date'), 'dateFrom'),
            'dateTo',
        ))
        setSubmittedFilters(prev => withoutFilterKey(
            withoutFilterKey(withoutFilterKey(withoutFilterKey(prev, 'category'), 'date'), 'dateFrom'),
            'dateTo',
        ))
    }, [paymentRoleView])

    const onPaymentListingTabChange = useCallback((tab: PaymentListingTab) => {
        setPaymentListingTab(tab)
        setBulkAuditNote('')
        setSelectedPaymentAction(undefined)
        setSelectedPayments({})
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
        }))
        setDraftFilters(prev => withoutFilterKey(prev, 'category'))
        setSubmittedFilters(prev => withoutFilterKey(prev, 'category'))
    }, [])

    /**
     * Applies the selected approver action to the current payment selection.
     *
     * @param action whether the selection should be approved or rejected.
     * @param auditNote approver note captured in the confirmation modal.
     * @returns a promise that resolves after the updates and list refresh finish.
     * @remarks Engagement approvers can only update On Hold (Admin) rows from
     * the scoped view, so this handler maps the UI action directly to finance
     * status transitions without exposing extra edit fields.
     */
    const onSelectedPaymentsUpdate = useCallback(async (
        action: SelectedPaymentAction,
        auditNote: string,
    ) => {
        const ids = Object.keys(selectedPayments)
        if (ids.length === 0) return

        const isRejectAction = action === 'reject'
        const nextPaymentStatus = isRejectAction ? 'CANCELLED' : 'OWED'
        const actionVerb = isRejectAction ? 'reject' : 'approve'
        const actionResult = isRejectAction ? 'rejected' : 'approved'

        toast.success(`Starting ${ids.length > 1 ? 'bulk ' : ''}${actionVerb}`, { position: toast.POSITION.BOTTOM_RIGHT })

        let successfullyUpdated = 0
        for (const id of ids) {
            const updates: any = {
                auditNote,
                paymentStatus: nextPaymentStatus,
                winningsId: id,
            }

            try {
                // awaiting sequentially to preserve order and server load control
                // errors for individual items are caught and reported
                // eslint-disable-next-line no-await-in-loop
                await editPayment(updates)
                successfullyUpdated += 1
            } catch (err:any) {
                const paymentName = selectedPayments[id]?.handle || id
                if (err?.message) {
                    toast.error(`Failed to ${actionVerb} payment ${paymentName} (${id}): ${err.message}`, { position: toast.POSITION.BOTTOM_RIGHT })
                } else {
                    toast.error(`Failed to ${actionVerb} payment ${paymentName} (${id})`, { position: toast.POSITION.BOTTOM_RIGHT })
                }
            }
        }

        if (successfullyUpdated > 0) {
            toast.success(
                `Successfully ${actionResult} ${successfullyUpdated} winning${successfullyUpdated === 1 ? '' : 's'}`,
                { position: toast.POSITION.BOTTOM_RIGHT },
            )
        }

        setBulkAuditNote('')
        setSelectedPaymentAction(undefined)
        setSelectedPayments({})
        await fetchWinnings()
    }, [selectedPayments, fetchWinnings])

    const listingFilters = React.useMemo((): Filter[] => {
        const pageSizeFilter: Filter = {
            key: 'pageSize',
            label: 'Payments per page',
            options: [
                { label: '10', value: '10' },
                { label: '50', value: '50' },
                { label: '100', value: '100' },
            ],
            type: 'dropdown',
        }

        const handleFilter: Filter = {
            key: 'winnerIds',
            label: 'Handle/Username',
            type: 'member_autocomplete',
        }

        const statusFilter: Filter = {
            key: 'status',
            label: 'Status',
            options: STATUS_FILTER_OPTIONS,
            type: 'multi_dropdown',
        }

        if (isWiproTaasAdmin && !hasPaymentAdminRole) {
            return [
                handleFilter,
                statusFilter,
                {
                    key: 'dateFrom',
                    label: 'Date from',
                    type: 'date',
                },
                {
                    key: 'dateTo',
                    label: 'Date to',
                    type: 'date',
                },
                pageSizeFilter,
            ]
        }

        if (isApproverView) {
            return [
                handleFilter,
                statusFilter,
                {
                    displayValueInTrigger: true,
                    key: 'category',
                    label: 'Payment Type',
                    options: APPROVER_TYPE_FILTER_OPTIONS,
                    type: 'multi_dropdown',
                },
                {
                    key: 'dateFrom',
                    label: 'Date from',
                    type: 'date',
                },
                {
                    key: 'dateTo',
                    label: 'Date to',
                    type: 'date',
                },
                pageSizeFilter,
            ]
        }

        const filtersOut: Filter[] = [
            handleFilter,
            statusFilter,
        ]

        if (paymentListingTab === 'topcoder') {
            filtersOut.push({
                displayValueInTrigger: true,
                key: 'category',
                label: 'Type',
                options: TOPCODER_TYPE_FILTER_OPTIONS,
                type: 'multi_dropdown',
            })
        }

        filtersOut.push(
            {
                key: 'dateFrom',
                label: 'Date from',
                type: 'date',
            },
            {
                key: 'dateTo',
                label: 'Date to',
                type: 'date',
            },
            pageSizeFilter,
        )

        return filtersOut
    }, [
        hasPaymentAdminRole,
        isApproverView,
        isWiproTaasAdmin,
        paymentListingTab,
    ])

    const selectedPaymentActions = selectedPaymentsCount > 0
        ? [
            {
                appearance: 'primary' as const,
                key: 'approve-selected-payments',
                label: `Approve (${selectedPaymentsCount})`,
                onClick: () => setSelectedPaymentAction('approve'),
            },
            {
                appearance: 'secondary' as const,
                key: 'reject-selected-payments',
                label: `Reject (${selectedPaymentsCount})`,
                onClick: () => setSelectedPaymentAction('reject'),
                variant: 'danger' as const,
            },
        ]
        : []

    return (
        <>
            <Collapsible
                header={<h3>Payment Listing</h3>}
                isCollapsed={props.isCollapsed}
                onToggle={props.onToggle}
            >
                {(showPaymentListingTabs || canToggleRoleView) && (
                    <div className={styles.paymentListingNavRow}>
                        {showPaymentListingTabs && (
                            <div
                                className={styles.paymentListingTabs}
                                role='tablist'
                                aria-label='Payment source'
                            >
                                {([
                                    { id: 'topcoder' as const, label: 'Topcoder' },
                                    { id: 'topgear' as const, label: 'Topgear' },
                                    { id: 'taas' as const, label: 'TaaS' },
                                ]).map(tab => (
                                    <button
                                        key={tab.id}
                                        type='button'
                                        role='tab'
                                        aria-selected={paymentListingTab === tab.id}
                                        className={`${styles.paymentListingTab} ${paymentListingTab === tab.id ? styles.paymentListingTabActive : ''}`}
                                        onClick={() => onPaymentListingTabChange(tab.id)}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {canToggleRoleView && (
                            <div className={styles.roleViewToggle}>
                                <div className={styles.roleViewButtons}>
                                    <button
                                        type='button'
                                        aria-pressed={!isRestrictedApproverView}
                                        className={`${styles.roleViewButton} ${!isRestrictedApproverView ? styles.roleViewButtonActive : ''}`}
                                        onClick={() => onRoleViewChange('admin')}
                                    >
                                        Admin View
                                    </button>
                                    {isPaymentApprover && (
                                        <button
                                            type='button'
                                            aria-pressed={isApproverView}
                                            className={`${styles.roleViewButton} ${isApproverView ? styles.roleViewButtonActive : ''}`}
                                            onClick={() => onRoleViewChange('paymentApprover')}
                                        >
                                            Approver View
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                <FilterBar
                    showExportButton
                    selectedCount={selectedPaymentsCount}
                    selectionActions={selectedPaymentActions}
                    hasActiveFilters={hasActiveFilters}
                    onExport={async () => {
                        toast.success('Downloading payments report. This may take a few moments.', { position: toast.POSITION.BOTTOM_RIGHT })
                        downloadBlob(
                            await exportSearchResults(appliedFilters, WinningsType.PAYMENT),
                            `payments-${new Date()
                                .getTime()}.csv`,
                        )
                        toast.success('Download complete', { position: toast.POSITION.BOTTOM_RIGHT })
                    }}
                    selectedValueOverrides={{ ...defaultDropdownValues, ...selectedValueOverrides }}
                    filters={listingFilters}
                    hasPendingChanges={hasPendingFilterChanges}
                    onFilterChange={(key: string, value: string[]) => {
                        setDraftFilters(prev => ({
                            ...prev,
                            [key]: value,
                        }))
                    }}
                    onApplyFilters={() => {
                        setDraftFilters(currentDraft => {
                            const nextPageSize = currentDraft.pageSize?.[0]
                                ? parseInt(currentDraft.pageSize[0], 10)
                                : pagination.pageSize

                            setSubmittedFilters(currentDraft)
                            setPagination(prev => ({
                                ...prev,
                                currentPage: 1,
                                pageSize: nextPageSize,
                            }))
                            setSelectedPayments({})

                            return currentDraft
                        })
                    }}
                    onResetFilters={() => {
                        setPagination({
                            ...pagination,
                            currentPage: 1,
                            pageSize: defaultPageSize,
                        })
                        setDraftFilters({})
                        setSubmittedFilters({})
                        setSelectedPayments({})
                    }}
                />
                {isLoading && <LoadingCircles className={styles.centered} />}
                {!isLoading && winnings.length > 0 && (
                    <PaymentsTable
                        enableBulkEdit={isRestrictedApproverView}
                        canEdit={isEditingAllowed() && !isRestrictedApproverView}
                        currentPage={pagination.currentPage}
                        numPages={pagination.totalPages}
                        payments={winnings}
                        selectedPayments={selectedPayments}
                        onSelectionChange={selected => setSelectedPayments(selected)}
                        onNextPageClick={async function onNextPageClicked() {
                            if (pagination.currentPage === pagination.totalPages) {
                                return
                            }

                            setPagination({
                                ...pagination,
                                currentPage: pagination.currentPage + 1,
                            })
                        }}
                        onPreviousPageClick={async function onPrevPageClicked() {
                            if (pagination.currentPage === 1) {
                                return
                            }

                            setPagination({
                                ...pagination,
                                currentPage: pagination.currentPage - 1,
                            })
                        }}
                        onPageClick={async function onPageClicked(pageNumber: number) {
                            setPagination({
                                ...pagination,
                                currentPage: pageNumber,
                            })
                        }}
                        onPaymentEditClick={(payment: Winning) => {
                            setEditState({})
                            onPaymentEditCallback(payment)
                        }}
                        onPaymentViewClick={function onPaymentViewClicked(payment: Winning) {
                            setConfirmFlow({
                                action: 'Save',
                                callback: async () => {
                                    updatePayment(payment.id)
                                },
                                content: (
                                    <PaymentView
                                        payment={payment}
                                        onClose={() => setConfirmFlow(undefined)}
                                    />
                                ),
                                showButtons: false,
                                title: 'PAYMENT DETAILS',
                            })
                        }}
                    />
                )}
                {!isLoading && winnings.length === 0 && (
                    <div className={styles.centered}>
                        <p className='body-main'>
                            {!hasActiveFilters
                                ? apiErrorMsg
                                : 'No payments match your filters.'}
                        </p>
                    </div>
                )}
            </Collapsible>
            {selectedPaymentAction && (
                <ConfirmModal
                    maxWidth='800px'
                    size='lg'
                    showButtons
                    title={`${selectedPaymentAction === 'reject' ? 'Reject' : 'Approve'} Payment${selectedPaymentsCount > 1 ? 's' : ''}`}
                    action={selectedPaymentAction === 'reject' ? 'Reject' : 'Approve'}
                    onClose={function onClose() {
                        setBulkAuditNote('')
                        setSelectedPaymentAction(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        onSelectedPaymentsUpdate(selectedPaymentAction, bulkAuditNote)
                    }}
                    canSave={bulkAuditNote.trim().length > 0}
                    open={selectedPaymentAction !== undefined}
                >
                    <div>
                        <p>
                            You are about to
                            {' '}
                            {selectedPaymentAction}
                            {' '}
                            {selectedPaymentsCount}
                            {' '}
                            payment
                            {selectedPaymentsCount > 1 ? 's' : ''}
                            .
                        </p>
                        <br />
                        <InputText
                            type='text'
                            label='Audit Note'
                            name='bulkAuditNote'
                            value={bulkAuditNote}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBulkAuditNote(e.target.value)}
                        />
                    </div>
                </ConfirmModal>
            )}
            {confirmFlow && (
                <ConfirmModal
                    maxWidth='960px'
                    size='lg'
                    showButtons={confirmFlow.showButtons}
                    title={confirmFlow.title}
                    action={confirmFlow.action}
                    onClose={function onClose() {
                        setEditState({})
                        setConfirmFlow(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        confirmFlow.callback?.()
                        setConfirmFlow(undefined)
                    }}
                    canSave={isConfirmFormValid}
                    open={confirmFlow !== undefined}
                >
                    <div>{renderConfirmModalContent}</div>
                </ConfirmModal>
            )}
        </>
    )
}

export default PaymentsListView
