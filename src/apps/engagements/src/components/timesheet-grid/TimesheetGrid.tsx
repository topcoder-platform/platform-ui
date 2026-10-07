import { FC, FocusEvent, useCallback, useMemo } from 'react'
import classNames from 'classnames'

import { TimesheetEntryStatus } from '../../lib/models'
import type { TimesheetFieldErrors, TimesheetRow } from '../../lib/utils'
import {
    formatHoursLabel,
    isRowReadOnly,
    isRowReopened,
    sumSelectedTotals,
    validateHours,
    validateRemarks,
} from '../../lib/utils'

import ExpandableText from './ExpandableText'
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
    /**
     * Decides which rows can be selected, replacing the default rule entirely.
     *
     * The default excludes approved rows, which is right for the member and manager views. The
     * administrator view overrides it, because selecting approved rows is how reopening and correcting
     * them starts.
     */
    isRowSelectable?: (row: TimesheetRow) => boolean
    /**
     * Keeps hours and remarks editable on approved rows. Administrator view only: for everyone else an
     * approved entry is frozen, and the API refuses the change anyway.
     */
    canEditApproved?: boolean
    /**
     * Renders the selected-totals footer. Off by default: every role view shows its own totals next to
     * its action button, and two copies of the same numbers on one screen is worse than none.
     */
    showTotals?: boolean
    emptyMessage?: string
    /** Errors the API reported against specific rows, shown under the input they belong to. */
    fieldErrors?: TimesheetFieldErrors
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

    const isSelectable = useCallback(
        (row: TimesheetRow) => (
            props.isRowSelectable ? props.isRowSelectable(row) : !isRowReadOnly(row)
        ),
        [props.isRowSelectable],
    )
    const selectableRows = useMemo(
        () => props.rows.filter(isSelectable),
        [isSelectable, props.rows],
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
                        <th scope='col' className={styles.dateCol}>Date</th>
                        <th scope='col'>Day</th>
                        <th scope='col'>Hours Worked</th>
                        <th scope='col'>Remarks</th>
                        <th scope='col'>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {props.rows.map(row => {
                        const rowReadOnly = readOnly
                            || (isRowReadOnly(row) && !props.canEditApproved)
                        const selectable = isSelectable(row)
                        const hoursCheck = validateHours(row.hoursWorked, props.standardHoursPerDay)
                        const isSelected = selected.has(row.workDate)
                        const rowErrors = props.fieldErrors?.[row.workDate]
                        // The local checks reflect what is in the inputs now, so they win over a server
                        // message about a value that may since have changed.
                        const hoursError = hoursCheck.error ?? rowErrors?.hoursWorked
                        const remarksError = validateRemarks(row.remarks).error ?? rowErrors?.remarks

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
                                <td data-label='Date' className={styles.dateCol}>
                                    {row.displayDate}
                                    {row.outsideAssignmentWindow && (
                                        <span className={styles.outsideWindow} title='Outside the assignment dates'>
                                            Outside assignment dates
                                        </span>
                                    )}
                                    {rowErrors?.workDate && (
                                        <span className={styles.error} role='alert'>
                                            {rowErrors.workDate}
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
                                                        hoursError ? styles.inputError : undefined,
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
                                                {hoursError && (
                                                    <span className={styles.error} role='alert'>
                                                        {hoursError}
                                                    </span>
                                                )}
                                                {!hoursError && hoursCheck.warning && (
                                                    <span className={styles.warning}>{hoursCheck.warning}</span>
                                                )}
                                            </>
                                        )}
                                </td>
                                <td data-label='Remarks'>
                                    {rowReadOnly
                                        ? (
                                            row.remarks
                                                ? <ExpandableText text={row.remarks} />
                                                : <span className={styles.readOnlyValue}>-</span>
                                        )
                                        : (
                                            <>
                                                <textarea
                                                    aria-label={`Remarks for ${row.displayDate}`}
                                                    className={classNames(
                                                        styles.remarksInput,
                                                        remarksError ? styles.inputError : undefined,
                                                    )}
                                                    onChange={function onRemarksChange(
                                                        event: FocusEvent<HTMLTextAreaElement>,
                                                    ) {
                                                        props.onRowChange?.(row.workDate, {
                                                            remarks: event.target.value,
                                                        })
                                                    }}
                                                    placeholder='What did you work on?'
                                                    rows={1}
                                                    value={row.remarks}
                                                />
                                                {remarksError && (
                                                    <span className={styles.error} role='alert'>
                                                        {remarksError}
                                                    </span>
                                                )}
                                            </>
                                        )}
                                </td>
                                <td data-label='Status'>
                                    {isRowReopened(row) ? (
                                        <span className={styles.reopenedBadge}>Reopened</span>
                                    ) : (
                                        <span className={styles.status}>{STATUS_LABELS[row.status]}</span>
                                    )}
                                    {row.status === TimesheetEntryStatus.APPROVED && (
                                        <span className={styles.approvalDetail}>
                                            {row.approvedByHandle
                                                ? `by ${row.approvedByHandle}`
                                                : undefined}
                                            {row.approvedAt
                                                ? ` on ${formatApprovalDate(row.approvedAt)}`
                                                : undefined}
                                        </span>
                                    )}
                                    {row.status === TimesheetEntryStatus.APPROVED && row.approvalComment && (
                                        <ExpandableText
                                            className={styles.approvalComment}
                                            text={row.approvalComment}
                                        />
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
                {props.showTotals && (
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
                )}
            </table>
        </div>
    )
}

export default TimesheetGrid
