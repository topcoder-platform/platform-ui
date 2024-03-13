/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { getMemberHandle, getPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail } from '../../../lib/models/WinningDetail'
import { FilterBar } from '../../../lib'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import PaymentsTable from '../../../lib/components/payments-table/PaymentTable'

import styles from './Payments.module.scss'

interface ListViewProps {
    // eslint-disable-next-line react/no-unused-prop-types
    profile: UserProfile
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
            return 'Owed'
        case 'ON_HOLD_ADMIN':
            return 'On Hold'
        case 'OWED':
            return 'Owed'
        case 'PAID':
            return 'Paid'
        case 'CANCELLED':
            return 'Cancelled'
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

    const convertToWinnings = useCallback(
        (payments: WinningDetail[], handleMap: Map<number, string>) => payments.map(payment => {
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
                handle: handleMap.get(parseInt(payment.winnerId, 10)) ?? payment.winnerId,
                id: payment.id,
                netPayment: formatCurrency(payment.details[0].totalAmount, payment.details[0].currency),
                releaseDate: formattedReleaseDate,
                status: formatStatus(payment.details[0].status),
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
            console.error('Failed to fetch winnings:', apiError)
        } finally {
            setIsLoading(false)
        }
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

    useEffect(() => {
        fetchWinnings()
    }, [fetchWinnings])

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Member Payments</h3>
                </div>
                <div className={styles.content}>
                    <Collapsible header={<h3>Payment Listing</h3>}>
                        <FilterBar
                            filters={[
                                {
                                    key: 'winnerIds',
                                    label: 'User ID',
                                    type: 'member_autocomplete',
                                },
                                // {
                                //     key: 'date',
                                //     label: 'Date',
                                //     options: [
                                //         {
                                //             label: 'Last 7 days',
                                //             value: 'last7days',
                                //         },
                                //         {
                                //             label: 'Last 30 days',
                                //             value: 'last30days',
                                //         },
                                //         {
                                //             label: 'All',
                                //             value: 'all',
                                //         },
                                //     ],
                                //     type: 'dropdown',
                                // },
                                // {
                                //     key: 'type',
                                //     label: 'Type',
                                //     options: [
                                //         {
                                //             label: 'Task Payment',
                                //             value: 'TASK_PAYMENT',
                                //         },
                                //         {
                                //             label: 'Contest Payment',
                                //             value: 'CONTEST_PAYMENT',
                                //         },
                                //         {
                                //             label: 'Copilot Payment',
                                //             value: 'COPILOT_PAYMENT',
                                //         },
                                //         {
                                //             label: 'Review Board Payment',
                                //             value: 'REVIEW_BOARD_PAYMENT',
                                //         },
                                //     ],
                                //     type: 'dropdown',
                                // },
                                // {
                                //     key: 'status',
                                //     label: 'Status',
                                //     options: [
                                //         {
                                //             label: 'Available',
                                //             value: 'OWED',
                                //         },
                                //         {
                                //             label: 'On Hold',
                                //             value: 'ON_HOLD',
                                //         },
                                //         {
                                //             label: 'Paid',
                                //             value: 'PAID',
                                //         },
                                //         {
                                //             label: 'Cancelled',
                                //             value: 'CANCELLED',
                                //         },
                                //     ],
                                //     type: 'dropdown',
                                // },
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
                                // onPayMeClick={async function onPayMeClicked(
                                //     paymentIds: { [paymentId: string]: Winning },
                                //     totalAmount: string,
                                // ) {
                                //     setConfirmFlow({
                                //         action: 'Yes',
                                //         callback: () => processPayouts(Object.keys(paymentIds)),
                                //         content: `You are about to process payments for a total of USD ${totalAmount}`,
                                //         title: 'Are you sure?',
                                //     })
                                // }}
                            />
                        )}
                        {!isLoading && winnings.length === 0 && (
                            <div className={styles.centered}>
                                <p className='body-main'>
                                    {Object.keys(filters).length === 0
                                        ? 'Member earnings will appear here.'
                                        : 'No payments match your filters.'}
                                </p>
                            </div>
                        )}
                    </Collapsible>
                </div>
            </div>
            {confirmFlow && (
                <ConfirmModal
                    title={confirmFlow.title}
                    action={confirmFlow.action}
                    onClose={function onClose() {
                        setConfirmFlow(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        confirmFlow.callback?.()
                        setConfirmFlow(undefined)
                    }}
                    open={confirmFlow !== undefined}
                >
                    <div>{renderConfirmModalContent}</div>
                </ConfirmModal>
            )}
        </>
    )
}

export default ListView
