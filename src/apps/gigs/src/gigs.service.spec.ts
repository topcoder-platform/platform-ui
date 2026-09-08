/* eslint-disable sort-keys */
import { tokenGetAsync } from '~/libs/core'

import { applyToGig, getCandidate, getGig, getGigs } from './gigs.service'

jest.mock('~/config', () => ({
    EnvironmentConfig: { COMMUNITY_APP_URL: 'https://www.topcoder-dev.com' },
}), { virtual: true })
jest.mock('~/libs/core', () => ({ tokenGetAsync: jest.fn() }), { virtual: true })

const fetchMock = jest.fn()
const originalFetch = global.fetch

beforeEach(() => {
    global.fetch = fetchMock
    fetchMock.mockReset();
    (tokenGetAsync as jest.Mock).mockResolvedValue({ token: 'member-token' })
})
afterAll(() => {
    global.fetch = originalFetch
})

/** Creates a minimal fetch response for HTTP and Recruit-envelope regression scenarios. */
function response(data: unknown, status: number = 200): Partial<Response> {
    return { ok: status < 400, status, json: async () => data }
}

describe('Recruit API integration', () => {
    it('loads public jobs without requesting credentials or transmitting a member token', async () => {
        fetchMock.mockResolvedValue(response([]))
        await expect(getGigs()).resolves.toEqual([])
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/api/recruit/jobs?job_status=1',
                expect.objectContaining({ headers: {}, credentials: 'omit' }),
            )
    })
    it('rejects error envelopes returned with HTTP 200 and preserves a job not-found status', async () => {
        fetchMock.mockResolvedValue(response({ error: true, status: 404 }))
        await expect(getGig('missing')).rejects.toMatchObject({ status: 404 })
        fetchMock.mockResolvedValue(response({ data: 'unexpected' }))
        await expect(getGigs()).rejects.toThrow('could not load')
    })
    it('preserves fulfilled status-only responses', async () => {
        const closed = { job_status: { id: 2 }, enable_job_application_form: 0 }
        fetchMock.mockResolvedValue(response(closed))
        await expect(getGig('fulfilled')).resolves.toEqual(closed)
    })
    it('encodes member email and distinguishes no prior profile from a failed lookup', async () => {
        fetchMock.mockResolvedValue(response({ data: [] }))
        await expect(getCandidate('member+tag@example.com')).resolves.toBeUndefined()
        expect(fetchMock.mock.calls[0][0])
            .toContain('email=member%2Btag%40example.com')
        fetchMock.mockResolvedValue(response({ error: true }, 503))
        await expect(getCandidate('member@example.com')).rejects.toThrow()
    })
    it('uses a refreshed token for multipart submission without a manual content-type boundary', async () => {
        const body = new FormData()
        fetchMock.mockResolvedValue(response({ success: true }))
        await applyToGig('gig-slug', body)
        expect(fetchMock)
            .toHaveBeenCalledWith(
                'https://www.topcoder-dev.com/api/recruit/jobs/gig-slug/apply',
                expect.objectContaining({
                    body,
                    headers: { Authorization: 'Bearer member-token' },
                    method: 'POST',
                }),
            )
    })
    it('never treats an error, an empty result, or an expired session as a successful application', async () => {
        fetchMock.mockResolvedValue(response({ error: true, errorObj: { notAllowed: true } }))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toThrow('already placed')
        fetchMock.mockResolvedValue(response({}))
        await expect(applyToGig('gig-slug', new FormData())).rejects.toThrow('not confirmed');
        (tokenGetAsync as jest.Mock).mockResolvedValue({})
        fetchMock.mockClear()
        await expect(applyToGig('gig-slug', new FormData())).rejects.toMatchObject({ status: 401 })
        expect(fetchMock).not.toHaveBeenCalled()
    })
})
