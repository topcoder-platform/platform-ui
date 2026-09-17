/* eslint-disable react/jsx-no-bind */
import {
    FC,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import type { FullConfiguration } from 'swr/dist/types'
import DOMPurify from 'dompurify'
import useSWR, {
    SWRResponse,
    useSWRConfig,
} from 'swr'

import { EnvironmentConfig } from '~/config'
import { getSafeCmsLink } from '~/libs/cms'
import {
    BaseModal,
    Button,
    IconOutline,
    LoadingSpinner,
} from '~/libs/ui'

import { ChallengeTerm } from '../models'
import {
    agreeToChallengeTerms,
    getChallengeSubmitterTermsDetails,
    getChallengeTermDocuSignUrl,
    getChallengeTermsDetails,
} from '../services'

import styles from './ChallengeTermsModal.module.scss'

export type ChallengeTermsMode = 'register' | 'view'

// One immediate read followed by bounded backoff. Confirmation has a separate
// 91-second wall-clock deadline so slow requests and throttled browser timers
// cannot extend the registration gate indefinitely.
const DOCUSIGN_POLL_RETRY_DELAYS_MS = [2000, 3000, 5000, 8000, 13000, 20000, 20000, 19000]
const DOCUSIGN_CONFIRMATION_TIMEOUT_MS = 91_000
const DOCUSIGN_STATUS_REQUEST_TIMEOUT_MS = 10_000
const NDA_TITLE_PATTERN = /\bnda\b|non[-\s]?disclosure/i

interface ChallengeTermsModalProps {
    busy?: boolean
    memberId?: number | string
    mode: ChallengeTermsMode
    onClose: () => void
    onComplete: () => Promise<void> | void
    open: boolean
    terms: ChallengeTerm[]
}

/**
 * Resolves the DocuSign template backing a challenge term.
 *
 * Terms API metadata takes precedence. The configured template is a legacy
 * compatibility fallback for NDA records whose current API detail contains
 * placeholder electronic-agreement content but no template identifier.
 *
 * @param term complete Terms API record.
 * @param configuredTemplateId environment-specific default NDA template.
 * @returns the API template, configured NDA fallback, or undefined.
 * @throws Does not throw.
 */
export function resolveChallengeTermDocuSignTemplateId(
    term: ChallengeTerm,
    configuredTemplateId: string | undefined = EnvironmentConfig.NDA_DOCUSIGN_TEMPLATE_ID,
): string | number | undefined {
    const apiTemplateId = typeof term.docusignTemplateId === 'string'
        ? term.docusignTemplateId.trim()
        : term.docusignTemplateId
    if (apiTemplateId) return apiTemplateId

    const fallbackTemplateId = configuredTemplateId?.trim()
    return fallbackTemplateId && NDA_TITLE_PATTERN.test(term.title ?? '')
        ? fallbackTemplateId
        : undefined
}

/**
 * Builds the legacy iframe callback URL used by the Terms service.
 *
 * @returns the community-app endpoint that posts the DocuSign event to its parent frame.
 * @throws Does not throw.
 */
function buildDocuSignReturnUrl(): string {
    const communityAppUrl = EnvironmentConfig.COMMUNITY_APP_URL?.replace(/\/$/, '')
        || window.location.origin
    return `${communityAppUrl}/community-app-assets/iframe-break`
}

/**
 * Delays a DocuSign agreement-status retry without blocking the browser and
 * clears the timer when the owning confirmation is cancelled.
 *
 * @param durationMs delay in milliseconds.
 * @param signal signal that cancels the pending delay.
 * @returns promise resolving true after the delay or false after cancellation.
 * @throws Does not throw.
 */
function delay(durationMs: number, signal: AbortSignal): Promise<boolean> {
    if (signal.aborted) return Promise.resolve(false)

    return new Promise(resolve => {
        let settled = false
        let timeout = 0
        const onAbort = (): void => {
            if (settled) return
            settled = true
            window.clearTimeout(timeout)
            resolve(false)
        }

        timeout = window.setTimeout(() => {
            if (settled) return
            settled = true
            signal.removeEventListener('abort', onAbort)
            resolve(true)
        }, durationMs)
        signal.addEventListener('abort', onAbort, { once: true })
    })
}

/**
 * Rejects an in-flight status read as soon as its confirmation signal aborts,
 * even if a mocked or non-Axios request fails to observe the signal itself.
 *
 * @param request status request to settle.
 * @param signal signal bounding the owning confirmation interaction.
 * @returns the request result when it settles before cancellation.
 * @throws AbortError after cancellation, or the original request failure.
 */
function awaitWithAbort<T>(request: Promise<T>, signal: AbortSignal): Promise<T> {
    if (signal.aborted) {
        return Promise.reject(new DOMException('DocuSign confirmation cancelled.', 'AbortError'))
    }

    return new Promise((resolve, reject) => {
        let settled = false
        const onAbort = (): void => {
            if (settled) return
            settled = true
            reject(new DOMException('DocuSign confirmation cancelled.', 'AbortError'))
        }

        signal.addEventListener('abort', onAbort, { once: true })
        request.then(
            value => {
                if (settled) return
                settled = true
                signal.removeEventListener('abort', onAbort)
                resolve(value)
            },
            error => {
                if (settled) return
                settled = true
                signal.removeEventListener('abort', onAbort)
                reject(error)
            },
        )
    })
}

/**
 * Identifies status-read failures that are safe to retry. Network failures and
 * timeout/rate-limit/server responses can clear while DocuSign confirmation is
 * propagating; authorization and other client errors should surface immediately.
 *
 * @param error failure returned by the authenticated Terms status read.
 * @returns true when another read may succeed without changing user state.
 * @throws Does not throw.
 */
function isTransientDocuSignStatusError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return true
    const candidate = error as {
        response?: { status?: unknown }
        status?: unknown
    }
    const rawStatus = candidate.status ?? candidate.response?.status
    if (rawStatus === undefined || rawStatus === null) return true
    const status = Number(rawStatus)
    if (!Number.isFinite(status) || status === 0) return true
    return status === 408 || status === 425 || status === 429 || status >= 500
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
        && (!!resolveChallengeTermDocuSignTemplateId(term)
            || (!!term.agreeabilityType
                && term.agreeabilityType.toLowerCase() !== 'electronically-agreeable'))
}

/**
 * Renders full Terms API content for either passive review or challenge
 * registration. View mode never exposes an agreement or registration action;
 * registration mode persists one explicit agreement at a time and does not
 * complete registration until the final outstanding term has been accepted.
 *
 * @param props term references, modal mode, submit state, and callbacks.
 * @returns Figma-aligned terms dialog with retryable detail loading.
 * @throws Does not throw; Terms API failures render a retry action.
 */
export const ChallengeTermsModal: FC<ChallengeTermsModalProps> = props => {
    const [accepted, setAccepted] = useState(false)
    const [completedTermIds, setCompletedTermIds] = useState<string[]>([])
    const [agreementBusy, setAgreementBusy] = useState(false)
    const [agreementError, setAgreementError] = useState('')
    const [docuSignCompleting, setDocuSignCompleting] = useState(false)
    const [docuSignLoading, setDocuSignLoading] = useState(false)
    const [docuSignRetry, setDocuSignRetry] = useState(0)
    const [docuSignView, setDocuSignView] = useState<{ key: string; url: string }>()
    const [externalError, setExternalError] = useState('')
    const agreementRequestRef = useRef(0)
    const activeAgreementRequestRef = useRef<number>()
    const closeRef = useRef<() => void>(() => undefined)
    const docuSignCallbackHandledRef = useRef(false)
    const docuSignCompletionRef = useRef<() => Promise<void>>(async () => undefined)
    const docuSignConfirmationControllerRef = useRef<AbortController>()
    const docuSignFrameRef = useRef<HTMLIFrameElement>(null)
    const docuSignUrlRequestRef = useRef(0)
    const interactionRef = useRef(0)
    const { mutate: mutateTermsCache }: FullConfiguration = useSWRConfig()
    const memberScope = props.memberId === undefined ? 'anonymous' : String(props.memberId)
    const termKey = useMemo(
        () => props.terms.map(term => `${term.id ?? term.url ?? term.title ?? 'term'}:${term.roleId ?? ''}`)
            .join('|'),
        [props.terms],
    )
    const shouldLoad = props.open && props.terms.some(term => !!term.id)
    const termsCacheKey = shouldLoad ? [
        'opportunities:challenge-terms',
        props.mode,
        memberScope,
        termKey,
    ] : undefined
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
        termsCacheKey,
        loadTerms,
        { revalidateOnFocus: false },
    )
    const terms = response.data ?? (shouldLoad ? [] : props.terms)
    const registrationMode = props.mode === 'register'
    const pendingTerms = registrationMode
        ? terms.filter(term => !term.id || !completedTermIds.includes(term.id))
        : []
    const activeTerm = pendingTerms[0]
    const displayedTerms = registrationMode
        ? activeTerm ? [activeTerm] : []
        : terms
    const activePosition = completedTermIds.length
    const agreementTotal = completedTermIds.length + pendingTerms.length
    const activeExternalAgreement = !!activeTerm && requiresExternalAgreement(activeTerm)
    const docuSignTerm = registrationMode
        ? activeTerm && resolveChallengeTermDocuSignTemplateId(activeTerm) ? activeTerm : undefined
        : displayedTerms.find(term => !!resolveChallengeTermDocuSignTemplateId(term))
    const docuSignTemplateId = docuSignTerm
        ? resolveChallengeTermDocuSignTemplateId(docuSignTerm)
        : undefined
    const docuSignRequestKey = docuSignTerm && docuSignTemplateId
        ? JSON.stringify([
            props.mode,
            memberScope,
            termKey,
            docuSignTerm.id ?? docuSignTerm.url ?? docuSignTerm.title ?? 'term',
            docuSignTemplateId,
        ])
        : undefined
    const docuSignUrl = docuSignView?.key === docuSignRequestKey
        ? docuSignView?.url
        : undefined
    const docuSignBusy = docuSignLoading || docuSignCompleting
    const compactRegistration = registrationMode
        && !response.error
        && !response.isValidating
        && terms.length === 0
    const hydratingRegistration = registrationMode
        && shouldLoad
        && !response.error
        && (response.isValidating || response.data === undefined)
    const fullTitle = activeTerm?.title || terms[0]?.title || props.terms[0]?.title || 'Challenge Terms'

    useEffect(() => {
        docuSignConfirmationControllerRef.current?.abort()
        docuSignConfirmationControllerRef.current = undefined
        interactionRef.current += 1
        if (props.open) {
            setAccepted(false)
            setCompletedTermIds([])
            setAgreementError('')
            setDocuSignCompleting(false)
            setDocuSignLoading(false)
            setDocuSignRetry(0)
            setDocuSignView(undefined)
            setExternalError('')
            docuSignCallbackHandledRef.current = false
        }

        return () => {
            // Cancel agreement polling, its active HTTP request, and late URL
            // callbacks so they cannot complete an obsolete registration.
            docuSignConfirmationControllerRef.current?.abort()
            docuSignConfirmationControllerRef.current = undefined
            interactionRef.current += 1
        }
    }, [props.open, props.mode, memberScope, termKey])

    useEffect(() => {
        const request = docuSignUrlRequestRef.current + 1
        docuSignUrlRequestRef.current = request
        docuSignCallbackHandledRef.current = false
        setDocuSignView(undefined)
        setDocuSignLoading(false)
        setExternalError('')
        if (!props.open || !docuSignRequestKey || !docuSignTemplateId) return

        const interaction = interactionRef.current
        setDocuSignLoading(true)
        getChallengeTermDocuSignUrl(docuSignTemplateId, buildDocuSignReturnUrl())
            .then(url => {
                if (interaction !== interactionRef.current
                    || request !== docuSignUrlRequestRef.current) return
                setDocuSignView({ key: docuSignRequestKey, url })
            })
            .catch(error => {
                if (interaction !== interactionRef.current
                    || request !== docuSignUrlRequestRef.current) return
                setExternalError(error instanceof Error && error.message.trim()
                    ? error.message
                    : 'We couldn\u2019t load the DocuSign agreement. Please try again.')
            })
            .finally(() => {
                if (interaction === interactionRef.current
                    && request === docuSignUrlRequestRef.current) setDocuSignLoading(false)
            })
    }, [
        docuSignRetry,
        docuSignRequestKey,
        docuSignTemplateId,
        props.open,
    ])

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

    /**
     * Persists the active electronic agreement before advancing to the next
     * Submitter term. Registration begins only after the final agreement has
     * succeeded, matching the legacy challenge prerequisite flow. An ambiguous
     * POST failure is reconciled once against authenticated outstanding terms.
     *
     * @returns promise settled after agreement, advancement, or registration completion.
     * @throws Does not throw; Terms API failures remain visible on the active term.
     */
    const acceptActiveTerm = async (): Promise<void> => {
        if (!activeTerm || activeExternalAgreement || activeAgreementRequestRef.current !== undefined) return
        const termId = activeTerm.id
        if (!termId || !termsCacheKey) {
            setAgreementError('We couldn\u2019t record this agreement because it is missing an identifier.')
            return
        }

        const interaction = interactionRef.current
        const agreementRequest = agreementRequestRef.current + 1
        agreementRequestRef.current = agreementRequest
        activeAgreementRequestRef.current = agreementRequest
        const finalTerm = pendingTerms.length === 1
        setAgreementBusy(true)
        setAgreementError('')
        try {
            try {
                await agreeToChallengeTerms([activeTerm])
            } catch (agreementFailure) {
                if (interaction !== interactionRef.current) return
                let refreshedTerms: ChallengeTerm[] | undefined
                try {
                    refreshedTerms = await getChallengeSubmitterTermsDetails(props.terms)
                } catch {
                    throw agreementFailure
                }

                if (interaction !== interactionRef.current) return
                await mutateTermsCache(termsCacheKey, refreshedTerms, { revalidate: false })
                if (!refreshedTerms || refreshedTerms.some(term => term.id === termId)) {
                    throw agreementFailure
                }
            }

            await mutateTermsCache(
                termsCacheKey,
                (currentTerms: ChallengeTerm[] | undefined) => (currentTerms ?? terms)
                    .filter(term => term.id !== termId),
                { revalidate: false },
            )
            if (interaction !== interactionRef.current) return
            if (!finalTerm) {
                setCompletedTermIds(current => [...current, termId])
            } else {
                await props.onComplete()
            }
        } catch (error) {
            if (interaction !== interactionRef.current) return
            setAgreementError(error instanceof Error && error.message.trim()
                ? error.message
                : 'We couldn\u2019t record your agreement. Please try again.')
        } finally {
            if (activeAgreementRequestRef.current === agreementRequest) {
                activeAgreementRequestRef.current = undefined
                setAgreementBusy(false)
            }
        }
    }

    /** Registers directly only when no outstanding Submitter terms remain. */
    const accept = (): void => {
        if (compactRegistration) {
            props.onComplete()
            return
        }

        acceptActiveTerm()
    }

    /**
     * Invalidates pending agreement callbacks before asking the owner to close
     * the dialog, preventing a just-finished request from registering after cancellation.
     *
     * @returns void after invalidating the active interaction and closing.
     * @throws Does not throw.
     */
    const close = (): void => {
        docuSignConfirmationControllerRef.current?.abort()
        docuSignConfirmationControllerRef.current = undefined
        interactionRef.current += 1
        props.onClose()
    }

    /**
     * Polls authenticated outstanding terms until the signed DocuSign term is
     * absent, accounting for the Terms service's asynchronous persistence.
     *
     * @param termId canonical term identifier signed in the recipient frame.
     * @param interaction modal interaction that owns the callback.
     * @param signal signal bounding all retry delays and status requests.
     * @param deadlineAt absolute time when confirmation must stop.
     * @returns remaining terms, or undefined when the interaction became stale or confirmation timed out.
     * @throws Propagates non-transient Terms API failures; transient failures are retried.
     */
    const pollForDocuSignAgreement = async (
        termId: string,
        interaction: number,
        signal: AbortSignal,
        deadlineAt: number,
    ): Promise<ChallengeTerm[] | undefined> => {
        const attemptCount = DOCUSIGN_POLL_RETRY_DELAYS_MS.length + 1
        for (let attempt = 0; attempt < attemptCount; attempt += 1) {
            if (attempt > 0) {
                // eslint-disable-next-line no-await-in-loop
                const delayCompleted = await delay(
                    Math.min(
                        DOCUSIGN_POLL_RETRY_DELAYS_MS[attempt - 1],
                        Math.max(0, deadlineAt - Date.now()),
                    ),
                    signal,
                )
                if (!delayCompleted || interaction !== interactionRef.current) return undefined
            }

            const remainingMs = deadlineAt - Date.now()
            if (signal.aborted || remainingMs <= 0) return undefined

            let refreshedTerms: ChallengeTerm[] | undefined
            // Sequential polling is required because Terms service persistence is asynchronous.
            try {
                // A unique `nocache` value is required for each authoritative
                // post-signature read; the Terms endpoint otherwise emits an ETag
                // without an explicit no-store policy.
                // eslint-disable-next-line no-await-in-loop
                refreshedTerms = await awaitWithAbort(
                    getChallengeSubmitterTermsDetails(props.terms, {
                        fresh: true,
                        signal,
                        timeoutMs: Math.min(DOCUSIGN_STATUS_REQUEST_TIMEOUT_MS, remainingMs),
                    }),
                    signal,
                )
            } catch (error) {
                if (signal.aborted || interaction !== interactionRef.current) return undefined
                if (!isTransientDocuSignStatusError(error)) throw error
            }

            if (interaction !== interactionRef.current) return undefined
            if (refreshedTerms && !refreshedTerms.some(term => term.id === termId)) return refreshedTerms
        }

        return undefined
    }

    /**
     * Reconciles a trusted DocuSign callback before advancing terms or
     * registering. Passive review refreshes details but never registers.
     *
     * @returns promise settled after refresh, advancement, or a visible confirmation error.
     * @throws Does not throw; errors remain visible inside the active modal.
     */
    const completeDocuSignAgreement = async (): Promise<void> => {
        if (!docuSignTerm || docuSignCompleting) return
        const interaction = interactionRef.current
        const termId = docuSignTerm.id
        const confirmationController = new AbortController()
        const deadlineAt = Date.now() + DOCUSIGN_CONFIRMATION_TIMEOUT_MS
        docuSignConfirmationControllerRef.current?.abort()
        docuSignConfirmationControllerRef.current = confirmationController
        const confirmationTimeout = window.setTimeout(
            () => confirmationController.abort(),
            DOCUSIGN_CONFIRMATION_TIMEOUT_MS,
        )
        setDocuSignCompleting(true)
        setExternalError('')
        try {
            if (!registrationMode) {
                await awaitWithAbort(Promise.resolve(response.mutate()), confirmationController.signal)
                if (interaction === interactionRef.current) close()
                return
            }

            if (!termId || !termsCacheKey) {
                throw new Error('We couldn\u2019t verify this DocuSign agreement because it is missing an identifier.')
            }

            const refreshedTerms = await pollForDocuSignAgreement(
                termId,
                interaction,
                confirmationController.signal,
                deadlineAt,
            )
            if (interaction !== interactionRef.current) return
            if (!refreshedTerms) {
                throw new Error(
                    'We couldn\u2019t confirm your DocuSign agreement within 91 seconds. '
                    + 'Select Check again to retry.',
                )
            }

            const outstandingTermIds = new Set(refreshedTerms
                .map(term => term.id)
                .filter((id): id is string => !!id))
            const confirmedCompletedIds = Array.from(new Set([...completedTermIds, termId]))
                .filter(id => !outstandingTermIds.has(id))
            await mutateTermsCache(termsCacheKey, refreshedTerms, { revalidate: false })
            if (interaction !== interactionRef.current) return
            if (refreshedTerms.length === 0) {
                await props.onComplete()
            } else {
                // A term returned by the server is still outstanding, even if
                // this modal previously recorded it as completed locally.
                setCompletedTermIds(confirmedCompletedIds)
            }
        } catch (error) {
            if (interaction !== interactionRef.current) return
            if (confirmationController.signal.aborted) {
                setExternalError(registrationMode
                    ? 'We couldn\u2019t confirm your DocuSign agreement within 91 seconds. '
                        + 'Select Check again to retry.'
                    : 'We couldn\u2019t refresh this DocuSign agreement within 91 seconds. '
                        + 'Select Check again to retry.')
            } else {
                setExternalError(error instanceof Error && error.message.trim()
                    ? error.message
                    : 'We couldn\u2019t confirm your DocuSign agreement. Please try again.')
            }
        } finally {
            window.clearTimeout(confirmationTimeout)
            if (docuSignConfirmationControllerRef.current === confirmationController) {
                docuSignConfirmationControllerRef.current = undefined
            }

            if (interaction === interactionRef.current) setDocuSignCompleting(false)
        }
    }

    /**
     * Retries either recipient-view creation or post-signature confirmation,
     * depending on which stage produced the visible DocuSign error.
     *
     * @returns void after scheduling the relevant retry.
     * @throws Does not throw.
     */
    const retryDocuSign = (): void => {
        if (docuSignUrl) completeDocuSignAgreement()
        else setDocuSignRetry(current => current + 1)
    }

    closeRef.current = close
    docuSignCompletionRef.current = completeDocuSignAgreement

    useEffect(() => {
        // Subscribe before the recipient iframe is rendered so a fast callback
        // cannot arrive between the iframe commit and this passive effect.
        if (!props.open || !docuSignRequestKey) return undefined
        let trustedOrigin: string
        try {
            trustedOrigin = new URL(buildDocuSignReturnUrl()).origin
        } catch {
            return undefined
        }

        /** Handles only messages sent by the active, same-origin callback frame. */
        const handleDocuSignMessage = (event: MessageEvent): void => {
            const frameWindow = docuSignFrameRef.current?.contentWindow
            if (!frameWindow || event.source !== frameWindow || event.origin !== trustedOrigin) return
            if (!event.data || event.data.type !== 'DocuSign') return

            if (event.data.event === 'signing_complete' || event.data.event === 'viewing_complete') {
                if (docuSignCallbackHandledRef.current) return
                docuSignCallbackHandledRef.current = true
                docuSignCompletionRef.current()
            } else {
                closeRef.current()
            }
        }

        window.addEventListener('message', handleDocuSignMessage)
        return () => window.removeEventListener('message', handleDocuSignMessage)
    }, [docuSignRequestKey, props.open])

    const buttons = registrationMode && activeExternalAgreement ? (
        <Button
            className={styles.modalAction}
            customRadius
            disabled={props.busy || docuSignCompleting}
            label='Close'
            noCaps
            onClick={close}
            primary
            size='lg'
        />
    ) : registrationMode ? (
        <>
            <Button
                disabled={props.busy || agreementBusy}
                className={styles.modalAction}
                customRadius
                label={compactRegistration ? 'Cancel' : 'I disagree'}
                noCaps
                onClick={close}
                secondary
                size='lg'
            />
            <Button
                disabled={(compactRegistration && !accepted)
                    || props.busy
                    || agreementBusy
                    || response.isValidating
                    || !!response.error
                    || (!compactRegistration && (!activeTerm || activeExternalAgreement))}
                className={styles.modalAction}
                customRadius
                label={props.busy
                    ? 'Registering…'
                    : agreementBusy ? 'Agreeing…' : compactRegistration ? 'Register' : 'I agree'}
                loading={props.busy || agreementBusy}
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
            onClick={close}
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
            onClose={close}
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
                {registrationMode && activeTerm && agreementTotal > 1 && (
                    <p aria-live='polite' className={styles.progress}>
                        {`Agreement ${activePosition + 1} of ${agreementTotal}`}
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
                {!compactRegistration && displayedTerms.length > 0 && (
                    <div
                        className={styles.terms}
                        key={registrationMode ? activeTerm?.id : 'view'}
                    >
                        {displayedTerms.map((term: ChallengeTerm, index: number) => {
                            const displayedDocuSignTerm = term === docuSignTerm && !!docuSignTemplateId
                            return (
                                <article
                                    className={styles.term}
                                    key={term.id ?? term.url ?? term.title ?? `term-${index}`}
                                >
                                    {!registrationMode && (terms.length > 1 || index > 0) && (
                                        <h3>{term.title || `Challenge term ${index + 1}`}</h3>
                                    )}
                                    {displayedDocuSignTerm ? (
                                        <div className={styles.docuSign}>
                                            {docuSignBusy && (
                                                <div className={styles.docuSignStatus} role='status'>
                                                    <LoadingSpinner />
                                                    <span>
                                                        {docuSignCompleting
                                                            ? 'Confirming your signature…'
                                                            : 'Loading DocuSign agreement…'}
                                                    </span>
                                                </div>
                                            )}
                                            {docuSignUrl && (
                                                <iframe
                                                    className={styles.docuSignFrame}
                                                    ref={docuSignFrameRef}
                                                    src={docuSignUrl}
                                                    title={term.title || 'DocuSign agreement'}
                                                />
                                            )}
                                        </div>
                                    ) : term.text ? (
                                        <div dangerouslySetInnerHTML={{ __html: sanitizedText(term.text) }} />
                                    ) : undefined}
                                    {!displayedDocuSignTerm && getSafeCmsLink(term.url) && (
                                        <a href={getSafeCmsLink(term.url)} rel='noreferrer' target='_blank'>
                                            Open this term in a new window
                                            <IconOutline.ExternalLinkIcon aria-hidden='true' />
                                        </a>
                                    )}
                                    {term.agreed && <small>You have already accepted this term.</small>}
                                </article>
                            )
                        })}
                    </div>
                )}
                {!compactRegistration
                    && registrationMode
                    && activeExternalAgreement
                    && !docuSignTemplateId && (
                    <div className={styles.error} role='alert'>
                        Complete this external agreement before registering.
                    </div>
                )}
                {!compactRegistration && agreementError && (
                    <div className={styles.error} role='alert'>{agreementError}</div>
                )}
                {!compactRegistration && externalError && (
                    <div className={styles.error} role='alert'>
                        <span>{externalError}</span>
                        <button disabled={docuSignBusy} onClick={retryDocuSign} type='button'>
                            {docuSignUrl ? 'Check again' : 'Try again'}
                        </button>
                    </div>
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
