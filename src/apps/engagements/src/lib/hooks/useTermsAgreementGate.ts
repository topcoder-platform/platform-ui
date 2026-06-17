import { type SyntheticEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { EnvironmentConfig } from '~/config'

import type { TermDetails } from '../models'
import {
    agreeToTerm,
    getDocuSignUrl,
    getTermDetails,
} from '../services'
import {
    extractTermId,
    resolveDocuSignTemplateId,
    resolveStandardTermsConfig,
} from '../utils'

type TermsConfig = {
    id: string
    label: string
    url?: string
}

export type TermsAgreementCompletionHandler = () => void | Promise<void>

export interface TermsAgreementGateModalState {
    open: boolean
    onClose: () => void
    contextDescription: string
    termsLabel?: string
    termsTitle: string
    termsBody?: string
    termsLoading: boolean
    termsError?: string
    termsAgreeing: boolean
    isElectronicallyAgreeable: boolean
    isDocuSignTerm: boolean
    docuSignUrl?: string
    docuSignLoading: boolean
    termsUrl?: string
    onAgree: () => void
    onOpenTermsLink: () => void
    onDocuSignFrameLoad?: (event: SyntheticEvent<HTMLIFrameElement>) => void
}

export interface UseTermsAgreementGateOptions {
    contextDescription: string
}

export interface UseTermsAgreementGateResult {
    modalState: TermsAgreementGateModalState
    isCheckingTerms: boolean
    isFinalizingAgreement: boolean
    termsError?: string
    startTermsAgreementFlow: (onComplete: TermsAgreementCompletionHandler) => Promise<void>
}

type TermsViewData = {
    termsTitle: string
    termsBody?: string
    isElectronicallyAgreeable: boolean
}

const STANDARD_TERMS = resolveStandardTermsConfig(
    EnvironmentConfig.DEFAULT_STANDARD_TERMS_UUID,
    EnvironmentConfig.TERMS_URL,
)
const TERMS_ID = STANDARD_TERMS.id
const NDA_TERMS_ID = extractTermId(EnvironmentConfig.NDA_TERMS_URL)

const TERMS_CONFIG: TermsConfig[] = [
    { id: TERMS_ID ?? '', label: 'Standard Topcoder Terms', url: STANDARD_TERMS.url },
    { id: NDA_TERMS_ID ?? '', label: 'Topcoder NDA', url: EnvironmentConfig.NDA_TERMS_URL },
].filter(term => term.id)

const DOCUSIGN_POLL_DELAY_MS = 5000
const DOCUSIGN_POLL_MAX_ATTEMPTS = 5
const DOCUSIGN_RETURN_PARAM = 'docusignReturn'
const DOCUSIGN_RETURN_VALUE = '1'

const delay = (durationMs: number): Promise<void> => (
    new Promise(resolve => {
        window.setTimeout(resolve, durationMs)
    })
)

const buildDocuSignReturnUrl = (): string => {
    const url = new URL(window.location.href)
    url.searchParams.set(DOCUSIGN_RETURN_PARAM, DOCUSIGN_RETURN_VALUE)
    return url.toString()
}

const isDocuSignReturnUrl = (url?: string): boolean => {
    if (!url) {
        return false
    }

    try {
        const parsed = new URL(url)
        return parsed.origin === window.location.origin
            && parsed.searchParams.get(DOCUSIGN_RETURN_PARAM) === DOCUSIGN_RETURN_VALUE
    } catch {
        return false
    }
}

const getTermsViewData = (termsDetails?: TermDetails): TermsViewData => {
    const termsTitle = termsDetails?.title || 'Terms & Conditions of Use'
    const termsBody = termsDetails?.text
        ? termsDetails.text.replace(/topcoder/gi, 'Topcoder')
        : undefined
    const isElectronicallyAgreeable = termsDetails?.agreeabilityType
        ? termsDetails.agreeabilityType === 'Electronically-agreeable'
        : true

    return {
        isElectronicallyAgreeable,
        termsBody,
        termsTitle,
    }
}

/**
 * Manages the shared engagement terms gate, including sequential term checks and DocuSign-backed terms.
 */
export const useTermsAgreementGate = (
    options: UseTermsAgreementGateOptions,
): UseTermsAgreementGateResult => {
    const [termsModalOpen, setTermsModalOpen] = useState<boolean>(false)
    const [activeTerm, setActiveTerm] = useState<TermsConfig | undefined>(undefined)
    const [termsDetails, setTermsDetails] = useState<TermDetails | undefined>(undefined)
    const [termsLoading, setTermsLoading] = useState<boolean>(false)
    const [termsError, setTermsError] = useState<string | undefined>(undefined)
    const [termsAgreeing, setTermsAgreeing] = useState<boolean>(false)
    const [docuSignUrl, setDocuSignUrl] = useState<string | undefined>(undefined)
    const [docuSignLoading, setDocuSignLoading] = useState<boolean>(false)

    const completionHandlerRef = useRef<TermsAgreementCompletionHandler | undefined>(undefined)
    const docuSignCallbackHandledRef = useRef<boolean>(false)

    const completeTermsFlow = useCallback(async (): Promise<void> => {
        const onComplete = completionHandlerRef.current
        completionHandlerRef.current = undefined

        if (onComplete) {
            await onComplete()
        }
    }, [])

    const closeTermsFlow = useCallback(() => {
        setTermsModalOpen(false)
        setTermsError(undefined)
        setTermsAgreeing(false)
        setDocuSignUrl(undefined)
        setDocuSignLoading(false)
        setActiveTerm(undefined)
        setTermsDetails(undefined)
        completionHandlerRef.current = undefined
        docuSignCallbackHandledRef.current = false
    }, [])

    const openNextPendingTerm = useCallback(async (): Promise<'opened' | 'completed' | 'failed'> => {
        if (!TERMS_ID || !NDA_TERMS_ID || TERMS_CONFIG.length < 2) {
            setTermsError('Unable to verify terms and NDA. Please try again later.')
            return 'failed'
        }

        setTermsError(undefined)
        setTermsLoading(true)

        try {
            const results = await Promise.all(
                TERMS_CONFIG.map(async term => ({
                    details: await getTermDetails(term.id),
                    term,
                })),
            )
            const nextPending = results.find(entry => !entry.details?.agreed)

            if (!nextPending) {
                setActiveTerm(undefined)
                setTermsDetails(undefined)
                setTermsModalOpen(false)
                await completeTermsFlow()
                return 'completed'
            }

            setActiveTerm(nextPending.term)
            setTermsDetails(nextPending.details)
            setTermsModalOpen(true)
            return 'opened'
        } catch {
            setTermsError('Unable to verify terms of use. Please try again.')
            return 'failed'
        } finally {
            setTermsLoading(false)
        }
    }, [completeTermsFlow])

    const handleAgreeTerms = useCallback(async () => {
        if (!activeTerm?.id) {
            setTermsError('Unable to verify terms of use. Please try again later.')
            return
        }

        setTermsAgreeing(true)
        setTermsError(undefined)

        try {
            const response = await agreeToTerm(activeTerm.id)
            if (response?.success === false) {
                throw new Error('Terms agreement failed')
            }

            await openNextPendingTerm()
        } catch {
            setTermsError('Unable to save your agreement. Please try again.')
        } finally {
            setTermsAgreeing(false)
        }
    }, [activeTerm?.id, openNextPendingTerm])

    const handleOpenTermsLink = useCallback(() => {
        const nextTermsUrl = activeTerm?.url || termsDetails?.url
        if (!nextTermsUrl) {
            return
        }

        window.open(nextTermsUrl, '_blank', 'noopener,noreferrer')
    }, [activeTerm?.url, termsDetails?.url])

    const handleDocuSignComplete = useCallback(async () => {
        if (!activeTerm?.id) {
            return
        }

        const termId = activeTerm.id
        const checkAgreement = async (attempt: number): Promise<TermDetails> => {
            const details = await getTermDetails(termId)
            setTermsDetails(details)

            if (details.agreed || attempt >= DOCUSIGN_POLL_MAX_ATTEMPTS) {
                return details
            }

            await delay(DOCUSIGN_POLL_DELAY_MS)
            return checkAgreement(attempt + 1)
        }

        setTermsAgreeing(true)
        setTermsError(undefined)

        try {
            const details = await checkAgreement(1)
            if (!details.agreed) {
                setTermsError('We could not confirm your signature yet. Please try again.')
                return
            }

            await openNextPendingTerm()
        } catch {
            setTermsError('Unable to verify your agreement. Please try again.')
        } finally {
            setTermsAgreeing(false)
        }
    }, [activeTerm?.id, openNextPendingTerm])

    const handleDocuSignCallback = useCallback(() => {
        if (docuSignCallbackHandledRef.current) {
            return
        }

        docuSignCallbackHandledRef.current = true
        setTermsModalOpen(false)
        handleDocuSignComplete()
    }, [handleDocuSignComplete])

    const handleDocuSignFrameLoad = useCallback((event: SyntheticEvent<HTMLIFrameElement>) => {
        try {
            const frameLocation = event.currentTarget.contentWindow?.location?.href
            if (isDocuSignReturnUrl(frameLocation)) {
                handleDocuSignCallback()
            }
        } catch {
            // Ignore cross-origin iframe loads.
        }
    }, [handleDocuSignCallback])

    const { isElectronicallyAgreeable, termsBody, termsTitle }: TermsViewData = useMemo(
        () => getTermsViewData(termsDetails),
        [termsDetails],
    )
    const docuSignTemplateId = resolveDocuSignTemplateId(
        termsDetails,
        EnvironmentConfig.NDA_DOCUSIGN_TEMPLATE_ID,
    )
    const isDocuSignTerm = Boolean(
        termsDetails && docuSignTemplateId,
    )
    const termsUrl = activeTerm?.url || termsDetails?.url

    useEffect(() => {
        if (!termsModalOpen || !isDocuSignTerm || !docuSignTemplateId) {
            setDocuSignUrl(undefined)
            setDocuSignLoading(false)
            return
        }

        docuSignCallbackHandledRef.current = false
        const returnUrl = buildDocuSignReturnUrl()
        setDocuSignLoading(true)
        setDocuSignUrl(undefined)
        getDocuSignUrl(docuSignTemplateId, returnUrl)
            .then(url => setDocuSignUrl(url))
            .catch(() => setTermsError('Unable to load the agreement. Please try again.'))
            .finally(() => setDocuSignLoading(false))
    }, [docuSignTemplateId, isDocuSignTerm, termsModalOpen])

    useEffect(() => {
        if (!termsModalOpen || !docuSignUrl) {
            return undefined
        }

        const handler = (event: MessageEvent): void => {
            if (!event?.data || event.data.type !== 'DocuSign') {
                return
            }

            if (event.data.event === 'signing_complete' || event.data.event === 'viewing_complete') {
                handleDocuSignCallback()
            } else {
                closeTermsFlow()
            }
        }

        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [closeTermsFlow, docuSignUrl, handleDocuSignCallback, termsModalOpen])

    const startTermsAgreementFlow = useCallback(async (onComplete: TermsAgreementCompletionHandler) => {
        if (termsLoading || termsAgreeing) {
            return
        }

        completionHandlerRef.current = onComplete
        const result = await openNextPendingTerm()

        if (result === 'failed') {
            completionHandlerRef.current = undefined
        }
    }, [openNextPendingTerm, termsAgreeing, termsLoading])

    return {
        isCheckingTerms: termsLoading && !termsModalOpen,
        isFinalizingAgreement: termsAgreeing && !termsModalOpen,
        modalState: {
            contextDescription: options.contextDescription,
            docuSignLoading,
            docuSignUrl,
            isDocuSignTerm,
            isElectronicallyAgreeable,
            onAgree: handleAgreeTerms,
            onClose: closeTermsFlow,
            onDocuSignFrameLoad: handleDocuSignFrameLoad,
            onOpenTermsLink: handleOpenTermsLink,
            open: termsModalOpen,
            termsAgreeing,
            termsBody,
            termsError,
            termsLabel: activeTerm?.label,
            termsLoading,
            termsTitle,
            termsUrl,
        },
        startTermsAgreementFlow,
        termsError,
    }
}
