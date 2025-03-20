/**
 * Groups table.
 */
import { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { Table, TableColumn } from '~/libs/ui'
import { useWindowSize, WindowSize } from '~/libs/shared'

import { useTableFilterLocal, useTableFilterLocalProps } from '../../hooks'
import { MobileTableColumn } from '../../models/MobileTableColumn.model'
import { UserGroup, UserMappingType } from '../../models'
import { Pagination } from '../common/Pagination'
import { TableMobile } from '../common/TableMobile'

import styles from './GroupsTable.module.scss'

interface Props {
    className?: string
    datas: UserGroup[]
    usersMapping: UserMappingType
}

export const GroupsTable: FC<Props> = (props: Props) => {
    const columns = useMemo<TableColumn<UserGroup>[]>(
        () => [
            {
                label: 'Group ID',
                propertyName: 'id',
                renderer: (data: UserGroup) => (
                    <div>
                        <Link to={`${data.id}/group-members`}>{data.id}</Link>
                    </div>
                ),
                type: 'element',
            },
            {
                label: 'Name',
                propertyName: 'name',
                renderer: (data: UserGroup) => (
                    <div>
                        <Link to={`${data.id}/group-members`}>{data.name}</Link>
                    </div>
                ),
                type: 'element',
            },
            {
                className: styles.blockCellWrap,
                label: 'Description',
                propertyName: 'description',
                type: 'text',
            },
            {
                label: 'Created By',
                propertyName: 'createdByHandle',
                renderer: (data: UserGroup) => {
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
                label: 'Created at',
                propertyName: 'createdAtString',
                type: 'text',
            },
            {
                label: 'Modified By',
                propertyName: 'updatedByHandle',
                renderer: (data: UserGroup) => {
                    if (!data.updatedBy) {
                        return <></>
                    }

                    return (
                        <>
                            {!props.usersMapping[data.updatedBy]
                                ? 'loading...'
                                : props.usersMapping[data.updatedBy]}
                        </>
                    )
                },
                type: 'element',
            },
            {
                label: 'Modified at',
                propertyName: 'updatedAtString',
                type: 'text',
            },
        ],
        [props.usersMapping],
    )

    const columnsMobile = useMemo<MobileTableColumn<UserGroup>[][]>(() => [
        [
            {
                colSpan: 2,
                label: 'Group ID',
                propertyName: 'id',
                renderer: (data: UserGroup) => (
                    <span>
                        <Link to={`${data.id}/group-members`}>
                            {data.id}
                        </Link>
                        {' '}
                        |
                        {' '}
                        <Link to={`${data.id}/group-members`}>
                            {data.name}
                        </Link>
                    </span>
                ),
                type: 'element',
            },
        ],
        [
            {
                label: 'Description label',
                mobileType: 'label',
                propertyName: 'description',
                renderer: () => <div>Description:</div>,
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
                label: 'Created By label',
                mobileType: 'label',
                propertyName: 'createdBy',
                renderer: () => <div>Created by:</div>,
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
                label: 'Created At label',
                mobileType: 'label',
                propertyName: 'createdAt',
                renderer: () => <div>Created at:</div>,
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
                label: 'Modified By label',
                mobileType: 'label',
                propertyName: 'updatedBy',
                renderer: () => <div>Modified By:</div>,
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
        [
            {
                label: 'Modified at label',
                mobileType: 'label',
                propertyName: 'updatedAd',
                renderer: () => <div>Modified at:</div>,
                type: 'element',
            },
            {
                ...columns[6],
                className: classNames(
                    columns[6].className,
                    styles.blockRightColumn,
                ),
            },
        ],
    ], [columns])

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1150, [screenWidth])

    const {
        page,
        setPage,
        totalPages,
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<UserGroup> = useTableFilterLocal(
        props.datas ?? [],
        undefined,
        {
            createdAtString: 'createdAt',
            updatedAtString: 'updatedAt',
        },
    )

    return (
        <div className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={results} />
            ) : (
                <Table
                    columns={columns}
                    data={results}
                    onToggleSort={setSort}
                    removeDefaultSort
                    forceSort={sort}
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

export default GroupsTable
