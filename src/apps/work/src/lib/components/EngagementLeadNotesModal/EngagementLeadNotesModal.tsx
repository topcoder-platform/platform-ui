import {
    ChangeEvent,
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'

import { EngagementLead, EngagementLeadStatus } from '../../models/EngagementLead.model'
import { addEngagementLeadNote } from '../../services/engagement-leads.service'
import { extractErrorMessage, showErrorToast, showSuccessToast } from '../../utils'
import { formatLeadDateTime } from '../../utils/engagement-leads.utils'
import { ConfirmationModal } from '../ConfirmationModal'

import styles from './EngagementLeadNotesModal.module.scss'

const NOTES_MAX_LENGTH = 5000

export interface EngagementLeadNotesModalProps {
    lead: EngagementLead
    onClose: () => void
    onSaved: (lead: EngagementLead) => void
}

/**
 * Lists a lead's notes, oldest first, and adds new ones. Notes are read-only once added, so the list
 * keeps a record of who said what and when.
 */
export const EngagementLeadNotesModal: FC<EngagementLeadNotesModalProps> = (
    props: EngagementLeadNotesModalProps,
) => {
    const lead = props.lead
    const onSaved = props.onSaved
    // Nothing can be added once the lead becomes an engagement, so the notes still record what led to it.
    const readOnly = lead.status === EngagementLeadStatus.CONVERTED

    const [newNote, setNewNote] = useState<string>('')
    const [saving, setSaving] = useState<boolean>(false)

    // The API already sends them oldest first; sorting again keeps the order if that ever changes.
    const notes = useMemo(
        () => [...(lead.notes ?? [])].sort((a, b) => (
            Date.parse(a.createdAt) - Date.parse(b.createdAt)
        )),
        [lead.notes],
    )

    const handleNoteChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>): void => {
        setNewNote(event.target.value)
    }, [])

    const handleSave = useCallback(async (): Promise<void> => {
        setSaving(true)

        try {
            const updated = await addEngagementLeadNote(lead.id, newNote.trim())
            showSuccessToast('Lead note added.')
            onSaved(updated)
        } catch (err: unknown) {
            showErrorToast(extractErrorMessage(err, 'Unable to add the lead note.'))
        } finally {
            setSaving(false)
        }
    }, [lead.id, newNote, onSaved])

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
            confirmDisabled={!readOnly && (saving || !newNote.trim())}
            confirmText={readOnly ? 'Close' : 'Add Note'}
            message={readOnly
                ? 'This lead has been converted, so no more notes can be added.'
                : `Notes for lead ${lead.id}.`}
            onCancel={props.onClose}
            onConfirm={handleConfirm}
            showCancelButton={!readOnly}
            title='Notes'
        >
            {notes.length
                ? (
                    <ul aria-label='Existing notes' className={styles.list}>
                        {notes.map(note => (
                            <li className={styles.note} key={note.id}>
                                <p className={styles.meta}>
                                    {formatLeadDateTime(note.createdAt)}
                                    {note.createdBy ? ` by ${note.createdBy}` : ''}
                                </p>
                                <p className={styles.content}>{note.content}</p>
                            </li>
                        ))}
                    </ul>
                )
                : <p className={styles.empty}>No notes were added.</p>}

            {!readOnly && (
                <textarea
                    aria-label='New note'
                    className={styles.textarea}
                    disabled={saving}
                    maxLength={NOTES_MAX_LENGTH}
                    placeholder='Enter a new note'
                    value={newNote}
                    onChange={handleNoteChange}
                />
            )}
        </ConfirmationModal>
    )
}

export default EngagementLeadNotesModal
