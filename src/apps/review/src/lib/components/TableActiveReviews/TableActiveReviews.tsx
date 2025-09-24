/**
 * Table Active Reviews.
 */
import { FC, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bind, lowerCase, noop } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import {
    ActiveReviewAssignment,
} from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ProgressBar } from '../ProgressBar'

import styles from './TableActiveReviews.module.scss'

interface Props {
    className?: string
    datas: ActiveReviewAssignment[]
}

export const TableActiveReviews: FC<Props> = (props: Props) => {
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

    const columns = useMemo<TableColumn<ActiveReviewAssignment>[]>(
        () => [
            {
                className: styles.tableCell,
                label: '#',
                propertyName: 'index',
                type: 'text',
            },
            {
                className: classNames(styles.textBlue, styles.tableBreakCell, styles.tableCell),
                label: 'Project',
                propertyName: 'name',
                renderer: (data: ActiveReviewAssignment) => (
                    <Link
                        to={`${data.id}/challenge-details`}
                        onClick={bind(redirect, this, data)}
                    >
                        {data.name}
                    </Link>
                ),
                type: 'element',
            },
            {
                className: classNames(styles.tableCell),
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
            },
            {
                className: styles.tableCell,
                label: 'Phase',
                propertyName: 'currentPhase',
                renderer: (data: ActiveReviewAssignment) => (
                    <div className={styles.phase}>
                        <i
                            className={`icon-${
                                lowerCase(data.currentPhase)
                                    .split(' ')[0]
                            }`}
                        />
                        {data.currentPhase}
                    </div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Phase End Date',
                propertyName: 'currentPhaseEndDateString',
                type: 'text',
            },
            {
                className: styles.tableCell,
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
                        {(() => {
                            const rawTimeLeft = data.timeLeft?.trim()
                            const normalizedLate = rawTimeLeft
                                && data.timeLeftStatus === 'error'
                                ? rawTimeLeft.replace(/^[+-]/, '').trim()
                                : ''

                            return normalizedLate
                                ? `Late by ${normalizedLate}`
                                : data.timeLeft
                        })()}
                    </span>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Review Progress',
                propertyName: 'reviewProgress',
                renderer: (data: ActiveReviewAssignment) => (
                    <div className='last-element'>
                        {typeof data.reviewProgress === 'number' ? (
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
        ],
        [redirect],
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
                    onToggleSort={noop}
                    removeDefaultSort
                    className='enhanced-table-desktop'
                />
            )}
        </TableWrapper>
    )
}

export default TableActiveReviews
