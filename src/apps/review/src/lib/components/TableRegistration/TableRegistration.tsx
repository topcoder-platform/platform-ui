/**
 * Table Registration.
 */
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { EnvironmentConfig } from '~/config'
import {
    useTableFilterLocal,
    useTableFilterLocalProps,
} from '~/apps/admin/src/lib/hooks'

import { RegistrationInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'

import styles from './TableRegistration.module.scss'

interface Props {
    className?: string
    datas: RegistrationInfo[]
}

export const TableRegistration: FC<Props> = (props: Props) => {
    const {
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<RegistrationInfo> = useTableFilterLocal(
        props.datas ?? [],
        undefined,
        {},
        true, // no pagination
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const columns = useMemo<TableColumn<RegistrationInfo>[]>(
        () => [
            {
                label: 'Handle',
                propertyName: 'memberHandle',
                renderer: (data: RegistrationInfo) => (
                    <a
                        href={`${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${data.memberHandle}`}
                        target='_blank'
                        rel='noreferrer'
                        style={{
                            color: data.handleColor,
                        }}
                        onClick={function onClick() {
                            window.open(
                                `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${data.memberHandle}`,
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
                renderer: (data: RegistrationInfo) => (
                    <span style={{ color: data.handleColor }}>
                        {data.rating ?? 'Not Rated'}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Registration Date',
                propertyName: 'created',
                renderer: (data: RegistrationInfo) => (
                    <span className='last-element'>{data.createdString}</span>
                ),
                type: 'element',
            },
        ],
        [],
    )

    const columnsMobile = useMemo<MobileTableColumn<RegistrationInfo>[][]>(
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
            ] as MobileTableColumn<RegistrationInfo>[],
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
