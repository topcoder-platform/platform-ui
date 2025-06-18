/**
 * Role members table.
 */
import { FC, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, colWidthType, InputCheckbox, Table, TableColumn } from '~/libs/ui'

import { useTableFilterLocal, useTableFilterLocalProps } from '../../hooks'
import { RoleMemberInfo } from '../../models'
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
    const [colWidth, setColWidth] = useState<colWidthType>({})
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

    const columns = useMemo<TableColumn<RoleMemberInfo>[]>(
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
                columnId: 'id',
                label: 'User ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                columnId: 'handle',
                label: 'Handle',
                propertyName: 'handle',
                type: 'text',
            },
            {
                label: 'Email',
                propertyName: 'email',
                type: 'text',
            },
            {
                className: styles.blockColumnAction,
                columnId: 'action',
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
        ], [
            {
                ...columns[3],
                className: '',
                label: `${columns[3].label as string} label`,
                mobileType: 'label',
                renderer: () => (
                    <div>
                        {columns[3].label as string}
                        :
                    </div>
                ),
                type: 'element',
            },
            {
                ...columns[3],
                mobileType: 'last-value',
            },
        ],
        [
            {
                ...columns[4],
                className: classNames(
                    columns[4].className,
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
                    className={styles.desktopTable}
                    colWidth={colWidth}
                    setColWidth={setColWidth}
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
