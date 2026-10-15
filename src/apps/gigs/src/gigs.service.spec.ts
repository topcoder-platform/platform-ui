/* eslint-disable sort-keys, unicorn/no-null */
import { tokenGetAsync } from '~/libs/core'

import { applyToGig, getCandidate, getGig, getGigPolicy, getGigs } from './gigs.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { WEBSITE_API_URL: 'https://www.topcoder-dev.com/__api' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({ tokenGetAsync: jest.fn() }), { virtual: true })

const fetchMock = jest.fn()
const originalFetch = global.fetch

beforeEach(() => {
    global.fetch = fetchMock
    jest.clearAllMocks()
    fetchMock.mockReset();
    (tokenGetAsync as jest.Mock).mockResolvedValue({ token: 'member-token' })
})
afterAll(() => {
    global.fetch = originalFetch
})

/** Creates a minimal fetch response for website API scenarios. */
function response(data: unknown, status: number = 200): Partial<Response> {
    return { ok: status < 400, status, json: async () => data }
}

describe('Website Recruit API integration', () => {
    it('loads public jobs without requesting credentials or transmitting a member token', async () => {
        fetchMock.mockResolvedValue(response([]))
        await expect(getGigs()).resolves.toEqual([])
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/__api/recruit/jobs',
                expect.objectContaining({ headers: {}, credentials: 'omit' }),
            )
        expect(tokenGetAsync).not.toHaveBeenCalled()
    })
    it('preserves a job not-found status and rejects malformed listings', async () => {
        fetchMock.mockResolvedValue(response({ status: 404, title: 'Not Found', detail: 'Gig not found.' }, 404))
        await expect(getGig('missing')).rejects.toMatchObject({ status: 404 })
        fetchMock.mockResolvedValue(response({ data: 'unexpected' }))
        await expect(getGigs()).rejects.toThrow('could not load')
    })
    it('preserves fulfilled status-only responses', async () => {
        const closed = { job_status: { id: 2 }, enable_job_application_form: 0 }
        fetchMock.mockResolvedValue(response(closed))
        await expect(getGig('fulfilled')).resolves.toEqual(closed)
        expect(fetchMock)
            .toHaveBeenCalledWith('https://www.topcoder-dev.com/__api/recruit/jobs/fulfilled', expect.anything())
    })
    it('loads the signed-in candidate with the member token and no email parameter', async () => {
        const candidate = { slug: 'candidate-slug' }
        fetchMock.mockResolvedValue(response({ candidate }))
        await expect(getCandidate()).resolves.toEqual(candidate)
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/__api/recruit/candidate',
                expect.objectContaining({ headers: { Authorization: 'Bearer member-token' } }),
            )
    })
    it('distinguishes no profile from malformed data and failures', async () => {
        fetchMock.mockResolvedValue(response({ candidate: null }))
        await expect(getCandidate()).resolves.toBeUndefined()
        fetchMock.mockResolvedValue(response({ candidates: [] }))
        await expect(getCandidate()).rejects.toThrow('Gig Work profile')
        fetchMock.mockResolvedValue(response({ status: 503 }, 503))
        await expect(getCandidate()).rejects.toMatchObject({ status: 503 })
        fetchMock.mockResolvedValue(response({ status: 401 }, 401))
        await expect(getCandidate()).rejects.toMatchObject({ status: 401 })
    })
    it('rejects candidate lookup without a member session', async () => {
        (tokenGetAsync as jest.Mock).mockResolvedValue({})
        await expect(getCandidate()).rejects.toMatchObject({ status: 401 })
        expect(fetchMock).not.toHaveBeenCalled()
    })
    it('uses a refreshed token for multipart submission without a manual content-type boundary', async () => {
        const body = new FormData()
        fetchMock.mockResolvedValue(response({
            candidate_slug: 'candidate-slug',
            job_slug: 'gig-slug',
            success: true,
        }))
        await applyToGig('gig-slug', body)
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/__api/recruit/jobs/gig-slug/apply',
                expect.objectContaining({
                    body,
                    headers: { Authorization: 'Bearer member-token' },
                    method: 'POST',
                }),
            )
    })
    it.each([
        { message: 'Assignment failed' },
        { candidate_slug: 'candidate-slug' },
        { candidate_slug: 'candidate-slug', job_slug: 'another-gig' },
    ])('rejects a nonempty response that does not confirm the requested assignment: %j', async data => {
        fetchMock.mockResolvedValue(response(data))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toThrow('not confirmed')
    })
    it('never treats an error, an empty result, or an expired session as a successful application', async () => {
        fetchMock.mockResolvedValue(response({ status: 409, code: 'candidate_placed' }, 409))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toThrow('already placed')
        fetchMock.mockResolvedValue(response({ status: 413, detail: 'The maximum resume size is 4 MB.' }, 413))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toMatchObject({ status: 413 })
        fetchMock.mockResolvedValue(response({}))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toThrow('not confirmed')
        fetchMock.mockResolvedValue(response({ success: false }))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toThrow('not confirmed')
        fetchMock.mockResolvedValue(response(['unexpected']))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toThrow('not confirmed')
        const tokenGetMock = tokenGetAsync as jest.Mock
        tokenGetMock.mockResolvedValue({})
        fetchMock.mockClear()
        await expect(applyToGig('gig-slug', new FormData())).rejects.toMatchObject({ status: 401 })
        expect(fetchMock).not.toHaveBeenCalled()
    })
    it('loads candidate policies from the published CMS proxy', async () => {
        fetchMock.mockResolvedValue(response({ fields: { content: { fields: { text: '# Policy' } } } }))
        await expect(getGigPolicy('VAeo0vZ5tQFjPZlIcdt0m')).resolves.toBe('# Policy')
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/__api/cms/default/entries/VAeo0vZ5tQFjPZlIcdt0m',
                expect.objectContaining({ headers: {} }),
            )
        fetchMock.mockResolvedValue(response({ status: 404 }, 404))
        await expect(getGigPolicy('missing')).rejects.toMatchObject({ status: 404 })
        fetchMock.mockResolvedValue(response({ fields: {} }))
        await expect(getGigPolicy('empty')).rejects.toThrow('policy could not be loaded')
    })
})
