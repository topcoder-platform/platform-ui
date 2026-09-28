import { FC, useMemo } from 'react'

import { TimesheetGrid } from '../../components/timesheet-grid'
import type { TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus } from '../../lib/models'
import { buildRowsFromEntries } from '../../lib/utils'

import styles from './TimesheetsPage.module.scss'

interface TmTimesheetViewProps {
    timesheet: TimesheetView
}

/**
 * TM read-only mode: the caller can review submitted entries and their status history, but cannot
 * edit, approve, reopen, or submit anything. The grid is therefore locked and filtered down to
 * submitted rows only.
 */
const TmTimesheetView: FC<TmTimesheetViewProps> = (props: TmTimesheetViewProps) => {
    const rows = useMemo(
        () => buildRowsFromEntries(
            props.timesheet.entries.filter(entry => entry.status === TimesheetEntryStatus.SUBMITTED),
        ),
        [props.timesheet.entries],
    )

    return (
        <div className={styles.view}>
            <TimesheetGrid
                emptyMessage='No submitted entries to review.'
                isRowSelectable={function isRowSelectable() {
                    return false
                }}
                onSelectionChange={function onSelectionChange() {
                    return undefined
                }}
                readOnly
                rows={rows}
                selectedDates={[]}
                standardHoursPerDay={props.timesheet.assignment.standardHoursPerDay}
            />
        </div>
    )
}

export default TmTimesheetView
