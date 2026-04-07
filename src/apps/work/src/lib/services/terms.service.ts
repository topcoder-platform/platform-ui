import { xhrGetAsync } from '~/libs/core'

import { TERMS_API_URL } from '../constants'
import { Term } from '../models'

function normalizeError(error: unknown, fallbackMessage: string): Error {
    const typedError = error as {
        message?: string
        response?: {
            data?: {
                message?: string
            }
        }
    }

    const errorMessage = typedError?.response?.data?.message
        || typedError?.message
        || fallbackMessage

    return new Error(errorMessage)
}

function normalizeTerm(term: Partial<Term>): Term | undefined {
    const id = term.id !== undefined && term.id !== null
        ? String(term.id)
        : ''
    const title = typeof term.title === 'string'
        ? term.title.trim()
        : ''

    if (!id || !title) {
        return undefined
    }

    return {
        id,
        title,
    }
}

function extractTerms(response: unknown): Term[] {
    if (Array.isArray(response)) {
        return response
            .map(term => normalizeTerm(term as Partial<Term>))
            .filter((term): term is Term => !!term)
    }

    if (typeof response === 'object' && response) {
        const typedResponse = response as {
            result?: unknown
        }

        if (Array.isArray(typedResponse.result)) {
            return typedResponse.result
                .map(term => normalizeTerm(term as Partial<Term>))
                .filter((term): term is Term => !!term)
        }
    }

    return []
}

export async function fetchTerms(): Promise<Term[]> {
    try {
        const response = await xhrGetAsync<unknown>(
            `${TERMS_API_URL}?page=1&perPage=200`,
        )

        return extractTerms(response)
    } catch (error) {
        throw normalizeError(error, 'Failed to fetch terms')
    }
}
