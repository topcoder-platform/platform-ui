import { AxiosHeaders } from 'axios'

import { tokenGetAsync } from '../../../libs/core/lib/auth'
import { globalInstance } from '../../../libs/core/lib/xhr/xhr-functions/xhr.functions'

import { salesforceSyncErrorMessage, syncSalesforceData } from './salesforce-sync.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example/v6' }, LOCAL_SERVICE_OVERRIDES: [] },
}), { virtual: true })

jest.mock('../../../libs/core/lib/auth', () => ({ tokenGetAsync: jest.fn() }))

jest.mock('~/libs/core', () => ({
    xhrPostAsync: jest.requireActual('../../../libs/core/lib/xhr/xhr-functions/xhr.functions').postAsync,
}), { virtual: true })

describe('Salesforce sync request', () => {
    it('posts to billing accounts with the signed-in user JWT and waits for the response', async () => {
        const getToken = tokenGetAsync as jest.MockedFunction<typeof tokenGetAsync>
        getToken.mockResolvedValue({ token: 'signed-in-user-jwt' } as never)
        const originalAdapter = globalInstance.defaults.adapter
        const counts = { conflicted: 0, scanned: 1, unchanged: 0, unmatched: 0, updated: 1 }
        const result = { billingAccounts: counts, clients: counts }
        globalInstance.defaults.adapter = async config => {
            expect(config.method)
                .toBe('post')
            expect(config.url)
                .toBe('https://api.example/v6/billing-accounts/salesforce-sync')
            expect(AxiosHeaders.from(config.headers)
                .get('Authorization'))
                .toBe('Bearer signed-in-user-jwt')
            expect(config.timeout)
                .toBe(360000)
            return { config, data: result, headers: new AxiosHeaders(), status: 200, statusText: 'OK' }
        }

        try {
            await expect(syncSalesforceData())
                .resolves.toEqual(result)
        } finally {
            globalInstance.defaults.adapter = originalAdapter
        }
    })

    it.each([401, 403, 409, 503, 502])('explains HTTP %s without exposing response bodies', status => {
        const message = salesforceSyncErrorMessage({ response: { data: 'secret', status } })
        expect(message)
            .not.toContain('secret')
        expect(message.length)
            .toBeGreaterThan(20)
    })
})
