/* Native DOM controls do not depend on stable callback identity. */
/* eslint-disable react/jsx-no-bind */
import { FC, useEffect, useState } from 'react'

import { PageTitle } from '~/libs/ui'

import {
    downloadFormSubmissions,
    fetchFormSubmissions,
    fetchReportForms,
    formatFormValue,
    FormDates,
    FormReport,
    ReportForm,
} from '../../lib/services/forms.service'
import { downloadBlobFile } from '../../lib/services/reports.service'

import styles from './FormsPage.module.scss'

interface Selection extends FormDates {
    key: string
    cursors: (string | undefined)[]
}

/**
 * Displays private form submissions with date filtering, cursor pagination, and complete CSV exports.
 * @returns Reports portal content. No props; access is restricted by the administrator route.
 * @throws Does not throw intentionally; API failures are shown inline with a retry action.
 */
const FormsPage: FC = () => {
    const [forms, setForms] = useState<ReportForm[]>([])
    const [selection, setSelection] = useState<Selection>({ cursors: [undefined], key: '' })
    const [report, setReport] = useState<FormReport>()
    const [loadingForms, setLoadingForms] = useState(true)
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [directoryError, setDirectoryError] = useState('')
    const [reportError, setReportError] = useState('')
    const [exportError, setExportError] = useState('')
    const [retry, setRetry] = useState(0)
    const invalidRange = !!(selection.startDate && selection.endDate && selection.startDate > selection.endDate)
    const page = selection.cursors.length

    useEffect(() => {
        let active = true
        setLoadingForms(true)
        setDirectoryError('')
        fetchReportForms()
            .then(result => { if (active) setForms(result) })
            .catch(() => { if (active) setDirectoryError('Unable to load forms. Check your access or retry.') })
            .finally(() => { if (active) setLoadingForms(false) })
        return () => { active = false }
    }, [retry])

    useEffect(() => {
        let active = true
        setReport(undefined)
        setReportError('')
        if (!selection.key || invalidRange) {
            setLoading(false)
            return () => { active = false }
        }

        setLoading(true)
        fetchFormSubmissions(selection.key, selection, selection.cursors[selection.cursors.length - 1])
            .then(result => { if (active) setReport(result) })
            .catch(() => { if (active) setReportError('Unable to load submissions. Check your access or retry.') })
            .finally(() => { if (active) setLoading(false) })
        return () => { active = false }
    }, [selection, invalidRange, retry])

    /**
     * Applies a form/date selection and returns pagination to the first page.
     * @param changes Changed selector values. @returns Nothing. @throws Does not throw.
     */
    function updateSelection(changes: Partial<Selection>): void {
        setReport(undefined)
        setExportError('')
        setSelection(current => ({ ...current, ...changes, cursors: [undefined] }))
    }

    /**
     * Saves all selected-form submissions or all rows in the current date range as CSV.
     * @param filtered Whether to include the date inputs. @returns Completion after browser download.
     * @throws Does not throw; download errors are displayed inline.
     */
    async function exportCsv(filtered: boolean): Promise<void> {
        setExporting(true)
        setExportError('')
        try {
            const blob = await downloadFormSubmissions(selection.key, filtered ? selection : {})
            downloadBlobFile(blob, `${selection.key}${filtered ? '-filtered' : '-all'}.csv`)
        } catch {
            setExportError('Unable to export submissions. Please try again.')
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className={styles.page}>
            <PageTitle>Forms</PageTitle>
            <h2>Forms</h2>
            <p>View submissions from all published form versions. Dates include the entire day in UTC.</p>
            {directoryError && <p role='alert'>{directoryError}</p>}
            {loadingForms && <p role='status'>Loading forms…</p>}
            {!loadingForms && !directoryError && forms.length === 0 && <p>No published forms are available.</p>}
            <div className={styles.filters}>
                <label htmlFor='report-form'>
                    Form
                    <select
                        id='report-form'
                        value={selection.key}
                        disabled={loadingForms || exporting}
                        onChange={event => updateSelection({ key: event.target.value })}
                    >
                        <option value=''>Select a form</option>
                        {forms.map(form => (
                            <option key={form.key} value={form.key}>{`${form.title} (${form.key})`}</option>
                        ))}
                    </select>
                </label>
                <label htmlFor='forms-start'>
                    Start date (UTC)
                    <input
                        id='forms-start'
                        type='date'
                        value={selection.startDate || ''}
                        disabled={exporting}
                        onChange={event => updateSelection({ startDate: event.target.value })}
                    />
                </label>
                <label htmlFor='forms-end'>
                    End date (UTC)
                    <input
                        id='forms-end'
                        type='date'
                        value={selection.endDate || ''}
                        disabled={exporting}
                        onChange={event => updateSelection({ endDate: event.target.value })}
                    />
                </label>
                <button
                    type='button'
                    disabled={exporting}
                    onClick={() => updateSelection({ endDate: '', startDate: '' })}
                >
                    Clear dates
                </button>
            </div>
            {invalidRange && <p role='alert'>Start date must be on or before end date.</p>}
            <div className={styles.actions}>
                <button type='button' disabled={!selection.key || exporting} onClick={() => exportCsv(false)}>
                    Export all CSV
                </button>
                <button
                    type='button'
                    disabled={!selection.key || exporting || invalidRange}
                    onClick={() => exportCsv(true)}
                >
                    Export filtered CSV
                </button>
                {exporting && <span role='status'>Preparing CSV…</span>}
            </div>
            {exportError && <p role='alert'>{exportError}</p>}
            {reportError && <p role='alert'>{reportError}</p>}
            {(directoryError || reportError) && (
                <button type='button' onClick={() => setRetry(current => current + 1)}>Retry</button>
            )}
            {loading && <p role='status'>Loading submissions…</p>}
            {!selection.key && <p>Select a form to view submissions.</p>}
            {report && !loading && (
                <>
                    <p role='status'>{`${report.total} submissions · Page ${page}`}</p>
                    {report.data.length === 0 ? <p>No submissions match these dates.</p> : (
                        // Keyboard users must be able to scroll to offscreen columns.
                        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                        <div className={styles.tableScroll} tabIndex={0} role='region' aria-label='Form submissions'>
                            <table>
                                <thead>
                                    <tr>
                                        {report.columns.map(column => (
                                            <th key={column} scope='col'>
                                                {report.labels[column] || column.replace(/_/g, ' ')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.data.map(row => (
                                        <tr key={String(row.submission_id)}>
                                            {report.columns.map(column => (
                                                <td key={column}>{formatFormValue(row[column])}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <nav className={styles.actions} aria-label='Submission pages'>
                        <button
                            type='button'
                            disabled={page === 1}
                            onClick={() => setSelection(current => ({
                                ...current, cursors: current.cursors.slice(0, -1),
                            }))}
                        >
                            Previous
                        </button>
                        <button
                            type='button'
                            disabled={!report.nextCursor}
                            onClick={() => setSelection(current => ({
                                ...current, cursors: [...current.cursors, report.nextCursor || undefined],
                            }))}
                        >
                            Next
                        </button>
                    </nav>
                </>
            )}
        </div>
    )
}

export default FormsPage
