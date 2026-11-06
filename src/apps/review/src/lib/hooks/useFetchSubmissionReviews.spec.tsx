/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { act, renderHook, RenderHookResult, waitFor } from '@testing-library/react'
import useSWR from 'swr'

import type { AppealInfo, BackendAppealResponse, ReviewItemInfo } from '../models'
import { createAppealResponse, updateAppealResponse, updateReviewItem } from '../services'

import { useFetchSubmissionReviews, useFetchSubmissionReviewsProps } from './useFetchSubmissionReviews'

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: '/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    getRatingColor: jest.fn(),
}), { virtual: true })

jest.mock('~/apps/admin/src/lib/utils', () => ({
    handleError: jest.fn(),
}), { virtual: true })

jest.mock('swr', () => ({
    __esModule: true,
    default: jest.fn(),
    mutate: jest.fn(),
}))

jest.mock('../contexts', () => ({
    ChallengeDetailContext: jest.requireActual('react')
        .createContext({}),
}))

jest.mock('./useRole', () => ({
    useRole: () => ({ actionChallengeRole: 'Reviewer' }),
}))

jest.mock('../services', () => ({
    createAppealResponse: jest.fn(),
    updateAppealResponse: jest.fn(),
    updateReviewItem: jest.fn(),
}))

const mockedUseSWR = useSWR as jest.Mock
const mockedCreateAppealResponse = createAppealResponse as jest.Mock
const mockedUpdateAppealResponse = updateAppealResponse as jest.Mock
const mockedUpdateReviewItem = updateReviewItem as jest.Mock

const appeal: AppealInfo = {
    content: 'Please reconsider the score.',
    id: 'appeal-1',
    reviewItemCommentId: 'comment-1',
}

const reviewItem: ReviewItemInfo = {
    createdAt: '',
    id: 'item-1',
    initialAnswer: '7',
    reviewItemComments: [],
    scorecardQuestionId: 'question-1',
}

const savedResponse: BackendAppealResponse = {
    appealId: appeal.id,
    content: 'No change',
    createdAt: '',
    createdBy: '',
    id: 'response-1',
    resourceId: 'reviewer-1',
    success: false,
    updatedAt: '',
    updatedBy: '',
}

describe.each(['create', 'edit'])('appeal response %s', operation => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedUseSWR.mockImplementation((key: string) => ({
            data: key.includes('/reviews/') ? { resourceId: 'reviewer-1' } : undefined,
        }))
        mockedCreateAppealResponse.mockImplementation((id, data) => Promise.resolve({
            ...savedResponse,
            ...data,
        }))
        mockedUpdateAppealResponse.mockImplementation((id, data) => Promise.resolve({
            ...savedResponse,
            ...data,
        }))
        mockedUpdateReviewItem.mockResolvedValue({})
    })

    it.each([
        ['rejects the original score', '7', undefined, '7', false],
        ['rejects no score selection', '7', undefined, '', false],
        ['rejects an unchanged final score', '7', '7', '7', false],
        ['accepts a changed score', '7', undefined, '8', true],
        ['keeps acceptance when reselecting the changed score', '7', '8', '8', true],
        ['keeps acceptance for a text-only edit', '7', '8', '', true],
        ['rejects a score reverted to the original', '7', '8', '7', false],
        ['rejects an unchanged zero score', '0', '0', '0', false],
        ['rejects an unchanged yes/no answer', 'No', undefined, 'No', false],
        ['accepts a changed yes/no answer', 'No', undefined, 'Yes', true],
    ])('%s', async (name, initialAnswer, finalAnswer, updatedResponse, success) => {
        const { result }: RenderHookResult<useFetchSubmissionReviewsProps, unknown> = renderHook(
            () => useFetchSubmissionReviews('review-1'),
        )
        const onSuccess = jest.fn()
        const request = operation === 'create' ? createAppealResponse : updateAppealResponse
        const responseAppeal = operation === 'create'
            ? appeal
            : { ...appeal, appealResponse: { ...savedResponse, success: true } }

        act(() => {
            result.current.addAppealResponse(
                'No change',
                updatedResponse as string,
                responseAppeal,
                { ...reviewItem, finalAnswer, initialAnswer } as ReviewItemInfo,
                onSuccess,
            )
        })

        await waitFor(() => expect(onSuccess)
            .toHaveBeenCalledTimes(1))
        expect(request)
            .toHaveBeenCalledWith(operation === 'create' ? appeal.id : savedResponse.id, {
                appealId: appeal.id,
                content: 'No change',
                resourceId: 'reviewer-1',
                success,
            })
        expect(result.current.mappingAppeals[appeal.reviewItemCommentId]?.appealResponse?.success)
            .toBe(success)
        expect(updateReviewItem)
            .toHaveBeenCalledTimes(updatedResponse ? 1 : 0)
    })
})
