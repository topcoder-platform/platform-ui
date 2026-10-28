/* eslint-disable no-script-url, ordered-imports/ordered-imports */
import {
    challengeAllowsStockArt,
    challengeFileTypes,
    challengeForumUrl,
    challengeManualReviewScorecardId,
    challengeManualReviewScorecardUrl,
    challengeReviewAppUrl,
    challengeScorecardUrl,
    challengeSidebarLinks,
    challengeSubmissionMode,
    challengeSubmissionLimit,
    memberProfileUrl,
    submissionAiReviewAppUrl,
} from './challenge-detail.utils'

jest.mock('~/config', () => ({
    AppSubdomain: { topgear: 'topgear' },
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

    it('builds encoded Review App links for one AI workflow run', () => {
        expect(submissionAiReviewAppUrl(
            'challenge with/slash',
            'submission with/slash',
            'workflow with/slash',
            'https://review.example/',
        ))
            .toBe('https://review.example/active-challenges/challenge%20with%2Fslash'
                + '/reviews/submission%20with%2Fslash?workflowId=workflow%20with%2Fslash')
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

    it('requires an explicit stock-art allowance from challenge metadata', () => {
        const challenge = {
            id: 'challenge',
            metadata: [{ name: 'ALLOWSTOCKART', value: ' true ' }],
            name: 'Challenge',
        }

        expect(challengeAllowsStockArt(challenge))
            .toBe(true)
        expect(challengeAllowsStockArt({
            ...challenge,
            metadata: [{ name: 'allowStockArt', value: false }],
        }))
            .toBe(false)
        expect(challengeAllowsStockArt({ ...challenge, metadata: [] }))
            .toBe(false)
    })

    it('enables URL submissions only for the exact normalized metadata value', () => {
        expect(challengeSubmissionMode({
            id: 'url-challenge',
            metadata: [{ name: ' SUBMISSION_TYPE ', value: ' URL ' }],
            name: 'URL challenge',
        }))
            .toBe('url')
        expect(challengeSubmissionMode({
            id: 'zip-challenge',
            metadata: [{ name: 'submission_type', value: 'zip' }],
            name: 'ZIP challenge',
        }))
            .toBe('zip')
        expect(challengeSubmissionMode({
            id: 'unsupported-challenge',
            metadata: [{ name: 'submission_type', value: 'external-url' }],
            name: 'Unsupported challenge',
        }))
            .toBe('zip')
        expect(challengeSubmissionMode({
            id: 'default-challenge',
            name: 'Default challenge',
        }))
            .toBe('zip')
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

    describe('manual review scorecard', () => {
        const reviewPhaseId = 'aa5a3f78-79e0-4bf7-93ff-b11e8f5b398b'
        const screeningPhaseId = '2d7d3d85-0b29-4989-b3b4-be7f2b1d0aa6'
        const iterativeReviewPhaseId = '003a4b14-de5d-43fc-9e35-835dbeb6af1f'
        const phases = [
            { id: 'screening-instance', name: 'Screening', phaseId: screeningPhaseId },
            { id: 'review-instance', name: 'Review', phaseId: reviewPhaseId },
        ]

        it('selects the member reviewer scorecard on the Review phase', () => {
            const challenge = {
                id: 'manual',
                name: 'Manual review',
                phases,
                reviewers: [
                    { isMemberReview: true, phaseId: screeningPhaseId, scorecardId: 'screening-scorecard' },
                    {
                        aiWorkflowId: 'awsH45_SAST_01',
                        isMemberReview: false,
                        phaseId: reviewPhaseId,
                        scorecardId: 'ai-scorecard',
                    },
                    { isMemberReview: true, phaseId: reviewPhaseId, scorecardId: ' hFU73Ve2XlYCK- ' },
                ],
            }

            expect(challengeManualReviewScorecardId(challenge))
                .toBe('hFU73Ve2XlYCK-')
            expect(challengeManualReviewScorecardUrl(challenge))
                .toBe('https://review.topcoder-dev.com/scorecard/hFU73Ve2XlYCK-')
            expect(challengeManualReviewScorecardUrl(challenge, 'https://review.example/'))
                .toBe('https://review.example/scorecard/hFU73Ve2XlYCK-')
        })

        it('falls back to the Iterative Review member reviewer and encodes the id', () => {
            expect(challengeManualReviewScorecardUrl({
                id: 'f2f',
                name: 'First2Finish',
                phases: [{ id: 'ir-instance', name: 'Iterative Review', phaseId: iterativeReviewPhaseId }],
                reviewers: [{ isMemberReview: true, phaseId: iterativeReviewPhaseId, scorecardId: 'f2f/score' }],
            }))
                .toBe('https://review.topcoder-dev.com/scorecard/f2f%2Fscore')
        })

        it('returns undefined without a manual Review phase reviewer', () => {
            expect(challengeManualReviewScorecardUrl({
                id: 'ai-only',
                name: 'AI only',
                phases,
                reviewers: [{
                    aiWorkflowId: 'awsH45_SAST_01',
                    isMemberReview: false,
                    phaseId: reviewPhaseId,
                    scorecardId: 'ai-scorecard',
                }],
            }))
                .toBeUndefined()
            expect(challengeManualReviewScorecardId({
                id: 'screening-only',
                name: 'Screening only',
                phases,
                reviewers: [{ isMemberReview: true, phaseId: screeningPhaseId, scorecardId: 'screening-scorecard' }],
            }))
                .toBeUndefined()
            expect(challengeManualReviewScorecardId({ id: 'none', name: 'No reviewers', phases }))
                .toBeUndefined()
        })
    })
})
