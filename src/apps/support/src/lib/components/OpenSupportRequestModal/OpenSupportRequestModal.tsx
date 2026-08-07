/* eslint-disable react/jsx-no-bind */
/** Member form for opening a support request. */
import {
    ChangeEvent,
    FC,
    useState,
} from 'react'

import { BaseModal, Button } from '~/libs/ui'

import { SupportTicketDetail } from '../../models'
import { createSupportTicket } from '../../services'
import { getSupportErrorMessage } from '../../utils'
import { SupportMarkdownEditor } from '../SupportMarkdownEditor'

import styles from './OpenSupportRequestModal.module.scss'

export interface OpenSupportRequestModalProps {
    onClose: () => void
    onCreated: (ticket: SupportTicketDetail) => void
    open: boolean
}

/**
 * Creates a non-authoritative upload grouping ID for attachments added before ticket creation.
 *
 * @returns unique draft upload context.
 * @throws Does not throw.
 */
function createUploadContext(): string {
    return `draft-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`
}

/**
 * Renders and validates the member-only Open support request modal.
 *
 * @param props open state and close/success callbacks.
 * @returns support request modal.
 * @throws Does not throw; API errors stay visible without clearing form data.
 */
export const OpenSupportRequestModal: FC<OpenSupportRequestModalProps> = props => {
    const [challengeId, setChallengeId] = useState('')
    const [description, setDescription] = useState('')
    const [descriptionError, setDescriptionError] = useState<string | undefined>()
    const [requestError, setRequestError] = useState<string | undefined>()
    const [submitting, setSubmitting] = useState(false)
    const [uploadContext, setUploadContext] = useState(createUploadContext)

    /**
     * Clears local form and error state for the next modal session.
     *
     * @returns void.
     * @throws Does not throw.
     */
    const reset = (): void => {
        setChallengeId('')
        setDescription('')
        setDescriptionError(undefined)
        setRequestError(undefined)
        setUploadContext(createUploadContext())
    }

    /**
     * Closes and resets the modal unless a create request is active.
     *
     * @returns void.
     * @throws Does not throw.
     */
    const handleClose = (): void => {
        if (!submitting) {
            reset()
            props.onClose()
        }
    }

    /**
     * Updates Markdown state and clears its required-field error.
     *
     * @param value current editor Markdown.
     * @returns void.
     * @throws Does not throw.
     */
    const handleDescriptionChange = (value: string): void => {
        setDescription(value)
        if (value.trim()) setDescriptionError(undefined)
    }

    /**
     * Copies the optional challenge identifier from its text input.
     *
     * @param event challenge input change event.
     * @returns void.
     * @throws Does not throw.
     */
    const handleChallengeChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setChallengeId(event.target.value)
    }

    /**
     * Validates and submits a new ticket while retaining data on failure.
     *
     * @returns a promise resolved after validation or the create request settles.
     * @throws Does not throw; request failures are stored for display.
     */
    const handleSubmit = async (): Promise<void> => {
        const normalizedDescription = description.trim()
        if (!normalizedDescription) {
            setDescriptionError('Enter a description of the support request.')
            return
        }

        setSubmitting(true)
        setRequestError(undefined)
        try {
            const normalizedChallengeId = challengeId.trim()
            const ticket = await createSupportTicket({
                ...(normalizedChallengeId ? { challengeId: normalizedChallengeId } : {}),
                description: normalizedDescription,
            })
            reset()
            props.onCreated(ticket)
        } catch (error) {
            setRequestError(getSupportErrorMessage(error, 'The support request could not be opened.'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <BaseModal
            center
            onClose={handleClose}
            open={props.open}
            size='lg'
            title='Open support request'
            buttons={(
                <>
                    <Button disabled={submitting} label='Cancel' onClick={handleClose} secondary size='lg' />
                    <Button
                        disabled={submitting}
                        label={submitting ? 'Opening…' : 'Open support request'}
                        loading={submitting}
                        onClick={handleSubmit}
                        primary
                        size='lg'
                    />
                </>
            )}
        >
            <div className={styles.form}>
                <label htmlFor='support-challenge-id'>
                    Challenge ID
                    <span>Optional</span>
                </label>
                <input
                    disabled={submitting}
                    id='support-challenge-id'
                    maxLength={64}
                    onChange={handleChallengeChange}
                    placeholder='Associated challenge ID'
                    type='text'
                    value={challengeId}
                />
                <SupportMarkdownEditor
                    contextId={uploadContext}
                    disabled={submitting}
                    error={descriptionError}
                    key={uploadContext}
                    label='Description'
                    onChange={handleDescriptionChange}
                    uploadCategory='support-ticket'
                    value={description}
                />
                {requestError && <p className={styles.requestError} role='alert'>{requestError}</p>}
            </div>
        </BaseModal>
    )
}
