/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import { AxiosError } from 'axios'
import { Link } from 'react-router-dom'
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { getPayments, processWinningsPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail } from '../../../lib/models/WinningDetail'
import { FilterBar } from '../../../lib'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'
import { useWalletDetails, WalletDetailsResponse } from '../../../lib/hooks/use-wallet-details'
import { nullToZero } from '../../../lib/util'
import PaymentsTable from '../../../lib/components/payments-table/PaymentTable'

import styles from './Winnings.module.scss'

interface ListViewProps {
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

const ListView: FC<ListViewProps> = (props: ListViewProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)
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

    const processPayouts = async (winningIds: string[]): Promise<void> => {
        setSelectedPayments({})

        toast.info('Processing payments...', {
            position: toast.POSITION.BOTTOM_RIGHT,
        })
        try {
            await processWinningsPayments(winningIds)
            toast.success('Payments processed successfully!', {
                position: toast.POSITION.BOTTOM_RIGHT,
            })
        } catch (error) {
            let message = 'Failed to process payments. Please try again later.'

            if (error instanceof AxiosError) {
                message = error.response?.data?.error?.message ?? error.response?.data?.message ?? error.message ?? ''

                message = message.charAt(0)
                    .toUpperCase() + message.slice(1)
            }

            toast.error(message, {
                position: toast.POSITION.BOTTOM_RIGHT,
            })
        }

        fetchWinnings()
    }

    function handlePayMeClick(
        paymentIds: { [paymentId: string]: Winning },
        totalAmount: string,
    ): void {
        setConfirmFlow({
            action: 'Yes',
            callback: () => processPayouts(Object.keys(paymentIds)),
            content: (
                <>
                    You are about to process payments for a total of USD
                    {' '}
                    {totalAmount}
                    .
                    <br />
                    <br />
                    {walletDetails && (
                        <>
                            <div className={styles.taxes}>
                                Est. Payment Fees:
                                {' '}
                                {nullToZero(walletDetails.estimatedFees)}
                                {' '}
                                USD and Tax Withholding:
                                {' '}
                                {`${nullToZero(walletDetails.taxWithholdingPercentage)}%`}
                                {' '}
                                will be applied on the payment.
                            </div>
                            <div className={styles.taxes}>
                                {walletDetails.primaryCurrency && (
                                    <>
                                        You will receive the payment in
                                        {' '}
                                        {walletDetails.primaryCurrency}
                                        {' '}
                                        currency after 2% conversion fees applied.
                                    </>
                                )}
                            </div>
                            <div className={`${styles.taxes} ${styles.mt}`}>
                                You can adjust your payout settings to customize your estimated payment fee and tax withholding percentage in
                                {' '}
                                <Link to='#payout'>Payout</Link>
                            </div>
                        </>
                    )}
                </>
            ),
            title: 'Are you sure?',
        })
    }

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Winnings</h3>
                </div>
                <div className={styles.content}>
                    <Collapsible header={<h3>Payments</h3>}>
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
                                    key: 'type',
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
                        {/* <PageDivider /> */}
                        {isLoading && <LoadingCircles className={styles.centered} />}
                        {!isLoading && winnings.length > 0 && (
                            <PaymentsTable
                                currentPage={pagination.currentPage}
                                numPages={pagination.totalPages}
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
