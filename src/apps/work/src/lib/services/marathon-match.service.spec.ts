/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrPostAsync } from '~/libs/core'

import { uploadMarathonMatchTestSubmission } from './marathon-match.service'

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
    xhrGetPaginatedAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
    xhrPutAsync: jest.fn(),
}), {
    virtual: true,
})
jest.mock('../constants', () => ({
    MARATHON_MATCH_API_URL: 'https://example.com/marathon-match',
}))

describe('marathon-match.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('uploads validation submissions as multipart form data', async () => {
        const mockedPostAsync = xhrPostAsync as jest.Mock
        const file = new File(['zip'], 'solution.zip', {
            type: 'application/zip',
        })

        mockedPostAsync.mockResolvedValue({
            challengeId: '30000123',
            cloudWatchLogsConsoleUrl: 'https://logs.example.com/task-1',
            configType: 'PROVISIONAL',
            submissionId: 'submission-1',
            taskArn: 'arn:aws:ecs:task/task-1',
            taskId: 'task-1',
        })

        await expect(
            uploadMarathonMatchTestSubmission('30000123', {
                configType: 'PROVISIONAL',
                file,
            }),
        )
            .resolves
            .toEqual({
                challengeId: '30000123',
                cloudWatchLogsConsoleUrl: 'https://logs.example.com/task-1',
                configType: 'PROVISIONAL',
                submissionId: 'submission-1',
                taskArn: 'arn:aws:ecs:task/task-1',
                taskId: 'task-1',
            })

        expect(mockedPostAsync)
            .toHaveBeenCalledWith(
                'https://example.com/marathon-match/challenge/30000123/test-submission',
                expect.any(FormData),
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                },
            )

        const formData = mockedPostAsync.mock.calls[0][1] as FormData
        const uploadedFile = formData.get('file') as File

        expect(formData.get('configType'))
            .toBe('PROVISIONAL')
        expect(formData.get('fileName'))
            .toBe('solution.zip')
        expect(uploadedFile.name)
            .toBe('solution.zip')
    })

    it('rejects malformed validation submission responses', async () => {
        const mockedPostAsync = xhrPostAsync as jest.Mock
        const file = new File(['zip'], 'solution.zip', {
            type: 'application/zip',
        })

        mockedPostAsync.mockResolvedValue({
            challengeId: '30000123',
        })

        await expect(
            uploadMarathonMatchTestSubmission('30000123', {
                configType: 'PROVISIONAL',
                file,
            }),
        )
            .rejects
            .toThrow('Marathon match validation upload response was invalid')
    })
})
