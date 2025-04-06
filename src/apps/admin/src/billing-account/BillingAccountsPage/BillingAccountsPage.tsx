/**
 * Billing accounts page.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { PlusIcon } from '@heroicons/react/solid'
import { LinkButton, LoadingSpinner, PageDivider, PageTitle } from '~/libs/ui'

import { BillingAccountsFilter } from '../../lib/components/BillingAccountsFilter'
import { BillingAccountsTable } from '../../lib/components/BillingAccountsTable'
import { useManageBillingAccounts, useManageBillingAccountsProps } from '../../lib/hooks'
import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { PageContent, PageHeader } from '../../lib'

import styles from './BillingAccountsPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Billing Accounts'

export const BillingAccountsPage: FC<Props> = (props: Props) => {
    const {
        isLoading,
        datas,
        totalPages,
        page,
        setPage,
        sort,
        setSort,
        setFilterCriteria,
    }: useManageBillingAccountsProps = useManageBillingAccounts({
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
                        label='add billing account'
                    />
                </div>
            </PageHeader>

            <PageContent>
                <BillingAccountsFilter
                    onSubmitForm={setFilterCriteria}
                    isLoading={isLoading}
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
                            <BillingAccountsTable
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

export default BillingAccountsPage
