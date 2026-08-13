/* eslint-disable ordered-imports/ordered-imports */
import { xhrGetAsync, xhrGlobalInstance, xhrPostAsync } from '~/libs/core'
import {
    buildOpportunityPageUrl,
    getChallengeSubmissionPreviews,
    getChallengeRegistration,
    getChallengeSubmitterTermsDetails,
    getChallengeSubmitters,
    getChallengeTermDocuSignUrl,
    getChallengeTermDetails,
    getOpportunityPage,
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

    it('maps My competitions to the Challenge API member and Submitter-role filter', () => {
        const url = new URL(buildOpportunityPageUrl('competitions', {
            applied: true,
            memberId: '123',
            page: 2,
            perPage: 10,
            resourceRoleId: '2425bb20-9a2c-4316-9f85-8b24f9ce43b8',
            search: 'design systems',
            sort: 'newest',
            tracks: ['Des'],
        }))

        expect(url.searchParams.get('memberId'))
            .toBe('123')
        expect(url.searchParams.get('resourceRoleId'))
            .toBe('2425bb20-9a2c-4316-9f85-8b24f9ce43b8')
        expect(url.searchParams.get('search'))
            .toBe('design systems')
        expect(url.searchParams.getAll('tracks'))
            .toEqual(['Des'])
        expect(url.searchParams.get('page'))
            .toBe('2')
        expect(url.searchParams.get('sortOrder'))
            .toBe('desc')
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
        const globalGet = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        get.mockResolvedValueOnce([
            { id: 'submitter-role', name: 'Submitter' },
            { id: 'reviewer-role', name: 'Reviewer' },
        ])
        globalGet.mockResolvedValueOnce({
            data: [{ challengeId: 'challenge', id: 'submitter', roleId: 'submitter-role' }],
            headers: {
                get: (name: string) => ({
                    'x-page': '2',
                    'x-per-page': '20',
                    'x-total': '31',
                    'x-total-pages': '2',
                } as Record<string, string>)[name],
            },
        })

        await expect(getChallengeSubmitters('challenge', 2, 20))
            .resolves.toEqual({
                items: [{ challengeId: 'challenge', id: 'submitter', roleId: 'submitter-role' }],
                page: 2,
                perPage: 20,
                total: 31,
                totalPages: 2,
            })
        expect(globalGet)
            .toHaveBeenLastCalledWith(
                'https://api.example/v6/resources?challengeId=challenge&page=2&perPage=20&roleId=submitter-role',
            )
    })

    it('uses a bounded member-scoped Submitter page for registration state', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        const globalGet = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        get.mockResolvedValueOnce([{ id: 'submitter-role', name: 'Submitter' }])
        globalGet.mockResolvedValueOnce({
            data: [{ challengeId: 'challenge', id: 'self', memberId: '123', roleId: 'submitter-role' }],
            headers: { get: () => undefined },
        })

        await expect(getChallengeRegistration('challenge', '123'))
            .resolves.toEqual({ challengeId: 'challenge', id: 'self', memberId: '123', roleId: 'submitter-role' })

        expect(globalGet)
            .toHaveBeenLastCalledWith(
                'https://api.example/v6/resources?challengeId=challenge&page=1&perPage=1'
                + '&memberId=123&roleId=submitter-role',
            )
    })

    it('never treats another member or role as the caller registration', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        const globalGet = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        get
            .mockResolvedValueOnce([{ id: 'submitter-role', name: 'Submitter' }])
            .mockResolvedValueOnce([{ id: 'submitter-role', name: 'Submitter' }])
        globalGet
            .mockResolvedValueOnce({
                data: [{ challengeId: 'challenge', id: 'other', memberId: '456', roleId: 'submitter-role' }],
                headers: { get: () => undefined },
            })
            .mockResolvedValueOnce({
                data: [{ challengeId: 'challenge', id: 'reviewer', memberId: '123', roleId: 'reviewer-role' }],
                headers: { get: () => undefined },
            })

        await expect(getChallengeRegistration('challenge', '123'))
            .resolves.toBeUndefined()
        await expect(getChallengeRegistration('challenge', '123'))
            .resolves.toBeUndefined()
    })

    it('globally filters and pages My competitions in one role-aware Challenge API request', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        const globalGet = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        const submitterRoleId = '2425bb20-9a2c-4316-9f85-8b24f9ce43b8'
        get.mockResolvedValueOnce([{ id: submitterRoleId, name: 'Submitter' }])
        globalGet.mockResolvedValueOnce({
            data: [{ id: 'challenge-b', name: 'Design challenge' }],
            headers: {
                get: (name: string) => ({
                    'x-page': '2',
                    'x-per-page': '10',
                    'x-total': '21',
                    'x-total-pages': '3',
                } as Record<string, string>)[name],
            },
        })

        await expect(getOpportunityPage('competitions', {
            applied: true,
            memberId: '123',
            page: 2,
            perPage: 10,
            search: 'design',
            sort: 'newest',
            statuses: ['ACTIVE'],
            tracks: ['Des'],
        }))
            .resolves.toEqual({
                items: [{ id: 'challenge-b', name: 'Design challenge' }],
                page: 2,
                perPage: 10,
                total: 21,
                totalPages: 3,
            })
        const requestUrl = new URL(String(globalGet.mock.calls.at(-1)?.[0]))
        expect(requestUrl.pathname)
            .toBe('/v6/challenges')
        expect(requestUrl.searchParams.get('memberId'))
            .toBe('123')
        expect(requestUrl.searchParams.get('resourceRoleId'))
            .toBe(submitterRoleId)
        expect(requestUrl.searchParams.get('search'))
            .toBe('design')
        expect(requestUrl.searchParams.getAll('status'))
            .toEqual(['ACTIVE'])
        expect(requestUrl.searchParams.getAll('tracks'))
            .toEqual(['Des'])
        expect(requestUrl.searchParams.get('page'))
            .toBe('2')
        expect(requestUrl.searchParams.get('perPage'))
            .toBe('10')
        expect(requestUrl.searchParams.get('sortBy'))
            .toBe('updatedAt')
        expect(requestUrl.searchParams.get('sortOrder'))
            .toBe('desc')
        expect(globalGet)
            .toHaveBeenCalledTimes(1)
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
