import { xhrGetAsync } from '~/libs/core'

import { contactLookupMember } from './contact.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { CONTACT_API: 'https://contact-api.example.test/v6/contact/' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({ xhrGetAsync: jest.fn() }), { virtual: true })

describe('Contact human member lookup transport', () => {
    beforeEach(() => { jest.resetAllMocks() })

    it.each([
        ['  Ada+newsletter@example.test  ', 'Ada%2Bnewsletter%40example.test'],
        ['  12345  ', '12345'],
    ])('trims and encodes %s without interpreting member IDs', async (input, encoded) => {
        const member = { email: 'ada@example.test', handle: 'Ada', memberId: 'canonical-17' };
        (xhrGetAsync as jest.Mock).mockResolvedValue(member)
        await expect(contactLookupMember(input)).resolves.toEqual(member)
        expect(xhrGetAsync)
            .toHaveBeenCalledWith(
                `https://contact-api.example.test/v6/contact/members/lookup?query=${encoded}`,
            )
    })

    it('rejects empty input before making a request', async () => {
        await expect(contactLookupMember('   ')).rejects.toThrow('Enter a Topcoder handle or email address.')
        expect(xhrGetAsync).not.toHaveBeenCalled()
    })
})
