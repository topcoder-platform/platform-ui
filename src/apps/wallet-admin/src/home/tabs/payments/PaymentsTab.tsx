/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import React, { FC, useCallback, useMemo, useState } from 'react'

import { Button, ConfirmModal, LoadingCircles } from '~/libs/ui'

import { FilterBar } from '../../../lib'
import { deletePaymentProvider, fetchPaymentProviderDetail, fetchPaymentProviders } from '../../../lib/services/wallet'
import { GenericTable } from '../../../lib/components/generic-table'
import { Column } from '../../../lib/models/Column'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'

import styles from './PaymentsTab.module.scss'

const PaymentsTab: FC = () => {
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)

    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(50)
    const [userIdsFilter, setUserIdsFilter] = useState<string[]>([])
    const [paymentMethods, setPaymentMethods] = useState([])

    const renderConfirmModalContent = useMemo(() => {
        if (confirmFlow?.content === undefined) {
            return undefined
        }

        if (typeof confirmFlow?.content === 'function') {
            return confirmFlow?.content()
        }

        return confirmFlow?.content
    }, [confirmFlow])

    const loadPaymentProviders = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetchPaymentProviders(currentPage, pageSize, userIdsFilter)
            // eslint-disable-next-line max-len
            setPaymentMethods((response.paymentMethods ?? []).map((data: {id: string, upmId: string, name: string, status: string, userId: string}) => ({
                id: data.id,
                name: data.name,
                status: data.status,
                upmId: data.upmId,
                userId: data.userId,
            })))
        } catch (apiError) {
            toast.error('Something went wrong fetching user payment methods. Please try again later.')
        }

        setIsLoading(false)
    }, [userIdsFilter])

    React.useEffect(() => {
        loadPaymentProviders()
    }, [loadPaymentProviders])

    function renderActions(row: any): JSX.Element {
        return (
            <div className={styles.actionButtons}>
                <Button
                    onClick={async () => {
                        const { userId, id } = row as { userId: string, id: string }

                        const details = await fetchPaymentProviderDetail(userId, id)

                        // toast.success('Your account has been updated.', { position: toast.POSITION.BOTTOM_RIGHT })
                        console.log('Details', details)
                    }}
                    label='View'
                    size='sm'
                    variant='danger'
                />
                <Button
                    onClick={async () => {
                        const { userId, id } = row as { userId: string, id: string }

                        setConfirmFlow({
                            action: 'Yes',
                            callback: async () => {
                                await deletePaymentProvider(userId, id)

                                // eslint-disable-next-line max-len
                                toast.success('Payment Provider Successfully Removed', { position: toast.POSITION.BOTTOM_RIGHT })
                                loadPaymentProviders()
                            },
                            content: `The user ${userId} will no longer be able to use this payment provider.`,
                            title: 'Are you sure?',
                        })
                    }}
                    label='Delete'
                    size='sm'
                    variant='danger'
                />
            </div>
        )
    }

    const columns: Column[] = [
        {
            accessor: 'userId',
            Header: 'User ID',
        },
        {
            accessor: 'name',
            Header: 'Selected Payment Provider',
        },
        {
            accessor: 'status',
            Header: 'Status',
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
                    <h3>Payment Provider</h3>
                </div>
                <br />
                <FilterBar
                    filters={[{
                        key: 'userId',
                        label: 'Memeber',
                        type: 'member_autocomplete',
                    }]}
                    onFilterChange={(key: string, value: string[]) => {
                        setUserIdsFilter(value)
                    }}
                    onResetFilters={() => {
                        setUserIdsFilter([])
                    }}
                />
                <div className={styles.content}>
                    {isLoading && <LoadingCircles />}
                    {!isLoading && (
                        <GenericTable columns={columns} data={paymentMethods} />
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

export default PaymentsTab
