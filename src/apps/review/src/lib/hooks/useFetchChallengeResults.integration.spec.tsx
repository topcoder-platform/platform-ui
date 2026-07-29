/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { act } from 'react'
import type { FC, PropsWithChildren } from 'react'

import { renderHook, waitFor } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'
import { SWRConfig } from 'swr'

import { handleError } from '~/libs/shared'

import type {
    ChallengeDetailContextModel,
    ChallengeInfo,
    ProjectResult,
    SubmissionInfo,
} from '../models'
import {
    fetchAllChallengeReviews,
    fetchAllProjectResults,
    fetchAllSubmissions,
} from '../services'
import { ChallengeDetailContext } from '../contexts/ChallengeDetailContext'

import {
    useFetchChallengeResults,
    useFetchChallengeResultsProps,
} from './useFetchChallengeResults'

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn()
        .mockReturnValue('#000000'),
}), { virtual: true })

jest.mock('~/config', () => ({
    EnvironmentConfig: {},
}), { virtual: true })

jest.mock('~/libs/shared', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('../services', () => ({
    fetchAllChallengeReviews: jest.fn(),
    fetchAllProjectResults: jest.fn(),
    fetchAllSubmissions: jest.fn(),
}))

const mockedFetchAllChallengeReviews = fetchAllChallengeReviews as jest.MockedFunction<
    typeof fetchAllChallengeReviews
>
const mockedFetchAllProjectResults = fetchAllProjectResults as jest.MockedFunction<
    typeof fetchAllProjectResults
>
const mockedFetchAllSubmissions = fetchAllSubmissions as jest.MockedFunction<
    typeof fetchAllSubmissions
>
const mockedHandleError = handleError as jest.MockedFunction<typeof handleError>

/**
 * Creates a minimal submission row for canonical winner hook tests.
 *
 * @param overrides fields that differ from the default winning submission.
 * @returns A challenge submission suitable for local display enrichment.
 */
const buildSubmission = (overrides: Partial<SubmissionInfo> = {}): SubmissionInfo => ({
    id: 'canonical-submission',
    memberId: '1001',
    placement: 1,
    reviews: [],
    submittedDate: '2026-01-03T00:00:00.000Z',
    submitterHandle: 'winner-handle',
    type: 'CONTEST_SUBMISSION',
    ...overrides,
})

/**
 * Creates the Review API's canonical final-placement result for hook tests.
 *
 * @param overrides fields that differ from the default project-result row.
 * @returns A canonical project result carrying the winning submission id.
 */
const buildProjectResult = (overrides: Partial<ProjectResult> = {}): ProjectResult => ({
    challengeId: 'challenge-id',
    createdAt: '2026-01-05T00:00:00.000Z',
    finalScore: 81,
    initialScore: 75,
    placement: 1,
    reviews: [],
    submissionId: 'canonical-submission',
    userId: '1001',
    ...overrides,
})

/**
 * Creates the challenge detail context required by the result hook.
 *
 * @param submissions local challenge submissions shown by the detail page.
 * @returns A completed challenge context with one final placement winner.
 */
const buildContextValue = (
    submissions: SubmissionInfo[],
): ChallengeDetailContextModel => ({
    aiReviewDecisionsBySubmissionId: {},
    challengeId: 'challenge-id',
    challengeInfo: {
        id: 'challenge-id',
        status: 'COMPLETED',
        submissions,
        winners: [{
            handle: 'winner-handle',
            placement: 1,
            type: 'PLACEMENT',
            userId: 1001,
        }],
    } as ChallengeInfo,
    challengeInfoError: undefined,
    challengeResourcesError: undefined,
    challengeScopedFetchError: undefined,
    challengeSubmissions: [],
    challengeSubmissionsError: undefined,
    hasChallengeScopedFetchError: false,
    isLoadingAiReviewConfig: false,
    isLoadingAiReviewDecisions: false,
    isLoadingChallengeInfo: false,
    isLoadingChallengeResources: false,
    isLoadingChallengeSubmissions: false,
    myResources: [],
    myRoles: [],
    registrants: [],
    resourceMemberIdMapping: {},
    resources: [],
    retryChallengeScopedFetches: () => undefined,
    reviewers: [],
})

/**
 * Builds an isolated SWR and challenge-context wrapper for each hook test.
 *
 * @param contextValue challenge data supplied to the hook.
 * @returns A React wrapper with a fresh cache and retries disabled.
 */
function createWrapper(contextValue: ChallengeDetailContextModel): FC<PropsWithChildren> {
    return function Wrapper(props: PropsWithChildren): JSX.Element {
        return (
            <SWRConfig
                value={{
                    dedupingInterval: 0,
                    provider: () => new Map(),
                    shouldRetryOnError: false,
                }}
            >
                <ChallengeDetailContext.Provider value={contextValue}>
                    {props.children}
                </ChallengeDetailContext.Provider>
            </SWRConfig>
        )
    }
}

describe('useFetchChallengeResults canonical project results', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedFetchAllChallengeReviews.mockResolvedValue([])
        mockedFetchAllSubmissions.mockResolvedValue([])
    })

    it('keeps loading until the canonical result resolves and never selects a sibling', async () => {
        let resolveProjectResults: (results: ProjectResult[]) => void = () => undefined
        const projectResultsPromise = new Promise<ProjectResult[]>(resolve => {
            resolveProjectResults = resolve
        })
        mockedFetchAllProjectResults.mockReturnValue(projectResultsPromise)
        const submissions = [
            buildSubmission({
                aggregateScore: 99,
                id: 'higher-scoring-sibling',
                submittedDate: '2026-01-06T00:00:00.000Z',
            }),
            buildSubmission({ aggregateScore: 70 }),
        ]

        const { result }: RenderHookResult<
            useFetchChallengeResultsProps,
            unknown
        > = renderHook(
            () => useFetchChallengeResults(submissions),
            { wrapper: createWrapper(buildContextValue(submissions)) },
        )

        await waitFor(() => expect(mockedFetchAllProjectResults)
            .toHaveBeenCalledWith('challenge-id', 100))
        expect(result.current.isLoading)
            .toBe(true)

        await act(async () => {
            resolveProjectResults([buildProjectResult()])
            await projectResultsPromise
        })

        await waitFor(() => expect(result.current.isLoading)
            .toBe(false))
        expect(result.current.projectResults)
            .toHaveLength(1)
        expect(result.current.projectResults[0])
            .toMatchObject({
                finalScore: 81,
                initialScore: 75,
                submissionId: 'canonical-submission',
            })
        expect(mockedFetchAllChallengeReviews)
            .not
            .toHaveBeenCalled()
    })

    it('renders a canonical winner for a registered-only viewer without fetching reviews', async () => {
        mockedFetchAllProjectResults.mockResolvedValue([buildProjectResult()])
        const contextValue = buildContextValue([])
        contextValue.myResources = [{
            challengeId: 'challenge-id',
            created: '2026-01-01T00:00:00.000Z',
            createdBy: 'registered-viewer',
            id: 'registered-viewer-resource',
            memberHandle: 'registered-viewer',
            memberId: '2002',
            roleId: 'submitter-role',
            roleName: 'Submitter',
        }]
        contextValue.myRoles = ['Submitter']

        const { result }: RenderHookResult<
            useFetchChallengeResultsProps,
            unknown
        > = renderHook(
            () => useFetchChallengeResults([]),
            { wrapper: createWrapper(contextValue) },
        )

        await waitFor(() => expect(result.current.isLoading)
            .toBe(false))
        expect(result.current.projectResults)
            .toHaveLength(1)
        expect(result.current.projectResults[0].submissionId)
            .toBe('canonical-submission')
        expect(mockedFetchAllChallengeReviews)
            .not
            .toHaveBeenCalled()
    })

    it('reports a canonical result request failure and returns no inferred winner', async () => {
        const requestError = new Error('project results unavailable')
        mockedFetchAllProjectResults.mockRejectedValue(requestError)
        const submissions = [buildSubmission({ id: 'possible-sibling' })]

        const { result }: RenderHookResult<
            useFetchChallengeResultsProps,
            unknown
        > = renderHook(
            () => useFetchChallengeResults(submissions),
            { wrapper: createWrapper(buildContextValue(submissions)) },
        )

        await waitFor(() => expect(mockedHandleError)
            .toHaveBeenCalledWith(requestError))
        await waitFor(() => expect(result.current.isLoading)
            .toBe(false))
        expect(result.current.projectResults)
            .toEqual([])
    })
})
