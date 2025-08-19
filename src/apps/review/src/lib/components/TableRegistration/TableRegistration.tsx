/**
 * Table Registration.
 */
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import {
    useTableFilterLocal,
    useTableFilterLocalProps,
} from '~/apps/admin/src/lib/hooks'

import { BackendResource } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { getHandleUrl } from '../../utils'

import styles from './TableRegistration.module.scss'

interface Props {
    className?: string
    datas: BackendResource[]
}

export const TableRegistration: FC<Props> = (props: Props) => {
    const {
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<BackendResource> = useTableFilterLocal(
        props.datas ?? [],
        undefined,
        {},
        true, // no pagination
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const columns = useMemo<TableColumn<BackendResource>[]>(
        () => [
            {
                label: 'Handle',
                propertyName: 'memberHandle',
                renderer: (data: BackendResource) => (
                    <a
                        href={getHandleUrl(data)}
                        target='_blank'
                        rel='noreferrer'
                        style={{
                            color: data.handleColor,
                        }}
                        onClick={function onClick() {
                            window.open(
                                getHandleUrl(data),
                                '_blank',
                            )
                        }}
                    >
                        {data.memberHandle}
                    </a>
                ),
                type: 'element',
            },
            {
                label: 'Rating',
                propertyName: 'rating',
                renderer: (data: BackendResource) => (
                    <span style={{ color: data.handleColor }}>
                        {data.rating ?? 'Not Rated'}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Registration Date',
                propertyName: 'created',
                renderer: (data: BackendResource) => (
                    <span className='last-element'>{data.createdString}</span>
                ),
                type: 'element',
            },
        ],
        [],
    )

    const columnsMobile = useMemo<MobileTableColumn<BackendResource>[][]>(
        () => columns.map(
            column => [
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
            ] as MobileTableColumn<BackendResource>[],
        ),
        [columns],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                props.className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={results} />
            ) : (
                <Table
                    columns={columns}
                    data={results}
                    onToggleSort={setSort}
                    forceSort={sort}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableRegistration
