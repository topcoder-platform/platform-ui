/* eslint-disable import/no-extraneous-dependencies */
import {
    buildSupportChallengeUrl,
    isSupportTeamMember,
    markdownToPlainText,
    sortResponsesAscending,
    truncateText,
} from './support.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        URLS: { CHALLENGES_PAGE: 'https://www.example.test/challenges/' },
    },
}), { virtual: true })

jest.mock('~/libs/core', () => ({
    UserRole: { topcoderSupportTeam: 'Topcoder Support Team' },
}), { virtual: true })

describe('Support utilities', () => {
    it('builds an encoded environment-specific challenge link', () => {
        expect(buildSupportChallengeUrl('challenge/id'))
            .toBe('https://www.example.test/challenges/challenge%2Fid')
    })

    it('matches only the exact Support Team role case-insensitively', () => {
        expect(isSupportTeamMember([' topcoder SUPPORT team ']))
            .toBe(true)
        expect(isSupportTeamMember(['Topcoder Staff', 'Support Team']))
            .toBe(false)
        expect(isSupportTeamMember(undefined))
            .toBe(false)
    })

    it('produces bounded plain-text ticket previews', () => {
        const plain = markdownToPlainText('## **Login** [details](https://example.test) <b>unsafe</b>')

        expect(plain)
            .toBe('Login details unsafe')
        expect(truncateText(plain, 12))
            .toBe('Login detai…')
        expect(truncateText('short', 12))
            .toBe('short')
    })

    it('sorts replies ascending without mutating the API array', () => {
        const responses = [
            {
                createdAt: '2026-08-02T00:00:00.000Z',
                id: 'later',
                markdown: 'Later',
                readBy: [],
                userHandle: 'staff',
                userId: '2',
            },
            {
                createdAt: '2026-08-01T00:00:00.000Z',
                id: 'first',
                markdown: 'First',
                readBy: [],
                userHandle: 'member',
                userId: '1',
            },
        ]

        expect(sortResponsesAscending(responses)
            .map(response => response.id))
            .toEqual(['first', 'later'])
        expect(responses.map(response => response.id))
            .toEqual(['later', 'first'])
    })
})
