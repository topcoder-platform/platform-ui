/**
 * Roles table.
 */
import { FC, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { colWidthType, Table, TableColumn } from '~/libs/ui'
import { useWindowSize, WindowSize } from '~/libs/shared'

import { useTableFilterLocal, useTableFilterLocalProps } from '../../hooks'
import { MSG_NO_RECORD_FOUND } from '../../../config/index.config'
import { TableMobile } from '../common/TableMobile'
import { MobileTableColumn } from '../../models/MobileTableColumn.model'
import { UserMappingType, UserRole } from '../../models'
import { Pagination } from '../common/Pagination'

import styles from './RolesTable.module.scss'

interface Props {
    className?: string
    datas: UserRole[]
    usersMapping: UserMappingType
}

export const RolesTable: FC<Props> = (props: Props) => {
    const [colWidth, setColWidth] = useState<colWidthType>({})
    const columns = useMemo<TableColumn<UserRole>[]>(
        () => [
            {
                columnId: 'id',
                label: 'Role ID',
                propertyName: 'id',
                renderer: (data: UserRole) => (
                    <div>
                        <Link to={`${data.id}/role-members`}>{data.id}</Link>
                    </div>
                ),
                type: 'numberElement', // Change from 'element' to 'numberElement'
            },
            {
                columnId: 'roleName',
                label: 'Role Name',
                propertyName: 'roleName',
                renderer: (data: UserRole) => (
                    <div>
                        <Link to={`${data.id}/role-members`}>
                            {data.roleName}
                        </Link>
                    </div>
                ),
                type: 'element',
            },
            {
                className: styles.blockCellWrap,
                columnId: 'createdByHandle',
                label: 'Created By',
                renderer: (data: UserRole) => {
                    if (!data.createdBy) {
                        return <></>
                    }

                    return (
                        <>
                            {!props.usersMapping[data.createdBy]
                                ? 'loading...'
                                : props.usersMapping[data.createdBy]}
                        </>
                    )
                },
                type: 'element',
            },
            {
                columnId: 'createdAtString',
                label: 'Created at',
                propertyName: 'createdAtString',
                type: 'text',
            },
            {
                className: styles.blockCellWrap,
                columnId: 'modifiedByHandle',
                label: 'Modified By',
                renderer: (data: UserRole) => {
                    if (!data.modifiedBy) {
                        return <></>
                    }

                    return (
                        <>
                            {!props.usersMapping[data.modifiedBy]
                                ? 'loading...'
                                : props.usersMapping[data.modifiedBy]}
                        </>
                    )
                },
                type: 'element',
            },
            {
                columnId: 'modifiedAtString',
                label: 'Modified at',
                propertyName: 'modifiedAtString',
                type: 'text',
            },
        ],
        [props.usersMapping],
    )

    const columnsMobile = useMemo<MobileTableColumn<UserRole>[][]>(() => [
        [
            {
                colSpan: 2,
                label: 'Role ID',
                propertyName: 'id',
                renderer: (data: UserRole) => (
                    <span>
                        <Link to={`${data.id}/role-members`}>
                            {data.id}
                        </Link>
                        {' '}
                        |
                        {' '}
                        <Link to={`${data.id}/role-members`}>
                            {data.roleName}
                        </Link>
                    </span>
                ),
                type: 'element',
            },
        ],
        [
            {
                label: 'Created By label',
                mobileType: 'label',
                propertyName: 'createdBy',
                renderer: () => <div>Created by:</div>,
                type: 'element',
            },
            {
                ...columns[2],
                className: classNames(
                    columns[2].className,
                    styles.blockRightColumn,
                ),
            },
        ],
        [
            {
                label: 'Created At label',
                mobileType: 'label',
                propertyName: 'createdAt',
                renderer: () => <div>Created at:</div>,
                type: 'element',
            },
            {
                ...columns[3],
                className: classNames(
                    columns[3].className,
                    styles.blockRightColumn,
                ),
            },
        ],
        [
            {
                label: 'Modified By label',
                mobileType: 'label',
                propertyName: 'modifiedBy',
                renderer: () => <div>Modified By:</div>,
                type: 'element',
            },
            {
                ...columns[4],
                className: classNames(
                    columns[4].className,
                    styles.blockRightColumn,
                ),
            },
        ],
        [
            {
                label: 'Modified at label',
                mobileType: 'label',
                propertyName: 'modifiedAt',
                renderer: () => <div>Modified at:</div>,
                type: 'element',
            },
            {
                ...columns[5],
                className: classNames(
                    columns[5].className,
                    styles.blockRightColumn,
                ),
            },
        ],
    ], [columns])

    // Convert id fields to numbers to ensure proper sorting
    const processedData = useMemo(() => props.datas.map(role => ({
        ...role,
        id: Number(role.id),
    })), [props.datas])

    const {
        page,
        setPage,
        totalPages,
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<UserRole> = useTableFilterLocal(
        processedData ?? [],
        undefined,
        {
            createdAtString: 'createdAt',
            modifiedAtString: 'modifiedAt',
        },
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])

    if (results.length === 0) {
        return <p className={styles.noRecordFound}>{MSG_NO_RECORD_FOUND}</p>
    }

    return (
        <div className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={results} />
            ) : (
                <Table
                    columns={columns}
                    data={results}
                    onToggleSort={setSort}
                    showExpand={false}
                    removeDefaultSort
                    forceSort={sort}
                    className={styles.desktopTable}
                    colWidth={colWidth}
                    setColWidth={setColWidth}
                />
            )}

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    )
}

export default RolesTable
