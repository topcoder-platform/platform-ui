/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import { xhrGetAsync } from '~/libs/core'

import { searchGiteaTeams } from './gitea-teams.service'

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
    xhrCreateInstance: jest.fn(() => ({
        defaults: {
            headers: {
                common: {},
            },
        },
    })),
    xhrGetAsync: jest.fn(),
}), {
    virtual: true,
})

const mockedGet = xhrGetAsync as jest.Mock

describe('searchGiteaTeams', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('requests the trimmed keyword and normalizes the matches', async () => {
        mockedGet.mockResolvedValue([
            {
                description: '  TC reviewers ',
                id: 34,
                name: ' reviewers ',
                organization: ' topcoder ',
            },
            {
                id: '12',
                name: 'devs',
                organization: 'partner',
            },
        ])

        const teams = await searchGiteaTeams('  reviewers  ')

        expect(mockedGet.mock.calls[0][0])
            .toContain('/reviews/gitea/teams?')
        expect(mockedGet.mock.calls[0][0])
            .toContain('q=reviewers')
        expect(mockedGet.mock.calls[0][0])
            .toContain('limit=20')
        expect(teams)
            .toEqual([
                {
                    description: 'TC reviewers',
                    id: 34,
                    name: 'reviewers',
                    organization: 'topcoder',
                },
                {
                    description: undefined,
                    id: 12,
                    name: 'devs',
                    organization: 'partner',
                },
            ])
    })

    it('drops matches without a usable id or name', async () => {
        mockedGet.mockResolvedValue([
            { name: 'no-id', organization: 'topcoder' },
            { id: 0, name: 'zero' },
            { id: 11, name: '  ' },
            { id: 22, name: 'kept', organization: 'topcoder' },
        ])

        expect(await searchGiteaTeams('team'))
            .toEqual([{
                description: undefined,
                id: 22,
                name: 'kept',
                organization: 'topcoder',
            }])
    })

    it.each([
        ['a blank keyword', '   '],
        ['an empty keyword', ''],
    ])('performs no request for %s', async (_label, term) => {
        expect(await searchGiteaTeams(term))
            .toEqual([])
        expect(mockedGet)
            .not
            .toHaveBeenCalled()
    })

    it('returns no matches when the response is not a list', async () => {
        mockedGet.mockResolvedValue({ message: 'unexpected' })

        expect(await searchGiteaTeams('devs'))
            .toEqual([])
    })

    it('surfaces the API error message', async () => {
        mockedGet.mockRejectedValue({
            response: { data: { message: 'Forbidden' } },
        })

        await expect(searchGiteaTeams('devs'))
            .rejects
            .toThrow('Forbidden')
    })
})
