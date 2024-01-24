/* eslint-disable react/jsx-no-bind */
import React, { FC, useEffect } from 'react'

import { LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { getPayments, processPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail } from '../../../lib/models/WinningDetail'
import { FilterBar } from '../../../lib'
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
    const [winnings, setWinnings] = React.useState<ReadonlyArray<Winning>>([])
    const [isLoading, setIsLoading] = React.useState<boolean>(false)

    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const fetchWinnings = async () => {
        setIsLoading(true)
        try {
            const payments = await getPayments(`${props.profile.userId}`)
            setWinnings(convertToWinnings(payments))
        } catch (apiError) {}

        setIsLoading(false)
    }

    useEffect(() => {
        fetchWinnings()
    }, [])

    function convertToWinnings(payments: WinningDetail[]): Winning[] {
        const tempWinnings: Winning[] = []

        payments.forEach((payment: WinningDetail) => {
            const winning: Winning = {
                canBeReleased: new Date(payment.releaseDate) <= new Date(),
                createDate: formatIOSDateString(payment.createdAt),
                currency: payment.details[0].currency,
                // eslint-disable-next-line max-len
                datePaid: payment.datePaid !== undefined && payment.datePaid.length ? formatIOSDateString(payment.datePaid) : '-',
                description: payment.description,
                details: payment.details,
                id: payment.id,
                netPayment: `${new Intl.NumberFormat('en-US', {
                    currency: payment.details[0].currency,
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                    style: 'currency',
                })
                    .format(
                        Number(payment.details[0].totalAmount),
                    )}`,
                releaseDate: formatIOSDateString(payment.releaseDate),
                status: payment.details[0].status,
                type: payment.category.replaceAll('_', ' '),
            }
            tempWinnings.push(winning)
        })

        return tempWinnings
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Winnings</h3>
            </div>
            <br />
            <FilterBar
                filters={[{
                    key: 'externalId',
                    label: 'Challenge ID',
                    type: 'input',
                }, {
                    key: 'userId',
                    label: 'Member ID',
                    type: 'input',
                }, {
                    key: 'status',
                    label: 'Select Payment Status',
                    options: [
                        { label: 'All', value: 'all' },
                        { label: 'Pending', value: 'pending' },
                        { label: 'Paid', value: 'paid' },
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
                }]}
                onFilterChange={(key: string, value: string[]) => {
                    console.log(key, value)
                }}
                onResetFilters={() => {
                    console.log('reset')
                }}
            />
            <div className={styles.content}>
                {isLoading && <LoadingCircles />}
                {!isLoading && (
                    <PaymentsTable
                        payments={winnings}
                        onPayMeClick={async paymentIds => {
                            const ids = Object.keys(paymentIds)
                            await processPayments(ids)

                            fetchWinnings()
                        }}
                    />
                )}
            </div>
        </div>
    )
}

export default ListView
