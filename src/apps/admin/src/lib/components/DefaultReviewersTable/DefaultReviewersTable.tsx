import {
    Dispatch,
    SetStateAction,
    useCallback,
    useMemo,
    useState,
} from 'react'
import type { FC } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import {
    Button,
    colWidthType,
    ConfirmModal,
    LinkButton,
    LoadingSpinner,
    Table,
    TableColumn,
} from '~/libs/ui'
import { useWindowSize } from '~/libs/shared'
import type { WindowSize } from '~/libs/shared'

import type {
    DefaultChallengeReviewerWithNames,
    MobileTableColumn,
} from '../../models'
import { deleteDefaultReviewer } from '../../services/default-reviewers.service'
import { handleError } from '../../utils'
import { TableMobile } from '../common/TableMobile'
import { Pagination } from '../common/Pagination'
import { TableWrapper } from '../common/TableWrapper'

import styles from './DefaultReviewersTable.module.scss'

interface Props {
    className?: string
    datas: DefaultChallengeReviewerWithNames[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    colWidth: colWidthType | undefined
    setColWidth: Dispatch<SetStateAction<colWidthType>> | undefined
    reloadData: () => void
}

export const DefaultReviewersTable: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1050, [screenWidth])
    const [deletingId, setDeletingId] = useState<string | undefined>(undefined)
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [
        recordToDelete,
        setRecordToDelete,
    ] = useState<DefaultChallengeReviewerWithNames | undefined>(undefined)

    const handleOpenDeleteConfirm = useCallback(
        (record: DefaultChallengeReviewerWithNames) => {
            setRecordToDelete(record)
            setDeleteConfirmOpen(true)
        },
        [],
    )

    const handleCloseDeleteConfirm = useCallback(() => {
        setDeleteConfirmOpen(false)
        setRecordToDelete(undefined)
    }, [])

    const handleConfirmDelete = useCallback(async () => {
        if (!recordToDelete) {
            return
        }

        setDeletingId(recordToDelete.id)

        try {
            await deleteDefaultReviewer(recordToDelete.id)
            toast.success('Default Reviewer deleted successfully')
            if (props.page > 1 && props.datas.length === 1) {
                props.setPage(props.page - 1)
            } else {
                props.reloadData()
            }

            setDeleteConfirmOpen(false)
            setRecordToDelete(undefined)
        } catch (error) {
            handleError(error)
        } finally {
            setDeletingId(undefined)
        }
    }, [
        recordToDelete,
        props.datas,
        props.page,
        props.reloadData,
        props.setPage,
    ])

    const columns = useMemo<TableColumn<DefaultChallengeReviewerWithNames>[]>(
        () => [
            {
                columnId: 'challengeType',
                label: 'Challenge Type',
                renderer: (data: DefaultChallengeReviewerWithNames) => (
                    <div>{data.typeName ?? data.typeId}</div>
                ),
                type: 'element',
            },
            {
                columnId: 'track',
                label: 'Track',
                renderer: (data: DefaultChallengeReviewerWithNames) => (
                    <div>{data.trackName ?? data.trackId}</div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                columnId: 'timelineTemplate',
                label: 'Timeline Template',
                renderer: (data: DefaultChallengeReviewerWithNames) => (
                    <div>{data.timelineTemplateName ?? 'N/A'}</div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                columnId: 'scorecard',
                label: 'Scorecard',
                renderer: (data: DefaultChallengeReviewerWithNames) => (
                    <div>{data.scorecardName ?? data.scorecardId}</div>
                ),
                type: 'element',
            },
            {
                columnId: 'phaseName',
                label: 'Phase Name',
                propertyName: 'phaseName',
                type: 'text',
            },
            {
                columnId: 'Action',
                label: '',
                renderer: (data: DefaultChallengeReviewerWithNames) => {
                    function handleDeleteClick(): void {
                        handleOpenDeleteConfirm(data)
                    }

                    const isDeleting = deletingId === data.id

                    return (
                        <div className={styles.rowActions}>
                            <LinkButton
                                primary
                                to={`${data.id}/edit`}
                                label='Edit'
                            />
                            {isDeleting ? (
                                <LoadingSpinner inline className={styles.deletingSpinner} />
                            ) : (
                                <Button
                                    primary
                                    variant='danger'
                                    size='sm'
                                    label='Delete'
                                    onClick={handleDeleteClick}
                                    disabled={deletingId !== undefined}
                                />
                            )}
                        </div>
                    )
                },
                type: 'element',
            },
        ],
        [deletingId, handleOpenDeleteConfirm],
    )

    const columnsMobile = useMemo<
        MobileTableColumn<DefaultChallengeReviewerWithNames>[][]
    >(
        () => columns.map(column => {
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
        <>
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
            <ConfirmModal
                title='Delete Confirmation'
                action='Delete'
                open={deleteConfirmOpen}
                onClose={handleCloseDeleteConfirm}
                onConfirm={handleConfirmDelete}
                isLoading={!!deletingId}
            >
                <div>
                    Are you sure you want to delete the default reviewer for
                    {' '}
                    <strong>{recordToDelete?.typeName}</strong>
                    {' '}
                    /
                    {' '}
                    <strong>{recordToDelete?.trackName}</strong>
                    ?
                </div>
            </ConfirmModal>
        </>
    )
}

export default DefaultReviewersTable
