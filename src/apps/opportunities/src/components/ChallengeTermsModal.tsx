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
import {
    BaseModal,
    Button,
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'

import { ChallengeTerm } from '../models'
import {
    getChallengeSubmitterTermsDetails,
    getChallengeTermDocuSignUrl,
    getChallengeTermsDetails,
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
    /**
     * Loads the terms appropriate to the active modal mode.
     *
     * Registration resolves only Submitter terms; passive viewing resolves the exact selected terms.
     *
     * @returns a promise containing hydrated Challenge API term details.
     * @throws propagates Challenge API failures to SWR for the modal error state.
     */
    const loadTerms = (): Promise<ChallengeTerm[]> => (props.mode === 'register'
        ? getChallengeSubmitterTermsDetails(props.terms)
        : getChallengeTermsDetails(props.terms))
    const response: SWRResponse<ChallengeTerm[], Error> = useSWR(
        shouldLoad ? ['opportunities:challenge-terms', props.mode, termKey] : undefined,
        loadTerms,
        { revalidateOnFocus: false },
    )
    const terms = response.data ?? (shouldLoad ? [] : props.terms)
    const externalAgreement = terms.some(requiresExternalAgreement)
    const registrationMode = props.mode === 'register'
    const compactRegistration = registrationMode
        && !response.error
        && !response.isValidating
        && terms.length === 0
    const hydratingRegistration = registrationMode
        && shouldLoad
        && !response.error
        && (response.isValidating || response.data === undefined)
    const fullTitle = terms[0]?.title || props.terms[0]?.title || 'Challenge Terms'

    useEffect(() => {
        if (props.open) {
            setAccepted(false)
            setExternalError('')
        }
    }, [props.open, props.mode])

    /**
     * Sanitizes Terms API HTML while removing document-authored inline CSS.
     *
     * The API can return Word-exported markup whose inline typography and
     * spacing override the Opportunities design system. Semantic elements and
     * safe links remain available for the modal's scoped styles to format.
     *
     * @param text Terms API HTML to sanitize.
     * @returns safe semantic HTML without inline style attributes.
     * @throws Does not throw.
     */
    const sanitizedText = (text: string): string => String(DOMPurify.sanitize(text, {
        FORBID_ATTR: ['style'],
    }))

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
            <Button
                disabled={props.busy}
                className={styles.modalAction}
                customRadius
                label={compactRegistration ? 'Cancel' : 'I disagree'}
                noCaps
                onClick={props.onClose}
                secondary
                size='lg'
            />
            <Button
                disabled={(compactRegistration && !accepted)
                    || props.busy
                    || response.isValidating
                    || !!response.error
                    || externalAgreement}
                className={styles.modalAction}
                customRadius
                label={props.busy ? 'Registering…' : compactRegistration ? 'Register' : 'I agree'}
                loading={props.busy}
                noCaps
                onClick={accept}
                primary
                size='lg'
            />
        </>
    ) : (
        <Button
            className={styles.modalAction}
            customRadius
            disabled={props.busy}
            label='Close'
            noCaps
            onClick={props.onClose}
            primary
            size='lg'
        />
    )

    // react-responsive-modal keeps closing content mounted for its exit
    // animation. Unmounting here prevents unresolved or fallback terms from
    // replacing the resolved registration reminder during that interval.
    if (!props.open || hydratingRegistration) return <></>

    return (
        <BaseModal
            buttons={buttons}
            center
            classNames={{
                modal: compactRegistration ? styles.compactModal : styles.termsModal,
            }}
            onClose={props.onClose}
            open
            size={compactRegistration ? 'md' : 'body'}
            spacer={false}
            title={compactRegistration ? 'Important Reminder' : fullTitle}
        >
            <div className={styles.body}>
                {compactRegistration ? (
                    <>
                        <p>In accordance with the Terms &amp; Conditions and Code of Conduct you agree:</p>
                        <ul>
                            <li>
                                To keep private any downloaded data (including code)
                                <ul><li>Except sharing a submission as directed or authorized by Topcoder</li></ul>
                            </li>
                            <li>To delete such data after completion of the challenge or project</li>
                        </ul>
                    </>
                ) : (
                    <p>
                        {registrationMode
                            ? 'You are seeing these Terms and Conditions because you have registered to a challenge '
                                + 'and you have to respect the terms below in order to be able to submit.'
                            : 'These terms govern participation in this competition.'}
                    </p>
                )}
                {!compactRegistration && response.isValidating && !response.data && (
                    <div className={styles.loading} role='status'>
                        <LoadingSpinner />
                        <span>Loading challenge terms…</span>
                    </div>
                )}
                {!compactRegistration && response.error && (
                    <div className={styles.error} role='alert'>
                        <span>We couldn&apos;t load the full challenge terms.</span>
                        <button onClick={() => response.mutate()} type='button'>Try again</button>
                    </div>
                )}
                {!compactRegistration && !response.error && !response.isValidating && terms.length === 0 && (
                    <p>No additional challenge-specific terms are listed.</p>
                )}
                {!compactRegistration && terms.length > 0 && (
                    <div className={styles.terms}>
                        {terms.map((term: ChallengeTerm, index: number) => (
                            <article
                                className={styles.term}
                                key={term.id ?? term.url ?? term.title ?? `term-${index}`}
                            >
                                {(terms.length > 1 || index > 0) && (
                                    <h3>{term.title || `Challenge term ${index + 1}`}</h3>
                                )}
                                {term.text && (
                                    <div dangerouslySetInnerHTML={{ __html: sanitizedText(term.text) }} />
                                )}
                                {getSafeCmsLink(term.url) && (
                                    <a href={getSafeCmsLink(term.url)} rel='noreferrer' target='_blank'>
                                        Open this term in a new window
                                        <IconOutline.ExternalLinkIcon aria-hidden='true' />
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
                    </div>
                )}
                {!compactRegistration && registrationMode && externalAgreement && (
                    <div className={styles.error} role='alert'>
                        Complete each external agreement before registering.
                    </div>
                )}
                {!compactRegistration && externalError && (
                    <div className={styles.error} role='alert'>{externalError}</div>
                )}
                {compactRegistration && (
                    <label>
                        <input
                            checked={accepted}
                            onChange={event => setAccepted(event.target.checked)}
                            type='checkbox'
                        />
                        <span>I agree</span>
                    </label>
                )}
            </div>
        </BaseModal>
    )
}
