/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { act } from 'react'
import { renderHook } from '@testing-library/react'
import type { RenderHookResult } from '@testing-library/react'

import { getSubmissionDownloadUrl } from '../services'

import { useDownloadSubmission } from './useDownloadSubmission'

jest.mock('../services', () => ({
    getSubmissionDownloadUrl: jest.fn(),
}))

jest.mock('../utils', () => ({
    showErrorToast: jest.fn(),
}))

const mockedGetSubmissionDownloadUrl
    = getSubmissionDownloadUrl as jest.MockedFunction<typeof getSubmissionDownloadUrl>

describe('useDownloadSubmission', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('clicks the signed URL directly instead of creating a Blob URL', async () => {
        const signedUrl = 'https://storage.example.test/signed-submission'
        const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click')
            .mockImplementation(() => undefined)

        mockedGetSubmissionDownloadUrl.mockResolvedValue(signedUrl)

        const { result }: RenderHookResult<
            ReturnType<typeof useDownloadSubmission>,
            unknown
        > = renderHook(() => useDownloadSubmission())

        await act(async () => {
            await result.current.downloadSubmission(' submission-id ')
        })

        expect(mockedGetSubmissionDownloadUrl)
            .toHaveBeenCalledWith('submission-id')
        expect(clickSpy)
            .toHaveBeenCalledTimes(1)

        const clickedLink: HTMLAnchorElement
            = clickSpy.mock.instances[0] as unknown as HTMLAnchorElement
        expect(clickedLink.href)
            .toBe(signedUrl)
        expect(clickedLink.download)
            .toBe('submission-submission-id.zip')
    })
})
