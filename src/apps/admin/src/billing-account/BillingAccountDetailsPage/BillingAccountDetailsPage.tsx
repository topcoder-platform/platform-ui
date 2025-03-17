/**
 * Billing account details page.
 */
import { FC, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import classNames from 'classnames'

import { LinkButton, LoadingSpinner, PageTitle } from '~/libs/ui'

import { DetailsTableColumn } from '../../lib/models/DetailsTableColumn.model'
import { useManageBillingAccountDetail, useManageBillingAccountDetailProps } from '../../lib/hooks'
import { PageContent, PageHeader } from '../../lib'
import { BillingAccount } from '../../lib/models'
import { TableRowDetails } from '../../lib/components/common/TableRowDetails'

import styles from './BillingAccountDetailsPage.module.scss'

interface Props {
    className?: string
}

const pageTitle = 'Details - Billing Account'

export const BillingAccountDetailsPage: FC<Props> = (props: Props) => {
    const { accountId = '' }: { accountId?: string } = useParams<{
        accountId: string
    }>()
    const { isLoading, billingAccount }: useManageBillingAccountDetailProps
        = useManageBillingAccountDetail(accountId)

    const columns = useMemo<DetailsTableColumn<BillingAccount>[][]>(
        () => [
            [
                {
                    detailType: 'label',
                    label: 'Name label',
                    propertyName: 'name',
                    renderer: () => <div>Name</div>,
                    type: 'element',
                },
                {
                    label: 'Name',
                    propertyName: 'name',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'Customer Number label',
                    propertyName: 'companyId',
                    renderer: () => <div>Customer Number</div>,
                    type: 'element',
                },
                {
                    label: 'Customer Number',
                    propertyName: 'companyId',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'Start Date label',
                    propertyName: 'startDateString',
                    renderer: () => <div>Start Date</div>,
                    type: 'element',
                },
                {
                    label: 'Start Date',
                    propertyName: 'startDateString',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'End Date label',
                    propertyName: 'endDateString',
                    renderer: () => <div>End Date</div>,
                    type: 'element',
                },
                {
                    label: 'End Date',
                    propertyName: 'endDateString',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'Status label',
                    propertyName: 'status',
                    renderer: () => <div>Status</div>,
                    type: 'element',
                },
                {
                    label: 'Status',
                    propertyName: 'status',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'Amount label',
                    propertyName: 'budgetAmount',
                    renderer: () => <div>Amount</div>,
                    type: 'element',
                },
                {
                    label: 'Amount',
                    propertyName: 'budgetAmount',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'PO Number label',
                    propertyName: 'poNumber',
                    renderer: () => <div>PO Number</div>,
                    type: 'element',
                },
                {
                    label: 'PO Number',
                    propertyName: 'poNumber',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'Subscription Number label',
                    propertyName: 'subscriptionNumber',
                    renderer: () => <div>Subscription Number</div>,
                    type: 'element',
                },
                {
                    label: 'Subscription Number',
                    propertyName: 'subscriptionNumber',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'Description label',
                    propertyName: 'description',
                    renderer: () => <div>Description</div>,
                    type: 'element',
                },
                {
                    label: 'Description',
                    propertyName: 'description',
                    type: 'text',
                },
            ],
            [
                {
                    detailType: 'label',
                    label: 'Payment Terms label',
                    propertyName: 'paymentTerms',
                    renderer: () => <div>Payment Terms</div>,
                    type: 'element',
                },
                {
                    label: 'Payment Terms',
                    propertyName: 'paymentTerms',
                    type: 'text',
                },
            ],
        ],
        [],
    )
    return (
        <div className={classNames(styles.container, props.className)}>
            <PageTitle>{pageTitle}</PageTitle>
            <PageHeader>
                <h3>{pageTitle}</h3>
            </PageHeader>

            <PageContent>
                {isLoading || !billingAccount ? (
                    <div className={styles.loadingSpinnerContainer}>
                        <LoadingSpinner className={styles.spinner} />
                    </div>
                ) : (
                    <TableRowDetails data={billingAccount} columns={columns} />
                )}
            </PageContent>
            <div className={styles.blockBottom}>
                <LinkButton primary light to='./../..' size='lg'>
                    Cancel
                </LinkButton>
            </div>
        </div>
    )
}

export default BillingAccountDetailsPage
