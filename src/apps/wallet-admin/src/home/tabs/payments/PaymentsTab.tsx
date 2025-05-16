/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { downloadBlob } from '~/libs/shared'

import { editPayment, exportSearchResults, getMemberHandle, getPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail } from '../../../lib/models/WinningDetail'
import { FilterBar, formatIOSDateString, PaymentView } from '../../../lib'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import PaymentEditForm from '../../../lib/components/payment-edit/PaymentEdit'
import PaymentsTable from '../../../lib/components/payments-table/PaymentTable'

import styles from './Payments.module.scss'

interface ListViewProps {
    // eslint-disable-next-line react/no-unused-prop-types
    profile: UserProfile
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ListView: FC<ListViewProps> = (props: ListViewProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)
    const [isConfirmFormValid, setIsConfirmFormValid] = React.useState<boolean>(false)
    const [winnings, setWinnings] = React.useState<ReadonlyArray<Winning>>([])
    const [selectedPayments, setSelectedPayments] = React.useState<{ [paymentId: string]: Winning }>({})
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [filters, setFilters] = React.useState<Record<string, string[]>>({})
    const [pagination, setPagination] = React.useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    })
    const [editState, setEditState] = React.useState<{
        grossAmount?: number;
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
        (payments: WinningDetail[], handleMap: Map<number, string>): ReadonlyArray<Winning> => payments.map(payment => {
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
            }
        }),
        [],
    )

    const fetchWinnings = useCallback(async () => {
        if (isLoading) {
            return
        }

        setIsLoading(true)
        try {
            const payments = await getPayments(pagination.pageSize, (pagination.currentPage - 1) * pagination.pageSize, filters)
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
    }, [convertToWinnings, filters, pagination.currentPage, pagination.pageSize])

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
            grossAmount: currentEditState.grossAmount !== undefined ? currentEditState.grossAmount : undefined,
            paymentStatus: currentEditState.paymentStatus !== undefined ? currentEditState.paymentStatus : undefined,
            releaseDate: currentEditState.releaseDate !== undefined ? currentEditState.releaseDate : undefined,
        }

        let paymentStatus : 'ON_HOLD_ADMIN' | 'OWED' | 'CANCELLED' | undefined
        if (updateObj.paymentStatus !== undefined) {
            if (updateObj.paymentStatus === 'Owed') {
                paymentStatus = 'OWED'
            } else if (updateObj.paymentStatus === 'On Hold') {
                paymentStatus = 'ON_HOLD_ADMIN'
            } else if (updateObj.paymentStatus === 'Cancel') {
                paymentStatus = 'CANCELLED'
            }
        }

        const updates: {
            auditNote?: string
            paymentStatus?: 'ON_HOLD_ADMIN' | 'OWED' | 'CANCELLED'
            releaseDate?: string
            paymentAmount?: number
            winningsId: string
        } = {
            auditNote: updateObj.auditNote,
            winningsId: paymentId,
        }

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
        let status = payment.status
        if (status === 'On Hold (Admin)') {
            status = 'On Hold'
        } else if (['On Hold (Member)', 'On Hold (Tax Form)', 'On Hold (Payment Provider)'].indexOf(status) !== -1) {
            status = 'Owed'
        }

        setConfirmFlow({
            action: 'Save',
            callback: async () => {
                updatePayment(payment.id)
            },
            content: (
                <PaymentEditForm
                    payment={{
                        ...payment,
                        status,
                    }}
                    canSave={setIsConfirmFormValid}
                    onValueUpdated={handleValueUpdated}
                />
            ),
            title: 'Edit Payment',
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleValueUpdated, editState])

    const isEditingAllowed = (): boolean => props.profile.roles.includes('Payment Admin') || props.profile.roles.includes('Payment Editor')

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Member Payments</h3>
                </div>
                <div className={styles.content}>
                    <Collapsible header={<h3>Payment Listing</h3>}>
                        <FilterBar
                            showExportButton
                            onExport={async () => {
                                toast.success('Downloading payments report. This may take a few moments.', { position: toast.POSITION.BOTTOM_RIGHT })
                                downloadBlob(
                                    await exportSearchResults(filters),
                                    `payments-${new Date()
                                        .getTime()}.csv`,
                                )
                                toast.success('Download complete', { position: toast.POSITION.BOTTOM_RIGHT })
                            }}
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
                                setFilters({
                                    ...filters,
                                    [key]: value,
                                })
                                setSelectedPayments({})
                            }}
                            onResetFilters={() => {
                                setPagination({
                                    ...pagination,
                                    currentPage: 1,
                                    pageSize: 10,
                                })
                                setFilters({})
                                setSelectedPayments({})
                            }}
                        />
                        {isLoading && <LoadingCircles className={styles.centered} />}
                        {!isLoading && winnings.length > 0 && (
                            <PaymentsTable
                                canEdit={isEditingAllowed()}
                                currentPage={pagination.currentPage}
                                numPages={pagination.totalPages}
                                payments={winnings}
                                selectedPayments={selectedPayments}
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
                                    {Object.keys(filters).length === 0
                                        ? apiErrorMsg
                                        : 'No payments match your filters.'}
                                </p>
                            </div>
                        )}
                    </Collapsible>
                </div>
            </div>
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

export default ListView
