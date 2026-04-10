/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, ConfirmModal, InputText, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { downloadBlob } from '~/libs/shared'

import { editPayment, exportSearchResults, getMemberHandle, getPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail, WinningsType } from '../../../lib/models/WinningDetail'
import { FilterBar, formatIOSDateString, PaymentView } from '../../../lib'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import { Filter } from '../../../lib/components/filter-bar/FilterBar'
import PaymentEditForm from '../../../lib/components/payment-edit/PaymentEdit'
import PaymentsTable from '../../../lib/components/payments-table/PaymentTable'

import styles from './Payments.module.scss'

type PaymentRoleView = 'admin' | 'engagementApprover' | 'wiproTaasAdmin'
type SelectedPaymentAction = 'approve' | 'reject'

const engagementPaymentCategory = 'ENGAGEMENT_PAYMENT'
const restrictedRoleDefaultStatus = 'ON_HOLD_ADMIN'
const taasPaymentCategory = 'TAAS_PAYMENT'
const defaultPageSize = 10

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
            status = 'On Hold (Payment Provider)'
        } else if (!payment.paymentStatus?.taxFormSetupComplete) {
            status = 'On Hold (Tax Form)'
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
    const isEngagementPaymentApprover = hasRole('Engagement Payment Approver')
    const canToggleRoleView = isPaymentAdmin && (isEngagementPaymentApprover)
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)
    const [isConfirmFormValid, setIsConfirmFormValid] = React.useState<boolean>(false)
    const [winnings, setWinnings] = React.useState<ReadonlyArray<Winning>>([])
    const [selectedPayments, setSelectedPayments] = React.useState<{ [paymentId: string]: Winning }>({})
    const selectedPaymentsCount = Object.keys(selectedPayments).length
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [paymentRoleView, setPaymentRoleView] = React.useState<PaymentRoleView>(
        isPaymentAdmin ? 'admin' : 'engagementApprover',
    )
    const isEngagementApproverView = isEngagementPaymentApprover && (
        !isPaymentAdmin || paymentRoleView === 'engagementApprover'
    )

    const restrictedCategory = isEngagementApproverView
        ? engagementPaymentCategory
        : (isWiproTaasAdmin && !hasPaymentAdminRole ? taasPaymentCategory : undefined)
    const restrictedDefaultStatus = isEngagementApproverView ? restrictedRoleDefaultStatus : undefined
    const isRestrictedApproverView = isEngagementApproverView
    const [filters, setFilters] = React.useState<Record<string, string[]>>({})
    const hasSelectedStatusFilter = (filters.status?.length ?? 0) > 0 && filters.status?.[0] !== 'all'
    const appliedFilters = React.useMemo<Record<string, string[]>>(() => {
        // Strip 'all' sentinel values — never forward them to the API
        const activeFilters = Object.fromEntries(
            Object.entries(filters)
                .filter(([, v]) => v.length > 0 && v[0] !== 'all'),
        )

        if (!restrictedCategory) {
            return activeFilters
        }

        return {
            ...activeFilters,
            category: [restrictedCategory],
            ...(hasSelectedStatusFilter
                ? { status: activeFilters.status }
                : (restrictedDefaultStatus ? { status: [restrictedDefaultStatus] } : {})),
        }
    }, [filters, hasSelectedStatusFilter, restrictedCategory, restrictedDefaultStatus])

    const hasActiveFilters = React.useMemo(
        () => Object.entries(appliedFilters)
            .some(([key, value]) => key !== 'category' && value.length > 0),
        [appliedFilters],
    )
    const selectedValueOverrides = React.useMemo<Record<string, string>>(() => {
        if (!restrictedCategory) {
            return {} as Record<string, string>
        }

        // Reflect the user's explicit status choice in the dropdown display.
        // Do not inject restrictedDefaultStatus here — it applies to the API query
        // via appliedFilters but must not override the dropdown's "All" default.
        const statusOverride = filters.status?.[0] !== 'all' ? filters.status?.[0] : undefined

        return {
            category: restrictedCategory,
            ...(statusOverride ? { status: statusOverride } : {}),
        }
    }, [filters.status, restrictedCategory])

    const defaultDropdownValues = React.useMemo<Record<string, string>>(() => {
        const defaults: Record<string, string> = {}

        if (!restrictedCategory) {
            defaults.category = filters.category?.[0] ?? 'all'
        }

        defaults.date = filters.date?.[0] ?? 'all'
        defaults.status = filters.status?.[0] ?? 'all' // ← moved out

        return defaults
    }, [filters.category, filters.date, filters.status, restrictedCategory])
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
        setBulkAuditNote('')
        setSelectedPaymentAction(undefined)
        setSelectedPayments({})
        setPagination(prev => ({
            ...prev,
            currentPage: 1,
        }))
        setFilters(prev => {
            const nextFilters = { ...prev }
            delete nextFilters.category

            return nextFilters
        })
    }, [paymentRoleView])

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
                {canToggleRoleView && (
                    <div className={styles.roleViewToggle}>
                        <span className='body-small-bold'>Role:</span>
                        <div className={styles.roleViewButtons}>
                            <button
                                type='button'
                                aria-pressed={!isRestrictedApproverView}
                                className={`${styles.roleViewButton} ${!isRestrictedApproverView ? styles.roleViewButtonActive : ''}`}
                                onClick={() => onRoleViewChange('admin')}
                            >
                                Admin View
                            </button>
                            {isEngagementPaymentApprover && (
                                <button
                                    type='button'
                                    aria-pressed={isEngagementApproverView}
                                    className={`${styles.roleViewButton} ${isEngagementApproverView ? styles.roleViewButtonActive : ''}`}
                                    onClick={() => onRoleViewChange('engagementApprover')}
                                >
                                    Engagement Approver View
                                </button>
                            )}
                        </div>
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
                    filters={[
                        {
                            key: 'winnerIds',
                            label: 'Username/Handle',
                            type: 'member_autocomplete',
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            options: [
                                {
                                    label: 'All',
                                    value: 'all',
                                },
                                {
                                    label: 'Owed',
                                    value: 'OWED',
                                },
                                {
                                    label: 'On Hold (Admin)',
                                    value: 'ON_HOLD_ADMIN',
                                },
                                {
                                    label: 'On Hold (Member)',
                                    value: 'ON_HOLD',
                                },
                                {
                                    label: 'Paid',
                                    value: 'PAID',
                                },
                                {
                                    label: 'Cancelled',
                                    value: 'CANCELLED',
                                },
                                {
                                    label: 'Processing',
                                    value: 'PROCESSING',
                                },
                                {
                                    label: 'Failed',
                                    value: 'FAILED',
                                },
                                {
                                    label: 'Returned',
                                    value: 'RETURNED',
                                },
                            ],
                            type: 'dropdown',
                        },
                        ...(isRestrictedApproverView || (isWiproTaasAdmin && !hasPaymentAdminRole) ? [] : [
                            {
                                key: 'category',
                                label: 'Type',
                                options: [
                                    {
                                        label: 'All',
                                        value: 'all',
                                    },
                                    {
                                        label: 'Task Payment',
                                        value: 'TASK_PAYMENT',
                                    },
                                    {
                                        label: 'Contest Payment',
                                        value: 'CONTEST_PAYMENT',
                                    },
                                    {
                                        label: 'Copilot Payment',
                                        value: 'COPILOT_PAYMENT',
                                    },
                                    {
                                        label: 'Review Board Payment',
                                        value: 'REVIEW_BOARD_PAYMENT',
                                    },
                                    {
                                        label: 'Engagement Payment',
                                        value: 'ENGAGEMENT_PAYMENT',
                                    },
                                    {
                                        label: 'TaaS Payment',
                                        value: 'TAAS_PAYMENT',
                                    },
                                ],
                                type: 'dropdown',
                            },
                        ] as Filter[]),
                        {
                            key: 'date',
                            label: 'Date',
                            options: [
                                {
                                    label: 'Last 7 days',
                                    value: 'last7days',
                                },
                                {
                                    label: 'Last 30 days',
                                    value: 'last30days',
                                },
                                {
                                    label: 'All',
                                    value: 'all',
                                },
                            ],
                            type: 'dropdown',
                        },
                        {
                            key: 'pageSize',
                            label: 'Payments per page',
                            options: [
                                {
                                    label: '10',
                                    value: '10',
                                },
                                {
                                    label: '50',
                                    value: '50',
                                },
                                {
                                    label: '100',
                                    value: '100',
                                },
                            ],
                            type: 'dropdown',
                        },
                    ]}
                    onFilterChange={(key: string, value: string[]) => {
                        const newPagination = {
                            ...pagination,
                            currentPage: 1,
                        }
                        if (key === 'pageSize') {
                            newPagination.pageSize = parseInt(value[0], 10)
                        }

                        setPagination(newPagination)
                        setFilters(prev => ({
                            ...prev,
                            [key]: value, // store 'all' explicitly; appliedFilters strips it before the API call
                        }))
                        setSelectedPayments({})
                    }}
                    onResetFilters={() => {
                        setPagination({
                            ...pagination,
                            currentPage: 1,
                            pageSize: defaultPageSize,
                        })
                        setFilters({})
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
                                    />
                                ),
                                showButtons: false,
                                title: 'Payment Details',
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
                    maxWidth='800px'
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
