/* eslint-disable ordered-imports/ordered-imports */
import { xhrGetAsync, xhrGlobalInstance, xhrPostAsync } from '~/libs/core'
import {
    buildOpportunityPageUrl,
    getChallengeSubmissionPreviews,
    getChallengeSubmitterTermsDetails,
    getChallengeSubmitters,
    getChallengeTermDocuSignUrl,
    getChallengeTermDetails,
    getSubmitterChallengeIds,
    normalizeOpportunitySummary,
} from './opportunities.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: { V5: 'https://api.example/v5', V6: 'https://api.example/v6' },
    },
}), { virtual: true })
jest.mock('~/libs/core', () => ({
    xhrDeleteAsync: jest.fn(),
    xhrGetAsync: jest.fn(),
    xhrGlobalInstance: { get: jest.fn() },
    xhrPostAsync: jest.fn(),
}), { virtual: true })

describe('opportunities service normalization', () => {
    it('normalizes the aggregation service cells and accepted legacy aliases', () => {
        expect(normalizeOpportunitySummary({
            result: {
                content: {
                    cells: {
                        challenges: { openCount: 12, totalPrize: '38500' },
                        copilotOpportunities: { count: 2 },
                        engagements: { total: 8 },
                        reviewOpportunities: { count: 3 },
                    },
                },
            },
        }))
            .toEqual({
                competitions: { amount: 38500, count: 12 },
                copilots: { count: 2 },
                engagements: { count: 8 },
                reviews: { count: 3 },
            })
    })

    it('uses safe zero counts when aggregation cells are absent or invalid', () => {
        expect(normalizeOpportunitySummary({ competitions: { count: -1 } }))
            .toEqual({
                competitions: { count: 0 },
                copilots: { count: 0 },
                engagements: { count: 0 },
                reviews: { count: 0 },
            })
    })

    it('maps competition facets and registration phase to Challenge API parameters', () => {
        const url = new URL(buildOpportunityPageUrl('competitions', {
            page: 2,
            perPage: 10,
            sort: 'startingSoon',
            statuses: ['REGISTRATION'],
            tracks: ['Des', 'Dev'],
            types: ['CH', 'F2F'],
        }))

        expect(url.pathname)
            .toBe('/v6/challenges')
        expect(url.searchParams.get('currentPhaseName'))
            .toBe('Registration')
        expect(url.searchParams.getAll('tracks'))
            .toEqual(['Des', 'Dev'])
        expect(url.searchParams.getAll('types'))
            .toEqual(['CH', 'F2F'])
        expect(url.searchParams.get('sortBy'))
            .toBe('startDate')
        expect(url.searchParams.get('sortOrder'))
            .toBe('asc')
    })

    it('maps engagement filters to its scalar status, skill IDs, and semantic sort', () => {
        const url = new URL(buildOpportunityPageUrl('engagements', {
            applied: true,
            page: 1,
            perPage: 20,
            skills: ['skill-id'],
            sort: 'startingSoon',
            statuses: ['CLOSED'],
        }))

        expect(url.searchParams.get('status'))
            .toBe('CLOSED')
        expect(url.searchParams.getAll('requiredSkills'))
            .toEqual(['skill-id'])
        expect(url.searchParams.get('sortBy'))
            .toBe('anticipatedStart')
        expect(url.searchParams.get('sortOrder'))
            .toBe('asc')
        expect(url.searchParams.get('appliedByMe'))
            .toBe('true')
    })

    it('maps copilot track facets and skills to types and disables status grouping for honest sorting', () => {
        const url = new URL(buildOpportunityPageUrl('copilots', {
            applied: true,
            page: 1,
            perPage: 20,
            skills: ['React'],
            sort: 'newest',
            tracks: ['design', 'ai'],
        }))

        expect(url.searchParams.getAll('type'))
            .toEqual(['design', 'ai'])
        expect(url.searchParams.get('sort'))
            .toBe('createdAt desc')
        expect(url.searchParams.get('noGrouping'))
            .toBe('true')
        expect(url.searchParams.get('applied'))
            .toBe('true')
        expect(url.searchParams.getAll('skills'))
            .toEqual(['React'])
    })

    it('uses canonical Review API facets and descending payment sorting', () => {
        const url = new URL(buildOpportunityPageUrl('reviews', {
            page: 3,
            perPage: 5,
            sort: 'highestPayment',
            statuses: ['OPEN'],
            tracks: ['Design'],
            types: ['REGULAR_REVIEW'],
        }))

        expect(url.searchParams.get('offset'))
            .toBe('10')
        expect(url.searchParams.getAll('status'))
            .toEqual(['OPEN'])
        expect(url.searchParams.getAll('tracks'))
            .toEqual(['Design'])
        expect(url.searchParams.getAll('opportunityTypes'))
            .toEqual(['REGULAR_REVIEW'])
        expect(url.searchParams.get('sortBy'))
            .toBe('basePayment')
        expect(url.searchParams.get('sortOrder'))
            .toBe('desc')
    })

    it('normalizes the public preview gallery totalCount contract', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get.mockResolvedValueOnce({
            data: [{ id: 'submission', previewUrl: 'https://assets.topcoder-dev.com/preview.jpg' }],
            meta: { page: 2, perPage: 6, totalCount: 13, totalPages: 3 },
        })

        await expect(getChallengeSubmissionPreviews('challenge', 2, 6))
            .resolves.toEqual({
                items: [{ id: 'submission', previewUrl: 'https://assets.topcoder-dev.com/preview.jpg' }],
                page: 2,
                perPage: 6,
                total: 13,
                totalPages: 3,
            })
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v6/submissions/previews?challengeId=challenge&page=2&perPage=6',
            )
    })

    it('resolves and retains only Submitter challenge resources', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get
            .mockResolvedValueOnce([
                { id: 'submitter-role', name: 'Submitter' },
                { id: 'reviewer-role', name: 'Reviewer' },
            ])
            .mockResolvedValueOnce([
                { challengeId: 'challenge', id: 'submitter', roleId: 'submitter-role' },
                { challengeId: 'challenge', id: 'reviewer', roleId: 'reviewer-role' },
            ])

        await expect(getChallengeSubmitters('challenge'))
            .resolves.toEqual([
                { challengeId: 'challenge', id: 'submitter', roleId: 'submitter-role' },
            ])
        expect(get)
            .toHaveBeenLastCalledWith(
                'https://api.example/v6/resources?challengeId=challenge&page=1&perPage=500&roleId=submitter-role',
            )
    })

    it('pages My competitions through Submitter-role resource assignments', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        const globalGet = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        get.mockResolvedValueOnce([{ id: 'submitter-role', name: 'Submitter' }])
        globalGet.mockResolvedValueOnce({
            data: ['challenge-a', 'challenge-b'],
            headers: {
                get: (name: string) => ({
                    'x-page': '2',
                    'x-per-page': '2',
                    'x-total': '5',
                    'x-total-pages': '3',
                } as Record<string, string>)[name],
            },
        })

        await expect(getSubmitterChallengeIds('123', 2, 2))
            .resolves.toEqual({
                items: ['challenge-a', 'challenge-b'],
                page: 2,
                perPage: 2,
                total: 5,
                totalPages: 3,
            })
        expect(globalGet)
            .toHaveBeenCalledWith(
                'https://api.example/v6/resources/123/challenges?resourceRoleId=submitter-role&page=2&perPage=2',
            )
    })

    it('resolves legacy challenge term references from v5 details', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get.mockResolvedValueOnce({
            result: [{ agreeabilityType: 'Electronically-agreeable', id: 'term-uuid', text: '<p>Rules</p>' }],
        })

        await expect(getChallengeTermDetails({ agreed: false, id: '123456', title: 'Rules' }))
            .resolves.toEqual({
                agreeabilityType: 'Electronically-agreeable',
                agreed: false,
                id: 'term-uuid',
                text: '<p>Rules</p>',
                title: 'Rules',
            })
    })

    it('loads only terms assigned to the canonical Submitter resource role', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get
            .mockResolvedValueOnce([{ id: 'submitter-role', name: 'Submitter' }])
            .mockResolvedValueOnce({ id: 'submitter-term', text: '<p>Rules</p>' })

        await expect(getChallengeSubmitterTermsDetails([
            { id: 'submitter-term', roleId: 'submitter-role' },
            { id: 'reviewer-term', roleId: 'reviewer-role' },
        ]))
            .resolves.toEqual([{ id: 'submitter-term', roleId: 'submitter-role', text: '<p>Rules</p>' }])
        expect(get)
            .not.toHaveBeenCalledWith('https://api.example/v5/terms/reviewer-term')
    })

    it('returns the Terms API DocuSign recipient view', async () => {
        const post = xhrPostAsync as jest.MockedFunction<typeof xhrPostAsync>
        post.mockResolvedValueOnce({ recipientViewUrl: 'https://docusign.example/sign' })

        await expect(getChallengeTermDocuSignUrl('template', 'https://topcoder-dev.com/opportunities'))
            .resolves.toBe('https://docusign.example/sign')
        expect(post)
            .toHaveBeenCalledWith('https://api.example/v5/terms/docusignViewURL', {
                returnUrl: 'https://topcoder-dev.com/opportunities',
                templateId: 'template',
            })
    })
})
