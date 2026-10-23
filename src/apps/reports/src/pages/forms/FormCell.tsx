import { FC, useState } from 'react'

import { formatFormValue } from '../../lib/services/forms.service'

import styles from './FormsPage.module.scss'

/** Report columns that forms-api adds for AI-classified forms (forms-processor-v6 ADR 0001). */
export const CLASSIFICATION_COLUMN = 'classification'
/** Shown inside the classification badge, so it gets no cell of its own. */
export const NEEDS_REVIEW_COLUMN = 'classification_needs_review'
const CONFIDENCE_COLUMN = 'classification_confidence'
const RUN_ID_COLUMN = 'classification_run_id'

/** Display names of the default tc-ai-api classes; an unlisted label is shown as-is. */
export const CLASSIFICATION_NAMES: Record<string, string> = {
    COMMUNITY_GENERAL: 'Community · General',
    COMMUNITY_OPPORTUNITY: 'Community · Opportunity',
    COMMUNITY_SKILLS: 'Community · Skills',
    COMMUNITY_SUPPORT: 'Community · Support',
    JUNK: 'Junk',
    SALES_LEAD: 'Sales lead',
    UNKNOWN: 'Unknown',
    WIPRO_QUERIES: 'Wipro queries',
}

/**
 * Coloured label of a submission's AI classification, with a visible review marker.
 * @param props Raw label and whether the classifier asked for a human check.
 * @returns A badge; unknown labels render neutrally with their raw value. @throws Does not throw.
 */
export const ClassificationBadge: FC<{ label: string, needsReview: boolean }> = (
    props: { label: string, needsReview: boolean },
) => (
    <span className={styles.classification}>
        <span
            className={styles.badge}
            data-label={props.label in CLASSIFICATION_NAMES ? props.label : 'OTHER'}
        >
            {CLASSIFICATION_NAMES[props.label] ?? props.label}
        </span>
        {props.needsReview && <span className={styles.review}>Needs review</span>}
    </span>
)

/**
 * The AI run id, shortened, with a button copying the full id.
 * @param props Full workflow run UUID. @returns Compact id with copy action. @throws Does not throw.
 */
const RunId: FC<{ id: string }> = (props: { id: string }) => {
    const [copied, setCopied] = useState(false)

    /**
     * Copies the full id; failures (no clipboard permission) leave the visible id to select by hand.
     * @returns Completion after the clipboard write. @throws Does not throw.
     */
    async function copy(): Promise<void> {
        try {
            await navigator.clipboard.writeText(props.id)
            setCopied(true)
        } catch {
            setCopied(false)
        }
    }

    return (
        <span className={styles.runId}>
            <code title={props.id}>{`${props.id.slice(0, 8)}…`}</code>
            {/* eslint-disable-next-line react/jsx-no-bind */}
            <button type='button' className={styles.copy} onClick={copy} aria-label={`Copy AI run id ${props.id}`}>
                {copied ? 'Copied' : 'Copy'}
            </button>
        </span>
    )
}

/**
 * Renders one report cell, giving the AI classification columns their own presentation.
 * @param props Column key and its row. @returns Cell content as text or components; never HTML from data.
 * @throws Does not throw for API JSON reports.
 */
const FormCell: FC<{ column: string, row: Record<string, unknown> }> = (
    props: { column: string, row: Record<string, unknown> },
) => {
    const value = props.row[props.column]
    if (props.column === CLASSIFICATION_COLUMN && typeof value === 'string') {
        return <ClassificationBadge label={value} needsReview={props.row[NEEDS_REVIEW_COLUMN] === true} />
    }

    if (props.column === CONFIDENCE_COLUMN && value !== null && value !== undefined && value !== '') {
        const confidence = Number(value)
        if (Number.isFinite(confidence)) return <>{`${Math.round(confidence * 100)}%`}</>
    }

    if (props.column === RUN_ID_COLUMN && typeof value === 'string' && value) {
        return <RunId id={value} />
    }

    return <>{formatFormValue(value)}</>
}

export default FormCell
