/**
 * Table Active Reviews.
 */
import { FC, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import _, { bind, lowerCase } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { ChallengeInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ProgressBar } from '../ProgressBar'
import { useRole } from '../../hooks/useRole'

import styles from './TableActiveReviews.module.scss'

interface Props {
    className?: string
    datas: ChallengeInfo[]
}

export const TableActiveReviews: FC<Props> = (props: Props) => {
    const navigate = useNavigate()
    const { updateRole }: { updateRole: (role: string) => void} = useRole()
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const redirect = useCallback(
        (data: ChallengeInfo, e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            updateRole(data.role)
            navigate(`${data.id}/challenge-details`)
        },
        [navigate, updateRole],
    )

    const columns = useMemo<TableColumn<ChallengeInfo>[]>(
        () => [
            {
                label: '#',
                propertyName: 'index',
                type: 'text',
            },
            {
                className: styles.textBlue,
                label: 'Project',
                propertyName: 'name',
                renderer: (data: ChallengeInfo) => (
                    <Link to='/' onClick={bind(redirect, this, data)}>
                        {data.name}
                    </Link>
                ),
                type: 'element',
            },
            {
                label: 'My Role',
                propertyName: 'role',
                type: 'text',
            },
            {
                label: 'Phase',
                propertyName: 'currentPhase',
                renderer: (data: ChallengeInfo) => (
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
                label: 'Phase End Date',
                propertyName: 'currentPhaseEndDateString',
                type: 'text',
            },
            {
                label: 'Time Left',
                propertyName: 'timeLeft',
                renderer: (data: ChallengeInfo) => (
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
                label: 'Review Progress',
                propertyName: 'reviewProgress',
                renderer: (data: ChallengeInfo) => (
                    <div className='last-element'>
                        <ProgressBar
                            progress={data.reviewProgress}
                            progressWidth='80px'
                        />
                    </div>
                ),
                type: 'element',
            },
        ],
        [redirect],
    )

    const columnsMobile = useMemo<MobileTableColumn<ChallengeInfo>[][]>(
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
        ] as MobileTableColumn<ChallengeInfo>[]),
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

export default TableActiveReviews
