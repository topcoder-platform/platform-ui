/**
 * Billing account resources page.
 */
import { FC } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { PlusIcon } from '@heroicons/react/solid'
import { LinkButton, LoadingSpinner, PageTitle } from '~/libs/ui'

import { BillingAccountResourcesTable } from '../../lib/components/BillingAccountResourcesTable'
import { useManageBillingAccountResources, useManageBillingAccountResourcesProps } from '../../lib/hooks'
import { MSG_NO_RECORD_FOUND } from '../../config/index.config'
import { PageContent, PageHeader } from '../../lib'

import styles from './BillingAccountResourcesPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Billing Account Resources'

export const BillingAccountResourcesPage: FC<Props> = (props: Props) => {
    const { accountId = '' }: { accountId?: string } = useParams<{
        accountId: string
    }>()
    const {
        billingAccountResources,
        isLoading,
        isRemoving,
        isRemovingBool,
        doRemoveBillingAccountResource,
    }: useManageBillingAccountResourcesProps = useManageBillingAccountResources(accountId)

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
                        label='add resource'
                    />
                    <LinkButton primary light to='./../..' size='lg'>
                        Back
                    </LinkButton>
                </div>
            </PageHeader>
            <PageContent>
                {isLoading ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <>
                        {billingAccountResources.length === 0 ? (
                            <p className={styles.noRecordFound}>
                                {MSG_NO_RECORD_FOUND}
                            </p>
                        ) : (
                            <div className={styles.blockTableContainer}>
                                <BillingAccountResourcesTable
                                    isRemoving={isRemoving}
                                    datas={billingAccountResources}
                                    doRemoveItem={doRemoveBillingAccountResource}
                                />

                                {isRemovingBool && (
                                    <div className={styles.blockActionLoading}>
                                        <LoadingSpinner
                                            className={styles.spinner}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </PageContent>
        </div>
    )
}

export default BillingAccountResourcesPage
