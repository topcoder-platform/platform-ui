/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import { PaymentProvider } from '../../../lib/models/PaymentProvider'
import { deletePaymentProvider, getMemberHandle, getPaymentMethods } from '../../../lib/services/wallet'
import { FilterBar, PaymentMethodTable } from '../../../lib'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'

import styles from './PaymentMethodsTab.module.scss'

interface ListViewProps {
    // eslint-disable-next-line react/no-unused-prop-types
    profile: UserProfile
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ListView: FC<ListViewProps> = (props: ListViewProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<{
        provider: PaymentProvider
    } | undefined>(undefined)
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [filters, setFilters] = React.useState<Record<string, string[]>>({})
    const [paymentMethods, setPaymentMethods] = React.useState<PaymentProvider[]>([])
    const [userIds, setUserIds] = React.useState<string[]>([])
    const [pagination, setPagination] = React.useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    })

    const fetchPaymentProviders = useCallback(async () => {
        if (isLoading) {
            return
        }

        setIsLoading(true)
        try {

            const paymentMethodsResponse = await getPaymentMethods(pagination.pageSize, (pagination.currentPage - 1) * pagination.pageSize, userIds)
            const tmpUserIds = paymentMethodsResponse.paymentMethods.map(provider => provider.userId)
            const handleMap = await getMemberHandle(tmpUserIds)

            const userPaymentMethods = paymentMethodsResponse.paymentMethods.map((provider: PaymentProvider) => ({ ...provider, handle: handleMap.get(parseInt(provider.userId, 10)) ?? provider.userId }))

            setPaymentMethods(userPaymentMethods)
            setPagination(paymentMethodsResponse.pagination)
        } catch (apiError) {
            console.error('Failed to fetch winnings:', apiError)
        } finally {
            setIsLoading(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageSize, pagination.currentPage, userIds])

    useEffect(() => {
        fetchPaymentProviders()
    }, [fetchPaymentProviders])

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Member Payment Providers</h3>
                </div>
                <div className={styles.content}>
                    <Collapsible header={<h3>Member Payment Providers Listing</h3>}>
                        <FilterBar
                            filters={[
                                {
                                    key: 'userIds',
                                    label: 'Username/Handle',
                                    type: 'member_autocomplete',
                                },
                                {
                                    key: 'pageSize',
                                    label: 'Members per page',
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

                                if (key === 'userIds') {
                                    setUserIds(value)
                                }

                                setPagination(newPagination)
                                setFilters({
                                    ...filters,
                                    [key]: value,
                                })
                            }}
                            onResetFilters={() => {
                                setPagination({
                                    ...pagination,
                                    currentPage: 1,
                                    pageSize: 10,
                                })
                                setFilters({})
                            }}
                        />
                        {isLoading && <LoadingCircles className={styles.centered} />}
                        {!isLoading && paymentMethods.length > 0 && (
                            <PaymentMethodTable
                                paymentMethods={paymentMethods}
                                numPages={pagination.totalPages}
                                currentPage={pagination.currentPage}
                                onPreviousPageClick={() => {
                                    setPagination({
                                        ...pagination,
                                        currentPage: pagination.currentPage - 1,
                                    })
                                }}
                                onNextPageClick={() => {
                                    setPagination({
                                        ...pagination,
                                        currentPage: pagination.currentPage + 1,
                                    })
                                }}
                                onPageClick={(pageNumber: number) => {
                                    setPagination({
                                        ...pagination,
                                        currentPage: pageNumber,
                                    })
                                }}
                                onDeleteClick={async (provider: PaymentProvider) => {
                                    setConfirmFlow({ provider })
                                }}
                            />
                        )}
                        {!isLoading && paymentMethods.length === 0 && (
                            <div className={styles.centered}>
                                <p className='body-main'>
                                    {Object.keys(filters).length === 0
                                        ? 'Member payment-providers will appear here.'
                                        : 'No payment-provider found for the selected member(s).'}
                                </p>
                            </div>
                        )}
                    </Collapsible>
                </div>
            </div>
            {confirmFlow && (
                <ConfirmModal
                    title='Delete Confirmation'
                    action='delete'
                    onClose={() => {
                        setConfirmFlow(undefined)
                    }}
                    onConfirm={async () => {
                        const userId = confirmFlow.provider.userId
                        const providerId = confirmFlow.provider.id!
                        setConfirmFlow(undefined)

                        toast.success('Deleting payment provider. Please wait...', { position: 'bottom-right' })
                        try {
                            await deletePaymentProvider(userId, providerId)
                            toast.success('Successfully deleted payment provider.', { position: 'bottom-right' })
                        } catch (err) {
                            toast.error('Failed to delete users payment provider. Please try again later', { position: 'bottom-right' })
                        }

                        fetchPaymentProviders()
                    }}
                    open={confirmFlow !== undefined}
                >
                    <div>
                        <p>
                            Are you sure you want to reset the payment provider of the member
                            {' '}
                            {confirmFlow.provider.handle}
                            ?
                        </p>
                        <br />
                        <p>This action cannot be undone.</p>
                    </div>
                </ConfirmModal>
            )}
        </>
    )
}

export default ListView
