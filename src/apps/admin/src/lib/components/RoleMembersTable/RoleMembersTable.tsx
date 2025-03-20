/**
 * Role members table.
 */
import { FC, useContext, useEffect, useMemo } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, InputCheckbox, Table, TableColumn } from '~/libs/ui'

import { AdminAppContext } from '../../contexts'
import { useTableFilterLocal, useTableFilterLocalProps } from '../../hooks'
import { AdminAppContextType, RoleMemberInfo } from '../../models'
import { MobileTableColumn } from '../../models/MobileTableColumn.model'
import { Pagination } from '../common/Pagination'
import { TableMobile } from '../common/TableMobile'
import { useTableSelection, useTableSelectionProps } from '../../hooks/useTableSelection'

import styles from './RoleMembersTable.module.scss'

interface Props {
    className?: string
    datas: RoleMemberInfo[]
    isRemovingBool: boolean
    isRemoving: { [key: string]: boolean }
    doRemoveRoleMember: (roleMember: RoleMemberInfo) => void
    doRemoveRoleMembers: (roleMemberIds: string[], callback: () => void) => void
}

export const RoleMembersTable: FC<Props> = (props: Props) => {
    const { loadUser, usersMapping, cancelLoadUser }: AdminAppContextType
        = useContext(AdminAppContext)
    const {
        page,
        setPage,
        totalPages,
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<RoleMemberInfo> = useTableFilterLocal(
        props.datas ?? [],
    )
    const datasIds = useMemo(() => results.map(item => item.id), [results])
    const {
        selectedDatas,
        selectedDatasArray,
        toggleSelect,
        hasSelected,
        isSelectAll,
        toggleSelectAll,
        unselectAll,
    }: useTableSelectionProps<string> = useTableSelection<string>(datasIds)

    useEffect(() => {
        // clear queue of currently loading user handles
        cancelLoadUser()
        // load user handles for members visible on the current page
        _.forEach(results, result => {
            loadUser(result.id)
        })

        return () => {
            // clear queue of currently loading user handles after exit ui
            cancelLoadUser()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [results])

    useEffect(() => {
        _.forEach(results, result => {
            result.handle = usersMapping[result.id]
        })
    }, [usersMapping, results])

    const columns = useMemo<TableColumn<RoleMemberInfo>[]>(
        () => [
            {
                className: styles.blockCellCheckBox,
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
                renderer: (data: RoleMemberInfo) => (
                    <InputCheckbox
                        checked={selectedDatas[data.id] ?? false}
                        name={`select-data-${data.id}`}
                        onChange={_.noop}
                        onClick={function onClick() {
                            toggleSelect(data.id)
                        }}
                        disabled={props.isRemovingBool}
                    />
                ),
                type: 'element',
            },
            {
                label: 'User ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: RoleMemberInfo) => {
                    if (!data.id) {
                        return <></>
                    }

                    return (
                        <>
                            {!usersMapping[data.id]
                                ? 'loading...'
                                : usersMapping[data.id]}
                        </>
                    )
                },
                type: 'element',
            },
            {
                className: styles.blockColumnAction,
                label: '',
                renderer: (data: RoleMemberInfo) => (
                    <Button
                        primary
                        variant='danger'
                        disabled={props.isRemoving[data.id]}
                        onClick={function onClick() {
                            props.doRemoveRoleMember(data)
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
            isSelectAll,
            selectedDatas,
            usersMapping,
            props.isRemoving,
            props.isRemovingBool,
            props.doRemoveRoleMember,
            toggleSelect,
            toggleSelectAll,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<RoleMemberInfo>[][]>(() => [
        [
            columns[0],
            {
                label: 'User ID',
                propertyName: 'id',
                renderer: (data: RoleMemberInfo) => (
                    <span>
                        {data.id}
                        {' '}
                        |
                        {' '}
                        {data.handle}
                    </span>
                ),
                type: 'element',
            },
        ],
        [
            {
                ...columns[3],
                className: classNames(
                    columns[3].className,
                    styles.blockRightColumn,
                ),
                colSpan: 2,
            },
        ],
    ], [columns])

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

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
                />
            )}

            <div className={styles.removeSelectionButtonContainer}>
                <Button
                    primary
                    variant='danger'
                    disabled={!hasSelected || props.isRemovingBool}
                    size='lg'
                    onClick={function onClick() {
                        props.doRemoveRoleMembers(selectedDatasArray, () => {
                            unselectAll()
                        })
                    }}
                >
                    Remove Selected
                </Button>
            </div>
            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    )
}

export default RoleMembersTable
