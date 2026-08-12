/* eslint-disable react/jsx-no-bind */
/** Member form for opening a support request. */
import {
    FC,
    useMemo,
    useState,
} from 'react'
import Select, { SingleValue } from 'react-select'
import useSWR, { SWRResponse } from 'swr'

import {
    ProfileContextData,
    useProfileContext,
} from '~/libs/core'
import { BaseModal, Button } from '~/libs/ui'

import {
    SupportChallenge,
    SupportTicketDetail,
} from '../../models'
import {
    createSupportTicket,
    getActiveMemberChallenges,
} from '../../services'
import { getSupportErrorMessage } from '../../utils'
import { SupportMarkdownEditor } from '../SupportMarkdownEditor'

import styles from './OpenSupportRequestModal.module.scss'

export interface OpenSupportRequestModalProps {
    onClose: () => void
    onCreated: (ticket: SupportTicketDetail) => void
    open: boolean
}

interface ChallengeOption {
    label: string
    value: string
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
    const { profile }: ProfileContextData = useProfileContext()
    const memberId: string | undefined = profile?.userId === undefined ? undefined : String(profile.userId)
    const [challengeId, setChallengeId] = useState('')
    const [description, setDescription] = useState('')
    const [descriptionError, setDescriptionError] = useState<string | undefined>()
    const [requestError, setRequestError] = useState<string | undefined>()
    const [submitting, setSubmitting] = useState(false)
    const [uploadContext, setUploadContext] = useState(createUploadContext)
    const challengeRequestKey: string | undefined = props.open && memberId
        ? `support-active-challenges:${memberId}`
        : undefined
    const {
        data: challenges = [],
        error: challengeError,
        isValidating: challengesLoading,
    }: SWRResponse<SupportChallenge[], Error> = useSWR<SupportChallenge[]>(
        challengeRequestKey,
        () => getActiveMemberChallenges(memberId as string),
        { revalidateOnFocus: false, shouldRetryOnError: false },
    )
    const challengeOptions = useMemo<ChallengeOption[]>(() => challenges.map(challenge => ({
        label: challenge.name,
        value: challenge.id,
    })), [challenges])
    const selectedChallenge = useMemo<ChallengeOption | undefined>(
        () => challengeOptions.find(option => option.value === challengeId),
        [challengeId, challengeOptions],
    )

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
     * Copies the optional challenge identifier from the resource-scoped picker.
     *
     * @param option selected active challenge, or null when the selection is cleared.
     * @returns void.
     * @throws Does not throw.
     */
    const handleChallengeChange = (option: SingleValue<ChallengeOption>): void => {
        setChallengeId(option?.value || '')
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
            // Resolve from the current option list so a profile/cache refresh
            // cannot submit an ID that is no longer visible in the picker.
            const normalizedChallengeId = selectedChallenge?.value.trim() || ''
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
            size='body'
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
                <div className={styles.challengeField}>
                    <label htmlFor='support-challenge-id'>Active Challenge (if applicable)</label>
                    <Select<ChallengeOption, false>
                        aria-describedby={challengeError ? 'support-challenge-error' : undefined}
                        className={styles.challengeSelect}
                        classNamePrefix='support-challenge-select'
                        inputId='support-challenge-id'
                        instanceId='support-challenge'
                        isClearable
                        isDisabled={submitting || challengesLoading || !memberId}
                        isLoading={challengesLoading}
                        menuPlacement='auto'
                        menuPortalTarget={typeof document === 'undefined' ? undefined : document.body}
                        menuPosition='fixed'
                        noOptionsMessage={() => (
                            challengeError ? 'Challenges could not be loaded' : 'No active challenges found'
                        )}
                        onChange={handleChallengeChange}
                        options={challengeOptions}
                        placeholder='Select challenge'
                        value={selectedChallenge}
                    />
                    {challengeError && (
                        <p className={styles.challengeError} id='support-challenge-error' role='status'>
                            Active challenges could not be loaded. You can still open a request without one.
                        </p>
                    )}
                </div>
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
