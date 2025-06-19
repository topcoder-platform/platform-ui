/**
 * Submission Table.
 */
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, ConfirmModal, Table, TableColumn } from '~/libs/ui'

import { IsRemovingType, MobileTableColumn, Submission } from '../../models'
import { TableMobile } from '../common/TableMobile'
import { TableWrapper } from '../common/TableWrapper'

import SubmissionTableActions from './SubmissionTableActions'
import styles from './SubmissionTable.module.scss'

interface Props {
    className?: string
    data: Submission[]
    isRemovingSubmission: IsRemovingType
    doRemoveSubmission: (item: Submission) => void
    isRemovingReviewSummations: IsRemovingType
    doRemoveReviewSummations: (item: Submission) => void
    isRunningTest: IsRemovingType
    doPostBusEvent: (submissionId: string, testType: string) => void
    showSubmissionHistory: IsRemovingType
    setShowSubmissionHistory: Dispatch<SetStateAction<IsRemovingType>>
}

export const SubmissionTable: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1479, [screenWidth])
    const [
        showConfirmDeleteSubmissionDialog,
        setShowConfirmDeleteSubmissionDialog,
    ] = useState<Submission>()
    const [showConfirmDeleteReviewsDialog, setShowConfirmDeleteReviewsDialog]
        = useState<Submission>()

    const columns = useMemo<TableColumn<Submission>[]>(
        () => [
            {
                label: 'Submitter',
                propertyName: 'createdBy',
                type: 'text',
            },
            {
                className: 'blockCellWrap',
                label: 'ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                label: 'Submission date',
                propertyName: 'submittedDateString',
                type: 'text',
            },
            {
                label: 'Example score',
                renderer: (data: Submission) => (
                    <span>
                        {data.exampleScore === undefined
                            ? 'N/A'
                            : data.exampleScore}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Provisional score',
                renderer: (data: Submission) => (
                    <span>
                        {data.provisionalScore === undefined
                            ? 'N/A'
                            : data.provisionalScore}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Final score',
                renderer: (data: Submission) => (
                    <span>
                        {data.finalScore === undefined
                            ? 'N/A'
                            : data.finalScore}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Provisional rank',
                renderer: (data: Submission) => (
                    <span>
                        {data.provisionalRank === undefined
                            ? 'N/A'
                            : data.provisionalRank}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Final rank',
                renderer: (data: Submission) => (
                    <span>
                        {data.finalRank === undefined ? 'N/A' : data.finalRank}
                    </span>
                ),
                type: 'element',
            },
            {
                label: '',
                renderer: (data: Submission) => (
                    <div className={styles.rowActions}>
                        <SubmissionTableActions
                            data={data}
                            isRunningTest={props.isRunningTest}
                            doPostBusEvent={props.doPostBusEvent}
                            isRemovingSubmission={props.isRemovingSubmission}
                            isRemovingReviewSummations={
                                props.isRemovingReviewSummations
                            }
                            setShowConfirmDeleteSubmissionDialog={
                                setShowConfirmDeleteSubmissionDialog
                            }
                            setShowConfirmDeleteReviewsDialog={
                                setShowConfirmDeleteReviewsDialog
                            }
                        />
                        {!data.hideToggleHistory && (
                            <Button
                                onClick={function onClick() {
                                    props.setShowSubmissionHistory(prev => ({
                                        ...prev,
                                        [data.id]: !prev[data.id],
                                    }))
                                }}
                            >
                                {props.showSubmissionHistory[data.id]
                                    ? 'Hide'
                                    : 'Show'}
                                {' '}
                                History
                            </Button>
                        )}
                    </div>
                ),
                type: 'element',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            props.isRemovingSubmission,
            props.isRemovingReviewSummations,
            props.isRunningTest,
            props.showSubmissionHistory,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<Submission>[][]>(
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
        <TableWrapper className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={props.data} />
            ) : (
                <Table
                    columns={columns}
                    data={props.data}
                    removeDefaultSort
                    onToggleSort={_.noop}
                    className={styles.desktopTable}
                    disableSorting
                />
            )}

            {showConfirmDeleteSubmissionDialog && (
                <ConfirmModal
                    title='Delete Submission'
                    action='Delete'
                    onClose={function onClose() {
                        setShowConfirmDeleteSubmissionDialog(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        props.doRemoveSubmission(
                            showConfirmDeleteSubmissionDialog,
                        )
                        setShowConfirmDeleteSubmissionDialog(undefined)
                    }}
                    open
                >
                    <div>
                        Are you sure you want to delete this submission from
                        {' '}
                        {showConfirmDeleteSubmissionDialog.createdBy}
                        ?
                    </div>
                </ConfirmModal>
            )}
            {showConfirmDeleteReviewsDialog && (
                <ConfirmModal
                    title='Delete Review Summations'
                    action='Delete'
                    onClose={function onClose() {
                        setShowConfirmDeleteReviewsDialog(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        props.doRemoveReviewSummations(
                            showConfirmDeleteReviewsDialog,
                        )
                        setShowConfirmDeleteReviewsDialog(undefined)
                    }}
                    open
                >
                    <div>
                        Are you sure you want to delete the review summations?
                    </div>
                </ConfirmModal>
            )}
        </TableWrapper>
    )
}

export default SubmissionTable
