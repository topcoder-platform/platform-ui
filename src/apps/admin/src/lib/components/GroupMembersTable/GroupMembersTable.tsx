/**
 * Group members table.
 */
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, colWidthType, InputCheckbox, Table, TableColumn } from '~/libs/ui'

import { useTableFilterLocal, useTableFilterLocalProps } from '../../hooks'
import { UserGroupMember, UserMappingType } from '../../models'
import { MobileTableColumn } from '../../models/MobileTableColumn.model'
import { Pagination } from '../common/Pagination'
import { TableMobile } from '../common/TableMobile'

import styles from './GroupMembersTable.module.scss'

interface Props {
    className?: string
    memberType: string
    usersMapping: UserMappingType
    groupsMapping: UserMappingType
    datas: UserGroupMember[]
    onChangeDatas?: (datas: UserGroupMember[]) => void
    selectedDatas: {
        [id: number]: boolean
    }
    isRemovingBool: boolean
    isRemoving: { [key: string]: boolean }
    toggleSelect: (key: number) => void
    forceSelect: (key: number) => void
    forceUnSelect: (key: number) => void
    doRemoveGroupMember: (memberId: number, memberType: string) => void
}

export const GroupMembersTable: FC<Props> = (props: Props) => {
    const [colWidth, setColWidth] = useState<colWidthType>({})
    const {
        page,
        setPage,
        totalPages,
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<UserGroupMember> = useTableFilterLocal(
        props.datas ?? [],
        undefined,
        {
            createdAtString: 'createdAt',
            updatedAtString: 'updatedAt',
        },
    )

    const isSelectAll = useMemo(
        () => _.every(results, item => props.selectedDatas[item.memberId]),
        [results, props.selectedDatas],
    )

    const toggleSelectAll = useCallback(() => {
        if (isSelectAll) {
            _.forEach(results, item => {
                props.forceUnSelect(item.memberId)
            })
        } else {
            _.forEach(results, item => {
                props.forceSelect(item.memberId)
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSelectAll, results])

    useEffect(() => {
        props.onChangeDatas?.(results)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [results])

    const columns = useMemo<TableColumn<UserGroupMember>[]>(
        () => [
            {
                className: styles.blockCellCheckBox,
                columnId: 'checkbox',
                label: () => ( // eslint-disable-line react/no-unstable-nested-components
                    <div className={styles.headerCheckboxWrapper}>
                        <InputCheckbox
                            checked={isSelectAll}
                            name='select-datas'
                            onChange={_.noop}
                            disabled={props.isRemovingBool}
                            onClick={toggleSelectAll}
                        />
                    </div>
                ),
                renderer: (data: UserGroupMember) => (
                    <InputCheckbox
                        checked={props.selectedDatas[data.memberId] ?? false}
                        name={`select-data-${data.memberId}`}
                        onChange={_.noop}
                        disabled={props.isRemovingBool}
                        onClick={function onClick() {
                            props.toggleSelect(data.memberId)
                        }}
                    />
                ),
                type: 'element',
            },
            {
                className: styles.blockCellWrap,
                columnId: 'memberId',
                label: `${props.memberType} ID`,
                propertyName: 'memberId',
                type: 'text',
            },
            {
                className: styles.blockCellWrap,
                columnId: 'name',
                label: props.memberType === 'user' ? 'Handle' : 'Group Name',
                propertyName: 'name',
                renderer: (data: UserGroupMember) => {
                    let name = ''
                    if (!data.memberId) {
                        name = ''
                    } else if (props.memberType === 'group') {
                        name = !props.groupsMapping[data.memberId]
                            ? 'loading...'
                            : props.groupsMapping[data.memberId]
                    } else if (props.memberType === 'user') {
                        name = !props.usersMapping[data.memberId]
                            ? 'loading...'
                            : props.usersMapping[data.memberId]
                    }

                    return <>{name}</>
                },
                type: 'element',
            },
            {
                className: styles.blockCellWrap,
                columnId: 'createdByHandle',
                label: 'Created By',
                renderer: (data: UserGroupMember) => {
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
                columnId: 'updatedByHandle',
                label: 'Modified By',
                renderer: (data: UserGroupMember) => {
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
                columnId: 'updatedAtString',
                label: 'Modified at',
                propertyName: 'updatedAtString',
                type: 'text',
            },
            {
                columnId: 'action',
                label: '',
                renderer: (data: UserGroupMember) => (
                    <Button
                        primary
                        variant='danger'
                        disabled={props.isRemoving[data.memberId]}
                        onClick={function onClick() {
                            props.doRemoveGroupMember(data.memberId, props.memberType)
                        }}
                    >
                        Remove
                    </Button>
                ),
                type: 'action',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            props.memberType,
            props.groupsMapping,
            props.usersMapping,
            props.selectedDatas,
            props.isRemovingBool,
            props.isRemoving,
            isSelectAll,
            props.doRemoveGroupMember,
            toggleSelectAll,
        ],
    )

    const columnsMobile = useMemo<
        MobileTableColumn<UserGroupMember>[][]
    >(() => [
        [
            columns[0],
            {
                colSpan: 2,
                label: `${props.memberType} ID`,
                propertyName: 'id',
                renderer: (data: UserGroupMember) => {
                    let name = ''
                    if (!data.memberId) {
                        name = ''
                    } else if (props.memberType === 'group') {
                        name = !props.groupsMapping[data.memberId]
                            ? 'loading...'
                            : props.groupsMapping[data.memberId]
                    } else if (props.memberType === 'user') {
                        name = !props.usersMapping[data.memberId]
                            ? 'loading...'
                            : props.usersMapping[data.memberId]
                    }

                    return (
                        <>
                            {data.memberId}
                            {' '}
                            |
                            {' '}
                            {name}
                        </>
                    )
                },
                type: 'element',
            },
        ],
        [
            {
                label: 'empty cell',
                propertyName: 'id',
                renderer: () => <></>,
                type: 'element',
            },
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
                label: 'empty cell',
                propertyName: 'id',
                renderer: () => <></>,
                type: 'element',
            },
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
                label: 'empty cell',
                propertyName: 'id',
                renderer: () => <></>,
                type: 'element',
            },
            {
                label: 'Modified By label',
                mobileType: 'label',
                propertyName: 'updatedBy',
                renderer: () => (
                    <div>Modified By:</div>
                ),
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
                label: 'empty cell',
                propertyName: 'id',
                renderer: () => <></>,
                type: 'element',
            },
            {
                label: 'Modified at label',
                mobileType: 'label',
                propertyName: 'updatedAd',
                renderer: () => (
                    <div>Modified at:</div>
                ),
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
        [
            {
                ...columns[7],
                className: classNames(
                    columns[7].className,
                    styles.blockRightColumn,
                ),
                colSpan: 3,
            },
        ],
    ], [
        columns,
        props.groupsMapping,
        props.memberType,
        props.usersMapping,
    ])

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1120, [screenWidth])

    return (
        <div className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={results} />
            ) : (
                <Table
                    columns={columns}
                    data={results}
                    onToggleSort={setSort}
                    forceSort={sort}
                    removeDefaultSort
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

export default GroupMembersTable
