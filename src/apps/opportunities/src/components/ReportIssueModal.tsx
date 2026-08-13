/* eslint-disable react/jsx-no-bind */
import { FC, useState } from 'react'
import { toast } from 'react-toastify'

import { createSupportTicket } from '~/apps/support/src/lib/services/support.service'
import { SupportMarkdownEditor } from '~/apps/support/src/lib/components/SupportMarkdownEditor'
import { BaseModal, Button, IconOutline } from '~/libs/ui'

import styles from './ReportIssueModal.module.scss'

interface ReportIssueModalProps {
    challengeId?: string
    onClose: () => void
    open: boolean
}

/**
 * Renders the Figma Report an Issue flow backed by support-api-v6. Subject,
 * category, and separate file fields are intentionally omitted; the Markdown
 * editor owns drag/drop and paste uploads.
 *
 * @param props optional challenge context and modal state.
 * @returns Markdown-only support ticket form and success confirmation.
 * @throws Does not throw; request errors remain visible inside the modal.
 */
export const ReportIssueModal: FC<ReportIssueModalProps> = props => {
    const [description, setDescription] = useState('')
    const [error, setError] = useState<string | undefined>()
    const [busy, setBusy] = useState(false)
    const [created, setCreated] = useState(false)
    const contextId = `opportunity-${props.challengeId ?? 'general'}`

    /** Clears local state and closes the dialog. */
    const close = (): void => {
        if (busy) return
        setDescription('')
        setError(undefined)
        setCreated(false)
        props.onClose()
    }

    /** Creates a challenge-scoped support ticket. */
    const submit = async (): Promise<void> => {
        const normalized = description.trim()
        if (!normalized) {
            setError('Enter a description of the issue.')
            return
        }

        setBusy(true)
        setError(undefined)
        try {
            await createSupportTicket({
                ...(props.challengeId ? { challengeId: props.challengeId } : {}),
                description: normalized,
            })
            setCreated(true)
            toast.success('Your issue was sent to the Platform Team.')
        } catch (requestError) {
            const message = requestError instanceof Error ? requestError.message : 'The issue could not be submitted.'
            setError(message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <BaseModal
            buttons={created ? (
                <Button label='Done' onClick={close} primary size='lg' />
            ) : (
                <>
                    <Button disabled={busy} label='Cancel' onClick={close} secondary size='lg' />
                    <Button
                        disabled={busy}
                        label={busy ? 'Sending…' : 'Submit issue'}
                        loading={busy}
                        onClick={submit}
                        primary
                        size='lg'
                    />
                </>
            )}
            center
            onClose={close}
            open={props.open}
            size='body'
            title='Report an Issue'
        >
            {created ? (
                <div className={styles.success}>
                    <IconOutline.CheckCircleIcon />
                    <h3>Thank you for reporting this issue.</h3>
                    <p>The Platform Team will follow up through your support ticket.</p>
                </div>
            ) : (
                <div className={styles.form}>
                    <p>Describe what happened and include the steps needed to reproduce it.</p>
                    <SupportMarkdownEditor
                        contextId={contextId}
                        disabled={busy}
                        error={error}
                        label='Description'
                        onChange={value => {
                            setDescription(value)
                            if (value.trim()) setError(undefined)
                        }}
                        uploadCategory='support-ticket'
                        value={description}
                    />
                </div>
            )}
        </BaseModal>
    )
}
