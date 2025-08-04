/**
 * Table Review Appeals.
 */
import { FC, useCallback, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { TableWrapper } from '../TableWrapper'
import { SubmissionInfo } from '../../models'
import { ProgressBar } from '../ProgressBar'
import { ADMIN, APPROVAL, COPILOT, WITHOUT_APPEAL } from '../../../config/index.config'
import { useRole, useRoleProps } from '../../hooks'

import styles from './TableReviewAppeals.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    tab: string
    type?: string
    firstSubmissions?: SubmissionInfo
}

export const TableReviewAppeals: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const { actionChallengeRole }: useRoleProps = useRole()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => {
            const initalColumns = [
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

            ]
            const actionColumns = !includes([COPILOT, ADMIN], actionChallengeRole) ? [
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
            ] : []

            if (includes([APPROVAL], props.tab)) {
                return [...initalColumns] as MobileTableColumn<SubmissionInfo>[]
            }

            if (includes(WITHOUT_APPEAL, props.type)) {
                return [...initalColumns, ...actionColumns] as TableColumn<SubmissionInfo>[]
            }

            return [...initalColumns, {
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
            }, ...actionColumns] as TableColumn<SubmissionInfo>[]
        },
        [prevent, props.tab, props.type, actionChallengeRole],
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

    const submissions
        = includes([APPROVAL], props.tab)
            ? [props.firstSubmissions] as SubmissionInfo[]
            : props.datas

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                props.className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={submissions} />
            ) : (
                <Table
                    columns={columns}
                    data={submissions}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableReviewAppeals
