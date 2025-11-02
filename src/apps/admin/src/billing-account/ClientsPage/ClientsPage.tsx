/**
 * Billing account clients page.
 */
import { FC, useCallback, useState } from 'react'
import classNames from 'classnames'

import { PlusIcon } from '@heroicons/react/solid'
import { Button, colWidthType, LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'

import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { useManageClients, useManageClientsProps } from '../../lib/hooks'
import { PageContent, PageHeader } from '../../lib'
import { ClientsFilter } from '../../lib/components/ClientsFilter'
import { ClientsTable } from '../../lib/components/ClientsTable'
import { DialogAddClient } from '../../lib/components/DialogAddClient'

import styles from './ClientsPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Clients'

export const ClientsPage: FC<Props> = (props: Props) => {
    const [colWidth, setColWidth] = useState<colWidthType>({})
    const [showAddDialog, setShowAddDialog] = useState(false)
    const {
        isLoading,
        datas,
        totalPages,
        page,
        setPage,
        sort,
        setSort,
        setFilterCriteria,
        reloadData,
    }: useManageClientsProps = useManageClients({
        endDateString: 'endDate',
        startDateString: 'startDate',
    })

    const handleOpenAddDialog = useCallback(() => {
        setShowAddDialog(true)
    }, [])

    const handleAdded = useCallback(() => {
        reloadData?.()
    }, [reloadData])

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
                <div className={styles.headerActions}>
                    <Button
                        primary
                        size='lg'
                        icon={PlusIcon}
                        iconToLeft
                        onClick={handleOpenAddDialog}
                        label='add client'
                    />
                </div>
            </PageHeader>

            <PageContent>
                <ClientsFilter
                    isLoading={isLoading}
                    onSubmitForm={setFilterCriteria}
                />
                <PageDivider />
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        {datas.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <ClientsTable
                                datas={datas}
                                totalPages={totalPages}
                                page={page}
                                setPage={setPage}
                                setSort={setSort}
                                sort={sort}
                                colWidth={colWidth}
                                setColWidth={setColWidth}
                            />
                        )}
                    </>
                )}
            </PageContent>
            <DialogAddClient
                open={showAddDialog}
                setOpen={setShowAddDialog}
                onAdded={handleAdded}
            />
        </div>
    )
}

export default ClientsPage
