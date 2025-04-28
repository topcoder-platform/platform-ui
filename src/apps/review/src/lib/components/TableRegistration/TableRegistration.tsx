/**
 * Table Registration.
 */
import { FC, useCallback, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { RegistrationInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'

import styles from './TableRegistration.module.scss'

interface Props {
    className?: string
    datas: RegistrationInfo[]
}

export const TableRegistration: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<RegistrationInfo>[]>(
        () => [
            {
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: RegistrationInfo) => (
                    <NavLink
                        to='#'
                        onClick={prevent}
                        style={{
                            color: data.handleColor,
                        }}
                    >
                        {data.handle}
                    </NavLink>
                ),
                type: 'element',
            },
            {
                label: 'Rating',
                propertyName: 'index',
                renderer: (data: RegistrationInfo) => (
                    <span style={{ color: data.handleColor }}>
                        {data.rating ?? 'Not Rated'}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Registration Date',
                propertyName: 'registrationDateString',
                renderer: (data: RegistrationInfo) => (
                    <span className='last-element'>
                        {data.registrationDateString}
                    </span>
                ),
                type: 'element',
            },
        ],
        [prevent],
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
                <TableMobile columns={columnsMobile} data={props.datas} />
            ) : (
                <Table
                    columns={columns}
                    data={props.datas}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableRegistration
