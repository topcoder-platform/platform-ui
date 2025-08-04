/**
 * Table Winners.
 */
import { FC, useCallback, useMemo } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { ProjectResult, ReviewResult } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ORDINAL_SUFFIX, WITHOUT_APPEAL } from '../../../config/index.config'
import { getFinalScore } from '../../utils'
import { useFetchMockChallengeInfo, useFetchMockChallengeInfoProps } from '../../hooks'

import styles from './TableWinners.module.scss'

interface Props {
    className?: string
    datas: ProjectResult[]
}

export const TableWinners: FC<Props> = (props: Props) => {
    const params = useParams()
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])
    const { challengeInfo }: useFetchMockChallengeInfoProps = useFetchMockChallengeInfo(
        params.challengeId,
    )

    const firstSubmission: ProjectResult | undefined = useMemo(
        () => props.datas[0],
        [props.datas],
    )

    const finalScore = useCallback((data: ReviewResult[] | undefined) => getFinalScore(data), [])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<ProjectResult>[]>(
        () => [
            {
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: ProjectResult) => (
                    <div className={styles.blockPlacementContainer}>
                        {data.placement ? (
                            <i
                                className={`icon-${ORDINAL_SUFFIX.get(
                                    data.placement,
                                )}`}
                            />
                        ) : undefined}
                        <span>
                            <NavLink
                                to='#'
                                onClick={prevent}
                            >
                                {data.submissionId}
                            </NavLink>
                            <span className={styles.spacing}>-</span>
                            <span>
                                <NavLink
                                    to='#'
                                    onClick={prevent}
                                    style={{ color: data.handleColor }}
                                >
                                    {data.handle}
                                </NavLink>
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
                        {finalScore(data.reviews)}
                    </Link>
                ),
                type: 'element',
            },
            ...(firstSubmission?.reviews ?? [])
                .map((review, index) => {
                    const initialColumns = [
                        {
                            label: 'Review Date',
                            renderer: (data: ProjectResult) => (
                                <span>
                                    {data.reviews[index]?.createdAtString}
                                </span>
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
                    ]
                    if (includes(WITHOUT_APPEAL, challengeInfo?.type)) {
                        return initialColumns as TableColumn<ProjectResult>[]
                    }

                    return (
                        [
                            ...initialColumns,
                            {
                                className: styles.tableCellNoWrap,
                                label: 'Appeals',
                                renderer: (data: ProjectResult) => (
                                    <>
                                        [
                                        <Link
                                            className={classNames(styles.appealsLink, 'last-element')}
                                            to={`./../scorecard-details/${data.submissionId}?viewMode=true`}
                                        >
                                            <span className={styles.textBlue}>
                                                0
                                            </span>
                                            {' '}
                                            /
                                            {' '}
                                            <span className={styles.textBlue}>
                                                {
                                                    data.reviews[index]?.appeals?.length
                                                }
                                            </span>
                                        </Link>
                                        ]
                                    </>
                                ),
                                type: 'element',
                            },
                        ] as TableColumn<ProjectResult>[]
                    )
                })
                .reduce((accumulator, value) => accumulator.concat(value), []),
        ],
        [firstSubmission, finalScore, prevent, challengeInfo?.type],
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

export default TableWinners
