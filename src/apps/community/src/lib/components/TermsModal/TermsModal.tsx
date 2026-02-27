import {
    FC,
    MouseEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react'
import classNames from 'classnames'

import {
    BaseModal,
    Button,
    IconCheck,
    LoadingSpinner,
} from '~/libs/ui'

import { useTerms } from '../../hooks'
import type { TermInfo } from '../../models'

import styles from './TermsModal.module.scss'

interface TermsModalProps {
    challengeId: string
    onAllAgreed: () => void
    onClose: () => void
    termIds: string[]
}

/**
 * Builds a DocuSign callback URL that returns to the current page.
 *
 * @param templateId DocuSign template id to persist in the callback URL.
 * @returns Absolute callback URL with `docuSignReturn` query param.
 */
function buildDocuSignReturnUrl(templateId: string): string {
    const returnUrl = new URL(window.location.href)
    returnUrl.searchParams.set('docuSignReturn', templateId)

    return returnUrl.toString()
}

/**
 * Displays the challenge terms flow and captures all required agreements.
 *
 * @param props Challenge term ids with completion and close callbacks.
 * @returns Terms modal with sidebar navigation and agreeability-specific content.
 */
const TermsModal: FC<TermsModalProps> = (props: TermsModalProps) => {
    const {
        agreeTerm,
        checkStatus,
        clearDocuSignUrl,
        getDocuSignUrl,
        loadTerms,
        selectTerm,
        signDocuSign,
        state,
    }: ReturnType<typeof useTerms> = useTerms()
    const notifiedAllAgreedRef = useRef(false)
    const activeTemplateRef = useRef<string | undefined>(undefined)
    const loadedTemplateRef = useRef<string | undefined>(undefined)
    const signedTemplateRef = useRef<string | undefined>(undefined)
    const requestedTemplateRef = useRef<string | undefined>(undefined)

    useEffect(() => {
        notifiedAllAgreedRef.current = false
        requestedTemplateRef.current = undefined
        loadTerms(props.termIds)
            .catch(() => undefined)
    }, [loadTerms, props.termIds])

    useEffect(() => {
        if (!state.canRegister || notifiedAllAgreedRef.current) {
            return
        }

        notifiedAllAgreedRef.current = true
        props.onAllAgreed()
    }, [props.onAllAgreed, state.canRegister])

    const selectedDocuSignTemplateId = useMemo(() => {
        if (state.selectedTerm?.agreeabilityType !== 'DocuSignable') {
            return undefined
        }

        return state.selectedTerm.docusignTemplateId
    }, [state.selectedTerm])

    useEffect(() => {
        if (activeTemplateRef.current === selectedDocuSignTemplateId) {
            return
        }

        activeTemplateRef.current = selectedDocuSignTemplateId
        loadedTemplateRef.current = undefined
        requestedTemplateRef.current = undefined
        clearDocuSignUrl()
    }, [clearDocuSignUrl, selectedDocuSignTemplateId])

    useEffect(() => {
        if (!selectedDocuSignTemplateId) {
            return
        }

        const shouldRequestUrl = !state.docuSignUrl || loadedTemplateRef.current !== selectedDocuSignTemplateId
        if (!shouldRequestUrl) {
            return
        }

        requestedTemplateRef.current = selectedDocuSignTemplateId
        const returnUrl = buildDocuSignReturnUrl(selectedDocuSignTemplateId)
        getDocuSignUrl(selectedDocuSignTemplateId, returnUrl)
            .then(() => {
                loadedTemplateRef.current = selectedDocuSignTemplateId
            })
            .catch(() => undefined)
    }, [getDocuSignUrl, selectedDocuSignTemplateId, state.docuSignUrl])

    const hasDocuSignUrlForSelectedTemplate = Boolean(
        state.docuSignUrl
        && selectedDocuSignTemplateId
        && loadedTemplateRef.current === selectedDocuSignTemplateId,
    )

    useEffect(() => {
        const templateId = new URLSearchParams(window.location.search)
            .get('docuSignReturn')
        if (!templateId || signedTemplateRef.current === templateId) {
            return
        }

        const matchedTerm = state.terms.find(term => term.docusignTemplateId === templateId)
        if (!matchedTerm) {
            return
        }

        signedTemplateRef.current = templateId
        signDocuSign(matchedTerm.id)
        checkStatus(props.termIds)
            .catch(() => undefined)
    }, [checkStatus, props.termIds, signDocuSign, state.terms])

    const handleSelectTerm = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const termId = event.currentTarget.dataset.termId
        if (!termId) {
            return
        }

        const term = state.terms.find(item => item.id === termId)
        if (term) {
            selectTerm(term)
        }
    }, [selectTerm, state.terms])

    const handleAgree = useCallback(async (): Promise<void> => {
        if (!state.selectedTerm) {
            return
        }

        await agreeTerm(state.selectedTerm.id)
        await checkStatus(props.termIds)
    }, [agreeTerm, checkStatus, props.termIds, state.selectedTerm])

    const renderTermContent = useCallback((term: TermInfo): JSX.Element => {
        if (term.agreeabilityType === 'Electronically-agreeable') {
            return (
                <>
                    <div className={styles.contentScroll}>{term.text ?? 'No term text available.'}</div>

                    <div className={styles.actions}>
                        <Button onClick={handleAgree} primary>
                            I Agree
                        </Button>
                    </div>
                </>
            )
        }

        if (term.agreeabilityType === 'DocuSignable') {
            if (!term.docusignTemplateId) {
                return (
                    <div className={styles.emptyState}>
                        DocuSign template id is not available for this term.
                    </div>
                )
            }

            if (!hasDocuSignUrlForSelectedTemplate) {
                return (
                    <div className={styles.spinnerWrap}>
                        <LoadingSpinner inline />
                    </div>
                )
            }

            return (
                <iframe
                    className={styles.docuSignFrame}
                    src={state.docuSignUrl}
                    title={`docuSign-${props.challengeId}-${term.id}`}
                />
            )
        }

        return (
            <>
                <div className={styles.contentScroll}>
                    {term.text && <p>{term.text}</p>}
                    {!term.text && term.url && (
                        <a
                            className={styles.link}
                            href={term.url}
                            rel='noreferrer'
                            target='_blank'
                        >
                            {term.url}
                        </a>
                    )}
                    {!term.text && !term.url && (
                        <p>No additional term details are available.</p>
                    )}
                </div>

                <div className={styles.actions}>
                    <Button onClick={props.onClose} secondary>
                        Close
                    </Button>
                </div>
            </>
        )
    }, [handleAgree, hasDocuSignUrlForSelectedTemplate, props.challengeId, props.onClose, state.docuSignUrl])

    return (
        <BaseModal
            allowBodyScroll
            onClose={props.onClose}
            open
            size='lg'
            title='Terms and Conditions'
        >
            <div className={styles.modalBody}>
                {state.error && <div className={styles.error}>{state.error}</div>}

                {(state.isLoading || state.isCheckingStatus) ? (
                    <div className={styles.spinnerWrap}>
                        <LoadingSpinner inline />
                    </div>
                ) : (
                    <div className={styles.layout}>
                        <aside className={styles.sidebar}>
                            {state.terms.map(term => (
                                <button
                                    className={classNames(
                                        styles.termItem,
                                        term.id === state.selectedTerm?.id && styles.termItemActive,
                                    )}
                                    data-term-id={term.id}
                                    key={term.id}
                                    onClick={handleSelectTerm}
                                    type='button'
                                >
                                    <span className={styles.termTitle}>{term.title ?? term.id}</span>
                                    {term.agreed && (
                                        <IconCheck className={styles.agreedIcon} />
                                    )}
                                </button>
                            ))}
                        </aside>

                        <div className={styles.content}>
                            {state.selectedTerm
                                ? renderTermContent(state.selectedTerm)
                                : <div className={styles.emptyState}>No terms available.</div>}
                        </div>
                    </div>
                )}
            </div>
        </BaseModal>
    )
}

export { TermsModal, type TermsModalProps }
export default TermsModal
