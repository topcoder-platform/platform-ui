/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import React, { FC, useCallback, useMemo, useState } from 'react'

import { Button, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { downloadBlob } from '~/libs/shared'

import { FilterBar } from '../../../lib'
import { deleteTaxForm, fetchTaxFormDetail, fetchTaxForms } from '../../../lib/services/wallet'
import { ConfirmFlowData } from '../../../lib/models/ConfirmFlowData'
import { Column } from '../../../lib/models/Column'
import { GenericTable } from '../../../lib/components/generic-table'

import styles from './TaxFormsTab.module.scss'

function formatIOSDateString(iosDateString: string): string {
    const date = new Date(iosDateString)

    if (Number.isNaN(date.getTime())) {
        return 'N/A';
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

interface TaxFormsTabProps {
    profile: UserProfile
}

const TaxFormsTab: FC<TaxFormsTabProps> = (_props: TaxFormsTabProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)

    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(50)
    const [userIdsFilter, setUserIdsFilter] = useState<string[]>([])

    const [taxForms, setTaxForms] = useState([])

    const renderConfirmModalContent = useMemo(() => {
        if (confirmFlow?.content === undefined) {
            return undefined
        }

        if (typeof confirmFlow?.content === 'function') {
            return confirmFlow?.content()
        }

        return confirmFlow?.content
    }, [confirmFlow])

    const loadTaxForms = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetchTaxForms(currentPage, pageSize, userIdsFilter)
            setTaxForms(response.forms.map((data: {
                id: string,
                taxForm: {
                    name: string,
                },
                status: string,
                dateFiled: string,
                withholdingAmount: string,
                withholdingPercentage: string,
                userId: string,
            }) => ({
                dateFiled: formatIOSDateString(data.dateFiled),
                id: data.id,
                name: data.taxForm.name,
                status: data.status,
                userId: data.userId,
                witholdingAmount: data.withholdingAmount,
                witholdingPercentage: data.withholdingPercentage,
            })))
        } catch (apiError) {
            toast.error('Something went wrong fetching tax forms. Please try again later.')
        }

        setIsLoading(false)
    }, [userIdsFilter])

    React.useEffect(() => {
        loadTaxForms()
    }, [loadTaxForms])

    function renderActions(row: any): JSX.Element {
        return (
            <div className={styles.actionButtons}>
                <Button
                    onClick={async () => {
                        const { userId, id } = row as { userId: string, id: string }
                        toast.success('Download started.', { position: toast.POSITION.BOTTOM_RIGHT })
                        const blob = await fetchTaxFormDetail(userId, id)
                        downloadBlob(blob as Blob, `tax-form-${userId}-${new Date()
                            .getTime()}.pdf`)

                        toast.success('Tax form downloaded.', { position: toast.POSITION.BOTTOM_RIGHT })
                    }}
                    label='Download'
                    size='sm'
                    variant='danger'
                />
                <Button
                    onClick={async () => {
                        const { userId, id } = row as { userId: string, id: string }

                        setConfirmFlow({
                            action: 'Yes',
                            callback: async () => {
                                await deleteTaxForm(userId, id)

                                toast.success('Tax form deleted.', { position: toast.POSITION.BOTTOM_RIGHT })
                                loadTaxForms()
                            },
                            content: `The user ${userId} will have their tax form deleted and will have to re-submit a new one.`,
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
            Header: 'Filed TaxForm',
        },
        {
            accessor: 'dateFiled',
            Header: 'Date Filed',
        },
        {
            accessor: 'status',
            Header: 'Status',
        },
        {
            accessor: 'witholdingAmount',
            Header: 'Witholding Amount',
        },
        {
            accessor: 'witholdingPercentage',
            Header: 'Witholding Percentage',
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
                        label: 'Memeber',
                        type: 'member_autocomplete',
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
                        <GenericTable columns={columns} data={taxForms} />
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

export default TaxFormsTab
