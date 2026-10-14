import { login } from './authentication-url.config'

let mockSubdomain = 'topgear'

jest.mock('~/config', () => ({
    AppSubdomain: { topgear: 'topgear' },
    EnvironmentConfig: {
        AUTH: { ACCOUNTS_APP_CONNECTOR: 'https://accounts-auth0.topcoder-dev.com' },
        get SUBDOMAIN(): string { return mockSubdomain },
    },
}), { virtual: true })

describe('Accounts login URLs', () => {
    beforeEach(() => {
        mockSubdomain = 'topgear'
    })

    it('selects Wipro login and preserves the full supplied return URL on TopGear', () => {
        const returnUrl = 'https://topgear.topcoder-dev.com/opportunities/challenge/123?tab=details&view=list#terms'
        const url = new URL(login(returnUrl))

        expect(url.origin)
            .toBe('https://accounts-auth0.topcoder-dev.com')
        expect(url.searchParams.get('utm_source'))
            .toBe('wipro')
        expect(url.searchParams.get('retUrl'))
            .toBe(returnUrl)
    })

    it('selects Wipro login for sign-in links without an explicit return URL', () => {
        const url = new URL(login())

        expect(url.searchParams.get('retUrl'))
            .toBe(window.location.href.split('?')[0])
        expect(url.searchParams.get('utm_source'))
            .toBe('wipro')
    })

    it.each(['www', 'topcoder', 'platform-ui', 'opportunities', 'wipro'])(
        'preserves the standard login URL on the %s host',
        subdomain => {
            mockSubdomain = subdomain
            const returnUrl = `https://${subdomain}.topcoder-dev.com/opportunities`

            expect(login(returnUrl))
                .toBe(`https://accounts-auth0.topcoder-dev.com?retUrl=${encodeURIComponent(returnUrl)}`)
        },
    )

    it('does not select Wipro login on a normal host even when returning to TopGear', () => {
        mockSubdomain = 'www'
        expect(new URL(login('https://topgear.topcoder.com/opportunities')).searchParams.has('utm_source'))
            .toBe(false)
    })
})
