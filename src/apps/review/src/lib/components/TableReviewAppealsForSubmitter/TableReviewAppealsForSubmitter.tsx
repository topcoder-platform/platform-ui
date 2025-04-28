/**
 * Table Winners.
 */
import { FC, useCallback, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { ReviewResult, SubmissionInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { getFinalScore } from '../../utils'

import styles from './TableReviewAppealsForSubmitter.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
}

export const TableReviewAppealsForSubmitter: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1120, [screenWidth])

    const firstSubmission: SubmissionInfo | undefined = useMemo(
        () => props.datas[0],
        [props.datas],
    )

    const finalScore = useCallback((data: ReviewResult[] | undefined) => getFinalScore(data), [])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => [
            {
                label: 'Submission ID',
                propertyName: 'id',
                renderer: (data: SubmissionInfo) => (
                    <NavLink to='#' onClick={prevent}>{data.id}</NavLink>
                ),
                type: 'element',
            },
            {
                label: 'Review Score',
                renderer: (data: SubmissionInfo) => (
                    <Link
                        to={`./../scorecard-details/${data.id}?viewMode=true`}
                        className={styles.textBlue}
                    >
                        {finalScore(data.reviews)}
                    </Link>
                ),
                type: 'element',
            },
            ...(firstSubmission.reviews ?? [])
                .map(
                    review => [{
                        label: 'Reviewer',
                        renderer: () => (
                            <NavLink
                                to='#'
                                onClick={prevent}
                                className={styles.reviewer}
                                style={{
                                    color: review.reviewerHandleColor,
                                }}
                            >
                                {review.reviewerHandle}
                            </NavLink>
                        ),
                        type: 'element',
                    },
                    {
                        label: 'Review Date',
                        renderer: () => (
                            <span>{review.createdAtString}</span>
                        ),
                        type: 'element',
                    },
                    {
                        label: 'Score',
                        renderer: (data: SubmissionInfo) => (
                            <Link
                                to={`./../scorecard-details/${data.id}?viewMode=true`}
                                className={styles.textBlue}
                            >
                                {review.score}
                            </Link>
                        ),
                        type: 'element',
                    },
                    {
                        className: styles.tableCellNoWrap,
                        label: 'Appeals',
                        renderer: (data: SubmissionInfo) => (
                            <>
                                [
                                <Link
                                    className={classNames(styles.appealsLink, 'last-element')}
                                    to={`./../scorecard-details/${data.id}?viewMode=true`}
                                >
                                    <span className={styles.textBlue}>
                                        0
                                    </span>
                                    {' '}
                                    /
                                    {' '}
                                    <span className={styles.textBlue}>
                                        {review.appeals.length}
                                    </span>
                                </Link>
                                ]
                            </>
                        ),
                        type: 'element',
                    },
                    ] as TableColumn<SubmissionInfo>[],
                )
                .reduce((accumulator, value) => accumulator.concat(value), []),
        ],
        [firstSubmission, finalScore, prevent],
    )

    const columnsMobile = useMemo<MobileTableColumn<SubmissionInfo>[][]>(
        () => columns.map(
            column => [{
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
            ] as MobileTableColumn<SubmissionInfo>[],
        ),
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

export default TableReviewAppealsForSubmitter
