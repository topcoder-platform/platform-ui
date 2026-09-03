/* eslint-disable no-script-url, ordered-imports/ordered-imports */
import {
    challengeFileTypes,
    challengeForumUrl,
    challengeReviewAppUrl,
    challengeScorecardUrl,
    challengeSidebarLinks,
    challengeSubmissionLimit,
    memberProfileUrl,
} from './challenge-detail.utils'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        ADMIN: { ONLINE_REVIEW_URL: 'https://software.topcoder-dev.com/review' },
        REVIEW_APP_URL: 'https://review.topcoder-dev.com',
        TC_DOMAIN: 'topcoder-dev.com',
        URLS: { USER_PROFILE: 'https://profiles.topcoder-dev.com' },
        VANILLA_FORUM: { V2_URL: 'https://vanilla.topcoder-dev.com/api/v2' },
    },
}), { virtual: true })
jest.mock('~/libs/cms', () => ({
    getSafeCmsLink: (value?: string) => {
        if (!value) return undefined
        try {
            const url = new URL(value, 'https://topcoder-dev.com')
            const safeProtocol = ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
                || value.startsWith('#')
            const retired = url.hostname === 'contentful.com'
                || url.hostname.endsWith('.contentful.com')
                || url.hostname === 'ctfassets.net'
                || url.hostname.endsWith('.ctfassets.net')
                || url.hostname.includes('octana')
            return safeProtocol && !retired ? value : undefined
        } catch (error) {
            return undefined
        }
    },
}), { virtual: true })

describe('challenge detail utilities', () => {
    it('builds Review App links on the dedicated configured host', () => {
        expect(challengeReviewAppUrl('challenge with/slash'))
            .toBe('https://review.topcoder-dev.com/active-challenges/'
                + 'challenge%20with%2Fslash/challenge-details')
        expect(challengeReviewAppUrl('challenge-id', 'https://review.example/'))
            .toBe('https://review.example/active-challenges/challenge-id/challenge-details')
    })

    it('builds encoded links on the configured Profiles app host', () => {
        expect(memberProfileUrl('handle with/slash'))
            .toBe('https://profiles.topcoder-dev.com/handle%20with%2Fslash')
        expect(memberProfileUrl('coder', 'https://profiles.topcoder.com/'))
            .toBe('https://profiles.topcoder.com/coder')
    })

    it('parses case-insensitive file types and active submission limits', () => {
        const challenge = {
            id: 'challenge',
            metadata: [
                { name: 'FILETYPES', value: '["PSD", " psd ", "Sketch", ""]' },
                {
                    name: 'SubmissionLimit',
                    value: JSON.stringify({ count: '3', limit: 'true', unlimited: 'false' }),
                },
            ],
            name: 'Challenge',
        }

        expect(challengeFileTypes(challenge))
            .toEqual(['PSD', 'Sketch'])
        expect(challengeSubmissionLimit(challenge))
            .toBe(3)
    })

    it('retains a single authored file type when the API does not return a JSON array', () => {
        expect(challengeFileTypes({
            id: 'challenge',
            metadata: [{ name: 'fileTypes', value: 'Figma' }],
            name: 'Challenge',
        }))
            .toEqual(['Figma'])
    })

    it('returns only safe authored challenge and attachment links', () => {
        const links = challengeSidebarLinks({
            attachments: [
                { id: 'safe', name: 'Starter files', url: 'https://assets.topcoder-dev.com/starter.zip' },
                { id: 'unsafe', name: 'Unsafe', url: 'javascript:alert(1)' },
                { id: 'email', name: 'Email', url: 'mailto:owner@example.com' },
                { id: 'phone', name: 'Phone', url: 'tel:+15555550100' },
                { id: 'relative', name: 'Relative', url: '/downloads/starter.zip' },
            ],
            discussions: [
                { name: 'Discussion', url: 'https://vanilla.topcoder-dev.com/discussion/1' },
                { name: 'Legacy', url: 'https://cdn.contentful.com/legacy' },
                { name: 'Fragment', url: '#discussion' },
            ],
            id: 'challenge',
            metadata: [
                { name: 'environment', value: 'https://example.topcoder-dev.com' },
                { name: 'codeRepo', value: 'https://api.octana.io/repository' },
            ],
            name: 'Challenge',
        })

        expect(links.challengeLinks)
            .toEqual([
                { label: 'Environment', url: 'https://example.topcoder-dev.com/' },
                { label: 'Discussion', url: 'https://vanilla.topcoder-dev.com/discussion/1' },
            ])
        expect(links.attachments)
            .toEqual([{ label: 'Starter files', url: 'https://assets.topcoder-dev.com/starter.zip' }])
    })

    it('uses safe discussions first and derives deliberate dev/prod legacy forum URLs', () => {
        expect(challengeForumUrl({
            discussions: [{ url: 'https://vanilla.topcoder-dev.com/discussion/authored' }],
            id: 'authored',
            name: 'Authored',
        }))
            .toBe('https://vanilla.topcoder-dev.com/discussion/authored')
        expect(challengeForumUrl({
            id: 'design',
            legacy: { forumId: 123 },
            name: 'Design',
            track: 'Design',
        }, 'https://vanilla.topcoder-dev.com/api/v2'))
            .toBe('https://vanilla.topcoder-dev.com/?module=ThreadList&forumID=123')
        expect(challengeForumUrl({
            id: 'development',
            legacy: { forumId: 456 },
            name: 'Development',
            track: 'Development',
        }, 'https://vanilla.topcoder.com/api/v2'))
            .toBe('https://discussions.topcoder.com/?module=Category&categoryID=456')
        expect(challengeForumUrl({ id: 'no-forum', name: 'No forum' }, 'https://vanilla.topcoder-dev.com/api/v2'))
            .toBeUndefined()
        expect(challengeForumUrl({ id: 'bad', name: 'Bad config' }, 'javascript:alert(1)'))
            .toBeUndefined()
    })

    it('builds environment-aware scorecard links for positive legacy IDs only', () => {
        expect(challengeScorecardUrl(123, 'https://software.topcoder-dev.com/review'))
            .toBe('https://software.topcoder-dev.com/review/actions/ViewScorecard?scid=123')
        expect(challengeScorecardUrl(456, 'https://software.topcoder.com'))
            .toBe('https://software.topcoder.com/review/actions/ViewScorecard?scid=456')
        expect(challengeScorecardUrl(0, 'https://software.topcoder.com'))
            .toBeUndefined()
        expect(challengeScorecardUrl(Number.NaN, 'https://software.topcoder.com'))
            .toBeUndefined()
        expect(challengeScorecardUrl(123, 'javascript:alert(1)'))
            .toBeUndefined()
    })
})
