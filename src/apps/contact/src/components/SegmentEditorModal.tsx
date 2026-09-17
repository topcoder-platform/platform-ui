/* Form callbacks capture the current segment draft. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
import { FC, FormEvent, useRef, useState } from 'react'

import { Button } from '~/libs/ui/lib/components/button'
import { BaseModal } from '~/libs/ui/lib/components/modals/base-modal'

import { Segment, SegmentFilter } from '../contact.models'
import { contactError, contactPatch, contactPost } from '../contact.service'

import { SegmentFields } from './SegmentFields'
import styles from './SegmentManager.module.scss'

interface Props {
    segment?: Segment
    onClose: () => void
    onSaved: (segment: Segment, message: string) => Promise<void>
}

/**
 * Edits a local segment draft in the shared accessible modal without mutating the table's saved filter.
 * @param props optional segment to edit, close callback, and successful-save notification/refresh callback.
 * @returns a focused name field and reusable member criteria; cancel discards pending changes.
 * @throws API/validation failures are displayed while preserving the draft for retry.
 */
export const SegmentEditorModal: FC<Props> = props => {
    const [name, setName] = useState(props.segment?.name || '')
    const [filter, setFilter] = useState<SegmentFilter>(props.segment?.filter || {})
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const nameRef = useRef<HTMLInputElement>(null)

    /** Close an idle editor; takes no inputs and returns void without interrupting a write. */
    function close(): void {
        if (!busy) props.onClose()
    }

    /**
     * Creates or updates only the segment name and criteria, then reports the confirmed save.
     * @param event form submission, prevented to retain the SPA route.
     * @returns completion after the API response and library notification.
     * @throws Does not throw; validation and API failures preserve all entered values.
     */
    async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()
        if (busy) return
        setError('')
        if (!name.trim()) {
            setError('Enter a segment name.')
            nameRef.current?.focus()
            return
        }

        setBusy(true)
        try {
            const body = { filter, name: name.trim() }
            const segment = props.segment
                ? await contactPatch<Segment>(`segments/${encodeURIComponent(props.segment.id)}`, body)
                : await contactPost<Segment>('segments', body)
            await props.onSaved(segment, props.segment ? 'Segment updated.' : 'Segment created.')
        } catch (failure) {
            setError(contactError(failure))
        } finally {
            setBusy(false)
        }
    }

    return (
        <BaseModal
            open
            size='lg'
            title={<h3 id='contact-segment-editor-title'>{props.segment ? 'Edit segment' : 'Add segment'}</h3>}
            ariaLabelledby='contact-segment-editor-title'
            initialFocusRef={nameRef}
            closeOnEsc={!busy}
            closeOnOverlayClick={!busy}
            showCloseIcon={!busy}
            bodyClassName={styles.modalBody}
            onClose={close}
        >
            <form onSubmit={save} aria-busy={busy}>
                {error && <p className={styles.error} role='alert'>{error}</p>}
                <label className={styles.nameField}>
                    Segment name
                    <input ref={nameRef} value={name} disabled={busy} onChange={event => setName(event.target.value)} />
                </label>
                <SegmentFields value={filter} onChange={setFilter} disabled={busy} />
                <div className={styles.footer}>
                    <Button secondary size='lg' label='Cancel' disabled={busy} onClick={close} />
                    <Button primary size='lg' type='submit' label={busy ? 'Saving…' : 'Save segment'} disabled={busy} />
                </div>
            </form>
        </BaseModal>
    )
}
