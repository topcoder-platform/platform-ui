import { xhrGetAsync } from '~/libs/core'

import { hasTopgearAccess } from './topgear-access.service'

let mockAccessGroupId = 'wipro-all'
jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V6: 'https://api.example.com/v6' },
        TOPGEAR: { get ACCESS_GROUP_ID(): string { return mockAccessGroupId } },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({ xhrGetAsync: jest.fn() }), { virtual: true })
const get = xhrGetAsync as jest.Mock

describe('Topgear membership service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockAccessGroupId = 'wipro-all'
    })

    it('uses authenticated member-group IDs and grants only the configured access group', async () => {
        const signal = new AbortController().signal
        get.mockResolvedValue(['another-group', 'wipro-all'])
        await expect(hasTopgearAccess('123', signal)).resolves.toBe(true)
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example.com/v6/groups/memberGroups/123?uuid=true',
                undefined,
                { signal, timeout: 15000 },
            )
        get.mockResolvedValue(['another-group'])
        await expect(hasTopgearAccess('123')).resolves.toBe(false)
        get.mockResolvedValue([])
        await expect(hasTopgearAccess('123')).resolves.toBe(false)
    })

    it('fails closed for missing identity or configuration without a membership request', async () => {
        await expect(hasTopgearAccess('')).resolves.toBe(false)
        mockAccessGroupId = ' '
        await expect(hasTopgearAccess('123')).resolves.toBe(false)
        expect(get).not.toHaveBeenCalled()
    })

    const invalidResponses = [undefined, { groups: ['wipro-all'] }, [{ id: 'wipro-all' }]]
    it.each(invalidResponses)('rejects malformed group responses: %s', async response => {
        get.mockResolvedValue(response)
        await expect(hasTopgearAccess('123')).rejects.toThrow('Invalid group membership response')
    })

    it.each([401, 403, 500])('does not grant access on HTTP %s', async status => {
        get.mockRejectedValue({ status })
        await expect(hasTopgearAccess('123')).rejects.toEqual({ status })
    })
})
