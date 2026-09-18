import { FC } from 'react'

import { BaseModal, Button } from '~/libs/ui'

import { formatHoursLabel } from '../../lib/utils'

import styles from './TimesheetSubmitModal.module.scss'

interface TimesheetSubmitModalProps {
    open: boolean
    /** Number of entries about to be submitted. */
    entryCount: number
    /** Exact decimal total, e.g. `42.50`. */
    totalHours: string
    isSubmitting?: boolean
    onCancel: () => void
    onConfirm: () => void
}

/**
 * Confirmation before submitting. States the count and the total so the member is confirming a
 * specific claim about their week rather than clicking through a generic "are you sure".
 */
const TimesheetSubmitModal: FC<TimesheetSubmitModalProps> = (props: TimesheetSubmitModalProps) => (
    <BaseModal
        buttons={(
            <>
                <Button
                    disabled={props.isSubmitting}
                    label='Cancel'
                    onClick={props.onCancel}
                    secondary
                />
                <Button
                    disabled={props.isSubmitting}
                    label={props.isSubmitting ? 'Submitting...' : 'Submit'}
                    onClick={props.onConfirm}
                    primary
                />
            </>
        )}
        onClose={props.onCancel}
        open={props.open}
        size='md'
        title='Submit timesheet entries'
    >
        <p className={styles.body}>
            {`You are about to submit ${props.entryCount} timesheet `}
            {props.entryCount === 1 ? 'entry' : 'entries'}
            {` totaling ${formatHoursLabel(props.totalHours)} hours. `}
            Once submitted, these entries will be sent to the engagement manager for approval.
            Do you want to continue?
        </p>
    </BaseModal>
)

export default TimesheetSubmitModal
