/**
 * Resource Table.
 */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import classNames from 'classnames'

import { Sort } from '~/apps/gamification-admin/src/game-lib'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, Table, TableColumn } from '~/libs/ui'

import { ConfirmModal } from '../common/ConfirmModal'
import { MobileTableColumn } from '../../models/MobileTableColumn.model'
import { ChallengeResource } from '../../models'
import { Pagination } from '../common/Pagination'
import { TableMobile } from '../common/TableMobile'
import { TableWrapper } from '../common/TableWrapper'

import styles from './ResourceTable.module.scss'

interface Props {
    className?: string
    isRemovingBool: boolean
    datas: ChallengeResource[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    sort: Sort | undefined
    setSort: Dispatch<SetStateAction<Sort | undefined>>
    doRemoveItem: (item: ChallengeResource) => void
}

export const ResourceTable: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const [showConfirmDialog, setShowConfirmDialog] = useState<ChallengeResource>()

    const columns = useMemo<TableColumn<ChallengeResource>[]>(
        () => [
            {
                className: 'blockCellWrap',
                label: 'Resource ID',
                renderer: (data: ChallengeResource) => <span>{data.id}</span>,
                type: 'element',
            },
            {
                label: 'User Handle',
                renderer: (data: ChallengeResource) => (
                    <span>{data.memberHandle}</span>
                ),
                type: 'element',
            },
            {
                className: 'blockCellNoWrap',
                label: 'User ID',
                renderer: (data: ChallengeResource) => (
                    <span>{data.memberId}</span>
                ),
                type: 'element',
            },
            {
                className: 'blockCellWrap',
                label: 'Resource Role',
                renderer: (data: ChallengeResource) => (
                    <span>{data.roleId}</span>
                ),
                type: 'element',
            },
            {
                label: 'Created Date',
                propertyName: 'createdString',
                type: 'text',
            },
            {
                className: 'blockCellWrap',
                label: 'Created By',
                renderer: (data: ChallengeResource) => (
                    <span>{data.createdBy}</span>
                ),
                type: 'element',
            },
            {
                label: 'Action',
                renderer: (data: ChallengeResource) => (
                    <Button
                        primary
                        variant='danger'
                        disabled={props.isRemovingBool}
                        onClick={function onClick() {
                            setShowConfirmDialog(data)
                        }}
                    >
                        Remove
                    </Button>
                ),
                type: 'element',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.isRemovingBool, props.doRemoveItem],
    )

    const columnsMobile = useMemo<MobileTableColumn<ChallengeResource>[][]>(
        () => columns.map(column => {
            if (column.label === 'Action') {
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
                    onToggleSort={props.setSort}
                    forceSort={props.sort}
                    className={styles.desktopTable}
                />
            )}
            <Pagination
                page={props.page}
                totalPages={props.totalPages}
                onPageChange={props.setPage}
            />

            {showConfirmDialog ? (
                <ConfirmModal
                    title='Remove User'
                    action='remove'
                    onClose={function onClose() {
                        setShowConfirmDialog(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        props.doRemoveItem(showConfirmDialog)
                        setShowConfirmDialog(undefined)
                    }}
                    open
                >
                    <div>
                        Are you sure you want to remove this resource?
                    </div>
                </ConfirmModal>
            ) : undefined}
        </TableWrapper>
    )
}

export default ResourceTable
