/* eslint-disable ordered-imports/ordered-imports */
import {
    xhrDeleteAsync,
    xhrGetAsync,
    xhrGlobalInstance,
    xhrPostAsync,
    xhrRequestAsync,
} from '~/libs/core'
import {
    buildOpportunityPageUrl,
    createChallengeSubmission,
    deleteChallengeSubmission,
    getChallengeProjectResults,
    getChallengeReviewSummations,
    getChallengeSubmissionHistory,
    getChallengeSubmissionPreviews,
    getChallengeSubmissionDownloadUrl,
    getChallengeSubmissions,
    getChallengeRegistration,
    getChallengeSubmitterTermsDetails,
    getChallengeSubmitters,
    getChallengeTermDocuSignUrl,
    getChallengeTermDetails,
    getMyWorkCounts,
    getOpportunityPage,
    normalizeOpportunitySummary,
    unregisterFromChallenge,
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
    xhrRequestAsync: jest.fn(),
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

    it('loads member-work totals on count-only owner pages', async () => {
        const get = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        const getAsync = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        const totals: Record<string, number> = {
            '/v6/challenges': 40,
            '/v6/engagements/engagements': 30,
            '/v6/projects/copilots/opportunities': 20,
            '/v6/review-opportunities/search': 15,
        }
        getAsync.mockResolvedValueOnce([
            { id: 'submitter-role', name: 'Submitter' },
        ] as never)
        get.mockImplementation(async requestUrl => {
            const url = new URL(String(requestUrl))
            return {
                data: [],
                headers: {
                    get: (name: string) => (name === 'x-total'
                        ? String(totals[url.pathname] ?? 0)
                        : undefined),
                },
            } as never
        })

        await expect(getMyWorkCounts('123'))
            .resolves.toEqual({
                competitions: 40,
                copilots: 20,
                engagements: 30,
                reviews: 15,
            })

        const requests = (get.mock.calls as Array<[string]>).map(call => new URL(call[0]))
        const byPath = new Map(requests.map(url => [url.pathname, url]))
        expect(requests)
            .toHaveLength(4)
        expect(byPath.get('/v6/challenges')?.searchParams.get('perPage'))
            .toBe('1')
        expect(byPath.get('/v6/challenges')?.searchParams.get('memberId'))
            .toBe('123')
        expect(byPath.get('/v6/challenges')?.searchParams.get('resourceRoleId'))
            .toBe('submitter-role')
        expect(byPath.get('/v6/engagements/engagements')?.searchParams.get('perPage'))
            .toBe('1')
        expect(byPath.get('/v6/engagements/engagements')?.searchParams.get('appliedByMe'))
            .toBe('true')
        expect(byPath.get('/v6/projects/copilots/opportunities')?.searchParams.get('pageSize'))
            .toBe('1')
        expect(byPath.get('/v6/projects/copilots/opportunities')?.searchParams.get('applied'))
            .toBe('true')
        expect(byPath.get('/v6/review-opportunities/search')?.searchParams.get('limit'))
            .toBe('1')
        expect(byPath.get('/v6/review-opportunities/search')?.searchParams.get('appliedByMe'))
            .toBe('true')
    })

    it('maps competition facets and registration phase to Challenge API parameters', () => {
        const url = new URL(buildOpportunityPageUrl('competitions', {
            page: 2,
            perPage: 10,
            search: 'React project',
            skills: ['React'],
            sort: 'startingSoon',
            statuses: ['REGISTRATION'],
            tracks: ['Des', 'Dev'],
            types: ['CH', 'F2F'],
        }))

        expect(url.pathname)
            .toBe('/v6/challenges')
        expect(url.searchParams.get('currentPhaseName'))
            .toBe('Registration')
        expect(url.searchParams.getAll('tracks[]'))
            .toEqual(['Des', 'Dev'])
        expect(url.searchParams.getAll('types[]'))
            .toEqual(['CH', 'F2F'])
        expect(url.searchParams.get('search'))
            .toBe('React project')
        expect(url.searchParams.getAll('tags'))
            .toEqual([])
        expect(url.searchParams.get('sortBy'))
            .toBe('startDate')
        expect(url.searchParams.get('sortOrder'))
            .toBe('asc')
        expect(Date.parse(url.searchParams.get('startDateStart') ?? ''))
            .toBeGreaterThan(0)
    })

    it('keeps scheduled challenges out of public active results without hiding member competitions', () => {
        const publicUrl = new URL(buildOpportunityPageUrl('competitions', {
            page: 1,
            perPage: 10,
            statuses: ['ACTIVE'],
        }))
        const memberUrl = new URL(buildOpportunityPageUrl('competitions', {
            applied: true,
            memberId: '123',
            page: 1,
            perPage: 10,
            resourceRoleId: 'submitter-role',
            statuses: ['ACTIVE'],
        }))

        expect(publicUrl.searchParams.get('currentPhaseName'))
            .toBe('Submission')
        expect(memberUrl.searchParams.has('currentPhaseName'))
            .toBe(false)
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
        expect(url.searchParams.getAll('tracks[]'))
            .toEqual(['Des'])
        expect(url.searchParams.has('tracks'))
            .toBe(false)
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
            role: 'SOFTWARE_DEVELOPER',
            skills: ['skill-id'],
            sort: 'startingSoon',
            statuses: ['CLOSED'],
        }))

        expect(url.searchParams.get('status'))
            .toBe('CLOSED')
        expect(url.searchParams.getAll('requiredSkills'))
            .toEqual(['skill-id'])
        expect(url.searchParams.get('role'))
            .toBe('SOFTWARE_DEVELOPER')
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
            search: 'TypeScript',
            skills: ['React'],
            sort: 'newest',
            statuses: ['active'],
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
        expect(url.searchParams.get('search'))
            .toBe('TypeScript')
        expect(url.searchParams.getAll('status'))
            .toEqual(['active'])
        expect(url.searchParams.getAll('skills'))
            .toEqual(['React'])
    })

    it('falls back to locally filtered legacy Copilot results during API rollout', async () => {
        const globalGet = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        globalGet
            .mockRejectedValueOnce({
                data: { message: ['property status should not exist'] },
                status: 400,
            })
            .mockResolvedValueOnce({
                data: [
                    {
                        createdAt: '2026-01-03T00:00:00.000Z',
                        id: 'matching',
                        opportunityTitle: 'Frontend migration',
                        skills: [{ id: 'typescript', name: 'TypeScript' }],
                        status: 'active',
                        type: 'dev',
                    },
                    {
                        createdAt: '2026-01-02T00:00:00.000Z',
                        id: 'completed',
                        opportunityTitle: 'TypeScript maintenance',
                        skills: [{ id: 'typescript', name: 'TypeScript' }],
                        status: 'completed',
                        type: 'dev',
                    },
                    {
                        createdAt: '2026-01-01T00:00:00.000Z',
                        id: 'different-skill',
                        opportunityTitle: 'Backend migration',
                        skills: [{ id: 'java', name: 'Java' }],
                        status: 'active',
                        type: 'dev',
                    },
                ],
                headers: {
                    get: (name: string) => ({
                        'x-page': '1',
                        'x-per-page': '1000',
                        'x-total': '3',
                        'x-total-pages': '1',
                    } as Record<string, string>)[name],
                },
            })

        await expect(getOpportunityPage('copilots', {
            page: 1,
            perPage: 10,
            search: 'typescript',
            sort: 'newest',
            statuses: ['active'],
            tracks: ['dev'],
        }))
            .resolves.toMatchObject({
                items: [expect.objectContaining({ id: 'matching' })],
                page: 1,
                perPage: 10,
                total: 1,
                totalPages: 1,
            })

        const legacyUrl = new URL(String(globalGet.mock.calls.at(-1)?.[0]))
        expect(legacyUrl.searchParams.get('pageSize'))
            .toBe('1000')
        expect(legacyUrl.searchParams.get('noGrouping'))
            .toBe('true')
        expect(legacyUrl.searchParams.has('search'))
            .toBe(false)
        expect(legacyUrl.searchParams.has('status'))
            .toBe(false)
        expect(legacyUrl.searchParams.has('type'))
            .toBe(false)
    })

    it('sorts legacy Copilot results by start date without sending an unsupported sort', async () => {
        const globalGet = xhrGlobalInstance.get as jest.MockedFunction<typeof xhrGlobalInstance.get>
        globalGet
            .mockRejectedValueOnce({
                data: { message: ['property status should not exist'] },
                status: 400,
            })
            .mockResolvedValueOnce({
                data: [
                    { id: 'later', startDate: '2099-05-02T00:00:00.000Z', status: 'active' },
                    { id: 'missing', status: 'active' },
                    { id: 'past', startDate: '2026-05-01T00:00:00.000Z', status: 'active' },
                    { id: 'earlier', startDate: '2099-05-01T00:00:00.000Z', status: 'active' },
                ],
                headers: {
                    get: (name: string) => ({
                        'x-page': '1',
                        'x-per-page': '1000',
                        'x-total': '3',
                        'x-total-pages': '1',
                    } as Record<string, string>)[name],
                },
            })

        await expect(getOpportunityPage('copilots', {
            page: 1,
            perPage: 10,
            sort: 'startingSoon',
            statuses: ['active'],
        }))
            .resolves.toMatchObject({
                items: [
                    expect.objectContaining({ id: 'earlier' }),
                    expect.objectContaining({ id: 'later' }),
                ],
            })

        const initialUrl = new URL(String(globalGet.mock.calls[0][0]))
        expect(Date.parse(initialUrl.searchParams.get('startDateFrom') ?? ''))
            .toBeGreaterThan(0)

        const legacyUrl = new URL(String(globalGet.mock.calls.at(-1)?.[0]))
        expect(legacyUrl.searchParams.get('sort'))
            .toBe('createdAt desc')
    })

    it('uses canonical Review API facets and descending payment sorting', () => {
        const url = new URL(buildOpportunityPageUrl('reviews', {
            page: 3,
            perPage: 5,
            sort: 'highestPayment',
            statuses: ['OPEN'],
            tracks: ['Design'],
            types: ['Challenge'],
        }))

        expect(url.searchParams.get('offset'))
            .toBe('10')
        expect(url.searchParams.getAll('status'))
            .toEqual(['OPEN'])
        expect(url.searchParams.getAll('tracks'))
            .toEqual(['Design'])
        expect(url.searchParams.getAll('types'))
            .toEqual(['Challenge'])
        expect(url.searchParams.get('sortBy'))
            .toBe('basePayment')
        expect(url.searchParams.get('sortOrder'))
            .toBe('desc')
    })

    it('maps Review newest-first and starting-soon labels to their supported date ordering', () => {
        const newest = new URL(buildOpportunityPageUrl('reviews', {
            page: 1,
            perPage: 10,
            sort: 'newest',
        }))
        const startingSoon = new URL(buildOpportunityPageUrl('reviews', {
            page: 1,
            perPage: 10,
            sort: 'startingSoon',
        }))

        expect(newest.searchParams.get('sortBy'))
            .toBe('createdAt')
        expect(newest.searchParams.get('sortOrder'))
            .toBe('desc')
        expect(startingSoon.searchParams.get('sortBy'))
            .toBe('startDate')
        expect(startingSoon.searchParams.get('sortOrder'))
            .toBe('asc')
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

    it('uploads a multipart challenge submission and reports Axios progress', async () => {
        const post = xhrPostAsync as jest.MockedFunction<typeof xhrPostAsync>
        const progress = jest.fn()
        const file = new File(['archive'], 'MySubmission.zip', { type: 'application/zip' })
        const controller = new AbortController()
        post.mockImplementationOnce(async (_url, _payload, config) => {
            config?.onUploadProgress?.({ loaded: 1, total: 2 } as never)
            return { id: 'submission-id' } as never
        })

        await expect(createChallengeSubmission(
            'challenge-id',
            '123',
            'CHECKPOINT_SUBMISSION',
            file,
            progress,
            controller.signal,
        ))
            .resolves.toEqual({ id: 'submission-id' })

        expect(post)
            .toHaveBeenCalledWith(
                'https://api.example/v6/submissions',
                expect.any(FormData),
                expect.objectContaining({
                    headers: { 'Content-Type': 'multipart/form-data' },
                    signal: controller.signal,
                }),
            )
        const payload = post.mock.calls.at(-1)?.[1] as FormData
        expect(payload.get('challengeId'))
            .toBe('challenge-id')
        expect(payload.get('memberId'))
            .toBe('123')
        expect(payload.get('type'))
            .toBe('CHECKPOINT_SUBMISSION')
        expect(payload.get('fileName'))
            .toBe('MySubmission.zip')
        expect((payload.get('file') as File).name)
            .toBe('MySubmission.zip')
        expect(progress)
            .toHaveBeenCalledWith(50)
    })

    it('requests only the latest submission per member for the main table', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get.mockResolvedValueOnce({
            data: [{ id: 'latest', isLatest: true, memberId: '123' }],
            meta: { page: 1, perPage: 10, totalCount: 1, totalPages: 1 },
        })

        await expect(getChallengeSubmissions('challenge', 1, 10))
            .resolves.toMatchObject({
                items: [{ id: 'latest', isLatest: true, memberId: '123' }],
                total: 1,
            })
        expect(get)
            .toHaveBeenLastCalledWith(
                'https://api.example/v6/submissions?challengeId=challenge&page=1&perPage=10&isLatest=true'
                + '&sortBy=submittedDate&orderBy=desc',
            )
    })

    it('keeps all member attempts for My Submissions when latest-only is disabled', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get.mockResolvedValueOnce({ data: [], meta: { page: 1, totalCount: 0, totalPages: 0 } })

        await getChallengeSubmissions('challenge', 1, 10, '123', false)

        const requestUrl = new URL(String(get.mock.calls.at(-1)?.[0]))
        expect(requestUrl.searchParams.get('memberId'))
            .toBe('123')
        expect(requestUrl.searchParams.has('isLatest'))
            .toBe(false)
        expect(requestUrl.searchParams.get('sortBy'))
            .toBe('submittedDate')
        expect(requestUrl.searchParams.get('orderBy'))
            .toBe('desc')
    })

    it('loads the authorized signed URL used by a My Submissions download action', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get.mockResolvedValueOnce({ url: 'https://clean-storage.example/submission.zip' })

        await expect(getChallengeSubmissionDownloadUrl('submission/id'))
            .resolves.toBe('https://clean-storage.example/submission.zip')
        expect(get)
            .toHaveBeenLastCalledWith(
                'https://api.example/v6/submissions/submission%2Fid/download-url',
            )
    })

    it('deletes only the encoded submission selected by My Submissions', async () => {
        const remove = xhrDeleteAsync as jest.MockedFunction<typeof xhrDeleteAsync>
        remove.mockResolvedValueOnce(undefined)

        await expect(deleteChallengeSubmission('submission/id'))
            .resolves.toBeUndefined()
        expect(remove)
            .toHaveBeenLastCalledWith('https://api.example/v6/submissions/submission%2Fid')
    })

    it('loads and sorts every same-type member submission for the history modal', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get
            .mockResolvedValueOnce({
                data: [{ id: 'older', submittedDate: '2026-06-01T00:00:00.000Z' }],
                meta: { page: 1, perPage: 200, totalCount: 2, totalPages: 2 },
            })
            .mockResolvedValueOnce({
                data: [{ id: 'newer', submittedDate: '2026-06-02T00:00:00.000Z' }],
                meta: { page: 2, perPage: 200, totalCount: 2, totalPages: 2 },
            })

        await expect(getChallengeSubmissionHistory('challenge', '123', 'CONTEST_SUBMISSION'))
            .resolves.toEqual([
                { id: 'newer', submittedDate: '2026-06-02T00:00:00.000Z' },
                { id: 'older', submittedDate: '2026-06-01T00:00:00.000Z' },
            ])
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v6/submissions?challengeId=challenge&memberId=123&page=1&perPage=200'
                + '&sortBy=submittedDate&orderBy=desc&type=CONTEST_SUBMISSION',
            )
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v6/submissions?challengeId=challenge&memberId=123&page=2&perPage=200'
                + '&sortBy=submittedDate&orderBy=desc&type=CONTEST_SUBMISSION',
            )
    })

    it('loads every Marathon Match review-summation page for table scores and dashboard', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get
            .mockResolvedValueOnce({
                data: [{ aggregateScore: 35, id: 'first', isProvisional: true }],
                meta: { page: 1, perPage: 500, totalCount: 2, totalPages: 2 },
            })
            .mockResolvedValueOnce({
                data: [{ aggregateScore: 85, id: 'second', isFinal: true }],
                meta: { page: 2, perPage: 500, totalCount: 2, totalPages: 2 },
            })

        await expect(getChallengeReviewSummations('challenge'))
            .resolves.toEqual([
                { aggregateScore: 35, id: 'first', isProvisional: true },
                { aggregateScore: 85, id: 'second', isFinal: true },
            ])
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v6/reviewSummations?challengeId=challenge&page=1&perPage=500',
            )
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v6/reviewSummations?challengeId=challenge&page=2&perPage=500',
            )
    })

    it('loads every authorized canonical winner-result page from Review API', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get
            .mockResolvedValueOnce({
                data: [{ finalScore: 98.98, placement: 1, userId: '1' }],
                meta: { page: 1, perPage: 100, totalCount: 2, totalPages: 2 },
            })
            .mockResolvedValueOnce({
                data: [{ finalScore: 88.88, placement: 2, userId: '2' }],
                meta: { page: 2, perPage: 100, totalCount: 2, totalPages: 2 },
            })

        await expect(getChallengeProjectResults('challenge'))
            .resolves.toEqual([
                { finalScore: 98.98, placement: 1, userId: '1' },
                { finalScore: 88.88, placement: 2, userId: '2' },
            ])
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v6/projectResult?challengeId=challenge&page=1&perPage=100',
            )
        expect(get)
            .toHaveBeenCalledWith(
                'https://api.example/v6/projectResult?challengeId=challenge&page=2&perPage=100',
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
        expect(get)
            .toHaveBeenCalledWith('https://api.example/v6/resource-roles')
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

    it('unregisters through Resource API\'s body-based Submitter contract', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        const request = xhrRequestAsync as jest.MockedFunction<typeof xhrRequestAsync>
        get.mockResolvedValueOnce([{ id: 'submitter-role', name: 'Submitter' }])
        request.mockResolvedValueOnce(undefined)

        await expect(unregisterFromChallenge('challenge', 'coder'))
            .resolves.toBeUndefined()

        expect(request)
            .toHaveBeenCalledWith({
                data: {
                    challengeId: 'challenge',
                    memberHandle: 'coder',
                    roleId: 'submitter-role',
                },
                method: 'DELETE',
                url: 'https://api.example/v6/resources',
            })
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
        expect(requestUrl.searchParams.getAll('tracks[]'))
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

    it('loads only outstanding terms assigned to the canonical Submitter resource role', async () => {
        const get = xhrGetAsync as jest.MockedFunction<typeof xhrGetAsync>
        get
            .mockResolvedValueOnce([{ id: 'submitter-role', name: 'Submitter' }])
            .mockResolvedValueOnce({ agreed: false, id: 'submitter-term', text: '<p>Rules</p>' })
            .mockResolvedValueOnce({ agreed: true, id: 'accepted-term', text: '<p>Signed</p>' })

        await expect(getChallengeSubmitterTermsDetails([
            { id: 'submitter-term', roleId: 'submitter-role' },
            { id: 'accepted-term', roleId: 'submitter-role' },
            { id: 'reviewer-term', roleId: 'reviewer-role' },
        ]))
            .resolves.toEqual([{
                agreed: false,
                id: 'submitter-term',
                roleId: 'submitter-role',
                text: '<p>Rules</p>',
            }])
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
