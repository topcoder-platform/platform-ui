/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrPostAsync,
    xhrPutAsync,
} from '~/libs/core'

import {
    createAiReviewConfig,
    updateAiReviewConfig,
} from './ai-review-configs.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://example.com/v6',
        },
    },
}), {
    virtual: true,
})
jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
    xhrPutAsync: jest.fn(),
}), {
    virtual: true,
})

describe('ai-review-configs.service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('preserves an explicit empty templateId when updating a config', async () => {
        const mockedPutAsync = xhrPutAsync as jest.Mock

        mockedPutAsync.mockResolvedValue({
            autoFinalize: false,
            challengeId: 'challenge-1',
            id: 'config-1',
            minPassingThreshold: 70,
            mode: 'AI_GATING',
            workflows: [
                {
                    id: 'config-workflow-1',
                    isGating: true,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        })

        await updateAiReviewConfig('config-1', {
            autoFinalize: false,
            challengeId: 'challenge-1',
            minPassingThreshold: 70,
            mode: 'AI_GATING',
            templateId: '',
            workflows: [
                {
                    isGating: true,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        })

        expect(mockedPutAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/ai-review/configs/config-1',
                expect.objectContaining({
                    templateId: '',
                }),
            )
    })

    it('omits templateId when creating a manual config from scratch', async () => {
        const mockedPostAsync = xhrPostAsync as jest.Mock

        mockedPostAsync.mockResolvedValue({
            autoFinalize: false,
            challengeId: 'challenge-1',
            id: 'config-1',
            minPassingThreshold: 70,
            mode: 'AI_GATING',
            workflows: [
                {
                    id: 'config-workflow-1',
                    isGating: true,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        })

        await createAiReviewConfig({
            autoFinalize: false,
            challengeId: 'challenge-1',
            minPassingThreshold: 70,
            mode: 'AI_GATING',
            workflows: [
                {
                    isGating: true,
                    weightPercent: 100,
                    workflowId: 'workflow-1',
                },
            ],
        })

        expect(mockedPostAsync)
            .toHaveBeenCalledWith(
                'https://example.com/v6/ai-review/configs',
                expect.not.objectContaining({
                    templateId: expect.anything(),
                }),
            )
    })
})
