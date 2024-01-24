/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import React, { FC, useCallback, useState } from 'react'

import { LoadingCircles } from '~/libs/ui'

import { FilterBar } from '../../../lib'
import { fetchPaymentProviders } from '../../../lib/services/wallet'

import styles from './PaymentsTab.module.scss'

const PaymentsTab: FC = () => {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [userIdsFilter, setUserIdsFilter] = useState<string[]>([])

    const loadTaxForms = useCallback(async () => {
        setIsLoading(true)
        try {
            const paymentMethods = await fetchPaymentProviders(currentPage, pageSize, userIdsFilter)
            console.log('paymentMethods', paymentMethods)
        } catch (apiError) {
            toast.error('Something went wrong fetching user payment methods. Please try again later.')
        }

        setIsLoading(false)
    }, [userIdsFilter])

    React.useEffect(() => {
        loadTaxForms()
    }, [loadTaxForms])

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Payment Provider</h3>
            </div>
            <br />
            <FilterBar
                filters={[{
                    key: 'userId',
                    label: 'Member ID',
                    type: 'input',
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
                    <div> Table data </div>
                )}
            </div>
        </div>
    )
}

export default PaymentsTab
