/* eslint-disable unicorn/no-null */
import {
    useCallback,
    useReducer,
} from 'react'

import {
    TERMS_CHECK_DELAY_MS,
    TERMS_CHECK_MAX_ATTEMPTS,
} from '../../config/index.config'
import { TermInfo } from '../models'
import {
    agreeTerm as agreeTermService,
    fetchDocuSignUrl,
    fetchTermsForChallenge,
} from '../services'

/**
 * Terms state handled by the community terms hook.
 */
export interface TermsState {
    canRegister: boolean
    docuSignUrl: string
    error: string | null
    isCheckingStatus: boolean
    isLoading: boolean
    selectedTerm: TermInfo | null
    terms: TermInfo[]
}

type TermsAction
    = {
        canRegister?: boolean
        terms: TermInfo[]
        type: 'SET_TERMS'
    }
    | {
        isCheckingStatus: boolean
        type: 'SET_CHECKING_STATUS'
    }
    | {
        isLoading: boolean
        type: 'SET_LOADING'
    }
    | {
        error: string | null
        type: 'SET_ERROR'
    }
    | {
        docuSignUrl: string
        type: 'SET_DOCUSIGN_URL'
    }
    | {
        selectedTerm: TermInfo | null
        type: 'SET_SELECTED_TERM'
    }
    | {
        termId: string
        type: 'MARK_TERM_AGREED'
    }

const initialTermsState: TermsState = {
    canRegister: false,
    docuSignUrl: '',
    error: null,
    isCheckingStatus: false,
    isLoading: false,
    selectedTerm: null,
    terms: [],
}

function delay(timeoutMs: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, timeoutMs)
    })
}

function getSelectedTerm(terms: TermInfo[]): TermInfo | null {
    return terms.find(term => !term.agreed) ?? null
}

function sortTerms(terms: TermInfo[]): TermInfo[] {
    return [...terms].sort((a, b) => Number(a.agreed) - Number(b.agreed))
}

function toErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }

    return 'Something went wrong while processing terms'
}

function termsReducer(state: TermsState, action: TermsAction): TermsState {
    if (action.type === 'SET_CHECKING_STATUS') {
        return {
            ...state,
            isCheckingStatus: action.isCheckingStatus,
        }
    }

    if (action.type === 'SET_DOCUSIGN_URL') {
        return {
            ...state,
            docuSignUrl: action.docuSignUrl,
        }
    }

    if (action.type === 'SET_ERROR') {
        return {
            ...state,
            error: action.error,
        }
    }

    if (action.type === 'SET_LOADING') {
        return {
            ...state,
            isLoading: action.isLoading,
        }
    }

    if (action.type === 'SET_SELECTED_TERM') {
        return {
            ...state,
            selectedTerm: action.selectedTerm,
        }
    }

    if (action.type === 'SET_TERMS') {
        const terms = sortTerms(action.terms)
        const canRegister = action.canRegister ?? terms.every(term => term.agreed)

        return {
            ...state,
            canRegister,
            selectedTerm: getSelectedTerm(terms),
            terms,
        }
    }

    const terms = sortTerms(
        state.terms.map(term => {
            if (term.id === action.termId) {
                return {
                    ...term,
                    agreed: true,
                }
            }

            return term
        }),
    )

    return {
        ...state,
        canRegister: terms.every(term => term.agreed),
        selectedTerm: getSelectedTerm(terms),
        terms,
    }
}

async function checkTermsStatus(termIds: string[], attemptsLeft: number): Promise<TermInfo[]> {
    const latestTerms = await fetchTermsForChallenge(termIds)
    const allAgreed = latestTerms.every(term => term.agreed)

    if (allAgreed || attemptsLeft <= 1) {
        return latestTerms
    }

    await delay(TERMS_CHECK_DELAY_MS)
    return checkTermsStatus(termIds, attemptsLeft - 1)
}

export interface UseTermsResult {
    agreeTerm(termId: string): Promise<void>
    checkStatus(termIds: string[]): Promise<void>
    /**
     * Clears the cached DocuSign URL so the DocuSign iframe can return to loading state.
     */
    clearDocuSignUrl(): void
    getDocuSignUrl(templateId: string, returnUrl?: string): Promise<void>
    loadTerms(termIds: string[]): Promise<void>
    selectTerm(term: TermInfo): void
    signDocuSign(termId: string): void
    state: TermsState
}

/**
 * Manages challenge terms loading and agreement state transitions.
 *
 * @returns Terms state and transition helpers.
 */
export function useTerms(): UseTermsResult {
    const [state, dispatch] = useReducer(termsReducer, initialTermsState)

    const loadTerms = useCallback(async (termIds: string[]): Promise<void> => {
        dispatch({
            error: null,
            type: 'SET_ERROR',
        })
        dispatch({
            isLoading: true,
            type: 'SET_LOADING',
        })

        if (!termIds.length) {
            dispatch({
                canRegister: true,
                terms: [],
                type: 'SET_TERMS',
            })
            dispatch({
                isLoading: false,
                type: 'SET_LOADING',
            })

            return
        }

        try {
            const terms = await fetchTermsForChallenge(termIds)
            dispatch({
                terms,
                type: 'SET_TERMS',
            })
        } catch (error) {
            dispatch({
                error: toErrorMessage(error),
                type: 'SET_ERROR',
            })
        } finally {
            dispatch({
                isLoading: false,
                type: 'SET_LOADING',
            })
        }
    }, [])

    const agreeTerm = useCallback(async (termId: string): Promise<void> => {
        dispatch({
            error: null,
            type: 'SET_ERROR',
        })
        dispatch({
            isLoading: true,
            type: 'SET_LOADING',
        })

        try {
            const response = await agreeTermService(termId)
            if (!response.success) {
                throw new Error('Failed to agree term')
            }

            dispatch({
                termId,
                type: 'MARK_TERM_AGREED',
            })
        } catch (error) {
            dispatch({
                error: toErrorMessage(error),
                type: 'SET_ERROR',
            })
        } finally {
            dispatch({
                isLoading: false,
                type: 'SET_LOADING',
            })
        }
    }, [])

    /**
     * Clears the currently stored DocuSign recipient URL.
     */
    const clearDocuSignUrl = useCallback((): void => {
        dispatch({
            docuSignUrl: '',
            type: 'SET_DOCUSIGN_URL',
        })
    }, [])

    const getDocuSignUrl = useCallback(async (
        templateId: string,
        returnUrl?: string,
    ): Promise<void> => {
        dispatch({
            error: null,
            type: 'SET_ERROR',
        })

        try {
            const response = await fetchDocuSignUrl(templateId, returnUrl)
            dispatch({
                docuSignUrl: response.recipientViewUrl,
                type: 'SET_DOCUSIGN_URL',
            })
        } catch (error) {
            dispatch({
                error: toErrorMessage(error),
                type: 'SET_ERROR',
            })
        }
    }, [])

    const signDocuSign = useCallback((termId: string): void => {
        dispatch({
            termId,
            type: 'MARK_TERM_AGREED',
        })
    }, [])

    const checkStatus = useCallback(async (termIds: string[]): Promise<void> => {
        dispatch({
            error: null,
            type: 'SET_ERROR',
        })
        dispatch({
            isCheckingStatus: true,
            type: 'SET_CHECKING_STATUS',
        })

        if (!termIds.length) {
            dispatch({
                canRegister: true,
                terms: [],
                type: 'SET_TERMS',
            })
            dispatch({
                isCheckingStatus: false,
                type: 'SET_CHECKING_STATUS',
            })

            return
        }

        try {
            const latestTerms = await checkTermsStatus(
                termIds,
                TERMS_CHECK_MAX_ATTEMPTS,
            )
            dispatch({
                terms: latestTerms,
                type: 'SET_TERMS',
            })
        } catch (error) {
            dispatch({
                error: toErrorMessage(error),
                type: 'SET_ERROR',
            })
        } finally {
            dispatch({
                isCheckingStatus: false,
                type: 'SET_CHECKING_STATUS',
            })
        }
    }, [])

    const selectTerm = useCallback((term: TermInfo): void => {
        dispatch({
            selectedTerm: term,
            type: 'SET_SELECTED_TERM',
        })
    }, [])

    return {
        agreeTerm,
        checkStatus,
        clearDocuSignUrl,
        getDocuSignUrl,
        loadTerms,
        selectTerm,
        signDocuSign,
        state,
    }
}
