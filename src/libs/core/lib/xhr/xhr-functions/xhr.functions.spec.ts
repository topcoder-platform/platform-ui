import { AxiosHeaders, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

import { tokenGetAsync } from '../../auth'

import { createInstance, getAsync, postAsync } from './xhr.functions'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        LOCAL_SERVICE_OVERRIDES: [],
    },
}), { virtual: true })

jest.mock('../../auth', () => ({
    tokenGetAsync: jest.fn(),
}), { virtual: true })

describe('xhr post serialization', () => {
    it('serializes submission payloads as JSON and keeps the application/json content type', async () => {
        const tokenGet = tokenGetAsync as jest.MockedFunction<typeof tokenGetAsync>
        tokenGet.mockResolvedValue({ token: 'auth-token' } as never)
        const controller = new AbortController()
        const payload = {
            challengeId: 'challenge-id',
            memberId: '123',
            type: 'CHECKPOINT_SUBMISSION',
            url: 'https://s3.amazonaws.com/submission-dmz/challenge-id-123-CHECKPOINT_SUBMISSION.zip',
        }
        let captured: InternalAxiosRequestConfig | undefined
        const xhr = createInstance()
        xhr.defaults.adapter = async config => {
            captured = config

            return {
                config,
                data: { id: 'submission-id' },
                headers: new AxiosHeaders(),
                status: 201,
                statusText: 'Created',
            }
        }

        await expect(postAsync(
            'https://api.example/v6/submissions',
            payload,
            { signal: controller.signal },
            xhr,
        ))
            .resolves.toEqual({ id: 'submission-id' })

        expect(tokenGet)
            .toHaveBeenCalledTimes(1)
        expect(captured?.data)
            .toBe(JSON.stringify(payload))
        expect(AxiosHeaders.from(captured?.headers)
            .get('Content-Type'))
            .toBe('application/json')
        expect(AxiosHeaders.from(captured?.headers)
            .get('Authorization'))
            .toBe('Bearer auth-token')
        expect(captured?.signal)
            .toBe(controller.signal)
    })
})

describe('xhr get request configuration', () => {
    it('forwards cancellation and timeout controls to Axios', async () => {
        const controller = new AbortController()
        const get = jest.fn()
            .mockResolvedValue({ data: { id: 'term-id' } })
        const xhr = { get } as unknown as AxiosInstance

        await expect(getAsync(
            'https://api.example/v5/terms/term-id',
            xhr,
            { signal: controller.signal, timeout: 10_000 },
        ))
            .resolves.toEqual({ id: 'term-id' })
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v5/terms/term-id',
                { signal: controller.signal, timeout: 10_000 },
            )
    })
})
