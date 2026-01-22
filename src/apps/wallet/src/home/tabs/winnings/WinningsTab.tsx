/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { useLocation } from 'react-router-dom'
import React, { FC, useEffect, useRef, useState } from 'react'

import { UserProfile } from '~/libs/core'

import PaymentsListView from './PaymentsListView'
import PointsListView from './PointsListView'
import styles from './Winnings.module.scss'

interface WinningsTabProps {
    profile: UserProfile
}

const WinningsTab: FC<WinningsTabProps> = (props: WinningsTabProps) => {
    const location = useLocation()
    const pointsRef = useRef<HTMLDivElement>(null)
    const [paymentsCollapsed, setPaymentsCollapsed] = useState(false)
    const [pointsCollapsed, setPointsCollapsed] = useState(false)

    useEffect(() => {
        // Parse URL query parameters from hash
        const hashParts = location.hash.split('?')
        if (hashParts.length > 1) {
            const searchParams = new URLSearchParams(hashParts[1])
            const type = searchParams.get('type')

            if (type === 'points') {
                // Collapse payments and scroll to points
                setPaymentsCollapsed(true)
                setPointsCollapsed(false)

                // Scroll to points section after a short delay to allow rendering
                setTimeout(() => {
                    pointsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
            }
        }
    }, [location.hash])

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
                                        {
                                            label: 'Engagement Payment',
                                            value: 'ENGAGEMENT_PAYMENT',
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
                </div>
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Winnings</h3>
            </div>
            <div className={styles.content}>
                <PaymentsListView
                    profile={props.profile}
                    isCollapsed={paymentsCollapsed}
                    onToggle={setPaymentsCollapsed}
                />
                <div ref={pointsRef}>
                    <PointsListView
                        profile={props.profile}
                        isCollapsed={pointsCollapsed}
                        onToggle={setPointsCollapsed}
                    />
                </div>
            </div>
        </div>
    )
}

export default WinningsTab
