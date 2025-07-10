/**
 * Terms Users Table.
 */
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import {
    Button,
    colWidthType,
    InputCheckbox,
    Table,
    TableColumn,
} from '~/libs/ui'
import { useWindowSize, WindowSize } from '~/libs/shared'

import { MobileTableColumn, TermUserInfo, UserMappingType } from '../../models'
import { TableWrapper } from '../common/TableWrapper'
import { TableMobile } from '../common/TableMobile'
import { Pagination } from '../common/Pagination'

import styles from './TermsUsersTable.module.scss'

interface Props {
    className?: string
    datas: TermUserInfo[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    colWidth: colWidthType | undefined
    setColWidth: Dispatch<SetStateAction<colWidthType>> | undefined
    usersMapping: UserMappingType
    isRemovingBool: boolean
    isRemoving: { [key: string]: boolean }
    toggleSelect: (key: number) => void
    forceSelect: (key: number) => void
    forceUnSelect: (key: number) => void
    doRemoveTermUser: (userId: number) => void
    selectedDatas: {
        [id: number]: boolean
    }
}

export const TermsUsersTable: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const isSelectAll = useMemo(
        () => _.every(props.datas, item => props.selectedDatas[item.userId]),
        [props.datas, props.selectedDatas],
    )

    /**
     * Handle select/unselect all items event
     */
    const toggleSelectAll = useCallback(() => {
        if (isSelectAll) {
            _.forEach(props.datas, item => {
                props.forceUnSelect(item.userId)
            })
        } else {
            _.forEach(props.datas, item => {
                props.forceSelect(item.userId)
            })
        }
    }, [isSelectAll, props.datas])

    const columns = useMemo<TableColumn<TermUserInfo>[]>(
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
                renderer: (data: TermUserInfo) => (
                    <InputCheckbox
                        checked={props.selectedDatas[data.userId] ?? false}
                        name={`select-data-${data.userId}`}
                        onChange={_.noop}
                        disabled={props.isRemovingBool}
                        onClick={function onClick() {
                            props.toggleSelect(data.userId)
                        }}
                    />
                ),
                type: 'element',
            },
            {
                columnId: 'userId',
                label: 'User Id',
                propertyName: 'userId',
                type: 'text',
            },
            {
                columnId: 'handle',
                label: 'Handle',
                renderer: (data: TermUserInfo) => (
                    <>
                        {!props.usersMapping[data.userId]
                            ? 'loading...'
                            : props.usersMapping[data.userId]}
                    </>
                ),
                type: 'element',
            },
            {
                columnId: 'Action',
                label: '',
                renderer: (data: TermUserInfo) => (
                    <Button
                        primary
                        variant='danger'
                        disabled={props.isRemoving[data.userId]}
                        onClick={function onClick() {
                            props.doRemoveTermUser(data.userId)
                        }}
                    >
                        Remove
                    </Button>
                ),
                type: 'element',
            },
        ],
        [
            props.usersMapping,
            props.selectedDatas,
            props.isRemovingBool,
            props.isRemoving,
            isSelectAll,
            props.doRemoveTermUser,
            toggleSelectAll,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<TermUserInfo>[][]>(
        () => columns.map(column => {
            if (column.columnId === 'checkbox') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                    },
                ]
            }

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

export default TermsUsersTable
