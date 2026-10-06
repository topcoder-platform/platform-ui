import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { BaseModal, Button, InputDatePicker, InputSelect } from '~/libs/ui'

import type { TimesheetView } from '../../lib/models'
import { TimesheetEntryStatus } from '../../lib/models'
import {
    approveTimesheetEntries,
    getTimesheet,
    reopenTimesheetEntries,
    saveTimesheetEntries,
    submitTimesheetEntries,
} from '../../lib/services'
import type { TimesheetRow } from '../../lib/utils'
import {
    buildRowsFromEntries,
    formatDisplayDate,
    formatHoursLabel,
    generateWorkDates,
    getDayLabel,
    hasEnteredHours,
    hasRowValidationError,
    sumSelectedTotals,
    toWorkDateString,
    validateDateRange,
} from '../../lib/utils'
import { TimesheetApproveModal } from '../../components/timesheet-approve-modal'
import { TimesheetAuditModal } from '../../components/timesheet-audit-modal'
import { TimesheetGrid } from '../../components/timesheet-grid'
import { TimesheetReasonModal } from '../../components/timesheet-reason-modal'

import styles from './TimesheetsPage.module.scss'

interface AdminTimesheetViewProps {
    timesheet: TimesheetView
    onTimesheetChange: (timesheet: TimesheetView) => void
}

/** Which override the reason dialog is collecting a reason for. */
type PendingOverride = 'correct' | 'reopen' | 'submit'
type StatusFilter = TimesheetEntryStatus.APPROVED | TimesheetEntryStatus.SUBMITTED

const OVERRIDE_COPY: Record<PendingOverride, { confirmLabel: string, description: string, title: string }> = {
    correct: {
        confirmLabel: 'Save correction',
        description:
            'You are correcting timesheet entries on the member’s behalf. '
            + 'The previous values and statuses are preserved in the audit trail.',
        title: 'Correct timesheet entries',
    },
    reopen: {
        confirmLabel: 'Reopen',
        description:
            'You are reopening approved entries, which overrides a manager’s approval. '
            + 'They return to draft and must be resubmitted and approved again.',
        title: 'Reopen approved entries',
    },
    submit: {
        confirmLabel: 'Submit on behalf',
        description:
            'You are submitting these entries on the member’s behalf, '
            + 'which sends them to the engagement managers for approval.',
        title: 'Submit on the member’s behalf',
    },
}

/**
 * Administrators may act on any row, approved included: reopening and correcting approved entries is
 * exactly what this view is for.
 */
const selectAnyRow = (): boolean => true

const extractErrorMessage = (error: unknown, fallback: string): string => {
    const typedError = error as {
        message?: string
        response?: { data?: { message?: string } }
    }

    return typedError?.response?.data?.message || typedError?.message || fallback
}

const sortRowsByWorkDate = (rows: TimesheetRow[]): TimesheetRow[] => (
    [...rows].sort((left, right) => left.workDate.localeCompare(right.workDate))
)

const normalizeRemarks = (remarks: string | null | undefined): string => (
    remarks?.trim() || ''
)

const STATUS_FILTER_OPTIONS = [
    {
        label: 'Pending Approval',
        value: TimesheetEntryStatus.SUBMITTED,
    },
    {
        label: 'Approved',
        value: TimesheetEntryStatus.APPROVED,
    },
]

const getDefaultRange = (): { fromDate: string, toDate: string } => {
    const today = new Date()
    const monday = new Date(today)
    const offsetToMonday = (today.getDay() + 6) % 7
    monday.setDate(today.getDate() - offsetToMonday)
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)

    return {
        fromDate: toWorkDateString(monday),
        toDate: toWorkDateString(friday),
    }
}

const toPickerDate = (value: string): Date | undefined => {
    if (!value) {
        return undefined
    }

    const [year, month, day] = value.split('-')
        .map(Number)

    return new Date(year, month - 1, day)
}

/**
 * The administrator's view: everything a member or manager can do, on anyone's timesheet, plus reopen
 * and correct.
 *
 * Every action that overrides someone else's work collects a reason first, because the API requires
 * one and because an override with no recorded reason is exactly what the audit trail exists to
 * prevent. Actions taken for someone else are labelled as such.
 */
const AdminTimesheetView: FC<AdminTimesheetViewProps> = (props: AdminTimesheetViewProps) => {
    const defaultRange = useMemo(getDefaultRange, [])
    const [rows, setRows] = useState<TimesheetRow[]>([])
    const [selectedDates, setSelectedDates] = useState<string[]>([])
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(TimesheetEntryStatus.SUBMITTED)
    const [filterFromDate, setFilterFromDate] = useState<string>('')
    const [filterToDate, setFilterToDate] = useState<string>('')
    const [fromDate, setFromDate] = useState<string>(defaultRange.fromDate)
    const [toDate, setToDate] = useState<string>(defaultRange.toDate)
    const [pendingOverride, setPendingOverride] = useState<PendingOverride | undefined>()
    const [isApproveOpen, setIsApproveOpen] = useState<boolean>(false)
    const [isAddEntriesOpen, setIsAddEntriesOpen] = useState<boolean>(false)
    const [auditEntry, setAuditEntry] = useState<TimesheetRow | undefined>()
    const [isWorking, setIsWorking] = useState<boolean>(false)
    const [actionError, setActionError] = useState<string | undefined>()
    const [partialResult, setPartialResult] = useState<string | undefined>()

    const isApprovedView = statusFilter === TimesheetEntryStatus.APPROVED

    useEffect(() => {
        setRows(buildRowsFromEntries(props.timesheet.entries))
        setSelectedDates([])
    }, [props.timesheet.entries])

    const rangeError = isApprovedView ? validateDateRange(filterFromDate, filterToDate) : undefined
    const filteredRows = useMemo(
        () => rows.filter(row => (isApprovedView
            ? row.status === TimesheetEntryStatus.APPROVED
            : row.status !== TimesheetEntryStatus.APPROVED)),
        [isApprovedView, rows],
    )
    const selectedRows = useMemo(
        () => filteredRows.filter(row => selectedDates.includes(row.workDate)),
        [filteredRows, selectedDates],
    )
    const totals = useMemo(() => sumSelectedTotals(selectedRows), [selectedRows])
    const invalidRows = useMemo(
        () => rows.filter(row => hasRowValidationError(
            row,
            props.timesheet.assignment.standardHoursPerDay,
        )),
        [props.timesheet.assignment.standardHoursPerDay, rows],
    )
    const addRangeError = useMemo(
        () => validateDateRange(fromDate, toDate),
        [fromDate, toDate],
    )

    const selectedIds = useMemo(
        () => selectedRows
            .map(row => row.id)
            .filter((id): id is string => Boolean(id)),
        [selectedRows],
    )
    const selectedStatuses = useMemo(
        () => new Set(selectedRows.map(row => row.status)),
        [selectedRows],
    )
    const hasPendingRowChanges = useMemo(() => {
        const savedByDate = new Map(
            props.timesheet.entries.map(entry => [entry.workDate, entry]),
        )

        return rows.some(row => {
            const saved = savedByDate.get(row.workDate)
            if (!saved) {
                return hasEnteredHours(row)
            }

            return row.hoursWorked.trim() !== saved.hoursWorked
                || normalizeRemarks(row.remarks) !== normalizeRemarks(saved.remarks)
        })
    }, [props.timesheet.entries, rows])

    const reload = useCallback(async (): Promise<void> => {
        const loaded = await getTimesheet(
            props.timesheet.engagementId,
            props.timesheet.assignment.id,
            {
                fromDate: isApprovedView ? filterFromDate || undefined : undefined,
                status: isApprovedView ? TimesheetEntryStatus.APPROVED : undefined,
                toDate: isApprovedView ? filterToDate || undefined : undefined,
            },
        )
        props.onTimesheetChange(loaded)
    }, [filterFromDate, filterToDate, isApprovedView, props, statusFilter])

    useEffect(() => {
        if (rangeError) {
            return
        }

        setSelectedDates([])
        reload()
            .catch(error => {
                setActionError(extractErrorMessage(error, 'Failed to load the timesheet.'))
            })
        // Reload only when filter state changes. Including reload would also refetch whenever
        // props.timesheet updates after a response.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterFromDate, filterToDate, rangeError, statusFilter])

    const handleRowChange = useCallback((workDate: string, changes: Partial<TimesheetRow>) => {
        setRows(current => current.map(row => (
            row.workDate === workDate ? { ...row, ...changes } : row
        )))
        setActionError(undefined)
    }, [])

    const handleAddRange = useCallback((): boolean => {
        if (addRangeError) {
            setActionError(addRangeError)
            return false
        }

        const rangeWorkDates = generateWorkDates(fromDate, toDate)
        const existingDates = new Set(rows.map(row => row.workDate))
        const missingDates = rangeWorkDates.filter(workDate => !existingDates.has(workDate))

        if (!missingDates.length) {
            setActionError('All dates in this range already exist in this timesheet.')
            return false
        }

        setRows(current => sortRowsByWorkDate([
            ...current,
            ...missingDates.map(workDate => ({
                dayLabel: getDayLabel(workDate),
                displayDate: formatDisplayDate(workDate),
                hoursWorked: '',
                isPaid: false,
                outsideAssignmentWindow: Boolean(
                    (props.timesheet.assignment.startDate && workDate < props.timesheet.assignment.startDate)
                    || (props.timesheet.assignment.endDate && workDate > props.timesheet.assignment.endDate),
                ),
                remarks: '',
                status: TimesheetEntryStatus.DRAFT,
                workDate,
            })),
        ]))
        setSelectedDates(current => Array.from(new Set([...current, ...missingDates])))
        setActionError(undefined)
        return true
    }, [
        addRangeError,
        fromDate,
        props.timesheet.assignment.endDate,
        props.timesheet.assignment.startDate,
        rows,
        toDate,
    ])

    /**
     * Saves the edited rows. An approved row being changed is an override, so the API needs a reason -
     * which is why the caller passes one through from the reason dialog.
     */
    const saveRows = useCallback(async (overrideReason?: string): Promise<void> => {
        if (!selectedDates.length) {
            setActionError('Select at least one entry before saving.')
            return
        }

        const entries = rows
            .filter(row => selectedDates.includes(row.workDate))
            .filter(hasEnteredHours)
            .filter(row => !hasRowValidationError(
                row,
                props.timesheet.assignment.standardHoursPerDay,
            ))
            .map(row => ({
                hoursWorked: row.hoursWorked.trim(),
                remarks: row.remarks.trim() || undefined,
                workDate: row.workDate,
            }))

        if (!entries.length) {
            setActionError('Enter hours on at least one day before saving.')
            return
        }

        const updated = await saveTimesheetEntries(
            props.timesheet.engagementId,
            props.timesheet.assignment.id,
            { entries, overrideReason },
        )

        props.onTimesheetChange(updated)
    }, [props, rows, selectedDates])

    const savePendingRowsIfNeeded = useCallback(async (): Promise<TimesheetView> => {
        if (!hasPendingRowChanges) {
            return props.timesheet
        }

        const entries = rows
            .filter(hasEnteredHours)
            .filter(row => !hasRowValidationError(
                row,
                props.timesheet.assignment.standardHoursPerDay,
            ))
            .map(row => ({
                hoursWorked: row.hoursWorked.trim(),
                remarks: row.remarks.trim() || undefined,
                workDate: row.workDate,
            }))

        const updated = await saveTimesheetEntries(
            props.timesheet.engagementId,
            props.timesheet.assignment.id,
            { entries },
        )

        props.onTimesheetChange(updated)
        return updated
    }, [hasPendingRowChanges, props, rows])

    const runOverride = useCallback(async (overrideReason: string) => {
        setActionError(undefined)
        setIsWorking(true)

        try {
            if (pendingOverride === 'reopen') {
                const updated = await reopenTimesheetEntries(
                    props.timesheet.engagementId,
                    props.timesheet.assignment.id,
                    { entryIds: selectedIds, overrideReason },
                )
                props.onTimesheetChange(updated)
                toast.success('Entries reopened.')
            } else if (pendingOverride === 'submit') {
                if (invalidRows.length) {
                    setActionError('Fix the highlighted fields before submitting.')
                    setPendingOverride(undefined)
                    return
                }

                const currentTimesheet = await savePendingRowsIfNeeded()
                const entryIds = currentTimesheet.entries
                    .filter(entry => selectedDates.includes(entry.workDate))
                    .filter(entry => entry.status === TimesheetEntryStatus.DRAFT)
                    .map(entry => entry.id)

                if (!entryIds.length) {
                    setActionError('The selected rows have nothing to submit.')
                    return
                }

                const updated = await submitTimesheetEntries(
                    props.timesheet.engagementId,
                    props.timesheet.assignment.id,
                    { entryIds, overrideReason },
                )
                props.onTimesheetChange(updated)
                toast.success('Entries submitted on the member’s behalf.')
            } else {
                await saveRows(overrideReason)
                toast.success('Correction saved.')
            }

            setPendingOverride(undefined)
            setSelectedDates([])
        } catch (error) {
            setActionError(extractErrorMessage(error, 'The override could not be applied.'))
            setPendingOverride(undefined)
        } finally {
            setIsWorking(false)
        }
    }, [
        invalidRows.length,
        pendingOverride,
        props,
        savePendingRowsIfNeeded,
        saveRows,
        selectedDates,
        selectedIds,
    ])

    const handleApprove = useCallback(async (
        approvalComment: string,
        overrideReason?: string,
    ) => {
        setActionError(undefined)
        setPartialResult(undefined)

        if (invalidRows.length) {
            setActionError('Fix the highlighted fields before approving.')
            setIsApproveOpen(false)
            return
        }

        setIsWorking(true)

        try {
            const currentTimesheet = await savePendingRowsIfNeeded()
            const entryIds = currentTimesheet.entries
                .filter(entry => selectedDates.includes(entry.workDate))
                .filter(entry => entry.status === TimesheetEntryStatus.SUBMITTED)
                .map(entry => entry.id)

            if (!entryIds.length) {
                setActionError('The selected rows have nothing to approve.')
                setIsApproveOpen(false)
                return
            }

            const result = await approveTimesheetEntries(
                props.timesheet.engagementId,
                props.timesheet.assignment.id,
                { approvalComment, entryIds, overrideReason },
            )

            setIsApproveOpen(false)
            setSelectedDates([])

            if (result.skipped.length) {
                setPartialResult(
                    `${result.approved.length} of ${entryIds.length} approved. `
                    + `${result.skipped.length} `
                    + `${result.skipped.length === 1 ? 'entry was' : 'entries were'} `
                    + 'no longer awaiting approval.',
                )
            } else {
                toast.success(
                    `Approved ${result.approved.length} `
                    + `${result.approved.length === 1 ? 'entry' : 'entries'}.`,
                )
            }

            await reload()
        } catch (error) {
            setActionError(extractErrorMessage(error, 'Failed to approve the selected entries.'))
            setIsApproveOpen(false)
        } finally {
            setIsWorking(false)
        }
    }, [invalidRows.length, props, reload, savePendingRowsIfNeeded, selectedDates])

    const handleSaveDrafts = useCallback(async () => {
        if (invalidRows.length) {
            setActionError('Fix the highlighted fields before saving.')
            return
        }

        // Touching an approved row is an override, so route it through the reason dialog instead.
        if (selectedStatuses.has(TimesheetEntryStatus.APPROVED)) {
            setPendingOverride('correct')
            return
        }

        setActionError(undefined)
        setIsWorking(true)

        try {
            await saveRows()
            toast.success('Timesheet saved.')
        } catch (error) {
            setActionError(extractErrorMessage(error, 'Failed to save the timesheet.'))
        } finally {
            setIsWorking(false)
        }
    }, [invalidRows.length, saveRows, selectedStatuses])

    const canApprove = selectedIds.length > 0
        && selectedRows.every(row => row.status === TimesheetEntryStatus.SUBMITTED)
    const canSubmitOnBehalf = selectedIds.length > 0
        && selectedRows.every(row => row.status === TimesheetEntryStatus.DRAFT)
    const canReopen = selectedIds.length > 0
        && selectedRows.every(row => row.status === TimesheetEntryStatus.APPROVED)

    return (
        <div className={styles.view}>
            <section className={styles.rangeSection}>
                <InputSelect
                    classNameWrapper={classNames(styles.dateFilterWrapper, styles.selectFilter)}
                    dirty
                    label='Status'
                    name='timesheet-admin-status-filter'
                    onChange={function onStatusChange(event: ChangeEvent<HTMLInputElement>) {
                        setStatusFilter(event.target.value as StatusFilter)
                        setSelectedDates([])
                        setPartialResult(undefined)
                    }}
                    options={STATUS_FILTER_OPTIONS}
                    placeholder='Select status'
                    value={statusFilter}
                />

                {isApprovedView && (
                    <>
                        <InputDatePicker
                            className={styles.dateFilter}
                            classNameWrapper={styles.dateFilterWrapper}
                            date={toPickerDate(filterFromDate)}
                            disabled={false}
                            isClearable
                            label='From Date'
                            onChange={function onFilterFromDateChange(date: Date | null) {
                                setFilterFromDate(date ? toWorkDateString(date) : '')
                            }}
                        />
                        <InputDatePicker
                            className={styles.dateFilter}
                            classNameWrapper={styles.dateFilterWrapper}
                            date={toPickerDate(filterToDate)}
                            disabled={false}
                            isClearable
                            label='To Date'
                            onChange={function onFilterToDateChange(date: Date | null) {
                                setFilterToDate(date ? toWorkDateString(date) : '')
                            }}
                        />
                    </>
                )}

                <Button
                    className={styles.leftAuto}
                    disabled={isWorking}
                    label='Add entries'
                    onClick={function onOpenAddEntries() {
                        setActionError(undefined)
                        setIsAddEntriesOpen(true)
                    }}
                    primary
                />
            </section>

            {rangeError && <p className={styles.error} role='alert'>{rangeError}</p>}

            <TimesheetGrid
                canEditApproved
                emptyMessage='This assignee has no timesheet entries yet.'
                isRowSelectable={selectAnyRow}
                onRowChange={handleRowChange}
                onSelectionChange={setSelectedDates}
                rows={filteredRows}
                selectedDates={selectedDates}
                standardHoursPerDay={props.timesheet.assignment.standardHoursPerDay}
            />

            {actionError && <p className={styles.error} role='alert'>{actionError}</p>}
            {partialResult && (
                <p className={styles.partialResult} role='status'>{partialResult}</p>
            )}

            <section className={styles.adminActions}>
                {hasPendingRowChanges && (
                    <Button
                        disabled={isWorking}
                        label='Save'
                        onClick={handleSaveDrafts}
                        secondary
                    />
                )}
                {canSubmitOnBehalf && (
                    <Button
                        disabled={isWorking}
                        label={`Submit on behalf (${selectedIds.length})`}
                        onClick={function onSubmitOnBehalf() {
                            setPendingOverride('submit')
                        }}
                        secondary
                    />
                )}
                {canApprove && (
                    <Button
                        disabled={isWorking}
                        label={`Approve on behalf (${selectedIds.length})`}
                        onClick={function onApproveOnBehalf() {
                            setIsApproveOpen(true)
                        }}
                        primary
                    />
                )}
                {canReopen && (
                    <Button
                        disabled={isWorking}
                        label={`Reopen (${selectedIds.length})`}
                        onClick={function onReopen() {
                            setPendingOverride('reopen')
                        }}
                        secondary
                    />
                )}
                {selectedRows.length === 1 && selectedRows[0].id && (
                    <Button
                        label='Audit history'
                        onClick={function onViewAudit() {
                            setAuditEntry(selectedRows[0])
                        }}
                        secondary
                    />
                )}
            </section>

            {selectedRows.length > 0 && (
                <section className={styles.summary}>
                    <span>
                        Total Selected Days:
                        {' '}
                        <strong>{totals.days}</strong>
                    </span>
                    <span>
                        Total Selected Hours:
                        {' '}
                        <strong>{formatHoursLabel(totals.hours)}</strong>
                    </span>
                </section>
            )}

            <TimesheetApproveModal
                entryCount={selectedIds.length}
                isApproving={isWorking}
                onCancel={function onCancelApprove() {
                    setIsApproveOpen(false)
                }}
                onConfirm={handleApprove}
                open={isApproveOpen}
                requiresOverrideReason
                totalHours={totals.hours}
            />

            <TimesheetReasonModal
                confirmLabel={pendingOverride ? OVERRIDE_COPY[pendingOverride].confirmLabel : 'Confirm'}
                description={pendingOverride ? OVERRIDE_COPY[pendingOverride].description : ''}
                isSubmitting={isWorking}
                onCancel={function onCancelOverride() {
                    setPendingOverride(undefined)
                }}
                onConfirm={runOverride}
                open={Boolean(pendingOverride)}
                title={pendingOverride ? OVERRIDE_COPY[pendingOverride].title : 'Override'}
            />

            <TimesheetAuditModal
                assignmentId={props.timesheet.assignment.id}
                engagementId={props.timesheet.engagementId}
                entryId={auditEntry?.id}
                entryLabel={auditEntry?.displayDate}
                onClose={function onCloseAudit() {
                    setAuditEntry(undefined)
                }}
                open={Boolean(auditEntry)}
            />

            <BaseModal
                buttons={(
                    <>
                        <Button
                            disabled={isWorking}
                            label='Cancel'
                            onClick={function onCancelAddEntries() {
                                setIsAddEntriesOpen(false)
                            }}
                            secondary
                        />
                        <Button
                            disabled={isWorking || !fromDate || !toDate || Boolean(addRangeError)}
                            label='Confirm'
                            onClick={function onConfirmAddEntries() {
                                if (handleAddRange()) {
                                    setIsAddEntriesOpen(false)
                                }
                            }}
                            primary
                        />
                    </>
                )}
                onClose={function onCloseAddEntriesModal() {
                    setIsAddEntriesOpen(false)
                }}
                open={isAddEntriesOpen}
                size='md'
                title='Add entries'
            >
                <section className={styles.rangeSection}>
                    <InputDatePicker
                        className={styles.dateFilter}
                        classNameWrapper={styles.dateFilterWrapper}
                        date={toPickerDate(fromDate)}
                        disabled={isWorking}
                        isClearable
                        label='From Date'
                        onChange={function onFromDateChange(date: Date | null) {
                            setFromDate(date ? toWorkDateString(date) : '')
                        }}
                    />
                    <InputDatePicker
                        className={styles.dateFilter}
                        classNameWrapper={styles.dateFilterWrapper}
                        date={toPickerDate(toDate)}
                        disabled={isWorking}
                        isClearable
                        label='To Date'
                        onChange={function onToDateChange(date: Date | null) {
                            setToDate(date ? toWorkDateString(date) : '')
                        }}
                    />
                </section>
                {addRangeError && <p className={styles.error}>{addRangeError}</p>}
            </BaseModal>
        </div>
    )
}

export default AdminTimesheetView
