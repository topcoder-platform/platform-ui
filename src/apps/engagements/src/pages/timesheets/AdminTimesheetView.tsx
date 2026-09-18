import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import { Button } from '~/libs/ui'

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
    formatHoursLabel,
    hasEnteredHours,
    sumSelectedTotals,
    validateHours,
} from '../../lib/utils'
import { EngagementManagers } from '../../components/engagement-managers'
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

/**
 * The administrator's view: everything a member or manager can do, on anyone's timesheet, plus reopen
 * and correct.
 *
 * Every action that overrides someone else's work collects a reason first, because the API requires
 * one and because an override with no recorded reason is exactly what the audit trail exists to
 * prevent. Actions taken for someone else are labelled as such.
 */
const AdminTimesheetView: FC<AdminTimesheetViewProps> = (props: AdminTimesheetViewProps) => {
    const [rows, setRows] = useState<TimesheetRow[]>([])
    const [selectedDates, setSelectedDates] = useState<string[]>([])
    const [pendingOverride, setPendingOverride] = useState<PendingOverride | undefined>()
    const [isApproveOpen, setIsApproveOpen] = useState<boolean>(false)
    const [auditEntry, setAuditEntry] = useState<TimesheetRow | undefined>()
    const [isWorking, setIsWorking] = useState<boolean>(false)
    const [actionError, setActionError] = useState<string | undefined>()
    const [partialResult, setPartialResult] = useState<string | undefined>()

    useEffect(() => {
        setRows(buildRowsFromEntries(props.timesheet.entries))
        setSelectedDates([])
    }, [props.timesheet.entries])

    const selectedRows = useMemo(
        () => rows.filter(row => selectedDates.includes(row.workDate)),
        [rows, selectedDates],
    )
    const totals = useMemo(() => sumSelectedTotals(selectedRows), [selectedRows])
    const invalidRows = useMemo(
        () => rows.filter(row => Boolean(
            validateHours(row.hoursWorked, props.timesheet.assignment.standardHoursPerDay).error,
        )),
        [props.timesheet.assignment.standardHoursPerDay, rows],
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

    const reload = useCallback(async (): Promise<void> => {
        const loaded = await getTimesheet(
            props.timesheet.engagementId,
            props.timesheet.assignment.id,
        )
        props.onTimesheetChange(loaded)
    }, [props])

    const handleRowChange = useCallback((workDate: string, changes: Partial<TimesheetRow>) => {
        setRows(current => current.map(row => (
            row.workDate === workDate ? { ...row, ...changes } : row
        )))
        setActionError(undefined)
    }, [])

    /**
     * Saves the edited rows. An approved row being changed is an override, so the API needs a reason -
     * which is why the caller passes one through from the reason dialog.
     */
    const saveRows = useCallback(async (overrideReason?: string): Promise<void> => {
        const entries = rows
            .filter(hasEnteredHours)
            .filter(row => !validateHours(
                row.hoursWorked,
                props.timesheet.assignment.standardHoursPerDay,
            ).error)
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
    }, [props, rows])

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
                const updated = await submitTimesheetEntries(
                    props.timesheet.engagementId,
                    props.timesheet.assignment.id,
                    { entryIds: selectedIds, overrideReason },
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
    }, [pendingOverride, props, saveRows, selectedIds])

    const handleApprove = useCallback(async (
        approvalComment: string,
        overrideReason?: string,
    ) => {
        setActionError(undefined)
        setPartialResult(undefined)
        setIsWorking(true)

        try {
            const result = await approveTimesheetEntries(
                props.timesheet.engagementId,
                props.timesheet.assignment.id,
                { approvalComment, entryIds: selectedIds, overrideReason },
            )

            setIsApproveOpen(false)
            setSelectedDates([])

            if (result.skipped.length) {
                setPartialResult(
                    `${result.approved.length} of ${selectedIds.length} approved. `
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
    }, [props, reload, selectedIds])

    const handleSaveDrafts = useCallback(async () => {
        if (invalidRows.length) {
            setActionError('Fix the highlighted hours before saving.')
            return
        }

        // Touching an approved row is an override, so route it through the reason dialog instead.
        if (selectedStatuses.has(TimesheetEntryStatus.APPROVED)
            || rows.some(row => row.status === TimesheetEntryStatus.APPROVED)) {
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
    }, [invalidRows.length, rows, saveRows, selectedStatuses])

    const canApprove = selectedIds.length > 0
        && selectedRows.every(row => row.status === TimesheetEntryStatus.SUBMITTED)
    const canSubmitOnBehalf = selectedIds.length > 0
        && selectedRows.every(row => row.status === TimesheetEntryStatus.DRAFT)
    const canReopen = selectedIds.length > 0
        && selectedRows.every(row => row.status === TimesheetEntryStatus.APPROVED)

    return (
        <div className={styles.view}>
            <EngagementManagers
                canEdit
                engagementId={props.timesheet.engagementId}
                managers={props.timesheet.managers}
                onChange={function onManagersChange() {
                    reload()
                        .catch(() => undefined)
                }}
            />

            <TimesheetGrid
                canEditApproved
                emptyMessage='This assignee has no timesheet entries yet.'
                isRowSelectable={selectAnyRow}
                onRowChange={handleRowChange}
                onSelectionChange={setSelectedDates}
                rows={rows}
                selectedDates={selectedDates}
                standardHoursPerDay={props.timesheet.assignment.standardHoursPerDay}
            />

            {actionError && <p className={styles.error} role='alert'>{actionError}</p>}
            {partialResult && (
                <p className={styles.partialResult} role='status'>{partialResult}</p>
            )}

            <section className={styles.adminActions}>
                <Button
                    disabled={isWorking}
                    label='Save'
                    onClick={handleSaveDrafts}
                    secondary
                />
                <Button
                    disabled={isWorking || !canSubmitOnBehalf}
                    label={`Submit on behalf (${canSubmitOnBehalf ? selectedIds.length : 0})`}
                    onClick={function onSubmitOnBehalf() {
                        setPendingOverride('submit')
                    }}
                    secondary
                />
                <Button
                    disabled={isWorking || !canApprove}
                    label={`Approve on behalf (${canApprove ? selectedIds.length : 0})`}
                    onClick={function onApproveOnBehalf() {
                        setIsApproveOpen(true)
                    }}
                    primary
                />
                <Button
                    disabled={isWorking || !canReopen}
                    label={`Reopen (${canReopen ? selectedIds.length : 0})`}
                    onClick={function onReopen() {
                        setPendingOverride('reopen')
                    }}
                    secondary
                />
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
        </div>
    )
}

export default AdminTimesheetView
