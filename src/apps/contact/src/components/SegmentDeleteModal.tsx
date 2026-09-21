import { FC, useRef, useState } from 'react'

import { Button } from '~/libs/ui/lib/components/button'
import { BaseModal } from '~/libs/ui/lib/components/modals/base-modal'

import { Segment } from '../contact.models'
import { contactDelete, contactError } from '../contact.service'

import styles from './SegmentManager.module.scss'

interface Props {
    segment: Segment
    onClose: () => void
    onDeleted: (id: string) => Promise<void>
}

/**
 * Requires a separate confirmation before deleting a saved segment definition.
 * @param props selected saved segment, cancellation callback, and confirmed-deletion callback.
 * @returns an accessible confirmation dialog; no member records or campaign criteria are deleted.
 * @throws API failures appear inside the dialog and leave the segment available for retry.
 */
export const SegmentDeleteModal: FC<Props> = props => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const headingRef = useRef<HTMLHeadingElement>(null)

    /** Cancel an idle confirmation; takes no inputs, returns void and does not delete anything. */
    function close(): void {
        if (!busy) props.onClose()
    }

    /**
     * Deletes the selected definition once the administrator explicitly confirms.
     * @returns completion after the delete and table notification, or after displaying a failure.
     * @throws Does not throw; failed requests keep the confirmation open.
     */
    async function remove(): Promise<void> {
        if (busy) return
        setBusy(true)
        setError('')
        try {
            await contactDelete(`segments/${encodeURIComponent(props.segment.id)}`)
            await props.onDeleted(props.segment.id)
        } catch (failure) {
            setError(contactError(failure))
        } finally {
            setBusy(false)
        }
    }

    return (
        <BaseModal
            open
            size='sm'
            title={<h3 ref={headingRef} tabIndex={-1} id='contact-segment-delete-title'>Delete segment</h3>}
            ariaLabelledby='contact-segment-delete-title'
            ariaDescribedby='contact-segment-delete-description'
            initialFocusRef={headingRef}
            closeOnEsc={!busy}
            closeOnOverlayClick={!busy}
            showCloseIcon={!busy}
            bodyClassName={styles.modalBody}
            onClose={close}
        >
            <p id='contact-segment-delete-description'>
                Delete
                {' '}
                <strong>{props.segment.name}</strong>
                ? This removes the saved segment.
                Member records and criteria already saved in campaigns remain available.
            </p>
            {error && <p className={styles.error} role='alert'>{error}</p>}
            <div className={styles.footer}>
                <Button secondary size='lg' label='Cancel' disabled={busy} onClick={close} />
                <Button
                    primary
                    variant='danger'
                    size='lg'
                    label={busy ? 'Deleting…' : 'Delete segment'}
                    disabled={busy}
                    onClick={remove}
                />
            </div>
        </BaseModal>
    )
}
