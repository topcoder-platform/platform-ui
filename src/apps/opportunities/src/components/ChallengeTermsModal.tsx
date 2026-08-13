/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useEffect,
    useMemo,
    useState,
} from 'react'
import DOMPurify from 'dompurify'
import useSWR, { SWRResponse } from 'swr'

import { getSafeCmsLink } from '~/libs/cms'
import { BaseModal, Button, LoadingSpinner } from '~/libs/ui'

import { ChallengeTerm } from '../models'
import {
    getChallengeSubmitterTermsDetails,
    getChallengeTermDocuSignUrl,
} from '../services'

import styles from './ChallengeTermsModal.module.scss'

export type ChallengeTermsMode = 'register' | 'view'

interface ChallengeTermsModalProps {
    busy?: boolean
    mode: ChallengeTermsMode
    onAccept: (terms: ChallengeTerm[]) => void
    onClose: () => void
    open: boolean
    terms: ChallengeTerm[]
}

/**
 * Checks whether an outstanding term explicitly requires a flow other than
 * the Terms API's electronic `/agree` endpoint.
 *
 * @param term complete Terms API record.
 * @returns true for an unaccepted non-electronic agreement.
 * @throws Does not throw.
 */
export function requiresExternalAgreement(term: ChallengeTerm): boolean {
    return !term.agreed
        && (!!term.docusignTemplateId
            || (!!term.agreeabilityType
                && term.agreeabilityType.toLowerCase() !== 'electronically-agreeable'))
}

/**
 * Renders full Terms API content for either passive review or challenge
 * registration. View mode never exposes an agreement or registration action;
 * registration mode requires acknowledgement and blocks external agreements.
 *
 * @param props term references, modal mode, submit state, and callbacks.
 * @returns Figma-aligned terms dialog with retryable detail loading.
 * @throws Does not throw; Terms API failures render a retry action.
 */
export const ChallengeTermsModal: FC<ChallengeTermsModalProps> = props => {
    const [accepted, setAccepted] = useState(false)
    const [externalBusy, setExternalBusy] = useState(false)
    const [externalError, setExternalError] = useState('')
    const termKey = useMemo(
        () => props.terms.map(term => term.id ?? term.url ?? term.title ?? 'term')
            .join('|'),
        [props.terms],
    )
    const shouldLoad = props.open && props.terms.some(term => !!term.id)
    const response: SWRResponse<ChallengeTerm[], Error> = useSWR(
        shouldLoad ? ['opportunities:challenge-terms', termKey] : undefined,
        () => getChallengeSubmitterTermsDetails(props.terms),
        { revalidateOnFocus: false },
    )
    const terms = response.data ?? (shouldLoad ? [] : props.terms)
    const externalAgreement = terms.some(requiresExternalAgreement)
    const registrationMode = props.mode === 'register'

    useEffect(() => {
        if (props.open) {
            setAccepted(false)
            setExternalError('')
        }
    }, [props.open, props.mode])

    /** Sanitizes trusted-format Terms API HTML before inserting it. */
    const sanitizedText = (text: string): string => String(DOMPurify.sanitize(text))

    /** Submits the exact resolved term records displayed to the member. */
    const accept = (): void => props.onAccept(terms)

    /** Opens the Terms API's authenticated DocuSign recipient flow. */
    const startDocuSign = async (term: ChallengeTerm): Promise<void> => {
        if (!term.docusignTemplateId) return
        setExternalBusy(true)
        setExternalError('')
        try {
            const url = await getChallengeTermDocuSignUrl(term.docusignTemplateId, window.location.href)
            window.location.assign(url)
        } catch (error) {
            setExternalError(error instanceof Error
                ? error.message
                : 'The external agreement could not be opened.')
            setExternalBusy(false)
        }
    }

    const buttons = registrationMode ? (
        <>
            <Button disabled={props.busy} label='Cancel' onClick={props.onClose} secondary size='lg' />
            <Button
                disabled={!accepted || props.busy || response.isValidating || !!response.error || externalAgreement}
                label={props.busy ? 'Registering…' : 'Agree & register'}
                loading={props.busy}
                onClick={accept}
                primary
                size='lg'
            />
        </>
    ) : (
        <Button disabled={props.busy} label='Close' onClick={props.onClose} primary size='lg' />
    )

    return (
        <BaseModal
            buttons={buttons}
            center
            onClose={props.onClose}
            open={props.open}
            size='lg'
            title='Challenge terms'
        >
            <div className={styles.body}>
                <p>
                    {registrationMode
                        ? 'Review the terms below before joining this competition.'
                        : 'These terms govern participation in this competition.'}
                </p>
                {response.isValidating && !response.data && (
                    <div className={styles.loading} role='status'>
                        <LoadingSpinner />
                        <span>Loading challenge terms…</span>
                    </div>
                )}
                {response.error && (
                    <div className={styles.error} role='alert'>
                        <span>We couldn&apos;t load the full challenge terms.</span>
                        <button onClick={() => response.mutate()} type='button'>Try again</button>
                    </div>
                )}
                {!response.error && !response.isValidating && terms.length === 0 && (
                    <p>No additional challenge-specific terms are listed.</p>
                )}
                {terms.map((term: ChallengeTerm, index: number) => (
                    <article className={styles.term} key={term.id ?? term.url ?? term.title ?? `term-${index}`}>
                        <h3>{term.title || `Challenge term ${index + 1}`}</h3>
                        {term.text && (
                            <div dangerouslySetInnerHTML={{ __html: sanitizedText(term.text) }} />
                        )}
                        {getSafeCmsLink(term.url) && (
                            <a
                                href={getSafeCmsLink(term.url)}
                                rel='noreferrer'
                                target='_blank'
                            >
                                Open this term in a new window
                            </a>
                        )}
                        {registrationMode && requiresExternalAgreement(term) && term.docusignTemplateId && (
                            <button
                                className={styles.externalButton}
                                disabled={externalBusy}
                                onClick={() => startDocuSign(term)}
                                type='button'
                            >
                                {externalBusy ? 'Opening DocuSign…' : 'Complete with DocuSign'}
                            </button>
                        )}
                        {term.agreed && <small>You have already accepted this term.</small>}
                    </article>
                ))}
                {registrationMode && externalAgreement && (
                    <div className={styles.error} role='alert'>
                        Complete each external agreement before registering.
                    </div>
                )}
                {externalError && <div className={styles.error} role='alert'>{externalError}</div>}
                {registrationMode && (
                    <label>
                        <input
                            checked={accepted}
                            onChange={event => setAccepted(event.target.checked)}
                            type='checkbox'
                        />
                        <span>
                            In accordance with the Terms &amp; Conditions and Code of Conduct, I agree to participate.
                        </span>
                    </label>
                )}
            </div>
        </BaseModal>
    )
}
