/**
 * Billing account clients page.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { LinkButton, LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'
import { PlusIcon } from '@heroicons/react/solid'

import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { useManageClients, useManageClientsProps } from '../../lib/hooks'
import { PageContent, PageHeader } from '../../lib'
import { ClientsFilter } from '../../lib/components/ClientsFilter'
import { ClientsTable } from '../../lib/components/ClientsTable'

import styles from './ClientsPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Clients'

export const ClientsPage: FC<Props> = (props: Props) => {
    const {
        isLoading,
        datas,
        totalPages,
        page,
        setPage,
        sort,
        setSort,
        setFilterCriteria,
    }: useManageClientsProps = useManageClients({
        endDateString: 'endDate',
        startDateString: 'startDate',
    })

    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
                <div className={styles.headerActions}>
                    <LinkButton
                        primary
                        size='lg'
                        to='new'
                        icon={PlusIcon}
                        iconToLeft
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
                            />
                        )}
                    </>
                )}
            </PageContent>
        </div>
    )
}

export default ClientsPage
