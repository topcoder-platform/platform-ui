import {
    isTopgearChallenge,
    isTopgearCommunity,
    topgearGroupIds,
    topgearTermsUrl,
    TOPGEAR_CHALLENGES_ROUTE,
} from './topgear.utils'

let mockSubdomain = 'platform-ui'
let mockGroupId: string | undefined = 'b7f7c0f8-8ee8-409e-9e5c-33404983b635'
let mockTermsUrl: string | undefined = 'https://topgear.topcoder.example/challenges/terms/detail/topgear-terms'

jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities', topgear: 'topgear' },
    EnvironmentConfig: {
        get SUBDOMAIN(): string { return mockSubdomain },
        get TOPGEAR(): { GROUP_ID: string | undefined } { return { GROUP_ID: mockGroupId } },
        get URLS(): { TOPGEAR_TERMS: string | undefined } { return { TOPGEAR_TERMS: mockTermsUrl } },
    },
}), { virtual: true })

describe('topgear utils', () => {
    beforeEach(() => {
        mockSubdomain = 'platform-ui'
        mockGroupId = 'b7f7c0f8-8ee8-409e-9e5c-33404983b635'
        mockTermsUrl = 'https://topgear.topcoder.example/challenges/terms/detail/topgear-terms'
    })

    it('recognizes only the topgear host as the TopGear community', () => {
        expect(isTopgearCommunity())
            .toBe(false)
        mockSubdomain = 'opportunities'
        expect(isTopgearCommunity())
            .toBe(false)
        mockSubdomain = 'topgear'
        expect(isTopgearCommunity())
            .toBe(true)
    })

    it('lists the configured TopGear group and ignores blank configuration', () => {
        expect(topgearGroupIds())
            .toEqual(['b7f7c0f8-8ee8-409e-9e5c-33404983b635'])
        mockGroupId = '  '
        expect(topgearGroupIds())
            .toEqual([])
        mockGroupId = undefined
        expect(topgearGroupIds())
            .toEqual([])
    })

    it('treats challenges in the TopGear group or on the TopGear host as TopGear challenges', () => {
        expect(isTopgearChallenge({ groups: ['b7f7c0f8-8ee8-409e-9e5c-33404983b635', 'other'] }))
            .toBe(true)
        expect(isTopgearChallenge({ groups: ['other'] }))
            .toBe(false)
        expect(isTopgearChallenge({}))
            .toBe(false)
        mockGroupId = undefined
        expect(isTopgearChallenge({ groups: ['b7f7c0f8-8ee8-409e-9e5c-33404983b635'] }))
            .toBe(false)
        mockSubdomain = 'topgear'
        expect(isTopgearChallenge({}))
            .toBe(true)
    })

    it('resolves the configured TopGear terms page', () => {
        expect(topgearTermsUrl())
            .toBe('https://topgear.topcoder.example/challenges/terms/detail/topgear-terms')
        mockTermsUrl = undefined
        expect(topgearTermsUrl())
            .toBe('')
    })

    it('keeps the canonical Opportunities listing route', () => {
        expect(TOPGEAR_CHALLENGES_ROUTE)
            .toBe('/opportunities/challenge')
    })
})
