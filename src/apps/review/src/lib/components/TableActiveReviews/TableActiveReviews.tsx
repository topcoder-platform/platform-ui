/**
 * Table Active Reviews.
 */
import { FC, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bind, invert, startCase, toLower, toUpper, trim } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import {
    ActiveReviewAssignment,
} from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ProgressBar } from '../ProgressBar'

import styles from './TableActiveReviews.module.scss'

const REVIEW_PROGRESS_PHASES = new Set([
    'review',
    'iterative review',
    'appeals',
    'appeals response',
    'topgear iterative review',
])

interface Props {
    className?: string
    datas: ActiveReviewAssignment[]
    hideStatusColumns?: boolean
    disableNavigation?: boolean
    onToggleSort?: (sort: Sort | undefined) => void
    sort?: Sort
}

export const TableActiveReviews: FC<Props> = (props: Props) => {
    const className = props.className
    const datas = props.datas
    const hideStatusColumns = props.hideStatusColumns
    const disableNavigation = props.disableNavigation
    const sort = props.sort
    const onToggleSort = props.onToggleSort
    const navigate = useNavigate()
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])

    const redirect = useCallback(
        (data: ActiveReviewAssignment, e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            navigate(`${data.id}/challenge-details`)
        },
        [
            navigate,
        ],
    )

    const sortMapping = useMemo<Record<string, string>>(() => {
        const mapping: Record<string, string> = {
            name: 'challengeName',
        }

        if (hideStatusColumns) {
            mapping.challengeEndDateString = 'challengeEndDate'
        } else {
            mapping.currentPhase = 'phase'
            mapping.currentPhaseEndDateString = 'phaseEndDate'
            mapping.reviewProgress = 'reviewProgress'
            mapping.timeLeft = 'timeLeft'
        }

        return mapping
    }, [hideStatusColumns])

    const displaySort = useMemo<Sort | undefined>(() => {
        if (!sort) {
            return undefined
        }

        const reverseMapping = invert(sortMapping)
        const fieldName = reverseMapping[sort.fieldName]

        if (!fieldName) {
            return undefined
        }

        return {
            direction: sort.direction,
            fieldName,
        }
    }, [sort, sortMapping])

    const handleWinnerProfileLinkClick = useCallback(
        (event: React.MouseEvent<HTMLAnchorElement>) => {
            const winnerProfileUrl = event.currentTarget.dataset.winnerProfileUrl

            if (!winnerProfileUrl) {
                return
            }

            event.preventDefault()
            window.open(winnerProfileUrl, '_blank')
        },
        [],
    )

    const columns = useMemo<TableColumn<ActiveReviewAssignment>[]>(
        () => {
            const baseColumns: TableColumn<ActiveReviewAssignment>[] = [
                {
                    className: styles.tableCell,
                    isSortable: false,
                    label: '#',
                    propertyName: 'index',
                    type: 'text',
                },
                {
                    className: classNames(styles.textBlue, styles.tableBreakCell, styles.tableCell),
                    isSortable: true,
                    label: 'Project',
                    propertyName: 'name',
                    renderer: (data: ActiveReviewAssignment) => (
                        disableNavigation ? (
                            <span>{data.name}</span>
                        ) : (
                            <Link
                                to={`${data.id}/challenge-details`}
                                onClick={bind(redirect, this, data)}
                            >
                                {data.name}
                            </Link>
                        )
                    ),
                    type: 'element',
                },
            ]
            const myRoleColumn: TableColumn<ActiveReviewAssignment> = {
                className: classNames(styles.tableCell),
                isSortable: false,
                label: 'My Role',
                propertyName: 'role',
                renderer: (data: ActiveReviewAssignment) => (
                    <div className={styles.blockMyRoles}>
                        {(
                            data.resourceRoles.length
                                ? data.resourceRoles
                                : ['--']
                        ).map(role => (
                            <span key={role}>{role}</span>
                        ))}
                    </div>
                ),
                type: 'element',
            }
            if (hideStatusColumns) {
                // Insert Status column before Winner and End Date
                baseColumns.push({
                    className: styles.tableCell,
                    isSortable: false,
                    label: 'Status',
                    propertyName: 'status',
                    renderer: (data: ActiveReviewAssignment) => {
                        const raw = data.status
                        const normalized = raw ? toUpper(trim(raw)) : undefined

                        const formatLabel = (value?: string): string | undefined => {
                            if (!value) return undefined
                            if (value === 'COMPLETED') return 'Completed'
                            if (value === 'CANCELLED') return 'Cancelled'
                            if (value.startsWith('CANCELLED_')) {
                                const reason = value.slice('CANCELLED_'.length)
                                return `Cancelled: ${startCase(toLower(reason))}`
                            }

                            return startCase(toLower(value))
                        }

                        const label = formatLabel(normalized)
                        const variantClass = normalized === 'COMPLETED'
                            ? styles.statusPillCompleted
                            : normalized?.startsWith('CANCELLED')
                                ? styles.statusPillCancelled
                                : undefined

                        return label ? (
                            <span className={classNames(styles.statusPill, variantClass)}>
                                {label}
                            </span>
                        ) : (
                            <span>--</span>
                        )
                    },
                    type: 'element',
                })
                baseColumns.push(myRoleColumn)
                baseColumns.push({
                    className: styles.tableCell,
                    isSortable: false,
                    label: 'Winner',
                    propertyName: 'winnerHandle',
                    renderer: (data: ActiveReviewAssignment) => {
                        if (!data.winnerHandle) {
                            return <span>-</span>
                        }

                        const colorStyle = data.winnerHandleColor
                            ? { color: data.winnerHandleColor }
                            : undefined

                        if (data.winnerProfileUrl) {
                            return (
                                <a
                                    href={data.winnerProfileUrl}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    style={colorStyle}
                                    data-winner-profile-url={data.winnerProfileUrl}
                                    onClick={handleWinnerProfileLinkClick}
                                >
                                    {data.winnerHandle}
                                </a>
                            )
                        }

                        return (
                            <span style={colorStyle}>
                                {data.winnerHandle}
                            </span>
                        )
                    },
                    type: 'element',
                })
                baseColumns.push({
                    className: styles.tableCell,
                    isSortable: true,
                    label: 'End Date',
                    propertyName: 'challengeEndDateString',
                    renderer: (data: ActiveReviewAssignment) => (
                        <span>{data.challengeEndDateString ?? '--'}</span>
                    ),
                    type: 'element',
                })
            }

            if (!hideStatusColumns) {
                baseColumns.push(myRoleColumn)
                baseColumns.push(
                    {
                        className: styles.tableCell,
                        isSortable: true,
                        label: 'Phase',
                        propertyName: 'currentPhase',
                        renderer: (data: ActiveReviewAssignment) => (
                            <div className={styles.phase}>
                                {data.currentPhase}
                            </div>
                        ),
                        type: 'element',
                    },
                    {
                        className: styles.tableCell,
                        isSortable: true,
                        label: 'Phase End Date',
                        propertyName: 'currentPhaseEndDateString',
                        type: 'text',
                    },
                    {
                        className: styles.tableCell,
                        isSortable: true,
                        label: 'Time Left',
                        propertyName: 'timeLeft',
                        renderer: (data: ActiveReviewAssignment) => (
                            <span
                                className={styles.timeLeft}
                                style={{
                                    color: data.timeLeftColor,
                                    fontWeight:
                                        data.timeLeftStatus === 'normal'
                                            ? '400'
                                            : '700',
                                }}
                            >
                                <i className={`icon-${data.timeLeftStatus}`} />
                                {data.timeLeft}
                            </span>
                        ),
                        type: 'element',
                    },
                    {
                        className: styles.tableCell,
                        isSortable: true,
                        label: 'Review Progress',
                        propertyName: 'reviewProgress',
                        renderer: (data: ActiveReviewAssignment) => (
                            <div className='last-element'>
                                {typeof data.reviewProgress === 'number'
                                    && typeof data.currentPhase === 'string'
                                    && REVIEW_PROGRESS_PHASES.has(
                                        data.currentPhase.toLowerCase(),
                                    ) ? (
                                        <ProgressBar
                                            progress={data.reviewProgress}
                                            progressWidth='80px'
                                        />
                                    ) : (
                                        <span>--</span>
                                    )}
                            </div>
                        ),
                        type: 'element',
                    },
                )
            }

            return baseColumns
        },
        [
            disableNavigation,
            handleWinnerProfileLinkClick,
            hideStatusColumns,
            redirect,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<ActiveReviewAssignment>[][]>(
        () => columns.map(
            column => [
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
            ] as MobileTableColumn<ActiveReviewAssignment>[],
        ),
        [columns],
    )

    const handleToggleSort = useCallback(
        (nextSort?: Sort) => {
            if (!onToggleSort) {
                return
            }

            if (!nextSort) {
                onToggleSort(undefined)
                return
            }

            const mappedFieldName = sortMapping[nextSort.fieldName]
            if (!mappedFieldName) {
                onToggleSort(undefined)
                return
            }

            onToggleSort({
                direction: nextSort.direction,
                fieldName: mappedFieldName,
            })
        },
        [onToggleSort, sortMapping],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={datas} />
            ) : (
                <Table
                    columns={columns}
                    data={datas}
                    onToggleSort={handleToggleSort}
                    removeDefaultSort
                    forceSort={displaySort}
                    className='enhanced-table-desktop'
                />
            )}
        </TableWrapper>
    )
}

export default TableActiveReviews
