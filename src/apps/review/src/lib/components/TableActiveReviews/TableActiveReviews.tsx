/**
 * Table Active Reviews.
 */
import { FC, useMemo } from 'react'
import { Link } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { ChallengeInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'

import styles from './TableActiveReviews.module.scss'

interface Props {
    className?: string
    datas: ChallengeInfo[]
}

export const TableActiveReviews: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

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
                    <Link to={`${data.id}/challenge-details`}>{data.name}</Link>
                ),
                type: 'element',
            },
            {
                label: 'Phase',
                propertyName: 'currentPhase',
                type: 'text',
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
                        style={{
                            color: data.timeLeftColor,
                        }}
                    >
                        {data.timeLeft}
                    </span>
                ),
                type: 'element',
            },
            {
                label: 'Review Progress',
                propertyName: 'reviewProgress',
                renderer: (data: ChallengeInfo) => (data.reviewProgress ? (
                    <span>
                        {data.reviewProgress}
                        % Completed
                    </span>
                ) : (
                    <span>-</span>
                )),
                type: 'element',
            },
        ],
        [],
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

export default TableActiveReviews
