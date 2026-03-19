import {
    useCallback,
    useMemo,
    useState,
} from 'react'

import { MemberValidationResult } from '../models'
import { bulkSearchMembers as bulkSearchMembersService } from '../services'

const BULK_SEARCH_MEMBERS_CHUNK_SIZE = 50

function chunkIdentifiers(identifiers: string[]): string[][] {
    return Array.from(
        {
            length: Math.ceil(identifiers.length / BULK_SEARCH_MEMBERS_CHUNK_SIZE),
        },
        (_, chunkIndex) => identifiers.slice(
            chunkIndex * BULK_SEARCH_MEMBERS_CHUNK_SIZE,
            (chunkIndex + 1) * BULK_SEARCH_MEMBERS_CHUNK_SIZE,
        ),
    )
}

function normalizeError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof Error && error.message.trim()) {
        return error
    }

    return new Error(fallbackMessage)
}

function normalizeIdentifiers(identifiers: string[]): string[] {
    return identifiers
        .map(identifier => identifier.trim())
        .filter(Boolean)
}

export interface UseBulkSearchMembersResult {
    error: Error | undefined
    isSearching: boolean
    searchMembers: (nextIdentifiers?: string[]) => Promise<MemberValidationResult[]>
    validationResults: MemberValidationResult[]
}

export function useBulkSearchMembers(identifiers: string[] = []): UseBulkSearchMembersResult {
    const [error, setError] = useState<Error | undefined>(undefined)
    const [isSearching, setIsSearching] = useState<boolean>(false)
    const [validationResults, setValidationResults] = useState<MemberValidationResult[]>([])

    const normalizedIdentifiers = useMemo(
        () => normalizeIdentifiers(identifiers),
        [identifiers],
    )

    const searchMembers = useCallback(
        async (nextIdentifiers?: string[]): Promise<MemberValidationResult[]> => {
            const sourceIdentifiers = normalizeIdentifiers(nextIdentifiers || normalizedIdentifiers)
            const identifierChunks = chunkIdentifiers(sourceIdentifiers)

            if (!identifierChunks.length) {
                setError(undefined)
                setValidationResults([])

                return []
            }

            setError(undefined)
            setIsSearching(true)
            setValidationResults([])

            let aggregatedResults: MemberValidationResult[] = []
            let latestError: Error | undefined

            try {
                const chunkResultsByIndex: MemberValidationResult[][] = Array.from(
                    {
                        length: identifierChunks.length,
                    },
                    () => [],
                )

                await Promise.all(identifierChunks.map(async (identifierChunk, chunkIndex) => {
                    try {
                        const chunkResults = await bulkSearchMembersService(identifierChunk)

                        chunkResultsByIndex[chunkIndex] = chunkResults
                    } catch (error_) {
                        latestError = normalizeError(error_, 'Failed to validate members')
                    }

                    setValidationResults(chunkResultsByIndex.flat())
                }))

                aggregatedResults = chunkResultsByIndex.flat()
            } finally {
                setIsSearching(false)
            }

            if (latestError) {
                setError(latestError)
            }

            return aggregatedResults
        },
        [normalizedIdentifiers],
    )

    return {
        error,
        isSearching,
        searchMembers,
        validationResults,
    }
}

export default useBulkSearchMembers
