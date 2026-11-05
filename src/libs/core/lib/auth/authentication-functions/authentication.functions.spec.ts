import { decodeToken, getFreshToken } from '@topcoder-platform/tc-auth-lib'

import { initializeAsync } from './authentication.functions'

jest.mock('@topcoder-platform/tc-auth-lib', () => ({
    configureConnector: jest.fn(),
    decodeToken: jest.fn(),
    getFreshToken: jest.fn(),
}))
jest.mock('browser-cookies', () => ({ get: jest.fn() }))
jest.mock('../../logger', () => ({ logError: jest.fn() }))
jest.mock('~/config', () => ({
    AppSubdomain: { topgear: 'topgear' },
    EnvironmentConfig: { AUTH: { ACCOUNTS_APP_CONNECTOR: 'https://accounts.example.com' }, REAUTH_OFFSET: 55 },
    ToolTitle: {},
}), { virtual: true })

describe('browser session verification', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.resetAllMocks();
        (getFreshToken as jest.Mock).mockResolvedValue('token')
    })
    afterEach(() => jest.useRealTimers())

    it.each([undefined, false, 'true', 'false', 1])('rejects unverified tokens (%s)', async value => {
        (decodeToken as jest.Mock).mockReturnValue({ email_verified: value, exp: Date.now() / 1000 + 300 })
        expect(await initializeAsync())
            .toBeUndefined()
        expect(jest.getTimerCount())
            .toBe(0)
    })

    const verifiedClaims = ['email_verified', 'emailVerified', 'emailActive', 'https://topcoder.com/emailVerified']
    it.each(verifiedClaims)('accepts boolean verification in %s', async name => {
        (decodeToken as jest.Mock).mockReturnValue({ exp: Date.now() / 1000 + 300, [name]: true })
        expect(await initializeAsync())
            .toBe('token')
        expect(jest.getTimerCount())
            .toBe(1)
    })

    it.each([
        { 'https://attacker.example/email_verified': true },
        { email_verified: false, emailVerified: true },
        { isMachine: true, roles: ['Administrator'] },
    ])('rejects spoofed or conflicting verification: %j', async claims => {
        (decodeToken as jest.Mock).mockReturnValue(claims)
        expect(await initializeAsync())
            .toBeUndefined()
    })

    it('treats malformed tokens as signed out', async () => {
        (decodeToken as jest.Mock).mockImplementation(() => { throw new Error('invalid token') })
        expect(await initializeAsync())
            .toBeUndefined()
    })
})
