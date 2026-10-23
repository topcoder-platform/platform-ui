/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrGetAsync,
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    fetchMarathonMatchConfig,
    fetchMarathonMatchDefaults,
    fetchMarathonMatchTestSubmissionStatus,
    updateMarathonMatchConfig,
    uploadMarathonMatchTestSubmission,
} from './marathon-match.service'

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
            status: 'QUEUED',
            submissionId: 'validation-run-1',
            taskArn: 'arn:aws:ecs:task/task-1',
            taskId: 'task-1',
            testSubmissionId: 'validation-run-1',
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
                status: 'QUEUED',
                submissionId: 'validation-run-1',
                taskArn: 'arn:aws:ecs:task/task-1',
                taskId: 'task-1',
                testSubmissionId: 'validation-run-1',
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

    it('fetches validation submission status details', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            challengeId: '30000123',
            cloudWatchLogsConsoleUrl: 'https://logs.example.com/task-1',
            completedAt: '2026-06-17T01:02:03.000Z',
            completedTests: 50,
            configType: 'PROVISIONAL',
            failedTests: 0,
            fileName: 'solution.zip',
            fileSize: 3,
            metadata: {
                testType: 'provisional',
            },
            progress: 1,
            score: 88.5,
            status: 'SUCCESS',
            submissionId: 'validation-run-1',
            taskArn: 'arn:aws:ecs:task/task-1',
            taskId: 'task-1',
            testSubmissionId: 'validation-run-1',
            totalTests: 50,
            updatedAt: '2026-06-17T01:02:03.000Z',
        })

        await expect(
            fetchMarathonMatchTestSubmissionStatus(
                '30000123',
                'validation-run-1',
            ),
        )
            .resolves
            .toMatchObject({
                challengeId: '30000123',
                fileName: 'solution.zip',
                metadata: {
                    testType: 'provisional',
                },
                score: 88.5,
                status: 'SUCCESS',
                testSubmissionId: 'validation-run-1',
            })

        expect(mockedGetAsync)
            .toHaveBeenCalledWith(
                'https://example.com/marathon-match/challenge/30000123/test-submission/validation-run-1',
            )
    })

    it('reads the default scorer memory limit from the defaults response', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            compileTimeout: 120000,
            memoryLimit: 2048,
            reviewScorecardId: 'scorecard-1',
            taskDefinitionName: 'mm-ecs-runner',
            taskDefinitionVersion: '7',
            testTimeout: 90000,
        })

        await expect(fetchMarathonMatchDefaults())
            .resolves
            .toMatchObject({
                memoryLimit: 2048,
            })
    })

    it('normalizes a saved config without a memory limit to null', async () => {
        const mockedGetAsync = xhrGetAsync as jest.Mock

        mockedGetAsync.mockResolvedValue({
            active: true,
            challengeId: '30000123',
            compileTimeout: 120000,
            createdAt: '2026-06-17T01:02:03.000Z',
            id: 'config-1',
            name: 'Marathon Match Scorer',
            relativeScoringEnabled: true,
            reviewScorecardId: 'scorecard-1',
            scoreDirection: 'MAXIMIZE',
            taskDefinitionName: 'mm-ecs-runner',
            taskDefinitionVersion: '7',
            testerId: 'tester-1',
            testTimeout: 90000,
            updatedAt: '2026-06-17T01:02:03.000Z',
        })

        const config = await fetchMarathonMatchConfig('30000123')

        expect(config?.memoryLimit)
            .toBeNull()
    })

    it('sends the memory limit when updating a scorer config', async () => {
        const mockedPutAsync = xhrPutAsync as jest.Mock

        mockedPutAsync.mockResolvedValue({
            active: true,
            challengeId: '30000123',
            compileTimeout: 120000,
            createdAt: '2026-06-17T01:02:03.000Z',
            id: 'config-1',
            memoryLimit: 4096,
            name: 'Marathon Match Scorer',
            relativeScoringEnabled: true,
            reviewScorecardId: 'scorecard-1',
            scoreDirection: 'MAXIMIZE',
            taskDefinitionName: 'mm-ecs-runner',
            taskDefinitionVersion: '7',
            testerId: 'tester-1',
            testTimeout: 90000,
            updatedAt: '2026-06-17T01:02:03.000Z',
        })

        const config = await updateMarathonMatchConfig('30000123', {
            memoryLimit: 4096,
        })

        expect(mockedPutAsync)
            .toHaveBeenCalledWith(
                'https://example.com/marathon-match/challenge/30000123',
                expect.objectContaining({
                    memoryLimit: 4096,
                }),
            )
        expect(config.memoryLimit)
            .toBe(4096)
    })
})
