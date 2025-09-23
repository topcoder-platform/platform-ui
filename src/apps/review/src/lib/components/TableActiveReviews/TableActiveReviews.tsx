/**
 * Table Active Reviews.
 */
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bind, lowerCase, noop } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib'

import {
    BackendResourceRole,
    ChallengeInfo,
    ChallengeRealtiveInfosMapping,
} from '../../models'
import { TableWrapper } from '../TableWrapper'
import { ProgressBar } from '../ProgressBar'

import styles from './TableActiveReviews.module.scss'

interface Props {
    className?: string
    datas: ChallengeInfo[]
    resourceRoleMapping?: {
        [key: string]: BackendResourceRole
    }
    challengeRelativeInfosMapping: ChallengeRealtiveInfosMapping // from challenge id to list of my role
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
}

export const TableActiveReviews: FC<Props> = (props: Props) => {
    const navigate = useNavigate()
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])

    const redirect = useCallback(
        (data: ChallengeInfo, e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            navigate(`${data.id}/challenge-details`)
        },
        [
            navigate,
        ],
    )

    const columns = useMemo<TableColumn<ChallengeInfo>[]>(
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
                renderer: (data: ChallengeInfo) => (
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
                renderer: (data: ChallengeInfo) => {
                    let myRoles = ['']
                    const challengeRelativeInfos = props.challengeRelativeInfosMapping[data.id]
                    if (!props.resourceRoleMapping || !challengeRelativeInfos) {
                        myRoles = ['loading...']
                    } else {
                        myRoles = challengeRelativeInfos.myRoles
                            .map(myRoleInfo => props.resourceRoleMapping?.[myRoleInfo.roleId]?.name)
                            .filter(item => !!item) as string[]
                    }

                    return (
                        <div className={styles.blockMyRoles}>
                            {myRoles.map(item => (
                                <span key={item}>{item}</span>
                            ))}
                        </div>
                    )
                },
                type: 'element',
            },
            {
                className: styles.tableCell,
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
                className: styles.tableCell,
                label: 'Phase End Date',
                propertyName: 'currentPhaseEndDateString',
                type: 'text',
            },
            {
                className: styles.tableCell,
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
                className: styles.tableCell,
                label: 'Review Progress',
                propertyName: 'reviewProgress',
                renderer: (data: ChallengeInfo) => {
                    const challengeRelativeInfos = props.challengeRelativeInfosMapping[data.id]
                    const reviewProgress = challengeRelativeInfos?.reviewProgress

                    return reviewProgress !== undefined ? (
                        <div className='last-element'>
                            {reviewProgress !== null && (
                                <ProgressBar
                                    progress={reviewProgress}
                                    progressWidth='80px'
                                />
                            )}
                        </div>
                    ) : (<span>loading...</span>)
                },
                type: 'element',
            },
        ],
        [redirect, props.resourceRoleMapping, props.challengeRelativeInfosMapping],
    )

    const columnsMobile = useMemo<MobileTableColumn<ChallengeInfo>[][]>(
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
            ] as MobileTableColumn<ChallengeInfo>[],
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
            <Pagination
                page={props.page}
                totalPages={props.totalPages}
                onPageChange={props.setPage}
            />
        </TableWrapper>
    )
}

export default TableActiveReviews
