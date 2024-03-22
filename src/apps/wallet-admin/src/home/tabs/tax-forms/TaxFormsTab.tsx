/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { toast } from 'react-toastify'
import React, { FC, useCallback, useEffect } from 'react'

import { Collapsible, ConfirmModal, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { downloadBlob } from '~/libs/shared'

import { deleteTaxForm, downloadTaxForm, getMemberHandle, getTaxForms } from '../../../lib/services/wallet'
import { TaxForm } from '../../../lib/models/TaxForm'
import { FilterBar, formatIOSDateString, TaxFormTable } from '../../../lib'
import { PaginationInfo } from '../../../lib/models/PaginationInfo'

import styles from './TaxFormsTab.module.scss'

interface ListViewProps {
    // eslint-disable-next-line react/no-unused-prop-types
    profile: UserProfile
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ListView: FC<ListViewProps> = (props: ListViewProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<{
        form: TaxForm
    } | undefined>(undefined)
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const [filters, setFilters] = React.useState<Record<string, string[]>>({})
    const [forms, setForms] = React.useState<TaxForm[]>([])
    const [userIds, setUserIds] = React.useState<string[]>([])
    const [pagination, setPagination] = React.useState<PaginationInfo>({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
    })

    const fetchTaxForms = useCallback(async () => {
        if (isLoading) {
            return
        }

        setIsLoading(true)
        try {

            const taxFormsResponse = await getTaxForms(pagination.pageSize, (pagination.currentPage - 1) * pagination.pageSize, userIds)
            const tmpUserIds = taxFormsResponse.forms.map(form => form.userId)
            const handleMap = await getMemberHandle(tmpUserIds)

            const taxForms = taxFormsResponse.forms.map((form: TaxForm) => ({ ...form, dateFiled: form.dateFiled ? formatIOSDateString(form.dateFiled) : '-', handle: handleMap.get(parseInt(form.userId, 10)) ?? form.userId }))

            setForms(taxForms)
            setPagination(taxFormsResponse.pagination)
        } catch (apiError) {
            console.error('Failed to fetch winnings:', apiError)
        } finally {
            setIsLoading(false)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageSize, pagination.currentPage, userIds])

    useEffect(() => {
        fetchTaxForms()
    }, [fetchTaxForms])

    return (
        <>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h3>Member Tax Forms</h3>
                </div>
                <div className={styles.content}>
                    <Collapsible header={<h3>Tax Forms Listing</h3>}>
                        <FilterBar
                            filters={[
                                {
                                    key: 'userIds',
                                    label: 'Username/Handle',
                                    type: 'member_autocomplete',
                                },
                                {
                                    key: 'pageSize',
                                    label: 'Tax Forms per page',
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
                        {!isLoading && forms.length > 0 && (
                            <TaxFormTable
                                taxForms={forms}
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
                                onDownloadClick={async (form: TaxForm) => {
                                    toast.success('Downloading tax form. Please wait...', { position: 'bottom-right' })
                                    try {
                                        downloadBlob(
                                            await downloadTaxForm(form.userId, form.id),
                                            `tax-form-${form.userId}-${new Date()
                                                .getTime()}.pdf`,
                                        )
                                    } catch (err) {
                                        toast.error('Failed to download tax form. Please try again later', { position: 'bottom-right' })
                                    }
                                }}
                                onDeleteClick={async (form: TaxForm) => {
                                    setConfirmFlow({ form })
                                }}
                            />
                        )}
                        {!isLoading && forms.length === 0 && (
                            <div className={styles.centered}>
                                <p className='body-main'>
                                    {Object.keys(filters).length === 0
                                        ? 'Member tax-forms will appear here.'
                                        : 'No tax-forms match your filters.'}
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
                        const userId = confirmFlow.form.userId
                        const formId = confirmFlow.form.id
                        setConfirmFlow(undefined)

                        toast.success('Deleting tax form. Please wait...', { position: 'bottom-right' })
                        try {
                            await deleteTaxForm(userId, formId)
                            toast.success('Successfully deleted tax-form.', { position: 'bottom-right' })
                        } catch (err) {
                            toast.error('Failed to delete users tax-form. Please try again later', { position: 'bottom-right' })
                        }

                        fetchTaxForms()
                    }}
                    open={confirmFlow !== undefined}
                >
                    <div>
                        <p>
                            Are you sure you want to reset the tax-form of the member
                            {' '}
                            {confirmFlow.form.handle}
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
