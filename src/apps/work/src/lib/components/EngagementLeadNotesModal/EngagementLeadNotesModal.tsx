import {
    ChangeEvent,
    FC,
    useCallback,
    useState,
} from 'react'

import { EngagementLead, EngagementLeadStatus } from '../../models/EngagementLead.model'
import { updateEngagementLeadNotes } from '../../services/engagement-leads.service'
import { extractErrorMessage, showErrorToast, showSuccessToast } from '../../utils'
import { formatLeadDate } from '../../utils/engagement-leads.utils'
import { ConfirmationModal } from '../ConfirmationModal'

import styles from './EngagementLeadNotesModal.module.scss'

const NOTES_MAX_LENGTH = 5000

export interface EngagementLeadNotesModalProps {
    lead: EngagementLead
    onClose: () => void
    onSaved: (lead: EngagementLead) => void
}

export const EngagementLeadNotesModal: FC<EngagementLeadNotesModalProps> = (
    props: EngagementLeadNotesModalProps,
) => {
    const lead = props.lead
    const onSaved = props.onSaved
    // Notes are frozen once the lead becomes an engagement, so they still record what led to it.
    const readOnly = lead.status === EngagementLeadStatus.CONVERTED

    const [notes, setNotes] = useState<string>(lead.notes || '')
    const [saving, setSaving] = useState<boolean>(false)

    const handleNotesChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>): void => {
        setNotes(event.target.value)
    }, [])

    const handleSave = useCallback(async (): Promise<void> => {
        setSaving(true)

        try {
            const updated = await updateEngagementLeadNotes(lead.id, notes)
            showSuccessToast('Lead notes saved.')
            onSaved(updated)
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to save lead notes.'))
        } finally {
            setSaving(false)
        }
    }, [lead.id, notes, onSaved])

    const handleConfirm = useCallback((): void => {
        if (readOnly) {
            props.onClose()
            return
        }

        handleSave()
            .catch(() => undefined)
    }, [handleSave, props, readOnly])

    return (
        <ConfirmationModal
            confirmDisabled={!readOnly && (saving || notes === (lead.notes || ''))}
            confirmText={readOnly ? 'Close' : 'Save'}
            message={readOnly
                ? 'This lead has been converted, so its notes can no longer be edited.'
                : `Add notes for lead ${lead.id}.`}
            onCancel={props.onClose}
            onConfirm={handleConfirm}
            showCancelButton={!readOnly}
            title='Notes'
        >
            <textarea
                aria-label='Notes'
                className={styles.textarea}
                disabled={saving}
                maxLength={NOTES_MAX_LENGTH}
                placeholder={readOnly ? 'No notes were added.' : 'Enter notes'}
                readOnly={readOnly}
                value={notes}
                onChange={handleNotesChange}
            />
            {lead.notesUpdatedAt && (
                <p className={styles.meta}>
                    {`Last updated ${formatLeadDate(lead.notesUpdatedAt)}`}
                    {lead.notesUpdatedBy ? ` by ${lead.notesUpdatedBy}` : ''}
                </p>
            )}
        </ConfirmationModal>
    )
}

export default EngagementLeadNotesModal
