import { FC } from 'react'

import { FormReport } from '../../lib/services/forms.service'

import FormCell, { CLASSIFICATION_COLUMN, NEEDS_REVIEW_COLUMN } from './FormCell'
import styles from './FormsPage.module.scss'

const hiddenColumns = new Set([
    'source_page', 'form_version', 'leadsource', 'source__c',
    'lead_source_for_campaign__c', 'primary_campaign__c', 'insta_page_name__c',
    // Shown inside the classification badge.
    NEEDS_REVIEW_COLUMN,
])
const inquiryColumn = 'briefly_describe_your_inquiry'
const labels: Record<string, string> = {
    member_id: 'Member ID',
    submission_id: 'Submission ID',
    submitted_at: 'Submitted at (UTC)',
    utm_campaign__c: 'UTM campaign',
    utm_medium__c: 'UTM medium',
    utm_source__c: 'UTM source',
}

/**
 * Displays contact submissions in API order with compact details above the full-width inquiry.
 * @param props Report page with published field labels, typed answers, and submission metadata.
 * @returns Responsive, labelled submissions without repetitive campaign fields; CSV data is unchanged.
 * @throws Does not throw for API JSON reports.
 */
const LetsTalkSubmissions: FC<{ report: FormReport }> = (props: { report: FormReport }) => {
    const report = props.report
    const columns = report.columns.filter(column => !hiddenColumns.has(column)
        && column !== inquiryColumn && column !== CLASSIFICATION_COLUMN)
    // The AI label leads each card, so triage starts from it.
    if (report.columns.includes(CLASSIFICATION_COLUMN)) columns.unshift(CLASSIFICATION_COLUMN)
    if (report.columns.includes(inquiryColumn)) columns.push(inquiryColumn)

    return (
        <section className={styles.submissions} aria-label='Form submissions'>
            {report.data.map(row => (
                <article className={styles.submission} key={String(row.submission_id)}>
                    <dl className={styles.details}>
                        {columns.map(column => (
                            <div key={column} className={column === inquiryColumn ? styles.inquiry : undefined}>
                                <dt>{labels[column] || report.labels[column] || column.replace(/_/g, ' ')}</dt>
                                <dd><FormCell column={column} row={row} /></dd>
                            </div>
                        ))}
                    </dl>
                </article>
            ))}
        </section>
    )
}

export default LetsTalkSubmissions
