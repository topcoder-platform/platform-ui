/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import {
    downloadSubmission,
    getSubmissionDownloadUrl,
} from './submissions.service'

jest.mock('~/libs/core', () => ({
    xhrCreateInstance: jest.fn(() => ({
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
    xhrGetAsync: jest.fn(),
}), {
    virtual: true,
})

jest.mock('../constants', () => ({
    SUBMISSIONS_API_URL: 'https://api.topcoder.test/v6/submissions',
}))

jest.mock('../utils/auth.utils', () => ({
    buildAuthHeaders: jest.fn(() => ({})),
}))

const mockedXhrGetAsync = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
const mockedFetch = jest.fn()
const originalFetch = globalThis.fetch

describe('submission downloads', () => {
    beforeAll(() => {
        globalThis.fetch = mockedFetch as typeof fetch
    })

    afterAll(() => {
        globalThis.fetch = originalFetch
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('requests and returns a signed download URL without following an API redirect', async () => {
        mockedXhrGetAsync.mockResolvedValue({
            url: 'https://storage.example.test/signed-submission',
        } as never)

        await expect(getSubmissionDownloadUrl(' submission/id '))
            .resolves
            .toBe('https://storage.example.test/signed-submission')
        expect(mockedXhrGetAsync)
            .toHaveBeenCalledWith(
                'https://api.topcoder.test/v6/submissions/submission%2Fid/download-url',
            )
        expect(mockedFetch)
            .not.toHaveBeenCalled()
    })

    it('downloads bulk-compatible blobs directly without credentials or custom headers', async () => {
        const submissionBlob = new Blob(['submission'])
        const blob = jest.fn()
            .mockResolvedValue(submissionBlob)

        mockedXhrGetAsync.mockResolvedValue({
            url: 'https://storage.example.test/signed-submission',
        } as never)
        mockedFetch.mockResolvedValue({
            blob,
            ok: true,
            status: 200,
        })

        await expect(downloadSubmission('submission-id'))
            .resolves
            .toBe(submissionBlob)
        expect(mockedFetch)
            .toHaveBeenCalledWith(
                'https://storage.example.test/signed-submission',
                {
                    credentials: 'omit',
                },
            )
        expect(blob)
            .toHaveBeenCalledTimes(1)
    })

    it('rejects a malformed download URL response before contacting storage', async () => {
        mockedXhrGetAsync.mockResolvedValue({} as never)

        await expect(downloadSubmission('submission-id'))
            .rejects
            .toThrow('Submission download URL is missing')
        expect(mockedFetch)
            .not.toHaveBeenCalled()
    })
})
