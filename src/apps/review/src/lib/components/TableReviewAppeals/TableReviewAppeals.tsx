/**
 * Table Review Appeals.
 */
import { FC, useCallback, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { TableWrapper } from '../TableWrapper'
import { SubmissionInfo } from '../../models'
import { ProgressBar } from '../ProgressBar'

import styles from './TableReviewAppeals.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
}

export const TableReviewAppeals: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => [
            {
                className: styles.textBlue,
                label: 'Submission ID',
                propertyName: 'id',
                renderer: (data: SubmissionInfo) => <NavLink to='#' onClick={prevent}>{data.id}</NavLink>,
                type: 'element',
            },
            {
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: SubmissionInfo) => (
                    <NavLink
                        to='#'
                        onClick={prevent}
                        style={{
                            color: data.handleColor,
                        }}
                    >
                        {data.handle}
                    </NavLink>
                ),
                type: 'element',
            },
            {
                label: 'Review Date',
                renderer: (data: SubmissionInfo) => {
                    if (data.review) {
                        return (
                            <span>
                                {data.review.updatedAtString
                                    || data.review.createdAtString}
                            </span>
                        )
                    }

                    return <></>
                },
                type: 'element',
            },
            {
                label: 'Score',
                renderer: (data: SubmissionInfo) => {
                    if (!data.review) {
                        return (
                            <span className={styles.notReviewed}>
                                Not Reviewed
                            </span>
                        )
                    }

                    if (!data.review.initialScore) {
                        if (!data.review.reviewProgress) {
                            return (
                                <span className={styles.notReviewed}>
                                    Not Reviewed
                                </span>
                            )
                        }

                        return (
                            <ProgressBar
                                progress={data.review.reviewProgress}
                            />
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
                        <>
                            [
                            <Link
                                to={`./../scorecard-details/${data.id}?viewMode=true`}
                                className={styles.appealsLink}
                            >
                                <span className={styles.textBlue}>0</span>
                                {' '}
                                /
                                {' '}
                                <span className={styles.textBlue}>
                                    {data.review?.appealResuls.length}
                                </span>
                            </Link>
                            ]
                        </>
                    )
                },
                type: 'element',
            },
            {
                className: styles.textBlue,
                label: 'Action',
                renderer: (data: SubmissionInfo) => (
                    <Link
                        to={`./../scorecard-details/${data.id}`}
                        className={classNames(styles.submit, 'last-element')}
                    >
                        <i
                            className={
                                data.review?.initialScore !== undefined
                                    ? 'icon-reopen'
                                    : 'icon-upload'
                            }
                        />
                        {data.review?.initialScore !== undefined
                            ? 'Reopen Review'
                            : 'Submit Review'}
                    </Link>
                ),
                type: 'element',
            },
        ],
        [prevent],
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
        <TableWrapper
            className={classNames(
                styles.container,
                props.className,
                'enhanced-table',
            )}
        >
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
