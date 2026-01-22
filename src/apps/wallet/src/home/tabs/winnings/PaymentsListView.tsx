/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { getPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail } from '../../../lib/models/WinningDetail'
import { FilterBar } from '../../../lib'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import { useWalletDetails, WalletDetailsResponse } from '../../../lib/hooks/use-wallet-details'
import { WalletDetails } from '../../../lib/models/WalletDetails'
import PaymentsTable from '../../../lib/components/payments-table/PaymentTable'

import ConfirmPaymentModal from './ConfirmPayment.modal'
import styles from './Winnings.module.scss'

interface PaymentsListViewProps {
    profile: UserProfile
    isCollapsed?: boolean
    onToggle?: (isCollapsed: boolean) => void
}

function formatIOSDateString(iosDateString: string): string {
    const date = new Date(iosDateString)

    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid date string')
    }

    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }

    return date.toLocaleDateString('en-GB', options)
}

function formatStatus(status: string): string {
    switch (status) {
        case 'ON_HOLD':
            return 'On Hold'
        case 'OWED':
            return 'Available'
        case 'PROCESSING':
            return 'Processing'
        case 'PAID':
            return 'Paid'
        case 'CANCELLED':
            return 'Cancelled'
        case 'FAILED':
            return 'Failed'
        case 'RETURNED':
            return 'Returned'
        default:
            return status.replaceAll('_', ' ')
    }
}

export const formatCurrency = (amountStr: string, currency: string): string => {
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

const PaymentsListView: FC<PaymentsListViewProps> = (props: PaymentsListViewProps) => {
    const [confirmPayments, setConfirmPayments] = React.useState<Winning[]>()
    const [winnings, setWinnings] = React.useState<ReadonlyArray<Winning>>([])
    const [selectedPayments, setSelectedPayments] = React.useState<{ [paymentId: string]: Winning }>({})
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [filters, setFilters] = React.useState<Record<string, string[]>>({})
    const { data: walletDetails }: WalletDetailsResponse = useWalletDetails()

    const [pagination, setPagination] = React.useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    })

    const convertToWinnings = useCallback(
        (payments: WinningDetail[]) => payments.map(payment => {
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

            return {
                canBeReleased: new Date(payment.releaseDate) <= new Date() && payment.details[0].status === 'OWED',
                createDate: formatIOSDateString(payment.createdAt),
                currency: payment.details[0].currency,
                datePaid: payment.details[0].datePaid ? formatIOSDateString(payment.details[0].datePaid) : '-',
                description: payment.description,
                details: payment.details,
                grossPayment: formatCurrency(payment.details[0].totalAmount, payment.details[0].currency),
                id: payment.id,
                releaseDate: formattedReleaseDate,
                status: formatStatus(payment.details[0].status),
                type: payment.category.replaceAll('_', ' ')
                    .toLowerCase(),
            }
        }),
        [],
    )

    const fetchWinnings = useCallback(async () => {
        setIsLoading(true)
        try {
            const payments = await getPayments(props.profile.userId.toString(), pagination.pageSize, (pagination.currentPage - 1) * pagination.pageSize, filters)
            const winningsData = convertToWinnings(payments.winnings)
            setWinnings(winningsData)
            setPagination(payments.pagination)
        } catch (apiError) {
            console.error('Failed to fetch winnings:', apiError)
        } finally {
            setIsLoading(false)
        }
    }, [props.profile.userId, convertToWinnings, filters, pagination.currentPage, pagination.pageSize])

    useEffect(() => {
        fetchWinnings()
    }, [fetchWinnings])

    function handlePayMeClick(
        payments: { [paymentId: string]: Winning },
    ): void {
        setConfirmPayments(Object.values(payments))
    }

    function handleCloseConfirmModal(isDone?: boolean): void {
        setConfirmPayments(undefined)
        setSelectedPayments({})
        if (isDone) {
            fetchWinnings()
        }
    }

    return (
        <>
            <Collapsible
                header={<h3>Payments</h3>}
                isCollapsed={props.isCollapsed}
                onToggle={props.onToggle}
            >
                <FilterBar
                    filters={[
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
                            key: 'category',
                            label: 'Type',
                            options: [
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
                                    label: 'All',
                                    value: '',
                                },
                            ],
                            type: 'dropdown',
                        },
                        {
                            key: 'status',
                            label: 'Status',
                            options: [
                                {
                                    label: 'Available',
                                    value: 'OWED',
                                },
                                {
                                    label: 'On Hold',
                                    value: 'ON_HOLD',
                                },
                                {
                                    label: 'Processing',
                                    value: 'PROCESSING',
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
                                    label: 'Failed',
                                    value: 'FAILED',
                                },
                                {
                                    label: 'Returned',
                                    value: 'RETURNED',
                                },
                                {
                                    label: 'All',
                                    value: '',
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
                        currentPage={pagination.currentPage}
                        numPages={pagination.totalPages}
                        minWithdrawAmount={walletDetails?.minWithdrawAmount ?? 0}
                        payments={winnings}
                        selectedPayments={selectedPayments}
                        onSelectedPaymentsChange={function onSelectedPaymentsChanged(selectedWinnings: { [paymentId: string]: Winning }) {
                            setSelectedPayments(selectedWinnings)
                        }}
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
                        onPayMeClick={handlePayMeClick}
                    />
                )}
                {!isLoading && winnings.length === 0 && (
                    <div className={styles.centered}>
                        <p className='body-main'>
                            {Object.keys(filters).length === 0
                                ? 'Your future earnings will appear here — explore Topcoder\'s opportunities to start making an impact!'
                                : 'No payments match your filters.'}
                        </p>
                    </div>
                )}
            </Collapsible>
            {confirmPayments && (
                <ConfirmPaymentModal
                    userEmail={props.profile.email}
                    payments={confirmPayments}
                    walletDetails={walletDetails as WalletDetails}
                    onClose={handleCloseConfirmModal}
                />
            )}
        </>
    )
}

export default PaymentsListView
