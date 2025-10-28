/**
 * Challenge Timeline.
 */
import { FC, useMemo } from 'react'
import classNames from 'classnames'

import { Button, Table, TableColumn } from '~/libs/ui'

import { TableWrapper } from '../TableWrapper'

import styles from './ChallengeTimeline.module.scss'

export interface ChallengeTimelineAction {
    label: string
    onClick: () => void
    disabled?: boolean
    loading?: boolean
}

export interface ChallengeTimelineRow {
    id?: string
    name: string
    status: string
    start: string
    end: string
    actions?: ChallengeTimelineAction[]
    duration?: number
}

interface Props {
    className?: string
    rows: ChallengeTimelineRow[]
    showActions?: boolean
}

const STATUS_CLASS_MAP: Record<string, string> = {
    closed: 'statusClosed',
    open: 'statusOpen',
    pending: 'statusPending',
}

export const ChallengeTimeline: FC<Props> = (props: Props) => {
    const columns = useMemo<TableColumn<ChallengeTimelineRow>[]>(() => {
        const baseColumns: TableColumn<ChallengeTimelineRow>[] = [
            {
                className: styles.phaseCell,
                columnId: 'phase',
                isSortable: false,
                label: 'Phase',
                propertyName: 'name',
                renderer: (row: ChallengeTimelineRow) => <span>{row.name}</span>,
                type: 'element',
            },
            {
                className: styles.statusCell,
                columnId: 'status',
                isSortable: false,
                label: 'Status',
                propertyName: 'status',
                renderer: (row: ChallengeTimelineRow) => {
                    const normalizedStatus = row.status.trim()
                        .toLowerCase()
                    const statusClassKey = STATUS_CLASS_MAP[normalizedStatus]
                    const statusClass = statusClassKey ? styles[statusClassKey] : undefined

                    return (
                        <span className={classNames(styles.status, statusClass)}>
                            {row.status}
                        </span>
                    )
                },
                type: 'element',
            },
            {
                className: styles.dateCell,
                columnId: 'start',
                isSortable: false,
                label: 'Start',
                propertyName: 'start',
                renderer: (row: ChallengeTimelineRow) => <span>{row.start}</span>,
                type: 'element',
            },
            {
                className: styles.dateCell,
                columnId: 'end',
                isSortable: false,
                label: 'End',
                propertyName: 'end',
                renderer: (row: ChallengeTimelineRow) => <span>{row.end}</span>,
                type: 'element',
            },
        ]

        if (props.showActions) {
            baseColumns.push({
                className: styles.actionsColumn,
                columnId: 'actions',
                isSortable: false,
                label: 'Actions',
                propertyName: 'actions',
                renderer: (row: ChallengeTimelineRow) => {
                    const availableActions = row.actions?.filter(Boolean) ?? []

                    if (!availableActions.length) {
                        return (
                            <span className={styles.noActions}>--</span>
                        )
                    }

                    return (
                        <span className={styles.actionsList}>
                            {availableActions.map(action => (
                                <Button
                                    key={action.label}
                                    secondary
                                    size='sm'
                                    noCaps
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                    loading={action.loading}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </span>
                    )
                },
                type: 'element',
            })
        }

        return baseColumns
    }, [props.showActions])

    if (props.rows.length === 0) {
        return <></>
    }

    return (
        <TableWrapper className={classNames(
            styles.container,
            props.className,
            'enhanced-table',
        )}
        >
            <Table
                columns={columns}
                data={props.rows}
                disableSorting
                removeDefaultSort
            />
        </TableWrapper>
    )
}

export default ChallengeTimeline
