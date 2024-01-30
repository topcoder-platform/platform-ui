/* eslint-disable react/no-unused-prop-types */
/* eslint-disable max-len */
/* eslint-disable sort-keys */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { toast } from 'react-toastify'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'

import { Button, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { editWinningRecord, searchWinnings } from '../../../lib/services/wallet'
import { PaymentDetail, WinningDetail } from '../../../lib/models/WinningDetail'
import { FilterBar } from '../../../lib'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { Column } from '../../../lib/models/Column'
import { GenericTable } from '../../../lib/components/generic-table'

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
        day: 'numeric',
        hour: '2-digit',
        hour12: true,
        minute: '2-digit',
        month: 'long',
        second: '2-digit',
        year: 'numeric',
    }

    return date.toLocaleDateString(undefined, options)
}

const ListView: FC<ListViewProps> = (props: ListViewProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)

    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(50)
    const [externalIdsFilter, setExternalIdsFilter] = useState<string[]>([])
    const [userIdsFilter, setUserIdsFilter] = useState<string[]>([])

    const [winnings, setWinnings] = useState<any[]>([])

    const renderConfirmModalContent = useMemo(() => {
        if (confirmFlow?.content === undefined) {
            return undefined
        }

        if (typeof confirmFlow?.content === 'function') {
            return confirmFlow?.content()
        }

        return confirmFlow?.content
    }, [confirmFlow])

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const fetchWinnings = useCallback(async () => {
        setIsLoading(true)
        try {
            const filters = {
                externalIds: externalIdsFilter,
                winnerId: userIdsFilter.length ? userIdsFilter[0] : undefined,
            }

            const payments = await searchWinnings(currentPage, pageSize, filters)
            console.log('payments', payments)
            const tempWinnings = convertToWinnings(payments as WinningDetail[])
            console.log('TempWinnings', tempWinnings)
            setWinnings(tempWinnings)
        } catch (apiError) {}

        setIsLoading(false)
    }, [currentPage, pageSize, externalIdsFilter, userIdsFilter])

    useEffect(() => {
        fetchWinnings()
    }, [fetchWinnings])

    function convertToWinnings(payments: WinningDetail[]): any[] {
        let tempWinnings: any[] = []

        payments.forEach((payment: WinningDetail) => {
            const temp = payment.details.map((detail: PaymentDetail) => {
                const winning: any = {
                    origin: payment.origin,
                    userId: payment.winnerId,
                    externalId: payment.externalId,
                    createDate: formatIOSDateString(payment.createdAt),
                    currency: payment.details[0].currency,
                    // eslint-disable-next-line max-len
                    datePaid: payment.datePaid !== undefined && payment.datePaid.length ? formatIOSDateString(payment.datePaid) : '-',
                    description: payment.description,
                    details: payment.details,
                    id: payment.id,
                    paymentId: detail.id,
                    netPayment: `${new Intl.NumberFormat('en-US', {
                        currency: detail.currency,
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                        style: 'currency',
                    })
                        .format(
                            Number(detail.netAmount),
                        )}`,
                    installmentNumber: detail.installmentNumber,
                    releaseDate: formatIOSDateString(payment.releaseDate),
                    status: payment.details[0].status,
                    type: payment.category.replaceAll('_', ' '),
                }

                return winning
            })

            tempWinnings = tempWinnings.concat(temp)
        })

        return tempWinnings
    }

    function renderActions(row: any): JSX.Element {
        return (
            <div className={styles.actionButtons}>
                <Button
                    onClick={async () => {
                        const { id: winningId, paymentId, status } = row as { paymentId: string, id: string, status: string }

                        setConfirmFlow({
                            action: 'Yes',
                            callback: async () => {

                                await editWinningRecord(winningId, paymentId, status === 'ON_HOLD_ADMIN' ? 'OWED' : 'ON_HOLD_ADMIN')

                                toast.success('Payment record cancelled.', { position: toast.POSITION.BOTTOM_RIGHT })
                                fetchWinnings()
                            },
                            content: `This will put the payment record ${paymentId} for winning ${winningId} on hold.`,
                            title: 'Are you sure?',
                        })
                    }}
                    label='Toggle Hold'
                    size='sm'
                    variant='danger'
                />
                <Button
                    onClick={async () => {
                        const { id: winningId, paymentId } = row as { paymentId: string, id: string }

                        setConfirmFlow({
                            action: 'Yes',
                            callback: async () => {

                                await editWinningRecord(winningId, paymentId, 'CANCELLED')

                                toast.success('Payment record cancelled.', { position: toast.POSITION.BOTTOM_RIGHT })
                                fetchWinnings()
                            },
                            content: `This will cancel the payment record ${paymentId} for winning ${winningId}.`,
                            title: 'Are you sure?',
                        })
                    }}
                    label='Cancel Payment'
                    size='sm'
                    variant='danger'
                />
            </div>
        )
    }

    const columns: Column[] = [
        {
            accessor: 'origin',
            Header: 'Origin',
        },
        {
            accessor: 'userId',
            Header: 'User ID',
        },
        {
            accessor: 'externalId',
            Header: 'External ID',
        },
        {
            accessor: 'type',
            Header: 'Winning Type',
        },
        {
            accessor: 'description',
            Header: 'Description',
        },
        {
            accessor: 'status',
            Header: 'Status',
        },
        {
            accessor: 'installmentNumber',
            Header: 'Installment',
        },
        {
            accessor: 'releaseDate',
            Header: 'Release Date',
        },
        {
            accessor: 'netPayment',
            Header: 'Amount',
        },
        {
            accessor: 'actions',
            Cell: ({ row }) => (renderActions(row)),
            Header: 'Actions',
        },
    ]

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Tax Forms</h3>
                </div>
                <br />
                <FilterBar
                    filters={[{
                        key: 'userId',
                        label: 'Member Handle',
                        type: 'member_autocomplete',
                    }, {
                        key: 'status',
                        label: 'Select Payment Status',
                        options: [
                            { label: 'Paid', value: 'all' },
                            { label: 'Cancelled', value: 'pending' },
                            { label: 'On Hold', value: 'paid' },
                            { label: 'On Hold Admin', value: 'paid' },
                        ],

                        type: 'dropdown',
                    }, {
                        key: 'date',
                        label: 'Select Payment Date',
                        options: [
                            { label: 'This Week', value: 'this_week' },
                            { label: 'Last 30 Days', value: 'last_30_days' },
                            { label: 'Last Year', value: 'last_year' },
                        ],

                        type: 'dropdown',
                    }, {
                        key: 'externalId',
                        label: 'Challenge ID',
                        type: 'input',
                    }]}
                    onFilterChange={(key: string, value: string[]) => {
                        console.log(key, value)

                        if (key === 'externalId') {
                            setExternalIdsFilter(value)
                        } else if (key === 'userId') {
                            setUserIdsFilter(value)
                        }
                    }}
                    onResetFilters={() => {
                        console.log('reset')
                    }}
                />
                <div className={styles.content}>
                    {isLoading && <LoadingCircles />}
                    {!isLoading && (
                        <GenericTable columns={columns} data={winnings} />
                    )}
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
