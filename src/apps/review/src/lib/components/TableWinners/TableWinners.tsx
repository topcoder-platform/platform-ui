/**
 * Table Winners.
 */
import { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { ProjectResult } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { formatOrdinals } from '../../utils'

import styles from './TableWinners.module.scss'

interface Props {
    className?: string
    datas: ProjectResult[]
}

export const TableWinners: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1120, [screenWidth])

    const firstSubmission: ProjectResult | undefined = useMemo(
        () => props.datas[0],
        [props.datas],
    )

    const columns = useMemo<TableColumn<ProjectResult>[]>(
        () => [
            {
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: ProjectResult) => (
                    <div className={styles.blockPlacementContainer}>
                        {data.placement ? (
                            <div
                                className={classNames(
                                    styles.blockPlacement,
                                    styles[`blockPlacement-${data.placement}`],
                                )}
                            >
                                {formatOrdinals(data.placement)}
                            </div>
                        ) : undefined}
                        <span>
                            <span className={styles.textBlue}>
                                {data.submissionId}
                            </span>
                            {' '}
                            <span>
                                (
                                <span style={{ color: data.handleColor }}>
                                    {data.handle}
                                </span>
                                )
                            </span>
                        </span>
                    </div>
                ),
                type: 'element',
            },
            {
                label: 'Review Score',
                renderer: (data: ProjectResult) => (
                    <Link
                        to={`./../scorecard-details/${data.submissionId}?viewMode=true`}
                        className={styles.textBlue}
                    >
                        {data.finalScore}
                    </Link>
                ),
                type: 'element',
            },
            ...(firstSubmission?.reviews ?? [])
                .map(
                    (review, index) => [
                        {
                            label: 'Review Date',
                            renderer: (data: ProjectResult) => (
                                <span>{data.reviews[index]?.createdAtString}</span>
                            ),
                            type: 'element',
                        },
                        {
                            label: 'Score',
                            renderer: (data: ProjectResult) => (
                                <Link
                                    to={`./../scorecard-details/${data.submissionId}?viewMode=true`}
                                    className={styles.textBlue}
                                >
                                    {data.reviews[index]?.score}
                                </Link>
                            ),
                            type: 'element',
                        },
                        {
                            className: styles.tableCellNoWrap,
                            label: 'Appeals',
                            renderer: (data: ProjectResult) => (
                                <Link
                                    to={`./../scorecard-details/${data.submissionId}?viewMode=true`}
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
                                            data.reviews[index]?.appeals
                                                .length
                                        }
                                    </span>
                                    {' '}
                                    ]
                                </Link>
                            ),
                            type: 'element',
                        },
                    ] as TableColumn<ProjectResult>[],
                )
                .reduce((accumulator, value) => accumulator.concat(value), []),
        ],
        [firstSubmission],
    )

    const columnsMobile = useMemo<MobileTableColumn<ProjectResult>[][]>(
        () => columns.map(column => [
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
        ] as MobileTableColumn<ProjectResult>[]),
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

export default TableWinners
