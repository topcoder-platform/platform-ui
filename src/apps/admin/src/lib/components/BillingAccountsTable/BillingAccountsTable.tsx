/**
 * Billing accounts table.
 */
import { Dispatch, FC, SetStateAction, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { Sort } from '~/apps/gamification-admin/src/game-lib'
import { LinkButton, Table, TableColumn } from '~/libs/ui'
import { useWindowSize, WindowSize } from '~/libs/shared'

import { BillingAccount, MobileTableColumn } from '../../models'
import { Pagination } from '../common/Pagination'
import { TableMobile } from '../common/TableMobile'

import styles from './BillingAccountsTable.module.scss'

interface Props {
    className?: string
    datas: BillingAccount[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    sort: Sort | undefined,
    setSort: Dispatch<SetStateAction<Sort | undefined>>
}

export const BillingAccountsTable: FC<Props> = (props: Props) => {
    const columns = useMemo<TableColumn<BillingAccount>[]>(
        () => [
            {
                label: 'Account ID',
                renderer: (data: BillingAccount) => (
                    <div>
                        <Link to={`${data.id}/details`}>{data.id}</Link>
                    </div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Name',
                propertyName: 'name',
                type: 'text',
            },
            {
                label: 'Status',
                propertyName: 'status',
                type: 'text',
            },
            {
                label: 'Start Date',
                propertyName: 'startDateString',
                type: 'text',
            },
            {
                label: 'End Date',
                propertyName: 'endDateString',
                type: 'text',
            },
            {
                label: '',
                renderer: (data: BillingAccount) => (
                    <span>
                        <LinkButton
                            className={styles.btnEditAccount}
                            to={`${data.id}/edit`}
                        >
                            Edit Account
                        </LinkButton>
                        |
                        <LinkButton
                            className={styles.btnViewResources}
                            to={`${data.id}/resources`}
                        >
                            View Resources
                        </LinkButton>
                    </span>
                ),
                type: 'action',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const columnsMobile = useMemo<MobileTableColumn<BillingAccount>[][]>(
        () => [
            [
                {
                    colSpan: 2,
                    label: 'Account ID',
                    propertyName: columns[0].propertyName,
                    renderer: (data: BillingAccount) => (
                        <span>
                            <Link to={`${data.id}/details`}>{data.id}</Link>
                            {' '}
                            |
                            {' '}
                            {data.name}
                        </span>
                    ),
                    type: 'element',
                },
            ],
            [
                {
                    label: 'Status label',
                    mobileType: 'label',
                    propertyName: columns[2].propertyName,
                    renderer: () => <div>Status:</div>,
                    type: 'element',
                },
                {
                    ...columns[2],
                    mobileType: 'last-value',
                },
            ],
            [
                {
                    label: 'Start Date label',
                    mobileType: 'label',
                    propertyName: columns[3].propertyName,
                    renderer: () => <div>Start Date:</div>,
                    type: 'element',
                },
                {
                    ...columns[3],
                    mobileType: 'last-value',
                },
            ],
            [
                {
                    label: 'End Date label',
                    mobileType: 'label',
                    propertyName: columns[4].propertyName,
                    renderer: () => <div>End Date:</div>,
                    type: 'element',
                },
                {
                    ...columns[4],
                    mobileType: 'last-value',
                },
            ],
            [
                {
                    ...columns[5],
                    colSpan: 2,
                    mobileType: 'last-value',
                },
            ],
        ],
        [columns],
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])

    return (
        <div className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={props.datas} />
            ) : (
                <Table
                    columns={columns}
                    data={props.datas}
                    onToggleSort={props.setSort}
                    removeDefaultSort
                    forceSort={props.sort}
                />
            )}
            <Pagination
                page={props.page}
                totalPages={props.totalPages}
                onPageChange={props.setPage}
            />
        </div>
    )
}

export default BillingAccountsTable
