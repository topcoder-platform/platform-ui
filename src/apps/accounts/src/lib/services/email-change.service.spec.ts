/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync, xhrPostAsync } from '~/libs/core'

import {
    completeEmailChangeAsync,
    initiateEmailChangeAsync,
    requestEmailChangeOtpAsync,
    verifyEmailChangeOtpAsync,
} from './email-change.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example.test/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
    xhrPostAsync: jest.fn(),
}), { virtual: true })

const mockedGet = xhrGetAsync as jest.Mock
const mockedPost = xhrPostAsync as jest.Mock

describe('email change API service', () => {
    beforeEach(() => {
        mockedGet.mockReset()
        mockedPost.mockReset()
    })

    it('uses the ownership, proof, validation, and completion endpoints', async () => {
        mockedPost
            .mockResolvedValueOnce({ expiresIn: 600 })
            .mockResolvedValueOnce({ expiresIn: 600, verificationToken: 'proof' })
            .mockResolvedValueOnce({ email: 'new@example.com' })
        mockedGet.mockResolvedValueOnce({ email: 'new@example.com' })

        await requestEmailChangeOtpAsync(123)
        await verifyEmailChangeOtpAsync(123, '012345')
        await initiateEmailChangeAsync(123, 'new@example.com', 'proof')
        await completeEmailChangeAsync('signed/token')

        expect(mockedPost.mock.calls)
            .toEqual([
                ['https://api.example.test/v6/users/123/email-change/otp', {}],
                [
                    'https://api.example.test/v6/users/123/email-change/verify-otp',
                    { param: { otp: '012345' } },
                ],
                [
                    'https://api.example.test/v6/users/123/email-change',
                    { param: { email: 'new@example.com', verificationToken: 'proof' } },
                ],
            ])
        expect(mockedGet)
            .toHaveBeenCalledWith(
                'https://api.example.test/v6/users/email-change/verify?token=signed%2Ftoken',
            )
    })
})
