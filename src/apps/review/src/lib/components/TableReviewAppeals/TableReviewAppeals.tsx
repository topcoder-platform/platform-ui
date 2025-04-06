/**
 * Table Review Appeals.
 */
import { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { TableWrapper } from '../TableWrapper'
import { SubmissionInfo } from '../../models'

import styles from './TableReviewAppeals.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
}

export const TableReviewAppeals: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => [
            {
                className: styles.textBlue,
                label: 'Submission ID',
                propertyName: 'id',
                renderer: (data: SubmissionInfo) => <span>{data.id}</span>,
                type: 'element',
            },
            {
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: SubmissionInfo) => (
                    <span
                        style={{
                            color: data.handleColor,
                        }}
                    >
                        {data.handle}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Review Date',
                renderer: (data: SubmissionInfo) => (data.review ? (
                    <span>
                        {data.review.updatedAtString
                        || data.review.createdAtString}
                    </span>
                ) : (
                    <></>
                )),
                type: 'element',
            },
            {
                label: 'Score',
                renderer: (data: SubmissionInfo) => {
                    if (!data.review) {
                        return <span>Not Reviewed</span>
                    }

                    if (!data.review.initialScore) {
                        if (!data.review.reviewProgress) {
                            return <span>Not Reviewed</span>
                        }

                        return (
                            <span>
                                {data.review.reviewProgress}
                                % Completed
                            </span>
                        )
                    }

                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}?viewMode=true`}
                            className={styles.textBlue}
                        >
                            {data.review.initialScore}
                        </Link>
                    )
                },
                type: 'element',
            },
            {
                label: 'Appeals',
                renderer: (data: SubmissionInfo) => {
                    if (!data.review) {
                        return <></>
                    }

                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}?viewMode=true`}
                        >
                            [
                            {' '}
                            <span className={styles.textBlue}>
                                0
                            </span>
                            {' '}
                            /
                            {' '}
                            <span className={styles.textBlue}>
                                {
                                    data.review?.appealResuls
                                        .length
                                }
                            </span>
                            {' '}
                            ]
                        </Link>
                    )
                },
                type: 'element',
            },
            {
                className: styles.textBlue,
                label: 'Action',
                renderer: (data: SubmissionInfo) => (
                    <Link to={`./../scorecard-details/${data.id}`}>
                        {data.review?.initialScore !== undefined
                            ? 'Reopen Review'
                            : 'Submit Review'}
                    </Link>
                ),
                type: 'element',
            },
        ],
        [],
    )

    const columnsMobile = useMemo<MobileTableColumn<SubmissionInfo>[][]>(
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
            ] as MobileTableColumn<SubmissionInfo>[]
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
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableReviewAppeals
