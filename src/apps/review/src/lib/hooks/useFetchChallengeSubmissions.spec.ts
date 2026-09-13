/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { renderHook, RenderHookResult } from '@testing-library/react'

import { useFetchChallengeSubmissions, useFetchChallengeSubmissionsProps } from './useFetchChallengeSubmissions'

interface CompletionProps {
    isCompleted: boolean
}

const mockMutate = jest.fn()
    .mockResolvedValue([])
jest.mock('swr', () => ({
    __esModule: true,
    default: () => ({
        data: [
            { id: 'own', memberId: '123', status: 'ACTIVE' },
            { id: 'other-latest', memberId: '456', status: 'ACTIVE' },
            { id: 'other-previous', memberId: '456', status: 'COMPLETED_WITHOUT_WIN' },
            { id: 'deleted', memberId: '456', status: 'DELETED' },
        ],
        isValidating: false,
        mutate: mockMutate,
    }),
}))
jest.mock('~/libs/core', () => ({
    UserRole: { administrator: 'administrator', projectManager: 'projectManager' },
}), { virtual: true })
jest.mock('~/libs/shared', () => ({ handleError: jest.fn() }), { virtual: true })
jest.mock('../services', () => ({ fetchAllSubmissions: jest.fn() }))
jest.mock('../models', () => ({ BackendSubmissionStatus: {} }))

describe('completed Marathon Match submission visibility', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockMutate.mockResolvedValue([])
    })

    it.each([
        [true, true, ['own', 'other-latest', 'other-previous']],
        [true, false, ['own']],
        [false, true, ['own']],
    ])('gates MM=%s completed=%s', (isMarathonMatch, isCompleted, ids) => {
        const { result }: RenderHookResult<useFetchChallengeSubmissionsProps, unknown> = renderHook(
            () => useFetchChallengeSubmissions(
                'challenge-1',
                { roles: ['Submitter'], userId: '123' },
                { isCompleted, isDesign: false, isMarathonMatch, submissionsViewable: false },
            ),
        )

        expect(result.current.challengeSubmissions.map(submission => submission.id))
            .toEqual(ids)
        expect(result.current.deletedSubmissionIds.has('deleted'))
            .toBe(true)
    })

    it('revalidates earlier attempts when the challenge becomes completed', () => {
        const initialProps: CompletionProps = { isCompleted: false }
        const { result, rerender }: RenderHookResult<useFetchChallengeSubmissionsProps, CompletionProps>
            = renderHook((props: CompletionProps) => useFetchChallengeSubmissions(
                'challenge-1',
                { roles: ['Submitter'], userId: '123' },
                { isCompleted: props.isCompleted, isDesign: false, isMarathonMatch: true, submissionsViewable: false },
            ), { initialProps })
        expect(mockMutate)
            .not.toHaveBeenCalled()

        rerender({ isCompleted: true })
        expect(mockMutate)
            .toHaveBeenCalledTimes(1)
        expect(result.current.challengeSubmissions)
            .toHaveLength(3)

        rerender({ isCompleted: false })
        expect(result.current.challengeSubmissions.map(submission => submission.id))
            .toEqual(['own'])
    })
})
