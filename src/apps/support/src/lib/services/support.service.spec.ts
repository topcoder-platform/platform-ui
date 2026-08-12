/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrPostAsync,
} from '~/libs/core'

import {
    addSupportResponse,
    assignSupportTicketToMe,
    autocompleteMemberHandles,
    buildTicketListUrl,
    closeSupportTicket,
    createSupportTicket,
    getSupportTicket,
    markSupportTicketRead,
    SUPPORT_API_BASE,
    unassignSupportTicketFromMe,
} from './support.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { API: { V6: 'https://api.example.test/v6' } },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn()
        .mockResolvedValue(undefined),
    xhrGetAsync: jest.fn()
        .mockResolvedValue({ data: [], meta: {} }),
    xhrPostAsync: jest.fn()
        .mockResolvedValue({ id: 'ticket' }),
}), { virtual: true })

const mockedDelete = xhrDeleteAsync as jest.Mock
const mockedGet = xhrGetAsync as jest.Mock
const mockedPost = xhrPostAsync as jest.Mock

describe('Support API service', () => {
    beforeEach(() => {
        mockedDelete.mockClear()
        mockedGet.mockClear()
        mockedPost.mockClear()
    })

    it('encodes allowlisted list filters and omits empty values', () => {
        const url = buildTicketListUrl({
            challengeId: ' challenge/id ',
            description: 'login & access',
            memberHandle: 'handle name',
            page: 2,
            perPage: 20,
            status: 'CLOSED',
        })

        expect(url)
            .toBe(
                `${SUPPORT_API_BASE}/tickets?status=CLOSED&page=2&perPage=20`
            + '&challengeId=challenge%2Fid&description=login+%26+access&memberHandle=handle+name',
            )
        expect(buildTicketListUrl({
            description: ' ',
            page: 1,
            perPage: 20,
            status: 'OPEN',
        })).not.toContain('description=')
    })

    it('uses exact mutation paths, encoded IDs, and payloads', async () => {
        await createSupportTicket({ challengeId: 'challenge', description: 'Help' })
        await getSupportTicket('ticket/id')
        await addSupportResponse('ticket/id', { markdown: 'Reply' })
        await assignSupportTicketToMe('ticket/id')
        await unassignSupportTicketFromMe('ticket/id')
        await markSupportTicketRead('ticket/id')
        await closeSupportTicket('ticket/id')

        expect(mockedPost.mock.calls)
            .toEqual([
                [`${SUPPORT_API_BASE}/tickets`, { challengeId: 'challenge', description: 'Help' }],
                [`${SUPPORT_API_BASE}/tickets/ticket%2Fid/responses`, { markdown: 'Reply' }],
                [`${SUPPORT_API_BASE}/tickets/ticket%2Fid/assignees/me`, {}],
                [`${SUPPORT_API_BASE}/tickets/ticket%2Fid/read`, {}],
                [`${SUPPORT_API_BASE}/tickets/ticket%2Fid/close`, {}],
            ])
        expect(mockedGet)
            .toHaveBeenCalledWith(`${SUPPORT_API_BASE}/tickets/ticket%2Fid`)
        expect(mockedDelete)
            .toHaveBeenCalledWith(`${SUPPORT_API_BASE}/tickets/ticket%2Fid/assignees/me`)
    })

    it('encodes autocomplete terms and normalizes numeric IDs', async () => {
        mockedGet.mockResolvedValueOnce([{ handle: 'tourist', userId: 123 }])

        await expect(autocompleteMemberHandles('tour ist')).resolves.toEqual([
            { handle: 'tourist', userId: '123' },
        ])
        expect(mockedGet)
            .toHaveBeenCalledWith(
                'https://api.example.test/v6/members/autocomplete?term=tour%20ist',
            )
    })
})
