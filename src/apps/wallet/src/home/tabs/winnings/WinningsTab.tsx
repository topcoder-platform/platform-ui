/* eslint-disable react/jsx-no-bind */
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { getPayments, processPayments } from '../../../lib/services/wallet'
import { Winning, WinningDetail } from '../../../lib/models/WinningDetail'

import styles from './Winnings.module.scss'
import { FilterBar } from '../../../lib'
import PaymentsTable from '../../../lib/components/payments-table/PaymentTable'
import { parse } from 'path'

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

    return date.toLocaleDateString('en-GB', options);
}

function formatStatus(status: string): string {
    switch (status) {
        case 'ON_HOLD':
            return "On Hold";
        case 'OWED':
            return 'Available'
        case 'PAID':
            return 'Paid'
        case 'CANCELLED':
            return 'Cancelled'
        default:
            return status.replaceAll('_', ' ')
    }
}

const formatCurrency = (amountStr: string, currency: string) => {
    let amount: number;
    try {
        amount = parseFloat(amountStr);
    } catch (error) {

        return amountStr;
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(amount);
};

const ListView: FC<ListViewProps> = (props: ListViewProps) => {
    const [winnings, setWinnings] = React.useState<ReadonlyArray<Winning>>([])
    const [isLoading, setIsLoading] = React.useState<boolean>(false)

    const convertToWinnings = useCallback((payments: WinningDetail[]) => {
        return payments.map(payment => {
            return {
                canBeReleased: new Date(payment.releaseDate) <= new Date(),
                createDate: formatIOSDateString(payment.createdAt),
                currency: payment.details[0].currency,
                datePaid: payment.datePaid ? formatIOSDateString(payment.datePaid) : '-',
                description: payment.description,
                details: payment.details,
                id: payment.id,
                netPayment: formatCurrency(payment.details[0].totalAmount, payment.details[0].currency),
                releaseDate: formatIOSDateString(payment.releaseDate),
                status: formatStatus(payment.details[0].status),
                type: payment.category.replaceAll('_', ' ').toLowerCase(),
            };
        });
    }, []);

    const fetchWinnings = useCallback(async () => {
        setIsLoading(true);
        try {
            const payments = await getPayments(props.profile.userId.toString());
            const winningsData = convertToWinnings(payments);
            setWinnings(winningsData);
        } catch (apiError) {
            console.error('Failed to fetch winnings:', apiError);
        } finally {
            setIsLoading(false);
        }
    }, [props.profile.userId, convertToWinnings]);

    useEffect(() => {
        fetchWinnings();
    }, [fetchWinnings]);

    return (
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
                                type: 'dropdown',
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
                            },
                            {
                                key: 'type',
                                label: 'Type',
                                type: 'dropdown',
                                options: [
                                    {
                                        label: 'Contest Payment',
                                        value: 'CONTEST_PAYMENT',
                                    },
                                    {
                                        label: 'Review Board Payment',
                                        value: 'REVIEW_BOARD_PAYMENT',
                                    },
                                ],
                            },
                            {
                                key: 'status',
                                label: 'Status',
                                type: 'dropdown',
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
                                        label: 'Paid',
                                        value: 'PAID',
                                    },
                                    {
                                        label: 'Cancelled',
                                        value: 'CANCELLED',
                                    },
                                ],
                            },
                        ]}
                        onFilterChange={(key: string, value: string[]) => {
                            console.log(key, value)
                        }}
                        onResetFilters={() => {
                            console.log('reset')
                        }}
                    />
                    {/* <PageDivider /> */}
                    {isLoading && <LoadingCircles />}
                    {!isLoading && (
                        <PaymentsTable
                            payments={winnings}
                            onPayMeClick={function onPayMeClicked() {
                                console.log('On Pay Me Clicked')
                            }}
                        />
                    )}
                </Collapsible>
            </div>
        </div>
    )
}

export default ListView
