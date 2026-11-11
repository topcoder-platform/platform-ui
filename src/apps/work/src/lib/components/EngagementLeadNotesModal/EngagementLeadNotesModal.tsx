import {
    ChangeEvent,
    FC,
    useCallback,
    useMemo,
    useState,
} from 'react'

import { EngagementLead } from '../../models/EngagementLead.model'
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

    // Notes can be added whatever the lead's status, including lost and completed leads.
    const handleConfirm = useCallback((): void => {
        handleSave()
            .catch(() => undefined)
    }, [handleSave])

    return (
        <ConfirmationModal
            confirmDisabled={saving || !newNote.trim()}
            confirmText='Add Note'
            message={`Notes for lead ${lead.id}.`}
            onCancel={props.onClose}
            onConfirm={handleConfirm}
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

            <textarea
                aria-label='New note'
                className={styles.textarea}
                disabled={saving}
                maxLength={NOTES_MAX_LENGTH}
                placeholder='Enter a new note'
                value={newNote}
                onChange={handleNoteChange}
            />
        </ConfirmationModal>
    )
}

export default EngagementLeadNotesModal
