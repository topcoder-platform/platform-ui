import {
    isTopgearCommunity,
    OPPORTUNITIES_ROOT_ROUTE,
    topgearGroupIds,
} from './topgear.utils'

let mockSubdomain = 'platform-ui'
let mockGroupId: string | undefined = 'b7f7c0f8-8ee8-409e-9e5c-33404983b635'

jest.mock('~/config', () => ({
    AppSubdomain: { opportunities: 'opportunities', topgear: 'topgear' },
    EnvironmentConfig: {
        get SUBDOMAIN(): string { return mockSubdomain },
        get TOPGEAR(): { GROUP_ID: string | undefined } { return { GROUP_ID: mockGroupId } },
    },
}), { virtual: true })

describe('topgear utils', () => {
    beforeEach(() => {
        mockSubdomain = 'platform-ui'
        mockGroupId = 'b7f7c0f8-8ee8-409e-9e5c-33404983b635'
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

    it('keeps the canonical Opportunities listing route', () => {
        expect(OPPORTUNITIES_ROOT_ROUTE)
            .toBe('/opportunities')
    })
})
