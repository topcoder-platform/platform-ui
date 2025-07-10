/**
 * Terms Table.
 */
import { Dispatch, FC, SetStateAction, useMemo } from 'react'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { colWidthType, LinkButton, Table, TableColumn } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'
import { useWindowSize, WindowSize } from '~/libs/shared'

import { MobileTableColumn, UserTerm } from '../../models'
import { TableMobile } from '../common/TableMobile'
import { Pagination } from '../common/Pagination'
import { TableWrapper } from '../common/TableWrapper'

import styles from './TermsTable.module.scss'

interface Props {
    className?: string
    datas: UserTerm[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    colWidth: colWidthType | undefined
    setColWidth: Dispatch<SetStateAction<colWidthType>> | undefined
}

const electronicallyAgreeableId = EnvironmentConfig.ADMIN.AGREE_ELECTRONICALLY
const agreeForDocuSignTemplateId
    = EnvironmentConfig.ADMIN.AGREE_FOR_DOCUSIGN_TEMPLATE

export const TermsTable: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1050, [screenWidth])
    const columns = useMemo<TableColumn<UserTerm>[]>(
        () => [
            {
                columnId: 'title',
                label: 'Title',
                renderer: (data: UserTerm) => (
                    <div>
                        <Link to={`${data.id}/edit`}>{data.title}</Link>
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'type',
                label: 'Type',
                propertyName: 'type',
                type: 'text',
            },
            {
                className: styles.tableCell,
                columnId: 'agreeabilityType',
                label: 'Agreeability Type',
                propertyName: 'agreeabilityType',
                type: 'text',
            },
            {
                className: styles.tableCell,
                columnId: 'Info',
                label: 'Info',
                renderer: (data: UserTerm) => (
                    <div>
                        {
                            data.agreeabilityTypeId === electronicallyAgreeableId
                                ? data.url
                                : data.agreeabilityTypeId === agreeForDocuSignTemplateId
                                    ? data.docusignTemplateId
                                    : ''
                        }
                    </div>
                ),
                type: 'element',
            },
            {
                columnId: 'Action',
                label: '',
                renderer: (data: UserTerm) => (
                    <div className={styles.rowActions}>
                        <LinkButton
                            primary
                            to={`${data.id}/users`}
                            label='View Users'
                        />
                    </div>
                ),
                type: 'element',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const columnsMobile = useMemo<MobileTableColumn<UserTerm>[][]>(
        () => columns.map(column => {
            if (column.label === '') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                        mobileType: 'last-value',
                    },
                ]
            }

            return [
                {
                    ...column,
                    className: '',
                    label: `${column.label as string} label`,
                    mobileType: 'label',
                    renderer: () => (
                        <div>
                            {column.label as string}
                            :
                        </div>
                    ),
                    type: 'element',
                },
                {
                    ...column,
                    mobileType: 'last-value',
                },
            ]
        }),
        [columns],
    )

    return (
        <TableWrapper className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={props.datas} />
            ) : (
                <Table
                    columns={columns}
                    data={props.datas}
                    removeDefaultSort
                    onToggleSort={_.noop}
                    className={styles.desktopTable}
                    colWidth={props.colWidth}
                    setColWidth={props.setColWidth}
                    disableSorting
                />
            )}
            <Pagination
                page={props.page}
                totalPages={props.totalPages}
                onPageChange={props.setPage}
            />
        </TableWrapper>
    )
}

export default TermsTable
