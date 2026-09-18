import { FC, FocusEvent, useMemo } from 'react'
import classNames from 'classnames'

import { TimesheetEntryStatus } from '../../lib/models'
import type { TimesheetRow } from '../../lib/utils'
import {
    formatHoursLabel,
    isRowReadOnly,
    isRowReopened,
    sumSelectedTotals,
    validateHours,
} from '../../lib/utils'

import styles from './TimesheetGrid.module.scss'

export interface TimesheetGridProps {
    /** Rows to render. Generated in the browser for a picked range, or built from saved entries. */
    rows: TimesheetRow[]
    /** Work dates of the selected rows. Selection is keyed on work date because a row may be unsaved. */
    selectedDates: string[]
    onSelectionChange: (workDates: string[]) => void
    /** Omit to render the grid read-only, which is how the approved and manager views mount it. */
    onRowChange?: (workDate: string, changes: Partial<TimesheetRow>) => void
    /** Drives the non-blocking "above standard hours" warning. */
    standardHoursPerDay?: number | null
    /** Hides hours and remarks inputs even for editable rows: the manager view reviews, not edits. */
    readOnly?: boolean
    /** Rows that cannot be selected, e.g. days with nothing entered yet. */
    isRowSelectable?: (row: TimesheetRow) => boolean
    emptyMessage?: string
}

const STATUS_LABELS: Record<TimesheetEntryStatus, string> = {
    [TimesheetEntryStatus.APPROVED]: 'Approved',
    [TimesheetEntryStatus.DRAFT]: '-',
    [TimesheetEntryStatus.SUBMITTED]: 'Submitted',
}

const formatApprovalDate = (value?: string): string => {
    if (!value) {
        return ''
    }

    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString()
}

/**
 * The timesheet grid, shared by the member, manager, and administrator views.
 *
 * Deliberately free of role logic: what a role may do arrives as props (`readOnly`, `onRowChange`,
 * `isRowSelectable`) so the three views render the same columns and formats rather than drifting apart.
 */
const TimesheetGrid: FC<TimesheetGridProps> = (props: TimesheetGridProps) => {
    const readOnly = props.readOnly ?? false
    const selected = useMemo(() => new Set(props.selectedDates), [props.selectedDates])

    const selectableRows = useMemo(
        () => props.rows.filter(row => (
            !isRowReadOnly(row) && (props.isRowSelectable?.(row) ?? true)
        )),
        [props.isRowSelectable, props.rows],
    )
    const selectedRows = useMemo(
        () => props.rows.filter(row => selected.has(row.workDate)),
        [props.rows, selected],
    )
    const totals = useMemo(() => sumSelectedTotals(selectedRows), [selectedRows])

    const allSelectableSelected = selectableRows.length > 0
        && selectableRows.every(row => selected.has(row.workDate))

    const toggleRow = (workDate: string, isSelected: boolean): void => {
        const next = new Set(selected)

        if (isSelected) {
            next.add(workDate)
        } else {
            next.delete(workDate)
        }

        props.onSelectionChange([...next])
    }

    const toggleAll = (isSelected: boolean): void => {
        props.onSelectionChange(
            isSelected ? selectableRows.map(row => row.workDate) : [],
        )
    }

    if (props.rows.length === 0) {
        return (
            <p className={styles.emptyState}>
                {props.emptyMessage ?? 'No timesheet entries to show.'}
            </p>
        )
    }

    return (
        <div className={styles.gridWrapper}>
            <table className={styles.grid}>
                <caption className={styles.caption}>Timesheet entries</caption>
                <thead>
                    <tr>
                        <th scope='col' className={styles.selectColumn}>
                            <input
                                aria-label='Select all rows'
                                checked={allSelectableSelected}
                                disabled={selectableRows.length === 0}
                                onChange={function onToggleAll(event: FocusEvent<HTMLInputElement>) {
                                    toggleAll(event.target.checked)
                                }}
                                type='checkbox'
                            />
                        </th>
                        <th scope='col'>Date</th>
                        <th scope='col'>Day</th>
                        <th scope='col'>Hours Worked</th>
                        <th scope='col'>Remarks</th>
                        <th scope='col'>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {props.rows.map(row => {
                        const rowReadOnly = readOnly || isRowReadOnly(row)
                        const selectable = !isRowReadOnly(row)
                            && (props.isRowSelectable?.(row) ?? true)
                        const hoursCheck = validateHours(row.hoursWorked, props.standardHoursPerDay)
                        const isSelected = selected.has(row.workDate)

                        return (
                            <tr
                                className={classNames(
                                    styles.row,
                                    isSelected ? styles.selectedRow : undefined,
                                    isRowReadOnly(row) ? styles.approvedRow : undefined,
                                )}
                                key={row.workDate}
                            >
                                <td className={styles.selectColumn} data-label='Select'>
                                    <input
                                        aria-label={`Select ${row.displayDate}`}
                                        checked={isSelected}
                                        disabled={!selectable}
                                        onChange={function onToggle(
                                            event: FocusEvent<HTMLInputElement>,
                                        ) {
                                            toggleRow(row.workDate, event.target.checked)
                                        }}
                                        type='checkbox'
                                    />
                                </td>
                                <td data-label='Date'>
                                    {row.displayDate}
                                    {row.outsideAssignmentWindow && (
                                        <span className={styles.outsideWindow} title='Outside the assignment dates'>
                                            Outside assignment dates
                                        </span>
                                    )}
                                </td>
                                <td data-label='Day'>{row.dayLabel}</td>
                                <td data-label='Hours Worked'>
                                    {rowReadOnly
                                        ? (
                                            <span className={styles.readOnlyValue}>
                                                {row.hoursWorked ? formatHoursLabel(row.hoursWorked) : '-'}
                                            </span>
                                        )
                                        : (
                                            <>
                                                <input
                                                    aria-label={`Hours worked on ${row.displayDate}`}
                                                    className={classNames(
                                                        styles.hoursInput,
                                                        hoursCheck.error ? styles.inputError : undefined,
                                                    )}
                                                    inputMode='decimal'
                                                    onChange={function onHoursChange(
                                                        event: FocusEvent<HTMLInputElement>,
                                                    ) {
                                                        props.onRowChange?.(row.workDate, {
                                                            hoursWorked: event.target.value,
                                                        })
                                                    }}
                                                    placeholder='0'
                                                    type='text'
                                                    value={row.hoursWorked}
                                                />
                                                {hoursCheck.error && (
                                                    <span className={styles.error} role='alert'>
                                                        {hoursCheck.error}
                                                    </span>
                                                )}
                                                {!hoursCheck.error && hoursCheck.warning && (
                                                    <span className={styles.warning}>{hoursCheck.warning}</span>
                                                )}
                                            </>
                                        )}
                                </td>
                                <td data-label='Remarks'>
                                    {rowReadOnly
                                        ? <span className={styles.readOnlyValue}>{row.remarks || '-'}</span>
                                        : (
                                            <input
                                                aria-label={`Remarks for ${row.displayDate}`}
                                                className={styles.remarksInput}
                                                onChange={function onRemarksChange(
                                                    event: FocusEvent<HTMLInputElement>,
                                                ) {
                                                    props.onRowChange?.(row.workDate, {
                                                        remarks: event.target.value,
                                                    })
                                                }}
                                                placeholder='What did you work on?'
                                                type='text'
                                                value={row.remarks}
                                            />
                                        )}
                                </td>
                                <td data-label='Status'>
                                    <span className={styles.status}>{STATUS_LABELS[row.status]}</span>
                                    {isRowReopened(row) && (
                                        <span className={styles.reopenedBadge}>Reopened</span>
                                    )}
                                    {row.status === TimesheetEntryStatus.APPROVED && (
                                        <span className={styles.approvalDetail}>
                                            {row.approvedByHandle
                                                ? `by ${row.approvedByHandle}`
                                                : undefined}
                                            {row.approvedAt
                                                ? ` on ${formatApprovalDate(row.approvedAt)}`
                                                : undefined}
                                            {row.approvalComment
                                                ? ` - "${row.approvalComment}"`
                                                : undefined}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
                <tfoot>
                    <tr>
                        <td className={styles.totalsCell} colSpan={6}>
                            <span className={styles.total}>
                                Total Selected Days:
                                {' '}
                                <strong>{totals.days}</strong>
                            </span>
                            <span className={styles.total}>
                                Total Selected Hours:
                                {' '}
                                <strong>{formatHoursLabel(totals.hours)}</strong>
                            </span>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}

export default TimesheetGrid
